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
import {Router} from "@angular/router";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs/Rx";
import {ConfigService} from "../../../config";
import {CONNECT_QUERY_RETURN_URL} from "../../../connect/connect-routing.constants";
import {ApiResponse} from "../response/api-response";
import {ZSessionHandler} from "../../zsession/handler";
import {DialogService} from "../../dialog";
import {ApiRequest} from "../request";
import {ApiService} from "./api.service";

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
    private router: Router,
    private httpClient: HttpClient,
    private zSessionHandler: ZSessionHandler,
    private dialogService: DialogService,
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

    return <Observable<ApiResponse<T>>> this.httpClient
      .request(apiRequest.method, url, options)
      .timeoutWith(
        config.apiRequestTimeoutMillis,
        Observable.defer(() => Observable.throw(new Error("Request timed out")))
      )
      .map((t) => DefaultApiService.extractResponse<T>(t))
      .catch(err => this.handleError(err));
  }

  private handleError<T>(error: any): Observable<T> {
    let message: string;

    if (typeof error === "string" || error instanceof String) {
      message = <string> error;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (error instanceof HttpErrorResponse) {
      if (error.error.hasOwnProperty("success")) {
        message = DefaultApiService.extractResponse(error.error).message;
      } else {
        message = error.error || "Unable to receive a response";
      }

      if (error.status === 401) {
        const returnUrl = this.router.routerState.snapshot.url;

        this.dialogService
          .showError(message, null)
          .switchMap(ref => ref.afterClosed())
          .switchMapTo(this.zSessionHandler.setSessionInfo(null))
          .forEach(() => {
            this.router.navigate(["/"], {
              queryParams: {
                [CONNECT_QUERY_RETURN_URL]: returnUrl
              }
            });
          });
      }
    } else {
      message = "Unknown error occurred. See the console for details";
      console.error(error);
    }

    return Observable.throw(message);
  }
}
