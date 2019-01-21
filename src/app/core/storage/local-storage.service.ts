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
import {StorageService} from "./storage.service";
import {Observable, of, defer} from "rxjs";
import {mapTo} from "rxjs/operators";

@Injectable()
export class LocalStorageService implements StorageService {

  constructor() {
  }

  set(key: string, value: any): Observable<void> {
    return defer(() => of(localStorage.setItem(key, value)))
      .pipe(mapTo(null));
  }

  get(key: string): Observable<any> {
    return defer(() => of(localStorage.getItem(key)));
  }

  remove(key: string): Observable<void> {
    return defer(() => of(localStorage.removeItem(key)))
      .pipe(mapTo(null));
  }
}
