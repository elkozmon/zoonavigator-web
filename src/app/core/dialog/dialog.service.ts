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
import {TdAlertDialogComponent, TdConfirmDialogComponent, TdPromptDialogComponent} from "@covalent/core";
import {MatDialogRef, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable} from "rxjs/Rx";
import {
  CreateZNodeDialogComponent,
  CreateZNodeData,
  DiscardChangesDialogComponent,
  MoveZNodeData,
  MoveZNodeDialogComponent,
  DuplicateZNodeDialogComponent,
  DuplicateZNodeData
} from "./dialogs";

@Injectable()
export abstract class DialogService {

  showErrorAndThrowOnClose<T>(
    error: string,
    viewRef?: ViewContainerRef
  ): Observable<T> {
    return this
      .showError(error, viewRef)
      .switchMap(ref => ref.afterClosed())
      .switchMapTo(Observable.throw(error));
  }

  abstract showDiscardChanges(
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<DiscardChangesDialogComponent>>

  abstract showCreateZNode(
    defaults: CreateZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<CreateZNodeDialogComponent>>

  abstract showDuplicateZNode(
    defaults: DuplicateZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<DuplicateZNodeDialogComponent>>

  abstract showMoveZNode(
    defaults: MoveZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<MoveZNodeDialogComponent>>

  abstract showConfirm(
    title: string,
    message: string,
    acceptBtn: string,
    cancelBtn: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<TdConfirmDialogComponent>>

  abstract showAlert(
    title: string,
    message: string,
    closeBtn: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<TdAlertDialogComponent>>

  abstract showError(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<TdAlertDialogComponent>>

  abstract showSuccess(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatSnackBarRef<SimpleSnackBar>>
}
