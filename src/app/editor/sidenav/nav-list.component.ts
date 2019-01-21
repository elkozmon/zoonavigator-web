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

import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {EMPTY, of} from "rxjs";
import {catchError, map, switchMap, switchMapTo} from "rxjs/operators";
import {Ordering} from "../ordering";
import {DialogService, FileSaverService, ZNodeExport, ZNodeService, ZPath} from "../../core";
import {EDITOR_QUERY_NODE_PATH} from "../editor-routing.constants";
import {DuplicateZNodeData, MoveZNodeData} from "../../core/dialog/dialogs";
import {CreateZNodeData} from "../../core/dialog";

@Component({
  selector: "zoo-editor-nav-list",
  templateUrl: "nav-list.component.html",
  styleUrls: ["nav-list.component.scss"]
})
export class NavListComponent implements OnChanges {

  @Output() refresh: EventEmitter<any> = new EventEmitter();
  @Output() select: EventEmitter<ZPath> = new EventEmitter();
  @Output() deselect: EventEmitter<ZPath> = new EventEmitter();

  @Input() zPath: ZPath;
  @Input() zNodes: ZPath[];
  @Input() zNodesSelected: ZPath[];
  @Input() zNodesOrdering: Ordering;

  private static compareZNodesAscending(a: ZPath, b: ZPath): number {
    if (a.name.valueOrThrow() > b.name.valueOrThrow()) {
      return 1;
    }

    if (a.name.valueOrThrow() < b.name.valueOrThrow()) {
      return -1;
    }

    return 0;
  }

  private static compareZNodesDescending(a: ZPath, b: ZPath): number {
    if (a.name.valueOrThrow() > b.name.valueOrThrow()) {
      return -1;
    }

    if (a.name.valueOrThrow() < b.name.valueOrThrow()) {
      return 1;
    }

    return 0;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zNodeService: ZNodeService,
    private dialogService: DialogService,
    private fileSaverService: FileSaverService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("zNodes") || changes.hasOwnProperty("zNodesOrdering")) {
      this.sortZNodes();
    }
  }

  onNavigateClick(zPath: ZPath): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [EDITOR_QUERY_NODE_PATH]: zPath.path
      },
      queryParamsHandling: "merge"
    });
  }

  onNodeChecked(zPath: ZPath): void {
    this.select.emit(zPath);
  }

  onNodeUnchecked(zPath: ZPath): void {
    this.deselect.emit(zPath);
  }

  onNodeDeleteClick(zPath: ZPath): void {
    this.dialogService
      .showRecursiveDeleteZNode(
        `Do you want to delete node '${zPath.name.valueOrThrow()}' and its children?`,
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMap((confirm: boolean) => {
          if (confirm) {
            const parentDir = zPath.goUp().path;

            return this.zNodeService.deleteChildren(parentDir, [zPath.name.valueOrThrow()]);
          }

          return EMPTY;
        }),
        catchError(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef)),
        map(() => this.refresh.emit())
      )
      .subscribe();
  }

  onNodeExportClick(zPath: ZPath): void {
    this.zNodeService
      .exportNodes([zPath.path])
      .pipe(
        catchError(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      )
      .forEach((zNodeExport: ZNodeExport) => this.fileSaverService.save(zNodeExport.blob, zNodeExport.name));
  }

  onNodeDuplicateClick(zPath: ZPath): void {
    this.dialogService
      .showDuplicateZNode(
        {
          path: zPath.path,
          redirect: false
        },
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMap((data: DuplicateZNodeData) => {
          if (data) {
            return this.zNodeService
              .duplicateNode(zPath.path, data.path)
              .pipe(
                catchError((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef)),
                switchMapTo(of(data))
              );
          }

          return EMPTY;
        })
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

  onNodeMoveClick(zPath: ZPath): void {
    this.dialogService
      .showMoveZNode(
        {
          path: zPath.path,
          redirect: false
        },
        this.viewContainerRef
      )
      .pipe(
        switchMap(ref => ref.afterClosed()),
        switchMap((data: MoveZNodeData) => {
          if (data) {
            return this.zNodeService
              .moveNode(zPath.path, data.path)
              .pipe(
                catchError((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef)),
                switchMapTo(of(data))
              );
          }

          return EMPTY;
        })
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

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  trackByPath(index: number, zPath: ZPath): string {
    return zPath.path;
  }

  private sortZNodes(): void {
    if (this.zNodesOrdering === Ordering.Ascending) {
      this.zNodes = this.zNodes.sort(NavListComponent.compareZNodesAscending);
      return;
    }

    this.zNodes = this.zNodes.sort(NavListComponent.compareZNodesDescending);
  }
}
