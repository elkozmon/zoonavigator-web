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

import {Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MatInput} from "@angular/material";
import {ActivatedRoute, Router} from "@angular/router";
import {DialogService, ZNode, ZNodeService, ZPath, ZPathService} from "../../core";
import {EDITOR_QUERY_NODE_PATH} from "../editor-routing.constants";
import {Observable} from "rxjs/Rx";

@Component({
  selector: "zoo-toolbar",
  templateUrl: "toolbar.component.html",
  styleUrls: ["toolbar.component.scss"],
  animations: [
    trigger("rotatedState", [
      state("default", style({transform: "rotate(0)"})),
      state("rotated", style({transform: "rotate(360deg)"})),
      transition("default => rotated", animate("400ms ease-in"))
    ])
  ]
})
export class ToolbarComponent {

  @ViewChild("pathInput") pathInput: MatInput;

  @Output() refresh: EventEmitter<any> = new EventEmitter();
  @Output() delete: EventEmitter<any> = new EventEmitter();
  @Output() duplicate: EventEmitter<any> = new EventEmitter();
  @Output() move: EventEmitter<any> = new EventEmitter();

  @Input() zPath: ZPath;

  navigationError: string;

  refreshButtonRotatedState = "default";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zNodeService: ZNodeService,
    private zPathService: ZPathService,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  onRefreshClick(): void {
    this.refreshButtonRotatedState = "default";
    setTimeout(() => this.refreshButtonRotatedState = "rotated", 0);

    this.refresh.emit();
  }

  onDeleteClick(): void {
    const zPath = this.zPath;
    const parentPath = zPath.goUp().path;

    this.dialogService
      .showConfirm(
        "Confirm recursive delete",
        `Do you want to delete this node and its children?`,
        "Delete",
        "Cancel",
        this.viewContainerRef
      )
      .switchMap(ref => ref.afterClosed())
      .switchMap((confirm: boolean) => {
        if (confirm) {
          return this.zNodeService
            .deleteChildren(parentPath, [zPath.name.valueOrThrow()])
            .catch(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef));
        }

        return Observable.empty<void>();
      })
      .forEach(() => {
        this.router.navigate(["./"], {
          relativeTo: this.route,
          queryParams: {
            [EDITOR_QUERY_NODE_PATH]: parentPath
          },
          queryParamsHandling: "merge"
        });
      });
  }

  onDuplicateClick(): void {
    const source = this.zPath.path;

    this.dialogService
      .showPrompt(
        "Duplicate node",
        "Type in new node path",
        "Duplicate",
        "Cancel",
        this.viewContainerRef,
        source
      )
      .switchMap(ref => ref.afterClosed())
      .switchMap((destination: string) => {
        if (destination) {
          return this.zNodeService
            .duplicateNode(source, destination)
            .catch((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.refresh.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onMoveClick(): void {
    const source = this.zPath.path;

    this.dialogService
      .showPrompt(
        "Move node",
        "Type in new node path",
        "Move",
        "Cancel",
        this.viewContainerRef,
        source
      )
      .switchMap(ref => ref.afterClosed())
      .switchMap((destination: string) => {
        if (destination) {
          return this.zNodeService
            .moveNode(source, destination)
            .catch((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.refresh.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onPathKeyPress(event: KeyboardEvent): void {
    if (event.which === 13) {
      // enter pressed
      this.navigatePath(this.pathInput.value);
    }
  }

  navigatePath(path: string): void {
    const zPath = this.zPathService.parse(path);

    if (zPath.isRoot) {
      this.router
        .navigate(["/editor"])
        .catch(err => this.handleNavigateError(err));

      return;
    }

    this.router
      .navigate(["/editor/node"], {
        queryParams: {
          [EDITOR_QUERY_NODE_PATH]: zPath.path
        },
        queryParamsHandling: "merge"
      })
      .catch(err => this.handleNavigateError(err));
  }

  handleNavigateError(error: string): void {
    this.navigationError = error;
  }
}
