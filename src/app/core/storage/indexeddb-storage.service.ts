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
import {AsyncLocalStorage} from "angular-async-local-storage";
import {StorageService} from "./storage.service";
import {Observable} from "rxjs/Rx";

@Injectable()
export class IndexedDBStorageService implements StorageService {

  constructor(private asyncLocalStorage: AsyncLocalStorage) {
  }

  set(key: string, value: any): Observable<void> {
    return this.asyncLocalStorage
      .setItem(key, value)
      .mapTo(null)
      .first();
  }

  get(key: string): Observable<any> {
    return this.asyncLocalStorage
      .getItem(key)
      .first();
  }

  remove(key: string): Observable<void> {
    return this.asyncLocalStorage
      .removeItem(key)
      .mapTo(null)
      .first();
  }
}
