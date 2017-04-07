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
import {URLSearchParams, RequestMethod} from "@angular/http";
import {ApiRequest} from "./api-request";
import {ApiRequestFactory} from "./api-request.factory";
import {ZSessionHandler} from "../../zsession/handler/zsession.handler";

@Injectable()
export class ZSessionApiRequestFactory implements ApiRequestFactory {

  constructor(
    private zSessionHandler: ZSessionHandler
  ) {
  }

  getRequest<T>(
    path: string,
    params?: URLSearchParams
  ): ApiRequest<T> {
    return new ApiRequest<T>(
      path,
      RequestMethod.Get,
      params,
      null,
      this.sessionToken
    );
  }

  postRequest<T>(
    path: string,
    params?: URLSearchParams,
    payload?: any
  ): ApiRequest<T> {
    return new ApiRequest<T>(
      path,
      RequestMethod.Post,
      params,
      payload,
      this.sessionToken
    );
  }

  putRequest<T>(
    path: string,
    params?: URLSearchParams,
    payload?: any
  ): ApiRequest<T> {
    return new ApiRequest<T>(
      path,
      RequestMethod.Put,
      params,
      payload,
      this.sessionToken
    );
  }

  deleteRequest<T>(
    path: string,
    params?: URLSearchParams
  ): ApiRequest<T> {
    return new ApiRequest<T>(
      path,
      RequestMethod.Delete,
      params,
      null,
      this.sessionToken
    );
  }

  private get sessionToken(): string | null {
    return this.zSessionHandler.sessionInfo
      ? this.zSessionHandler.sessionInfo.token
      : null;
  }
}
