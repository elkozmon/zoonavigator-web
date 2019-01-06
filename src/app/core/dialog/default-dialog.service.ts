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
import {
  IAlertConfig,
  IConfirmConfig,
  TdAlertDialogComponent,
  TdConfirmDialogComponent,
  TdDialogService
} from "@covalent/core";
import {MatDialog, MatDialogRef, MatSnackBar, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable} from "rxjs/Rx";
import {DialogService} from "./dialog.service";
import {
  CreateZNodeData,
  CreateZNodeDialogComponent,
  DiscardChangesDialogComponent,
  DuplicateZNodeData,
  DuplicateZNodeDialogComponent,
  ImportZNodesData,
  ImportZNodesDialogComponent,
  MoveZNodeData,
  MoveZNodeDialogComponent,
  SessionInfoDialogComponent
} from "./dialogs";
import {ZSessionInfo} from "../zsession/zsession-info";

type GroupKey = string;

@Injectable()
export class DefaultDialogService extends DialogService {

  private showConfirmInstances: Map<GroupKey, MatDialogRef<TdConfirmDialogComponent>> = new Map();

  private showAlertInstances: Map<GroupKey, MatDialogRef<TdAlertDialogComponent>> = new Map();

  constructor(
    private dialogService: TdDialogService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  showDiscardChanges(
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<DiscardChangesDialogComponent>> {
    const dialog = this.dialog.open(DiscardChangesDialogComponent, {
      viewContainerRef: viewRef,
      role: "dialog",
      hasBackdrop: true,
      disableClose: true,
      width: "500px",
      maxWidth: "80vw",
      height: "200px",
      maxHeight: "80vw",
      direction: "ltr",
      autoFocus: true
    });

    return Observable.of(dialog);
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

    return Observable.of(dialog);
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

    return Observable.of(dialog);
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

    return Observable.of(dialog);
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

    return Observable.of(dialog);
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

    return Observable.of(dialog);
  }

  showConfirm(
    title: string,
    message: string,
    acceptBtn: string,
    cancelBtn: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<TdConfirmDialogComponent>> {
    const config: IConfirmConfig = {
      message: message,
      disableClose: true,
      viewContainerRef: viewRef,
      title: title,
      cancelButton: cancelBtn,
      acceptButton: acceptBtn
    };

    const key: GroupKey = title + message + acceptBtn;

    // Look for cached dialog
    if (this.showConfirmInstances.has(key)) {
      return Observable.of(this.showConfirmInstances.get(key));
    }

    const dialog = this.dialogService.openConfirm(config);

    // Cache dialog
    this.showConfirmInstances.set(key, dialog);

    // Uncache dialog once closed
    dialog
      .afterClosed()
      .forEach(() => this.showConfirmInstances.delete(key));

    return Observable.of(dialog);
  }

  showAlert(
    title: string,
    message: string,
    closeBtn: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<TdAlertDialogComponent>> {
    const config: IAlertConfig = {
      message: message,
      viewContainerRef: viewRef,
      title: title,
      closeButton: closeBtn
    };

    const key: GroupKey = title + message;

    // Look for cached dialog
    if (this.showAlertInstances.has(key)) {
      return Observable.of(this.showAlertInstances.get(key));
    }

    const dialog = this.dialogService.openAlert(config);

    // Cache dialog
    this.showAlertInstances.set(key, dialog);

    // Uncache dialog once closed
    dialog
      .afterClosed()
      .forEach(() => this.showAlertInstances.delete(key));

    return Observable.of(dialog);
  }

  showError(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<TdAlertDialogComponent>> {
    return this.showAlert(
      "Error",
      message,
      "Close",
      viewRef
    );
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

    return Observable.of(snackBar);
  }
}
