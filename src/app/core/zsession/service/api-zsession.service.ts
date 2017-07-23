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
import {RequestMethod} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {ZSessionService, ApiRequest, ApiService} from "../../../core";
import {ConnectionParams} from "../connection-params";
import {ZSessionInfo} from "../zsession-info";
import "rxjs/add/operator/map";

@Injectable()
export class ApiZSessionService implements ZSessionService {

  constructor(
    private apiService: ApiService
  ) {
  }

  create(params: ConnectionParams): Observable<ZSessionInfo> {
    const request = new ApiRequest<ZSessionInfo>(
      "/zsession",
      RequestMethod.Post,
      null,
      params
    );

    return this.apiService
      .dispatch(request)
      .map(response => response.payload);
  }

  close(session: ZSessionInfo): Observable<void> {
    const request = new ApiRequest<string>(
      "/zsession",
      RequestMethod.Delete,
      null,
      null,
      session.token
    );

    return this.apiService
      .dispatch(request)
      .map(response => null);
  }
}
