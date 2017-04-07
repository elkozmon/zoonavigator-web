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
import {URLSearchParams} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {ApiService, ApiRequestFactory} from "../../core";
import {ZNodeMeta} from "./container/meta/znode-meta";
import {ZNodeData} from "./container/data/znode-data";
import {ZNodeService} from "./znode.service";
import {ZNodeChildren} from "./children/znode-children";
import {ZNodeMetaWith} from "./container/meta/znode-meta-with";
import {ZNodeAcl} from "./container/acl/znode-acl";

@Injectable()
export class ApiZNodeService implements ZNodeService {

  constructor(
    private apiService: ApiService,
    private apiRequestFactory: ApiRequestFactory
  ) {
  }

  createNode(path: string): Observable<void> {
    const params = new URLSearchParams();
    params.set("path", path);

    const request = this.apiRequestFactory.postRequest("/znode", params);

    return this.apiService
      .dispatch(request)
      .map(response => null);
  }

  deleteNode(
    path: string,
    version: number
  ): Observable<void> {
    const params = new URLSearchParams();
    params.set("path", path);
    params.set("version", version.toString());

    const request = this.apiRequestFactory.deleteRequest("/znode", params);

    return this.apiService
      .dispatch(request)
      .map(response => null);
  }

  getAcl(path: string): Observable<ZNodeMetaWith<ZNodeAcl>> {
    const params = new URLSearchParams();
    params.set("path", path);

    const request = this.apiRequestFactory.getRequest("/znode/acl", params);

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  setAcl(
    path: string,
    version: number,
    acl: ZNodeAcl,
    recursively: boolean
  ): Observable<ZNodeMeta> {
    const params = new URLSearchParams();
    params.set("path", path);
    params.set("version", version.toString());

    if (recursively) {
      params.set("recursive", "true");
    }

    const request = this.apiRequestFactory.putRequest("/znode/acl", params, acl);

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  getData(path: string): Observable<ZNodeMetaWith<ZNodeData>> {
    const params = new URLSearchParams();
    params.set("path", path);

    const request = this.apiRequestFactory.getRequest("/znode/data", params);

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  setData(
    path: string,
    version: number,
    data: ZNodeData
  ): Observable<ZNodeMeta> {
    const params = new URLSearchParams();
    params.set("path", path);
    params.set("version", version.toString());

    const request = this.apiRequestFactory.putRequest("/znode/data", params, data);

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  getMeta(path: string): Observable<ZNodeMeta> {
    const params = new URLSearchParams();
    params.set("path", path);

    const request = this.apiRequestFactory.getRequest("/znode/meta", params);

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  getChildren(path: string): Observable<ZNodeMetaWith<ZNodeChildren>> {
    const params = new URLSearchParams();
    params.set("path", path);

    const request = this.apiRequestFactory.getRequest("/znode/children", params);

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  deleteChildren(
    path: string,
    names: string[]
  ): Observable<void> {
    const params = new URLSearchParams();
    params.set("path", path);
    params.set("names", names.join("/"));

    const request = this.apiRequestFactory.deleteRequest("/znode/children", params);

    return this.apiService
      .dispatch(request)
      .map(response => null);
  }
}
