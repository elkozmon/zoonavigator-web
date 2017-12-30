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

import {Component, EventEmitter, Output, Input, ViewContainerRef} from "@angular/core";
import {trigger, state, style, animate, transition} from "@angular/animations";
import {ZPath} from "../zpath";
import {ZNode, ZNodeService} from "../znode";
import {FeedbackService} from "../../core";
import {Observable} from "rxjs/Rx";
import {Ordering} from "../ordering";

@Component({
  selector: "zoo-editor-nav-actions",
  templateUrl: "nav-actions.component.html",
  styleUrls: ["nav-actions.component.scss"],
  animations: [
    trigger("rotatedState", [
      state("default", style({transform: "rotate(0)"})),
      state("rotated", style({transform: "rotate(360deg)"})),
      transition("default => rotated", animate("400ms ease-in"))
    ]),
    trigger("flippedState", [
      state("default", style({transform: "scale(1, 1)"})),
      state("flipped", style({transform: "scale(1, -1) translate(0, -2px)"}))
    ])
  ]
})
export class NavActionsComponent {

  @Output() selectAll: EventEmitter<any> = new EventEmitter();
  @Output() reload: EventEmitter<any> = new EventEmitter();

  @Input() zPath: ZPath;
  @Input() zNodes: ZNode[];

  @Input() ordering: Ordering;
  @Output() orderingChange = new EventEmitter<Ordering>();

  private toggleSortButtonFlippedState = "flipped";

  private reloadButtonRotatedState = "default";

  constructor(
    private feedbackService: FeedbackService,
    private zNodeService: ZNodeService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  onSelectAllClick(): void {
    this.selectAll.emit();
  }

  onToggleSortClick(): void {
    let newOrdering: Ordering;

    if (this.ordering === Ordering.Descending) {
      newOrdering = Ordering.Ascending;
      this.toggleSortButtonFlippedState = "flipped";
    } else {
      newOrdering = Ordering.Descending;
      this.toggleSortButtonFlippedState = "default";
    }

    this.ordering = newOrdering;
    this.orderingChange.emit(newOrdering);
  }

  onReloadClick(): void {
    this.reloadButtonRotatedState = "default";
    setTimeout(() => this.reloadButtonRotatedState = "rotated", 0);

    this.reload.emit();
  }

  onCreateClick(): void {
    const snapshotZPath = this.zPath.clone();

    this.feedbackService
      .showPrompt(
        "Create child node",
        "Type in new node name",
        "Create",
        "Cancel",
        this.viewContainerRef
      )
      .afterClosed()
      .switchMap((name: string) => {
        if (name) {
          return this.zNodeService
            .createNode(snapshotZPath.goDown(name).toString())
            .catch(err => this.feedbackService.showErrorAndThrowOnClose(err))
            .map(() => this.reload.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onDeleteClick(): void {
    const path = this.zPath.toString();
    const names = this.zNodes.map(node => node.name);

    const message = `Do you want to delete ${names.length} ${names.length === 1 ? "node and its" : "nodes and their"} children?`;

    this.feedbackService
      .showConfirm(
        "Confirm recursive delete",
        message,
        "Confirm",
        "Cancel",
        this.viewContainerRef
      )
      .afterClosed()
      .switchMap((accept: boolean) => {
        if (accept) {
          return this.zNodeService
            .deleteChildren(path, names)
            .catch(err => this.feedbackService.showErrorAndThrowOnClose(err))
            .map(() => this.reload.emit());
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }
}
