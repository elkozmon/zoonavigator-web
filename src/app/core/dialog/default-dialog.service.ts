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

import {Injectable, ViewContainerRef} from "@angular/core";
import {TdDialogService} from "@covalent/core";
import {MatDialog, MatDialogRef, MatSnackBar, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable, of} from "rxjs";
import {DialogService} from "./dialog.service";
import {
  ConfirmData,
  ConfirmDialogComponent,
  CreateZNodeData,
  CreateZNodeDialogComponent,
  DuplicateZNodeData,
  DuplicateZNodeDialogComponent,
  ImportZNodesData,
  ImportZNodesDialogComponent,
  InfoData,
  InfoDialogComponent,
  MoveZNodeData,
  MoveZNodeDialogComponent,
  SessionInfoDialogComponent
} from "./dialogs";
import {ZSessionInfo} from "../zsession/zsession-info";

type GroupKey = string;

@Injectable()
export class DefaultDialogService extends DialogService {

  private showConfirmInstances: Map<GroupKey, MatDialogRef<ConfirmDialogComponent>> = new Map();

  private showInfoInstances: Map<GroupKey, MatDialogRef<InfoDialogComponent>> = new Map();

  constructor(
    private dialogService: TdDialogService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  showDiscardChanges(
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ConfirmDialogComponent>> {
    return this.showConfirm({
      icon: "help",
      title: "Discard changes?",
      message: "Unsaved changes detected. Do you want to discard them?",
      cancelText: "Cancel",
      acceptText: "Discard"
    }, viewRef);
  }

  showCreateZNode(
    defaults: CreateZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<CreateZNodeDialogComponent>> {
    const dialog = this.dialog.open(CreateZNodeDialogComponent, {
      data: defaults,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      disableClose: true,
      width: "500px",
      maxWidth: "80vw",
      height: defaults.redirect === undefined ? "230px" : "260px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    return of(dialog);
  }

  showImportZNodes(
    defaults: ImportZNodesData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ImportZNodesDialogComponent>> {
    const dialog = this.dialog.open(ImportZNodesDialogComponent, {
      data: defaults,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      disableClose: true,
      width: "500px",
      maxWidth: "80vw",
      height: defaults.redirect === undefined ? "287px" : "325px",
      maxHeight: "100vw",
      direction: "ltr",
      autoFocus: true
    });

    return of(dialog);
  }

  showDuplicateZNode(
    defaults: DuplicateZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<DuplicateZNodeDialogComponent>> {
    const dialog = this.dialog.open(DuplicateZNodeDialogComponent, {
      data: defaults,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      disableClose: true,
      width: "500px",
      maxWidth: "80vw",
      height: defaults.redirect === undefined ? "230px" : "260px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    return of(dialog);
  }

  showRecursiveDeleteZNode(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ConfirmDialogComponent>> {
    return this.showConfirm({
      icon: "help",
      title: "Confirm recursive delete",
      message: message,
      acceptText: "Delete",
      cancelText: "Cancel"
    }, viewRef);
  }

  showMoveZNode(
    defaults: MoveZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<MoveZNodeDialogComponent>> {
    const dialog = this.dialog.open(MoveZNodeDialogComponent, {
      data: defaults,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      disableClose: true,
      width: "500px",
      maxWidth: "80vw",
      height: defaults.redirect === undefined ? "230px" : "260px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    return of(dialog);
  }

  showSessionInfo(
    sessionInfo: ZSessionInfo,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<SessionInfoDialogComponent>> {
    const dialog = this.dialog.open(SessionInfoDialogComponent, {
      data: sessionInfo,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      width: "500px",
      maxWidth: "80vw",
      height: "250px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    return of(dialog);
  }

  showError(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<InfoDialogComponent>> {
    return this.showInfo(
      {
        icon: "error",
        title: "Error",
        message: message,
        dismissText: "Close"
      },
      viewRef
    );
  }

  showConfirm(
    options: ConfirmData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ConfirmDialogComponent>> {
    const key: GroupKey = options.title + options.message + options.acceptText;

    // Look for cached dialog
    if (this.showConfirmInstances.has(key)) {
      return of(this.showConfirmInstances.get(key));
    }

    const dialog = this.dialog.open(ConfirmDialogComponent, {
      data: options,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      width: "500px",
      maxWidth: "80vw",
      height: "210px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    // Cache dialog
    this.showConfirmInstances.set(key, dialog);

    // Uncache dialog once closed
    dialog
      .afterClosed()
      .forEach(() => this.showConfirmInstances.delete(key));

    return of(dialog);
  }

  showInfo(
    options: InfoData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<InfoDialogComponent>> {
    const key: GroupKey = options.title + options.message;

    // Look for cached dialog
    if (this.showInfoInstances.has(key)) {
      return of(this.showInfoInstances.get(key));
    }

    const dialog = this.dialog.open(InfoDialogComponent, {
      data: options,
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      width: "500px",
      maxWidth: "80vw",
      height: "210px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    // Cache dialog
    this.showInfoInstances.set(key, dialog);

    // Uncache dialog once closed
    dialog
      .afterClosed()
      .forEach(() => this.showInfoInstances.delete(key));

    return of(dialog);
  }

  showSnackbar(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatSnackBarRef<SimpleSnackBar>> {
    const snackBar = this.snackBar.open(
      message,
      "Close",
      {
        duration: 3000,
        viewContainerRef: viewRef
      }
    );

    return of(snackBar);
  }
}
