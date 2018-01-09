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
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Rx";
import {ZSessionHandler} from "../core/zsession/handler";
import {CONNECT_QUERY_RETURN_URL} from "../connect/connect-routing.constants";

@Injectable()
export class EditorGuard implements CanActivate, CanActivateChild {

  constructor(
    private router: Router,
    private zSessionHandler: ZSessionHandler
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkSession(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(childRoute, state);
  }

  private checkSession(url: string): Observable<boolean> {
    return this.zSessionHandler
      .getSessionInfo()
      .map((sessionInfo) => {
        if (sessionInfo) {
          return true;
        }

        this.router.navigate(["/"], {
            queryParams: {
              [CONNECT_QUERY_RETURN_URL]: url
            }
          }
        );

        return false;
      });
  }
}
