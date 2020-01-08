/*
 * Copyright (C) 2019  Ľuboš Kozmon <https://www.elkozmon.com>
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

import {Component, OnDestroy, OnInit, ViewContainerRef} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {pluck} from "rxjs/operators";
import {Either} from "tsmonad";
import {DialogService, ZNodeMeta, ZNodeWithChildren} from "../../../core";
import {Subscription} from "rxjs/Rx";

@Component({
  templateUrl: "znode-meta.component.html",
  styleUrls: ["znode-meta.component.scss"]
})
export class ZNodeMetaComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  meta: ZNodeMeta;

  constructor(
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = (<Observable<Either<Error, ZNodeWithChildren>>> this.route.parent.data.pipe(pluck("zNodeWithChildren")))
      .subscribe(either =>
        either.caseOf<void>({
          left: err => {
            this.dialogService.showError(err, this.viewContainerRef);
            this.meta = null;
          },
          right: node => this.meta = node.meta
        })
      );
  }
}

