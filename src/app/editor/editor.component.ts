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

import {AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {TdMediaService} from "@covalent/core";
import {ZSessionHandler, ZSessionService} from "../core";
import {ZNode} from "./znode";
import {ZPath, ZPathService} from "./zpath";
import {ZNodeService} from "./znode/znode.service";
import {FeedbackService} from "../core/feedback/feedback.service";
import {EDITOR_QUERY_NODE_PATH} from "./editor-routing.constants";
import {RegexpFilterComponent} from "../shared/regexp/regexp-filter.component";

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
    private viewContainerRef: ViewContainerRef
  ) {
  }

  ngOnInit(): void {
    const nodePath = this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/";
    this.currentZPath = this.zPathService.parse(nodePath);

    this.updateChildren(this.route.snapshot.data["children"].data);
  }

  ngAfterViewInit(): void {
    this.mediaService.broadcast();

    // update values on query params change
    this.route
      .queryParams
      .skip(1)
      .forEach(queryParams => {
        const nodePath = queryParams[EDITOR_QUERY_NODE_PATH] || "/";

        if (nodePath !== this.currentZPath.toString()) {
          this.currentZPath = this.zPathService.parse(nodePath);
          this.childrenFilter.clear();

          this.reloadChildren();
        }
      });
  }

  onFilterRegexpChange(regexp: RegExp): void {
    this.childrenFilterRegexp = regexp;
    this.updateFilteredChildren();
  }

  disconnect(): void {
    this.router
      .navigate(["/connect"])
      .then(success => {
        if (success) {
          this.zSessionService
            .close(this.zSessionHandler.sessionInfo)
            .subscribe(() => this.zSessionHandler.sessionInfo = null);
        }
      });
  }

  showSessionInfo(): void {
    this.feedbackService.showAlert(
      "Session info",
      "Connection string: " + this.zSessionHandler.sessionInfo.connectionString,
      "Dismiss",
      this.viewContainerRef
    );
  }

  selectZNode(zNode: ZNode): void {
    this.selectedZNodes.push(zNode);
  }

  deselectZNode(zNode: ZNode): void {
    this.selectedZNodes = this.selectedZNodes.filter(selectedZNode => selectedZNode !== zNode);
  }

  reloadChildren(): void {
    this.zNodeService
      .getChildren(this.currentZPath.toString())
      .subscribe(
        metaWithChildren => this.updateChildren(metaWithChildren.data),
        error => this.feedbackService.showError(error, null)
      );
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
