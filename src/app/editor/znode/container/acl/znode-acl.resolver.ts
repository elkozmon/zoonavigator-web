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
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Rx";
import {ZNodeAcl} from "./znode-acl";
import {ZNodeService} from "../../znode.service";
import {ZNodeMetaWith} from "../meta";
import {EDITOR_QUERY_NODE_PATH} from "../../../editor-routing.constants";
import {Either} from "tsmonad";

@Injectable()
export class ZNodeAclResolver implements Resolve<Either<Error, ZNodeMetaWith<ZNodeAcl>>> {

  constructor(private zNodeService: ZNodeService) {
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    const nodePath = route.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/";

    return this.zNodeService
      .getAcl(nodePath)
      .map(Either.right)
      .catch(err => Observable.of(Either.left<Error, ZNodeMetaWith<ZNodeAcl>>(new Error(err))));
  }
}
