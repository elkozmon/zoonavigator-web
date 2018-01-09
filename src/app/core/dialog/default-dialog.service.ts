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
  IAlertConfig, IConfirmConfig, TdAlertDialogComponent, TdConfirmDialogComponent,
  TdDialogService
} from "@covalent/core";
import {MatDialog, MatDialogRef, MatSnackBar, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable} from "rxjs/Rx";
import {Subject} from "rxjs/Subject";
import {GroupedObservable} from "rxjs/operators/groupBy";
import {DialogService} from "./dialog.service";
import {
  CreateZNodeData, CreateZNodeDialogComponent, DiscardChangesDialogComponent, DuplicateZNodeData,
  DuplicateZNodeDialogComponent, MoveZNodeData, MoveZNodeDialogComponent, SessionInfoDialogComponent
} from "./dialogs";
import {ZSessionInfo} from "../zsession/zsession-info";

interface Pair<A, B> {
  left: A,
  right: B
}

type GroupKey = string;

@Injectable()
export class DefaultDialogService extends DialogService {

  private groupByWindowDuration = 200; // ms

  private showConfirmSubject: Subject<Pair<GroupKey, IConfirmConfig>> = new Subject();

  private showConfirmObservable: Observable<Pair<GroupKey, MatDialogRef<TdConfirmDialogComponent>>> =
    Observable
      .from(this.showConfirmSubject)
      .groupBy(
        (pair: Pair<GroupKey, IConfirmConfig>) => pair.left,
        (pair: Pair<GroupKey, IConfirmConfig>) => pair.right,
        () => Observable.interval(this.groupByWindowDuration)
      )
      .mergeMap((group: GroupedObservable<GroupKey, IConfirmConfig>) =>
        group.toArray().map((array: IConfirmConfig[]) => {
          return {
            left: group.key,
            right: this.dialogService.openConfirm(array[0])
          };
        })
      )
      .share();

  private showAlertSubject: Subject<Pair<GroupKey, IAlertConfig>> = new Subject();

  private showAlertObservable: Observable<Pair<GroupKey, MatDialogRef<TdAlertDialogComponent>>> =
    Observable
      .from(this.showAlertSubject)
      .groupBy(
        (pair: Pair<GroupKey, IAlertConfig>) => pair.left,
        (pair: Pair<GroupKey, IAlertConfig>) => pair.right,
        () => Observable.interval(this.groupByWindowDuration)
      )
      .mergeMap((group: GroupedObservable<GroupKey, IAlertConfig>) =>
        group.toArray().map((array: IAlertConfig[]) => {
          return {
            left: group.key,
            right: this.dialogService.openAlert(array[0])
          };
        })
      )
      .share();

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

    const promise = this.showConfirmObservable
      .filter(pair => pair.left === key)
      .first()
      .map(pair => pair.right)
      .toPromise();

    this.showConfirmSubject.next({
      left: key,
      right: config
    });

    return Observable.fromPromise(promise);
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

    const promise = this.showAlertObservable
      .filter(pair => pair.left === key)
      .first()
      .map(pair => pair.right)
      .toPromise();

    this.showAlertSubject.next({
      left: key,
      right: config
    });

    return Observable.fromPromise(promise);
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

  showSuccess(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatSnackBarRef<SimpleSnackBar>> {
    const snackBar = this.snackBar.open(
      message,
      "Close",
      {
        duration: 3000,
        extraClasses: ["zoo-success"],
        viewContainerRef: viewRef
      }
    );

    return Observable.of(snackBar);
  }
}
