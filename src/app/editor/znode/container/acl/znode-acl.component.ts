/*
 * Copyright (C) 2017  Ľuboš Kozmon
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Component, OnInit, ViewContainerRef} from "@angular/core";
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs/Rx";
import {ZNodeService} from "../../znode.service";
import {Acl, FeedbackService, Permission, Scheme} from "../../../../core";
import {CanDeactivateComponent} from "../../../../shared";
import {ZNodeMetaWith} from "../meta/znode-meta-with";
import {ZNodeAcl} from "./znode-acl";
import {EDITOR_QUERY_NODE_PATH} from "../../../editor-routing.constants";
import {Either} from "tsmonad";

@Component({
  templateUrl: "znode-acl.component.html",
  styleUrls: ["znode-acl.component.scss"]
})
export class ZNodeAclComponent implements OnInit, CanDeactivateComponent {

  aclForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private zNodeService: ZNodeService,
    private feedbackService: FeedbackService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  ngOnInit(): void {
    (<Either<Error, ZNodeMetaWith<ZNodeAcl>>> this.route.snapshot.data["acl"])
      .caseOf<void>({
        left: err => this.feedbackService.showError(err.message, this.viewContainerRef),
        right: meta => this.updateAclForm(meta)
      });

    this.route
      .queryParams
      .skip(1)
      .switchMap(queryParams => {
        const newNodePath = queryParams[EDITOR_QUERY_NODE_PATH] || "/";

        return this.reloadAclForm(newNodePath);
      })
      .subscribe();
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.aclForm.dirty) {
      return this.feedbackService.showDiscardChanges(this.viewContainerRef);
    }

    return Observable.of(true);
  }

  onRefresh(): void {
    const path = this.getCurrentPath();

    if (!this.aclForm.dirty) {
      this.reloadAclForm(path).subscribe();

      return;
    }

    this.feedbackService
      .showDiscardChanges(this.viewContainerRef)
      .switchMap(discard => {
        if (discard) {
          return this.reloadAclForm(path);
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onSubmit(): void {
    const acl = this.getAclFormValue();

    this.saveZNodeAcl(acl);
  }

  addAclFormGroup(acl?: Acl): void {
    this.aclFormArray.push(this.newAclFormGroup(acl));
    this.aclForm.markAsDirty();
  }

  removeAclFormGroup(index: number): void {
    this.aclFormArray.removeAt(index);
    this.aclForm.markAsDirty();
  }

  clearAclFormArray(): void {
    const removeAll: () => void = () => {
      while (this.aclFormArray.controls.length > 0) {
        this.aclFormArray.removeAt(0);
      }
    };

    if (!this.aclForm.dirty) {
      removeAll();
      this.aclForm.markAsDirty();

      return;
    }

    this.feedbackService
      .showConfirm(
        "Confirm removing all ACLs",
        "Do you want to remove all ACL inputs? Changes will not be applied yet.",
        "Remove",
        "Cancel",
        this.viewContainerRef
      )
      .afterClosed()
      .subscribe(
        discard => {
          if (discard) {
            removeAll();
            this.aclForm.markAsDirty();
          }
        }
      );
  }

  get aclFormArray(): FormArray {
    return <FormArray>this.aclForm.get("aclArray");
  }

  private saveZNodeAcl(acl: ZNodeAcl): void {
    this.zNodeService
      .setAcl(
        this.getCurrentPath(),
        this.getAclVersionFormValue(),
        acl,
        this.getApplyRecursiveFormValue()
      )
      .map(meta => this.updateAclForm({meta: meta, data: acl}))
      .switchMap(() => this.reloadAclForm(this.getCurrentPath()))
      .switchMap(() => this.feedbackService
        .showSuccess("Changes saved", this.viewContainerRef)
        .afterOpened()
      )
      .catch(err => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .subscribe();
  }

  private getCurrentPath(): string | null {
    return this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH);
  }

  private reloadAclForm(path: string): Observable<void> {
    return this.zNodeService
      .getAcl(path)
      .map(metaWithAcl => this.updateAclForm(metaWithAcl))
      .catch(err => this.feedbackService.showErrorAndThrowOnClose<void>(err, this.viewContainerRef));
  }

  private updateAclForm(metaWithAcl: ZNodeMetaWith<ZNodeAcl>): void {
    this.aclForm = this.newAclForm(metaWithAcl);
  }

  private newAclForm(metaWithAcl: ZNodeMetaWith<ZNodeAcl>): FormGroup {
    const aclGroups: FormGroup[] = [];

    metaWithAcl.data.forEach(acl => aclGroups.push(this.newAclFormGroup(acl)));

    return this.formBuilder.group({
      aclVersion: [metaWithAcl.meta.aclVersion.toString(), [Validators.required]],
      aclArray: this.formBuilder.array(aclGroups),
      applyRecursive: [false]
    });
  }

  private newAclFormGroup(acl?: Acl): FormGroup {
    return this.formBuilder.group({
      scheme: [acl ? acl.scheme : "", [Validators.required]],
      id: [acl ? acl.id : ""],
      permissions: this.newPermissionFormGroup(acl ? acl.permissions : null)
    });
  }

  private newPermissionFormGroup(checked?: Permission[]): FormGroup {
    const isChecked: (Permission) => boolean = (permission) => {
      if (!checked) {
        return false;
      }

      return checked.indexOf(permission) !== -1;
    };

    return this.formBuilder.group({
      canCreate: [isChecked("create")],
      canRead: [isChecked("read")],
      canDelete: [isChecked("delete")],
      canWrite: [isChecked("write")],
      canAdmin: [isChecked("admin")]
    });
  }

  private getAclLastIndex(): number {
    return this.aclFormArray.controls.length - 1;
  }

  private getAclFormGroup(index: number): FormGroup {
    return <FormGroup>this.aclFormArray.at(index);
  }

  private getAclSchemeFormValue(index: number): Scheme {
    return this.getAclFormGroup(index).get("scheme").value;
  }

  private getAclIdFormValue(index: number): string {
    return this.getAclFormGroup(index).get("id").value;
  }

  private getAclPermissionsFormValue(index: number): Permission[] {
    const perms: Permission[] = [];

    const permsGroup = this.getAclFormGroup(index).get("permissions");

    if (permsGroup.get("canCreate").value) {
      perms.push("create");
    }

    if (permsGroup.get("canRead").value) {
      perms.push("read");
    }

    if (permsGroup.get("canDelete").value) {
      perms.push("delete");
    }

    if (permsGroup.get("canWrite").value) {
      perms.push("write");
    }

    if (permsGroup.get("canAdmin").value) {
      perms.push("admin");
    }

    return perms;
  }

  private getAclVersionFormValue(): number {
    return this.aclForm.get("aclVersion").value;
  }

  private getApplyRecursiveFormValue(): boolean {
    return this.aclForm.get("applyRecursive").value;
  }

  private getAclFormValue(): Acl[] {
    const aclArray: Acl[] = [];
    const lastIndex = this.getAclLastIndex();

    for (let i = 0; i <= lastIndex; i++) {
      aclArray.push({
        scheme: this.getAclSchemeFormValue(i),
        id: this.getAclIdFormValue(i),
        permissions: this.getAclPermissionsFormValue(i)
      });
    }

    return aclArray;
  }
}
