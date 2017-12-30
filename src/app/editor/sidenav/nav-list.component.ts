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
import {ZNode, ZNodeService} from "../znode";
import {ZPath, ZPathService} from "../zpath";
import {Ordering} from "../ordering";
import {FeedbackService} from "../../core";
import {Observable} from "rxjs/Rx";

@Component({
  selector: "zoo-editor-nav-list",
  templateUrl: "nav-list.component.html",
  styleUrls: ["nav-list.component.scss"]
})
export class NavListComponent implements OnChanges {

  @Output() reload: EventEmitter<any> = new EventEmitter();
  @Output() select: EventEmitter<ZNode> = new EventEmitter();
  @Output() deselect: EventEmitter<ZNode> = new EventEmitter();

  @Input() zPath: ZPath;
  @Input() zNodes: ZNode[];
  @Input() zNodesSelected: ZNode[];
  @Input() zNodesOrdering: Ordering;

  private static compareZNodesAscending(a: ZNode, b: ZNode): number {
    if (a.name > b.name) {
      return 1;
    }

    if (a.name < b.name) {
      return -1;
    }

    return 0;
  }

  private static compareZNodesDescending(a: ZNode, b: ZNode): number {
    if (a.name > b.name) {
      return -1;
    }

    if (a.name < b.name) {
      return 1;
    }

    return 0;
  }

  constructor(
    private zNodeService: ZNodeService,
    private zPathService: ZPathService,
    private feedbackService: FeedbackService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("zNodes") || changes.hasOwnProperty("zNodesOrdering")) {
      this.sortZNodes();
    }
  }

  onNodeChecked(zNode: ZNode): void {
    this.select.emit(zNode);
  }

  onNodeUnchecked(zNode: ZNode): void {
    this.deselect.emit(zNode);
  }

  onNodeDeleteClick(zNode: ZNode): void {
    this.feedbackService
      .showConfirm(
        "Confirm recursive delete",
        `Do you want to delete node '${zNode.name}'and its children?`,
        "Delete",
        "Cancel",
        this.viewContainerRef
      )
      .afterClosed()
      .switchMap((name: string) => {
        if (name) {
          const dir = this.zPathService.parse(zNode.path).goUp().toString();

          return this.zNodeService
            .deleteChildren(dir, [zNode.name])
            .catch(err => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.reload.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onNodeDuplicateClick(zNode: ZNode): void {
    this.feedbackService
      .showPrompt(
        "Duplicate node",
        "Type in new node path",
        "Duplicate",
        "Cancel",
        this.viewContainerRef,
        zNode.path
      )
      .afterClosed()
      .switchMap((dest: string) => {
        if (dest) {
          return this.zNodeService
            .duplicateNode(zNode.path, dest)
            .catch((err) => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.reload.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onNodeMoveClick(zNode: ZNode): void {
    this.feedbackService
      .showPrompt(
        "Move node",
        "Type in new node path",
        "Move",
        "Cancel",
        this.viewContainerRef,
        zNode.path
      )
      .afterClosed()
      .switchMap((dest: string) => {
        if (dest) {
          return this.zNodeService
            .moveNode(zNode.path, dest)
            .catch((err) => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
            .map(() => this.reload.emit());
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
