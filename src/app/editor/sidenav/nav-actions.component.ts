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
import {ZPath} from "../zpath";
import {ZNode, ZNodeService} from "../znode";
import {FeedbackService} from "../../core";

@Component({
  selector: "zoo-editor-nav-actions",
  templateUrl: "nav-actions.component.html",
  styleUrls: ["nav-actions.component.scss"]
})
export class NavActionsComponent {

  @Output() selectAll: EventEmitter<any> = new EventEmitter();
  @Output() reload: EventEmitter<any> = new EventEmitter();

  @Input() zPath: ZPath;
  @Input() zNodes: ZNode[];

  constructor(
    private feedbackService: FeedbackService,
    private zNodeService: ZNodeService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  onReloadClick(): void {
    this.reload.emit();
  }

  onSelectAllClick(): void {
    this.selectAll.emit();
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
      .subscribe((name: string) => {
        if (name) {
          this.zNodeService
            .createNode(snapshotZPath.goDown(name).toString())
            .subscribe(
              success => this.reload.emit(),
              error => this.feedbackService.showError(error, null)
            );
        }
      });
  }

  onDeleteClick(): void {
    const path = this.zPath.toString();
    const names = this.zNodes.map(node => node.name);

    const message = `Do you want to delete ${names.length} ${names.length === 1 ? "node and its" : "nodes and their"} children?`;

    this.feedbackService.showConfirm(
      "Confirm recursive delete",
      message,
      "Confirm",
      "Cancel",
      this.viewContainerRef
    )
      .afterClosed()
      .subscribe((accept: boolean) => {
        if (accept) {
          this.zNodeService
            .deleteChildren(path, names)
            .subscribe(
              success => this.reload.emit(),
              error => this.feedbackService.showError(error, null)
            );
        }
      });
  }
}
