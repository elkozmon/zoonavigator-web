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
import {Headers, Http, RequestOptionsArgs, Response} from "@angular/http";
import {Observable, ObservableInput} from "rxjs/Observable";
import "rxjs/add/observable/defer";
import "rxjs/add/observable/throw";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/timeoutWith";
import "rxjs/add/operator/skip";
import {ConfigService} from "../../../config";
import {ApiRequest} from "../request";
import {ApiResponse} from "../api-response";
import {ApiService} from "./api.service";
import {ZSessionHandler} from "../../zsession/handler/zsession.handler";

@Injectable()
export class DefaultApiService implements ApiService {

  private static extractResponse<T>(response: Response): ApiResponse<T> {
    const body = response.json();

    return new ApiResponse(
      body.success,
      body.payload,
      body.message
    );
  }

  constructor(
    private http: Http,
    private zSessionHandler: ZSessionHandler,
    private configService: ConfigService
  ) {
  }

  dispatch<T>(apiRequest: ApiRequest<T>): Observable<ApiResponse<T>> {
    const config = this.configService.config;

    const url: string = config.apiUrlPath.replace(/\/$/, "") + apiRequest.path;

    const options: RequestOptionsArgs = {
      url: url,
      search: apiRequest.params,
      method: apiRequest.method,
      body: apiRequest.payload
    };

    if (apiRequest.authToken) {
      options.headers = new Headers({
        "Authorization": apiRequest.authToken
      });
    }

    return this.http
      .request(url, options)
      .timeoutWith(
        config.apiRequestTimeoutMillis,
        Observable.defer(() => Observable.throw(new Error("Request timed out")))
      )
      .map(DefaultApiService.extractResponse)
      .catch(this.handleError.bind(this));
  }

  private handleError<T>(error: Response | any): ObservableInput<T> {
    let message: string = null;

    if (error instanceof Response) {
      message = DefaultApiService
        .extractResponse(error)
        .message;
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }

    if (!message && error.status === 0) {
      message = "Unable to receive a response.";
    }

    if (error.status === 403) {
      this.zSessionHandler.onSessionInvalid(message);
    }

    return Observable.throw(message);
  }
}
