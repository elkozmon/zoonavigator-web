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
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs/Rx";
import {ConfigService} from "../../../config";
import {ApiRequest} from "../request";
import {ApiResponse} from "../api-response";
import {ApiService} from "./api.service";
import {ZSessionHandler} from "../../zsession/handler";

@Injectable()
export class DefaultApiService implements ApiService {

  private static extractResponse<T>(body: any): ApiResponse<T> {
    return new ApiResponse(
      body.success,
      body.payload,
      body.message
    );
  }

  constructor(
    private http: HttpClient,
    private zSessionHandler: ZSessionHandler,
    private configService: ConfigService
  ) {
  }

  dispatch<T>(apiRequest: ApiRequest<T>): Observable<ApiResponse<T>> {
    const config = this.configService.config;

    const url: string = config.apiUrlPath.replace(/\/$/, "") + apiRequest.path;

    const options = {
      body: null,
      url: url,
      params: apiRequest.params,
      headers: apiRequest.headers || new HttpHeaders()
    };

    if (apiRequest.content) {
      options.body = apiRequest.content.data;
      options.headers = options.headers.set("Content-Type", apiRequest.content.type);
    }

    if (apiRequest.authToken) {
      options.headers = options.headers.set("Authorization", apiRequest.authToken);
    }

    return <Observable<ApiResponse<T>>> this.http
      .request(apiRequest.method, url, options)
      .timeoutWith(
        config.apiRequestTimeoutMillis,
        Observable.defer(() => Observable.throw(new Error("Request timed out")))
      )
      .map((t) => DefaultApiService.extractResponse<T>(t))
      .catch(this.handleError.bind(this));
  }

  private handleError<T>(error: any): Observable<T> {
    let message: string = error.toString();

    if (error instanceof HttpErrorResponse) {
      try {
        message = DefaultApiService
          .extractResponse(error.error)
          .message;
      } catch {
        message = error.message;
      }

      if (error.status === 401) {
        return this.zSessionHandler
          .onSessionInvalid(message)
          .mapTo(null);
      } else if (!message && error.status === 0) {
        message = "Unable to receive a response.";
      }
    }

    return Observable.throw(message);
  }
}
