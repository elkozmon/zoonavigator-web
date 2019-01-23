/*
 * Copyright (C) 2019  Ľuboš Kozmon <https://www.elkozmon.com>
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
import {Observable, ConnectableObservable, of, defer, Subject, AsyncSubject} from "rxjs";
import {delay, publishReplay, publishLast, tap, switchMapTo, switchMap} from "rxjs/operators";
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
import {ReplaySubject} from "rxjs/Rx";

type GroupKey = string;

@Injectable()
export class DefaultDialogService extends DialogService {

  private showConfirmInstances: Map<GroupKey, [MatDialogRef<ConfirmDialogComponent>, Observable<boolean>]> = new Map();

  private showInfoInstances: Map<GroupKey, ReplaySubject<MatDialogRef<InfoDialogComponent>>> = new Map();

  constructor(
    private dialogService: TdDialogService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  showDiscardChanges(
    viewRef?: ViewContainerRef
  ): Observable<[MatDialogRef<ConfirmDialogComponent>, Observable<boolean>]> {
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
  ): Observable<[MatDialogRef<ConfirmDialogComponent>, Observable<boolean>]> {
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
    error: Error,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<InfoDialogComponent>> {
    return this.showInfo(
      {
        icon: "error",
        title: "Error",
        message: error.message,
        dismissText: "Close"
      },
      viewRef
    );
  }

  showConfirm(
    options: ConfirmData,
    viewRef?: ViewContainerRef
  ): Observable<[MatDialogRef<ConfirmDialogComponent>, Observable<boolean>]> {
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

    const afterClosedRx = dialog
      .afterClosed()
      .pipe(publishLast()) as ConnectableObservable<boolean>;

    afterClosedRx.connect();

    // Cache dialog
    this.showConfirmInstances.set(key, [dialog, afterClosedRx]);

    // Uncache dialog once closed
    afterClosedRx
      .pipe(delay(100))
      .forEach(() => this.showConfirmInstances.delete(key));

    return of(this.showConfirmInstances.get(key));
  }

  showInfo(
    options: InfoData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<InfoDialogComponent>> {
    const key: GroupKey = options.title + options.message;

    // Look for cached dialog
    if (this.showInfoInstances.has(key)) {
      return this.showInfoInstances.get(key);
    }

    this.showInfoInstances.set(key, new ReplaySubject(1));

    return of(null)
      .pipe(
        delay(10),
        switchMap(() => {
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
          this.showInfoInstances
            .get(key)
            .next(dialog);

          // Uncache dialog once closed
          dialog
            .afterClosed()
            .pipe(delay(100))
            .forEach(() => this.showInfoInstances.delete(key));

          return of(dialog);
        })
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

    return of(snackBar);
  }
}
