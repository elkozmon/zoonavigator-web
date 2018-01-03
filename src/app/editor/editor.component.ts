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
import {Ordering} from "./ordering";
import {EDITOR_QUERY_NODE_PATH} from "./editor-routing.constants";
import {
  ZPath,
  ZPathService,
  DialogService,
  ZSessionService,
  ZSessionHandler
} from "../core";
import {RegexpFilterComponent} from "../shared";
import {ZNodeWithChildren} from "../core/znode/znode-with-children";
import {ZNodePath} from "../core/znode/znode-path";

@Component({
  templateUrl: "editor.component.html",
  styleUrls: ["editor.component.scss"]
})
export class EditorComponent implements OnInit, AfterViewInit {

  @ViewChild("childrenFilter") childrenFilter: RegexpFilterComponent;

  zPath: Observable<ZPath>;

  childrenOrdering: Ordering = Ordering.Ascending;
  childrenFilterRegexp: RegExp = null;
  childrenZNodes: ZPath[] = [];
  filteredZNodes: ZPath[] = [];
  selectedZNodes: ZPath[] = [];

  private static filterZNodes(nodes: ZPath[], regexp: RegExp): ZPath[] {
    return nodes.filter(node => node.name.valueOrThrow().match(regexp));
  }

  constructor(
    public mediaService: TdMediaService,
    private route: ActivatedRoute,
    private router: Router,
    private zPathService: ZPathService,
    private zSessionHandler: ZSessionHandler,
    private zSessionService: ZSessionService,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.zPath = this.route
      .queryParams
      .pluck(EDITOR_QUERY_NODE_PATH)
      .map((maybePath: string) => this.zPathService.parse(maybePath || "/"));

    (<Observable<Either<Error, ZNodeWithChildren>>> this.route.data.pluck("zNodeWithChildren"))
      .forEach(either =>
        either.caseOf<void>({
          left: error => this.dialogService.showError(error.message, this.viewContainerRef),
          right: node => this.updateChildren(node.children)
        })
      );
  }

  // TODO use this on delete
  // private navigateToParent(): void {
  //   const parentPath: ZPath = this.zPathService
  //     .parse(this.getCurrentPath())
  //     .goUp();
  //
  //   if (parentPath.isRoot) {
  //     this.router.navigate(["/editor"]);
  //
  //     return;
  //   }
  //
  //   this.router.navigate(["./"], {
  //     relativeTo: this.route,
  //     queryParams: {
  //       [EDITOR_QUERY_NODE_PATH]: parentPath.path
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

  showSessionInfo(): void {
    this.zSessionHandler
      .getSessionInfo()
      .switchMap((sessionInfo) => {
          if (sessionInfo) {
            return this.dialogService.showAlert(
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

  selectZNode(zPath: ZPath): void {
    this.selectedZNodes.push(zPath);
  }

  deselectZNode(zPath: ZPath): void {
    this.selectedZNodes = this.selectedZNodes.filter(selectedNode => selectedNode !== zPath);
  }

  toggleSelectAll(): void {
    const selectedFilteredNodes = this.selectedZNodes.filter(node => this.filteredZNodes.indexOf(node) >= 0);
    const allFilteredNodesSelected = selectedFilteredNodes.length === this.filteredZNodes.length;

    if (!allFilteredNodesSelected) {
      this.selectedZNodes = this.filteredZNodes;

      return;
    }

    this.selectedZNodes = [];
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
      .catch(err => this.dialogService.showError(err, this.viewContainerRef))
  }

  private updateChildren(children: ZNodePath[]): void {
    this.childrenZNodes = children.map(path => this.zPathService.parse(path));

    this.updateFilteredChildren();
    this.updateSelectedChildren();
  }

  private updateFilteredChildren(): void {
    if (this.childrenFilterRegexp) {
      this.filteredZNodes = EditorComponent.filterZNodes(
        this.childrenZNodes,
        this.childrenFilterRegexp
      );

      return;
    }

    this.filteredZNodes = this.childrenZNodes;
  }

  private updateSelectedChildren(): void {
    // remove non-existing selected znodes
    this.selectedZNodes = this.selectedZNodes.filter(node => this.childrenZNodes.indexOf(node) >= 0);
  }
}
