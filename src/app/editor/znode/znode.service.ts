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
import {Observable} from "rxjs/Rx";
import {ZNodeAcl, ZNodeData, ZNodeMeta, ZNodeMetaWith} from "./container";
import {ZNode} from "./znode";

@Injectable()
export abstract class ZNodeService {

  abstract createNode(
    path: string
  ): Observable<void>

  abstract deleteNode(
    path: string,
    version: number
  ): Observable<void>

  abstract duplicateNode(
    sourcePath: string,
    destinationPath: string
  ): Observable<void>

  abstract moveNode(
    sourcePath: string,
    destinationPath: string
  ): Observable<void>

  abstract getAcl(
    path: string
  ): Observable<ZNodeMetaWith<ZNodeAcl>>

  abstract setAcl(
    path: string,
    version: number,
    acl: ZNodeAcl,
    recursively: boolean
  ): Observable<ZNodeMeta>

  abstract getData(
    path: string
  ): Observable<ZNodeMetaWith<ZNodeData>>

  abstract setData(
    path: string,
    version: number,
    data: ZNodeData
  ): Observable<ZNodeMeta>

  abstract getMeta(
    path: string
  ): Observable<ZNodeMeta>

  abstract getChildren(
    path: string
  ): Observable<ZNodeMetaWith<ZNode[]>>

  abstract deleteChildren(
    path: string,
    names: string[]
  ): Observable<void>
}
