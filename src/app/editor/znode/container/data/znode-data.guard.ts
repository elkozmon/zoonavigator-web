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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {EDITOR_QUERY_NODE_PATH, EDITOR_QUERY_NODE_TAB} from "../../../editor-routing.constants";

@Injectable()
export class ZNodeDataGuard implements CanActivate {

  constructor(private router: Router) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // workaround for data tab not being active without query params
    if (!route.queryParamMap.has(EDITOR_QUERY_NODE_TAB)) {
      this.router.navigate(["/editor/node/data"], {
        replaceUrl: true,
        queryParams: {
          [EDITOR_QUERY_NODE_TAB]: "data",
          [EDITOR_QUERY_NODE_PATH]: route.queryParamMap.get(EDITOR_QUERY_NODE_PATH)
        }
      });

      return false;
    }

    return true;
  }
}
