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

import {Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MatInput} from "@angular/material";
import {ActivatedRoute, Router} from "@angular/router";
import {EMPTY, of} from "rxjs";
import {catchError, switchMap, switchMapTo} from "rxjs/operators";
import {Maybe} from "tsmonad";
import {DialogService, FileSaverService, ZNodeExport, ZNodeService, ZNodeWithChildren, ZPath, ZPathService} from "../../core";
import {EDITOR_QUERY_NODE_PATH} from "../editor-routing.constants";
import {DuplicateZNodeData, MoveZNodeData} from "../../core/dialog/dialogs";
import {CreateZNodeData} from "../../core/dialog";

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
  @Input() zNode: Maybe<ZNodeWithChildren>;

  navigationError: string;

  refreshButtonRotatedState = "default";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zNodeService: ZNodeService,
    private zPathService: ZPathService,
    private dialogService: DialogService,
    private fileSaverService: FileSaverService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  onRefreshClick(): void {
    this.refreshButtonRotatedState = "default";
    setTimeout(() => this.refreshButtonRotatedState = "rotated", 0);

    this.refresh.emit();
  }

  onHomeClick(): void {
    this.router.navigate([], {
      relativeTo: this.route,
    });
  }

  onDeleteClick(): void {
    const zNode = this.zNode.valueOrThrow();
    const zPath = this.zPath;
    const parentPath = zPath.goUp().path;

    this.dialogService
      .showRecursiveDeleteZNode(
        "Do you want to delete this node and its children?",
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMap((confirm: boolean) => {
          if (confirm) {
            return this.zNodeService.deleteNode(zNode.path, zNode.meta.dataVersion);
          }

          return EMPTY;
        }),
        catchError(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      )
      .forEach(() => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            [EDITOR_QUERY_NODE_PATH]: parentPath
          },
          queryParamsHandling: "merge"
        });
      });
  }

  onExportClick(): void {
    this.zNodeService
      .exportNodes([this.zPath.path])
      .pipe(
        catchError(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      )
      .forEach((zNodeExport: ZNodeExport) => this.fileSaverService.save(zNodeExport.blob, zNodeExport.name));
  }

  onDuplicateClick(): void {
    const source = this.zNode.valueOrThrow().path;

    this.dialogService
      .showDuplicateZNode(
        {
          path: source,
          redirect: false
        },
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMap((data: DuplicateZNodeData) => {
          if (data) {
            return this.zNodeService
              .duplicateNode(source, data.path)
              .pipe(switchMapTo(of(data)));
          }

          return EMPTY;
        }),
        catchError((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      )
      .forEach((data: CreateZNodeData) => {
        if (data.redirect) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              [EDITOR_QUERY_NODE_PATH]: data.path
            },
            queryParamsHandling: "merge"
          });

          return;
        }

        this.refresh.emit();
      });
  }

  onMoveClick(): void {
    const source = this.zNode.valueOrThrow().path;

    this.dialogService
      .showMoveZNode(
        {
          path: source
        },
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMap((data: MoveZNodeData) => {
          if (data) {
            return this.zNodeService
              .moveNode(source, data.path)
              .pipe(switchMapTo(of(data)));
          }

          return EMPTY;
        }),
        catchError((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      )
      .forEach((data: CreateZNodeData) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            [EDITOR_QUERY_NODE_PATH]: data.path
          },
          queryParamsHandling: "merge"
        });
      });
  }

  onPathKeyPress(event: KeyboardEvent): void {
    if (event.which === 13) {
      // Enter pressed
      this.navigatePath(this.pathInput.value);
    }
  }

  navigatePath(path: string): void {
    // Parse (validate) path
    const zPath = this.zPathService.parse(path);

    this.router
      .navigate([], {
        relativeTo: this.route,
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
