/*
 * Copyright (C) 2019  Ľuboš Kozmon
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
import {HttpParams} from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {map, mapTo, switchMap} from "rxjs/operators";
import {ZNodeService} from "./znode.service";
import {ZNodeChildren} from "./znode-children";
import {ZNodeMeta} from "./znode-meta";
import {ZNodeData} from "./znode-data";
import {ZNodeAcl} from "./znode-acl";
import {ZNodeWithChildren} from "./znode-with-children";
import {ZSessionHandler} from "../zsession";
import {ApiRequestFactory, ApiService, JsonRequestContent, TextRequestContent} from "../api";
import {ZNodeExport} from "./znode-export";

@Injectable()
export class ApiZNodeService implements ZNodeService {

  constructor(
    private apiService: ApiService,
    private zSessionHandler: ZSessionHandler,
    private apiRequestFactory: ApiRequestFactory
  ) {
  }

  private withAuthToken<T>(fun: (string) => Observable<T>): Observable<T> {
    return this.zSessionHandler
      .getSessionInfo()
      .pipe(
        switchMap(maybeSessionInfo => maybeSessionInfo.caseOf({
          just: info => of(info.token),
          nothing: () => throwError("Session was lost")
        })),
        switchMap(fun)
      );
  }

  getNode(path: string): Observable<ZNodeWithChildren> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path
        }
      });

      const request = this.apiRequestFactory.getRequest(
        "/znode",
        params,
        null,
        token
      );

      return this.apiService
        .dispatch<ZNodeWithChildren>(request)
        .pipe(
          map(response => response.payload)
        );
    });
  }

  createNode(
    path: string
  ): Observable<void> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path
        }
      });

      const request = this.apiRequestFactory.postRequest(
        "/znode",
        params,
        null,
        null,
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          mapTo(null)
        );
    });
  }

  deleteNode(
    path: string,
    version: number
  ): Observable<void> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path,
          version: version.toString()
        }
      });

      const request = this.apiRequestFactory.deleteRequest(
        "/znode",
        params,
        null,
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          mapTo(null)
        );
    });
  }

  duplicateNode(
    sourcePath: string,
    destinationPath: string
  ): Observable<void> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          source: sourcePath,
          destination: destinationPath
        }
      });

      const request = this.apiRequestFactory.postRequest(
        "/znode/duplicate",
        params,
        null,
        null,
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          mapTo(null)
        );
    });
  }

  moveNode(
    sourcePath: string,
    destinationPath: string
  ): Observable<void> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          source: sourcePath,
          destination: destinationPath
        }
      });

      const request = this.apiRequestFactory.postRequest(
        "/znode/move",
        params,
        null,
        null,
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          mapTo(null)
        );
    });
  }

  setAcl(
    path: string,
    version: number,
    acl: ZNodeAcl,
    recursively: boolean
  ): Observable<ZNodeMeta> {
    return this.withAuthToken(token => {
      let params = new HttpParams({
        fromObject: {
          path: path,
          version: version.toString()
        }
      });

      if (recursively) {
        params = params.set("recursive", "true");
      }

      const request = this.apiRequestFactory.putRequest(
        "/znode/acl",
        params,
        null,
        new JsonRequestContent(acl),
        token
      );

      return this.apiService
        .dispatch<ZNodeMeta>(request)
        .pipe(
          map(response => response.payload)
        );
    });
  }

  setData(
    path: string,
    version: number,
    data: ZNodeData
  ): Observable<ZNodeMeta> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path,
          version: version.toString()
        }
      });

      const request = this.apiRequestFactory.putRequest(
        "/znode/data",
        params,
        null,
        new TextRequestContent(data),
        token
      );

      return this.apiService
        .dispatch<ZNodeMeta>(request)
        .pipe(
          map(response => response.payload)
        );
    });
  }

  getChildren(
    path: string
  ): Observable<ZNodeChildren> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path
        }
      });

      const request = this.apiRequestFactory.getRequest(
        "/znode/children",
        params,
        null,
        token
      );

      return this.apiService
        .dispatch<ZNodeChildren>(request)
        .pipe(
          map(response => response.payload)
        );
    });
  }

  deleteChildren(
    path: string,
    names: string[]
  ): Observable<void> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path,
          names: names
        }
      });

      const request = this.apiRequestFactory.deleteRequest(
        "/znode/children",
        params,
        null,
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          mapTo(null)
        );
    });
  }

  exportNodes(
    paths: string[]
  ): Observable<ZNodeExport> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          paths: paths
        }
      });

      const request = this.apiRequestFactory.getRequest(
        "/znode/export",
        params,
        null,
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          map(response => {
            return {
              blob: new Blob([JSON.stringify(response.payload)], {type: "text/plain"}),
              name: "znode-export-" + new Date().toISOString() + ".json"
            }
          })
        );
    });
  }

  importNodes(
    path: string,
    nodes: any
  ): Observable<void> {
    return this.withAuthToken(token => {
      const params = new HttpParams({
        fromObject: {
          path: path
        }
      });

      const request = this.apiRequestFactory.postRequest(
        "/znode/import",
        params,
        null,
        new JsonRequestContent(nodes),
        token
      );

      return this.apiService
        .dispatch(request)
        .pipe(
          mapTo(null)
        );
    });
  }
}
