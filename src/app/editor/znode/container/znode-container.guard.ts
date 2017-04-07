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
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {EDITOR_QUERY_NODE_PATH, EDITOR_QUERY_NODE_TAB} from "../../editor-routing.constants";

@Injectable()
export class ZNodeContainerGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const maybeNodePath = route.queryParamMap.get(EDITOR_QUERY_NODE_PATH);

    if (maybeNodePath) {
      return true;
    }

    this.router.navigate(["/editor"]);

    return false;
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const queryTab = childRoute.queryParamMap.get(EDITOR_QUERY_NODE_TAB);
    const urlTab = childRoute.url[childRoute.url.length - 1].toString();

    if (queryTab && urlTab !== queryTab) {
      this.router.navigate(["/editor/node/" + queryTab], {
        queryParams: {
          [EDITOR_QUERY_NODE_TAB]: queryTab,
          [EDITOR_QUERY_NODE_PATH]: childRoute.queryParamMap.get(EDITOR_QUERY_NODE_PATH)
        }
      });

      return false;
    }

    return this.canActivate(childRoute, state);
  }
}
