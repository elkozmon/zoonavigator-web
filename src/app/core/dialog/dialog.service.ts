/*
 * Copyright (C) 2019  Ľuboš Kozmon
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
import {MatDialogRef, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable, throwError} from "rxjs";
import {switchMap, switchMapTo} from "rxjs/operators";
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

@Injectable()
export abstract class DialogService {

  showErrorAndThrowOnClose<T>(
    error: string,
    viewRef?: ViewContainerRef
  ): Observable<T> {
    return this
      .showError(error, viewRef)
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMapTo(throwError(error))
      );
  }

  abstract showDiscardChanges(
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ConfirmDialogComponent>>

  abstract showCreateZNode(
    defaults: CreateZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<CreateZNodeDialogComponent>>

  abstract showImportZNodes(
    defaults: ImportZNodesData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ImportZNodesDialogComponent>>

  abstract showDuplicateZNode(
    defaults: DuplicateZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<DuplicateZNodeDialogComponent>>

  abstract showRecursiveDeleteZNode(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ConfirmDialogComponent>>

  abstract showMoveZNode(
    defaults: MoveZNodeData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<MoveZNodeDialogComponent>>

  abstract showSessionInfo(
    sessionInfo: ZSessionInfo,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<SessionInfoDialogComponent>>

  abstract showError(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<InfoDialogComponent>>

  abstract showConfirm(
    options: ConfirmData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<ConfirmDialogComponent>>

  abstract showInfo(
    options: InfoData,
    viewRef?: ViewContainerRef
  ): Observable<MatDialogRef<InfoDialogComponent>>

  abstract showSnackbar(
    message: string,
    viewRef?: ViewContainerRef
  ): Observable<MatSnackBarRef<SimpleSnackBar>>
}
