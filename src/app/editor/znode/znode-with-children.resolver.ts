/*
 * Copyright (C) 2018  Ľuboš Kozmon
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
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable, of} from "rxjs";
import {map, catchError} from "rxjs/operators";
import {Either} from "tsmonad";
import {ZNodeService, ZNodeWithChildren} from "../../core";
import {EDITOR_QUERY_NODE_PATH} from "../editor-routing.constants";
import {ZPathService} from "../../core/zpath";

@Injectable()
export class ZNodeWithChildrenResolver implements Resolve<Either<Error, ZNodeWithChildren>> {

  constructor(
    private zNodeService: ZNodeService,
    private zPathService: ZPathService
  ) {
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    const nodePath = this.zPathService
      .parse(route.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/")
      .path;

    return this.zNodeService
      .getNode(nodePath)
      .pipe(
        map(Either.right),
        catchError(err => of(Either.left<Error, ZNodeWithChildren>(new Error(err))))
      );
  }
}
