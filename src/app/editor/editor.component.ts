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

import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {TdMediaService} from "@covalent/core";
import {ZSessionHandler, ZSessionService} from "../core";
import {ZNode} from "./znode";
import {ZPath, ZPathService} from "./zpath";
import {ZNodeService} from "./znode/znode.service";
import {FeedbackService} from "../core/feedback/feedback.service";
import {EDITOR_QUERY_NODE_PATH} from "./editor-routing.constants";
import {RegexpFilterComponent} from "../shared/regexp/regexp-filter.component";
import {Observable} from "rxjs/Rx";

@Component({
  templateUrl: "editor.component.html",
  styleUrls: ["editor.component.scss"]
})
export class EditorComponent implements OnInit, AfterViewInit {

  @ViewChild("childrenFilter") childrenFilter: RegexpFilterComponent;

  currentZPath: ZPath;

  childrenZNodes: ZNode[] = [];
  filteredZNodes: ZNode[] = [];
  selectedZNodes: ZNode[] = [];

  childrenFilterRegexp: RegExp = null;

  private static filterZNodes(nodes: ZNode[], regexp: RegExp): ZNode[] {
    return nodes.filter(node => node.name.match(regexp));
  }

  constructor(
    public mediaService: TdMediaService,
    private route: ActivatedRoute,
    private router: Router,
    private zNodeService: ZNodeService,
    private zSessionHandler: ZSessionHandler,
    private zSessionService: ZSessionService,
    private zPathService: ZPathService,
    private feedbackService: FeedbackService,
    private viewContainerRef: ViewContainerRef,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    const nodePath = this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/";
    this.currentZPath = this.zPathService.parse(nodePath);

    this.updateChildren(this.route.snapshot.data["children"].data);
  }

  ngAfterViewInit(): void {
    this.mediaService.broadcast();
    this.changeDetectorRef.detectChanges();

    // update values on query params change
    this.route
      .queryParams
      .skip(1)
      .switchMap(queryParams => {
        const nodePath = queryParams[EDITOR_QUERY_NODE_PATH] || "/";

        if (nodePath !== this.currentZPath.toString()) {
          this.currentZPath = this.zPathService.parse(nodePath);
          this.childrenFilter.clear();

          return this.reloadChildren();
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onFilterRegexpChange(regexp: RegExp): void {
    this.childrenFilterRegexp = regexp;
    this.updateFilteredChildren();
  }

  disconnect(): void {
    Observable
      .fromPromise(this.router.navigate(["/connect"]))
      .switchMap((success) => {
        if (success) {
          return this.zSessionHandler
            .getSessionInfo()
            .switchMap((sessionInfo) => this.zSessionService.close(sessionInfo));
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  showSessionInfo(): void {
    this.zSessionHandler
      .getSessionInfo()
      .switchMap((sessionInfo) => {
          if (sessionInfo) {
            this.feedbackService
              .showAlert(
                "Session info",
                "Connection string: " + sessionInfo.connectionString,
                "Dismiss",
                this.viewContainerRef
              )
              .afterClosed();
          }

          return Observable.empty();
        }
      )
      .subscribe();
  }

  selectZNode(zNode: ZNode): void {
    this.selectedZNodes.push(zNode);
  }

  deselectZNode(zNode: ZNode): void {
    this.selectedZNodes = this.selectedZNodes.filter(selectedZNode => selectedZNode !== zNode);
  }

  reloadChildren(): Observable<void> {
    return this.zNodeService
      .getChildren(this.currentZPath.toString())
      .map(metaWithChildren => this.updateChildren(metaWithChildren.data))
      .catch(err => this.feedbackService.showErrorAndThrowOnClose<void>(err));
  }

  toggleSelectAll(): void {
    const selectedFilteredNodes = this.selectedZNodes.filter(node => this.filteredZNodes.indexOf(node) >= 0);
    const allFilteredNodesSelected = selectedFilteredNodes.length === this.filteredZNodes.length;

    if (!allFilteredNodesSelected) {
      this.selectedZNodes = this.filteredZNodes;
    } else {
      this.selectedZNodes = [];
    }
  }

  private updateChildren(children: ZNode[]): void {
    this.childrenZNodes = children;

    this.updateFilteredChildren();
    this.updateSelectedChildren();
  }

  private updateFilteredChildren(): void {
    if (this.childrenFilterRegexp) {
      this.filteredZNodes = EditorComponent.filterZNodes(
        this.childrenZNodes,
        this.childrenFilterRegexp
      );
    } else {
      this.filteredZNodes = this.childrenZNodes;
    }
  }

  private updateSelectedChildren(): void {
    // remove non-existing selected znodes
    this.selectedZNodes = this.selectedZNodes.filter(node => this.childrenZNodes.indexOf(node) >= 0);
  }
}
