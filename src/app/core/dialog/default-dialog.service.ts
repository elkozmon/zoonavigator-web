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

import {Injectable, ViewContainerRef} from "@angular/core";
import {
  IAlertConfig,
  IConfirmConfig,
  TdAlertDialogComponent,
  TdConfirmDialogComponent,
  TdDialogService,
  TdPromptDialogComponent
} from "@covalent/core";
import {MatDialogRef, MatSnackBar, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable} from "rxjs/Rx";
import {Subject} from "rxjs/Subject";
import {GroupedObservable} from "rxjs/operators/groupBy";
import {DialogService} from "./dialog.service";


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
    private snackBar: MatSnackBar
  ) {
    super();
  }

  showDiscardChanges(
    viewRef?: ViewContainerRef
  ): Observable<boolean> {
    const confirm = this.showConfirm(
      "Discard changes?",
      "Unsaved changes detected. Do you want to discard them?",
      "Discard",
      "Cancel",
      viewRef
    );

    return confirm.switchMap(ref => ref.afterClosed());
  }

  showPrompt(
    title: string,
    message: string,
    acceptBtn: string,
    cancelBtn: string,
    viewRef?: ViewContainerRef,
    value?: string
  ): Observable<MatDialogRef<TdPromptDialogComponent>> {
    const prompt = this.dialogService.openPrompt({
      message: message,
      disableClose: true,
      viewContainerRef: viewRef,
      title: title,
      cancelButton: cancelBtn,
      acceptButton: acceptBtn,
      value: value
    });

    return Observable.of(prompt);
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
      disableClose: true,
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
