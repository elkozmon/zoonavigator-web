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
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {ZSessionHandler} from "./zsession.handler";
import {ZSessionInfo} from "../zsession-info";
import {StorageService} from "../../storage";

@Injectable()
export class DefaultZSessionHandler implements ZSessionHandler {

  private sessionInfoKey = "DefaultZSessionHandler.sessionInfo";

  constructor(private storageService: StorageService) {
  }

  getSessionInfo(): Observable<ZSessionInfo | null> {
    return this.storageService
      .get(this.sessionInfoKey)
      .pipe(
        map((value) => value ? JSON.parse(value) : null)
      );
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
