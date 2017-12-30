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
  TdAlertDialogComponent,
  TdConfirmDialogComponent,
  TdDialogService,
  TdPromptDialogComponent
} from "@covalent/core";
import {MatDialogRef, MatSnackBar, MatSnackBarRef, SimpleSnackBar} from "@angular/material";
import {Observable} from "rxjs/Rx";
import {FeedbackService} from "./feedback.service";

@Injectable()
export class DefaultFeedbackService extends FeedbackService {

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

    return confirm.afterClosed();
  }

  showPrompt(
    title: string,
    message: string,
    acceptBtn: string,
    cancelBtn: string,
    viewRef?: ViewContainerRef,
    value?: string
  ): MatDialogRef<TdPromptDialogComponent> {
    return this.dialogService.openPrompt({
      message: message,
      disableClose: true,
      viewContainerRef: viewRef,
      title: title,
      cancelButton: cancelBtn,
      acceptButton: acceptBtn,
      value: value
    });
  }

  showConfirm(
    title: string,
    message: string,
    acceptBtn: string,
    cancelBtn: string,
    viewRef?: ViewContainerRef
  ): MatDialogRef<TdConfirmDialogComponent> {
    return this.dialogService.openConfirm({
      message: message,
      disableClose: true,
      viewContainerRef: viewRef,
      title: title,
      cancelButton: cancelBtn,
      acceptButton: acceptBtn
    });
  }

  showAlert(
    title: string,
    message: string,
    closeBtn: string,
    viewRef?: ViewContainerRef
  ): MatDialogRef<TdAlertDialogComponent> {
    return this.dialogService.openAlert({
      message: message,
      disableClose: true,
      viewContainerRef: viewRef,
      title: title,
      closeButton: closeBtn
    });
  }

  showError(
    message: string,
    viewRef?: ViewContainerRef
  ): MatDialogRef<TdAlertDialogComponent> {
    return this.dialogService.openAlert({
      message: message,
      disableClose: true,
      viewContainerRef: viewRef,
      title: "Error",
      closeButton: "Close"
    });
  }

  showSuccess(
    message: string,
    viewRef?: ViewContainerRef
  ): MatSnackBarRef<SimpleSnackBar> {
    return this.snackBar.open(
      message,
      "Close",
      {
        duration: 3000,
        extraClasses: ["zoo-success"],
        viewContainerRef: viewRef
      }
    );
  }
}
