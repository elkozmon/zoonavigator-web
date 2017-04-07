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
import {ZPathService} from "./zpath.service";
import {ZPath} from "./zpath";
import {ZNode} from "../znode/znode";

@Injectable()
export class DefaultZPathService implements ZPathService {

  parse(path: string): ZPath {
    const accum: ZNode[] = [];

    if (path === "/") {
      return new ZPath(accum);
    }

    let idxBeg = 0;
    let idxEnd: number = path.indexOf("/", 1);

    while (idxEnd !== -1) {
      accum.push({
        path: path.slice(0, idxEnd),
        name: path.slice(idxBeg + 1, idxEnd)
      });

      idxBeg = idxEnd;
      idxEnd = path.indexOf("/", idxBeg + 1);
    }

    accum.push({
      path: path,
      name: path.slice(idxBeg + 1)
    });

    return new ZPath(accum);
  }

}
