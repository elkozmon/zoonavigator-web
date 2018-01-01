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
import {Observable} from "rxjs/Rx";
import {Either} from "tsmonad";
import {ZNode, ZNodeMetaWith, ZNodeService} from "./znode";
import {ZPath, ZPathService} from "./zpath";
import {Ordering} from "./ordering";
import {EDITOR_QUERY_NODE_PATH} from "./editor-routing.constants";
import {FeedbackService, ZSessionHandler, ZSessionService} from "../core";
import {RegexpFilterComponent} from "../shared";

@Component({
  templateUrl: "editor.component.html",
  styleUrls: ["editor.component.scss"]
})
export class EditorComponent implements OnInit, AfterViewInit {

  @ViewChild("childrenFilter") childrenFilter: RegexpFilterComponent;

  currentZPath: Observable<ZPath>;

  childrenOrdering: Ordering = Ordering.Ascending;
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
    this.currentZPath = this.route
      .queryParams
      .pluck(EDITOR_QUERY_NODE_PATH)
      .map((maybePath: string) => this.zPathService.parse(maybePath || "/"));

    (<Observable<Either<Error, ZNodeMetaWith<ZNode[]>>>> this.route.data.pluck("children"))
      .forEach(either =>
        either.caseOf<void>({
          left: err => this.feedbackService.showError(err.message, this.viewContainerRef),
          right: meta => this.updateChildren(meta.data)
        })
      );
  }

  // TODO use this on delete
  // private navigateToParent(): void {
  //   const parentPath: ZPath = this.zPathService
  //     .parse(this.getCurrentPath())
  //     .goUp();
  //
  //   if (parentPath.isRoot()) {
  //     this.router.navigate(["/editor"]);
  //
  //     return;
  //   }
  //
  //   this.router.navigate(["./"], {
  //     relativeTo: this.route,
  //     queryParams: {
  //       [EDITOR_QUERY_NODE_PATH]: parentPath.toString()
  //     },
  //     queryParamsHandling: "merge"
  //   });
  // }

  ngAfterViewInit(): void {
    this.mediaService.broadcast();
    this.changeDetectorRef.detectChanges();
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
            return this.feedbackService.showAlert(
              "Session info",
              "Connection string: " + sessionInfo.connectionString,
              "Dismiss",
              this.viewContainerRef
            );
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

  reloadEditor(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const urlSegments = urlTree.root.children["primary"].segments.map(it => it.path);

    this.router
      .navigate(urlSegments, {
        queryParams: {
          i: ((parseInt(this.route.snapshot.queryParamMap.get("i"), 0) || 0) + 1) % 2
        },
        queryParamsHandling: "merge"
      })
      .catch(err => this.feedbackService.showError(err, this.viewContainerRef))
  }

  reloadChildren(): void {
    this.currentZPath
      .first()
      .switchMap(zPath =>
        this.zNodeService
          .getChildren(zPath.toString())
          .map(metaWithChildren => this.updateChildren(metaWithChildren.data))
      )
      .catch(err => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .subscribe();
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
