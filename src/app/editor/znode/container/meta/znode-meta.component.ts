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

import {Component, OnInit, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {ZNodeService} from "../../znode.service";
import {ZPath, ZPathService} from "../../../zpath";
import {ZNodeMeta} from "./znode-meta";
import {FeedbackService} from "../../../../core";
import {EDITOR_QUERY_NODE_PATH} from "../../../editor-routing.constants";
import {Observable} from "rxjs/Rx";

@Component({
  templateUrl: "znode-meta.component.html",
  styleUrls: ["znode-meta.component.scss"]
})
export class ZNodeMetaComponent implements OnInit {

  meta: ZNodeMeta;

  constructor(
    private feedbackService: FeedbackService,
    private viewContainerRef: ViewContainerRef,
    private router: Router,
    private route: ActivatedRoute,
    private zNodeService: ZNodeService,
    private zPathService: ZPathService
  ) {
  }

  ngOnInit(): void {
    this.meta = this.route.snapshot.data["meta"];

    this.route
      .queryParams
      .skip(1)
      .switchMap(queryParams => {
        const newNodePath = queryParams[EDITOR_QUERY_NODE_PATH] || "/";

        return this.reloadData(newNodePath);
      })
      .subscribe();
  }

  onRefresh(): void {
    this
      .reloadData(this.getCurrentPath())
      .subscribe();
  }

  onDelete(): void {
    this.feedbackService
      .showConfirm(
        "Confirm recursive delete",
        "Do you want to delete this node and all its children?",
        "Delete",
        "Cancel",
        this.viewContainerRef
      )
      .afterClosed()
      .switchMap((accept) => {
        if (accept) {
          return this
            .zNodeService
            .deleteNode(
              this.getCurrentPath(),
              this.meta.dataVersion
            );
        }

        return Observable.empty<void>();
      })
      .catch(err => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .subscribe(() => this.navigateToParent());
  }

  private reloadData(path: string): Observable<void> {
    return this.zNodeService
      .getMeta(path)
      .map(meta => this.updateData(meta))
      .catch(err => this.feedbackService.showErrorAndThrowOnClose<void>(err, this.viewContainerRef));
  }

  private updateData(meta: ZNodeMeta): void {
    this.meta = meta;
  }

  private navigateToParent(): void {
    const parentPath: ZPath = this.zPathService
      .parse(this.getCurrentPath())
      .goUp();

    if (parentPath.isRoot()) {
      this.router.navigate(["/editor"]);

      return;
    }

    this.router.navigate(["./"], {
      relativeTo: this.route,
      queryParams: {
        [EDITOR_QUERY_NODE_PATH]: parentPath.toString()
      },
      queryParamsHandling: "merge"
    });
  }

  private getCurrentPath(): string | null {
    return this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH);
  }
}

