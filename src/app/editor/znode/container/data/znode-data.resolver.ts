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

import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/toPromise";
import {ZNodeData} from "./znode-data";
import {ZNodeMetaWith} from "../meta/znode-meta-with";
import {ZNodeService} from "../../znode.service";
import {EDITOR_QUERY_NODE_PATH} from "../../../editor-routing.constants";
import {FeedbackService} from "../../../../core";

@Injectable()
export class ZNodeDataResolver implements Resolve<ZNodeMetaWith<ZNodeData>> {

  constructor(
    private router: Router,
    private zNodeService: ZNodeService,
    private feedbackService: FeedbackService
  ) {
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<ZNodeMetaWith<ZNodeData>> | Promise<ZNodeMetaWith<ZNodeData>> | ZNodeMetaWith<ZNodeData> {
    const nodePath = route.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/";

    return this.zNodeService
      .getData(nodePath)
      .toPromise()
      .catch((error) => {
        this.feedbackService
          .showError(error, null)
          .afterClosed()
          .subscribe(
            () => this.router.navigate(["/editor"])
          );
      })
      .then((data) => {
        if (!data) {
          return Promise.reject("Couldn't fetch znode data");
        }

        return Promise.resolve(data);
      });
  }
}
