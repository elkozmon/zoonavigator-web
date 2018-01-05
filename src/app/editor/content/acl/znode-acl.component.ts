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
import {Either} from "tsmonad";
import {
  Acl,
  DialogService,
  Permission,
  Scheme,
  ZNodeAcl,
  ZNodeService,
  ZNodeWithChildren,
  ZNodeMeta
} from "../../../core";
import {CanDeactivateComponent} from "../../../shared";
import {EDITOR_QUERY_NODE_PATH} from "../../editor-routing.constants";
import {ZPathService} from "../../../core/zpath";

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
    private zPathService: ZPathService,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  get formDirty(): boolean {
    if (!this.aclForm) {
      return false;
    }

    return this.aclForm.dirty;
  }

  get formSubmittable(): boolean {
    return this.aclForm.valid && this.aclForm.dirty && this.aclFormArray.controls.length > 0;
  }

  ngOnInit(): void {
    (<Observable<Either<Error, ZNodeWithChildren>>> this.route.parent.data.pluck("zNodeWithChildren"))
      .forEach(either =>
        either.caseOf<void>({
          left: error => {
            this.dialogService.showError(error.message, this.viewContainerRef);
            this.aclForm = null;
          },
          right: node => this.updateForm(node.acl, node.meta)
        })
      );
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.formDirty) {
      return this.dialogService
        .showDiscardChanges(this.viewContainerRef)
        .switchMap(ref => ref.afterClosed());
    }

    return Observable.of(true);
  }

  onSubmit(): void {
    const acl = this.getAclFormValue();

    this.saveZNodeAcl(acl);
  }

  addAclFormGroup(acl?: Acl): void {
    this.aclFormArray.push(this.newFormGroup(acl));
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

    if (!this.formDirty) {
      removeAll();
      this.aclForm.markAsDirty();

      return;
    }

    this.dialogService
      .showConfirm(
        "Confirm removing all ACLs",
        "Do you want to remove all ACL inputs? Changes will not be applied yet.",
        "Remove",
        "Cancel",
        this.viewContainerRef
      )
      .switchMap(ref => ref.afterClosed())
      .subscribe(
        discard => {
          if (discard) {
            removeAll();
            this.addAclFormGroup();
            this.aclForm.markAsDirty();
          }
        }
      );
  }

  get aclFormArray(): FormArray {
    return <FormArray>this.aclForm.get("aclArray");
  }

  private saveZNodeAcl(newZNodeAcl: ZNodeAcl): void {
    this.zNodeService
      .setAcl(
        this.currentPath,
        this.getAclVersionFormValue(),
        newZNodeAcl,
        this.getApplyRecursiveFormValue()
      )
      .map(newMeta => this.updateForm(newZNodeAcl, newMeta))
      .switchMap(() => this.dialogService
        .showSuccess("Changes saved", this.viewContainerRef)
        .switchMap(ref => ref.afterOpened())
      )
      .catch(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .subscribe();
  }

  private get currentPath(): string | null {
    return this.zPathService
      .parse(this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/")
      .path;
  }

  private updateForm(zNodeAcl: ZNodeAcl, zNodeMeta: ZNodeMeta): void {
    this.aclForm = this.newForm(zNodeAcl, zNodeMeta);
  }

  private newForm(zNodeAcl: ZNodeAcl, zNodeMeta: ZNodeMeta): FormGroup {
    const aclGroups: FormGroup[] = [];

    zNodeAcl.forEach(acl => aclGroups.push(this.newFormGroup(acl)));

    return this.formBuilder.group({
      aclVersion: [zNodeMeta.aclVersion.toString(), [Validators.required]],
      aclArray: this.formBuilder.array(aclGroups),
      applyRecursive: [false]
    });
  }

  private newFormGroup(acl?: Acl): FormGroup {
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
