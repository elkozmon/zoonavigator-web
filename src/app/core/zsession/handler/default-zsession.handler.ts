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

import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Rx";
import {ZSessionHandler} from "./zsession.handler";
import {ZSessionInfo} from "../zsession-info";
import {StorageService} from "../../storage";
import {CONNECT_QUERY_RETURN_URL} from "../../../connect/connect-routing.constants";
import {FeedbackService} from "../../feedback";

@Injectable()
export class DefaultZSessionHandler implements ZSessionHandler {

  private sessionInfoKey = "sessionInfo";
  private sessionInvalid = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private feedbackService: FeedbackService
  ) {
  }

  onSessionInvalid(reason: string): Observable<void> {
    if (this.sessionInvalid) {
      return Observable.empty();
    }

    this.sessionInvalid = true;

    return this.feedbackService
      .showError(reason, null)
      .switchMap(ref => ref.afterClosed())
      .map(() => {
        this
          .router
          .navigate(["/connect"], {
            queryParams: {
              [CONNECT_QUERY_RETURN_URL]: this.router.routerState.snapshot.url
            }
          })
          .then((success) => {
            if (success) {
              this
                .setSessionInfo(null)
                .subscribe();
            }
          });
      })
      .finally(() => this.sessionInvalid = false);
  }

  getSessionInfo(): Observable<ZSessionInfo | null> {
    return this.storageService
      .get(this.sessionInfoKey)
      .map((value) => value ? JSON.parse(value) : null);
  }

  setSessionInfo(value: ZSessionInfo | null): Observable<void> {
    if (value) {
      return this.storageService
        .set(this.sessionInfoKey, JSON.stringify(value));
    }

    return this.storageService
      .remove(this.sessionInfoKey);
  }
}
