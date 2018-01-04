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

import {Component, Input, EventEmitter, Output, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable} from "rxjs/Rx";
import {Ordering} from "../ordering";
import {ZNode, ZNodeService, ZPath, DialogService} from "../../core";
import {EDITOR_QUERY_NODE_PATH} from "../editor-routing.constants";

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
      .showConfirm(
        "Confirm recursive delete",
        `Do you want to delete node '${zPath.name.valueOrThrow()}' and its children?`,
        "Delete",
        "Cancel",
        this.viewContainerRef
      )
      .switchMap(ref => ref.afterClosed())
      .switchMap((confirm: boolean) => {
        if (confirm) {
          const parentDir = zPath.goUp().path;

          return this.zNodeService
            .deleteChildren(parentDir, [zPath.name.valueOrThrow()])
            .catch(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.refresh.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onNodeDuplicateClick(zNode: ZNode): void {
    this.dialogService
      .showPrompt(
        "Duplicate node",
        "Type in new node path",
        "Duplicate",
        "Cancel",
        this.viewContainerRef,
        zNode.path
      )
      .switchMap(ref => ref.afterClosed())
      .switchMap((destination: string) => {
        if (destination) {
          return this.zNodeService
            .duplicateNode(zNode.path, destination)
            .catch((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.refresh.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onNodeMoveClick(zNode: ZNode): void {
    this.dialogService
      .showPrompt(
        "Move node",
        "Type in new node path",
        "Move",
        "Cancel",
        this.viewContainerRef,
        zNode.path
      )
      .switchMap(ref => ref.afterClosed())
      .switchMap((destination: string) => {
        if (destination) {
          return this.zNodeService
            .moveNode(zNode.path, destination)
            .catch((err) => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.refresh.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  trackByPath(index: number, zNode: ZNode): string {
    return zNode.path;
  }

  private sortZNodes(): void {
    if (this.zNodesOrdering === Ordering.Ascending) {
      this.zNodes = this.zNodes.sort(NavListComponent.compareZNodesAscending);
      return;
    }

    this.zNodes = this.zNodes.sort(NavListComponent.compareZNodesDescending);
  }
}
