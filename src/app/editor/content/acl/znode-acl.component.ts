/*
 * Copyright (C) 2018  Ľuboš Kozmon
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
import {ActivatedRoute, Router} from "@angular/router";
import {from, Observable, of} from "rxjs";
import {catchError, pluck, switchMap} from "rxjs/operators";
import {Either} from "tsmonad";
import {DialogService, ZNodeAcl, ZNodeService, ZNodeWithChildren} from "../../../core";
import {CanDeactivateComponent} from "../../../shared";
import {ZPathService} from "../../../core/zpath";
import {AclFormFactory} from "./acl-form.factory";
import {AclForm} from "./acl-form";
import {EDITOR_QUERY_NODE_PATH} from "../../editor-routing.constants";

@Component({
  templateUrl: "znode-acl.component.html",
  styleUrls: ["znode-acl.component.scss"]
})
export class ZNodeAclComponent implements OnInit, CanDeactivateComponent {

  aclForm: AclForm;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zNodeService: ZNodeService,
    private zPathService: ZPathService,
    private dialogService: DialogService,
    private aclFormFactory: AclFormFactory,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  ngOnInit(): void {
    (<Observable<Either<Error, ZNodeWithChildren>>>this.route.parent.data.pipe(pluck("zNodeWithChildren")))
      .forEach(either =>
        either.caseOf<void>({
          left: error => {
            this.dialogService.showError(error.message, this.viewContainerRef);
            this.aclForm = null;
          },
          right: node => {
            this.aclForm = this.aclFormFactory.newForm(node.acl, node.meta);
          }
        })
      );
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.aclForm && this.aclForm.isDirty) {
      return this.dialogService
        .showDiscardChanges(this.viewContainerRef)
        .pipe(
          switchMap(ref => ref.afterClosed())
        );
    }

    return of(true);
  }

  onSubmit(recursive: boolean): void {
    let confirmation: Observable<boolean> = of(true);

    if (recursive) {
      confirmation = this.dialogService
        .showConfirm(
          {
            icon: "help",
            title: "Confirm recursive change",
            message: "Do you want to apply these settings to this node and its children?",
            acceptText: "Apply",
            cancelText: "Cancel"
          },
          this.viewContainerRef
        )
        .pipe(
          switchMap(ref => ref.afterClosed())
        );
    }

    const values = this.aclForm.values;
    const version = this.aclForm.aclVersion;

    confirmation.forEach(confirm => {
      if (confirm) {
        this.saveZNodeAcl(
          values,
          version,
          recursive
        );
      }
    });
  }

  clearForm(): void {
    if (!this.aclForm.isDirty) {
      this.aclForm.clearAclFormArray();

      return;
    }

    this.dialogService
      .showConfirm(
        {
          icon: "help",
          title: "Confirm clearing the form",
          message: "Do you want to remove all ACL inputs? Changes will not be applied yet.",
          acceptText: "Clear",
          cancelText: "Cancel"
        },
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed())
      )
      .forEach(
        discard => {
          if (discard) {
            this.aclForm.clearAclFormArray();
          }
        }
      );
  }

  private saveZNodeAcl(acl: ZNodeAcl, aclVersion: number, recursive: boolean): void {
    this.zNodeService
      .setAcl(
        this.currentPath,
        aclVersion,
        acl,
        recursive
      )
      .pipe(
        switchMap(newMeta => {
          this.aclForm.markAsPristine();

          // refresh node data in resolver
          const redirect = this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              aclVersion: newMeta.aclVersion
            },
            queryParamsHandling: "merge"
          });

          return from(redirect);
        }),
        switchMap(() => this.dialogService.showSnackbar("Changes saved", this.viewContainerRef)),
        switchMap(ref => ref.afterOpened()),
        catchError(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      )
      .subscribe();
  }

  private get currentPath(): string | null {
    return this.zPathService
      .parse(this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/")
      .path;
  }
}
