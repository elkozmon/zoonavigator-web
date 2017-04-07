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
import {LocalStorageService} from "angular-2-local-storage";
import {StorageService} from "./storage.service";

@Injectable()
export class FallbackLocalStorageService implements StorageService {

  private data = {};

  constructor(private localStorageService: LocalStorageService) {
    if (!this.localStorageService.isSupported) {
      console.warn("Local storage is not supported by your browser");
    }
  }

  set(key: string, value: any): void {
    if (this.localStorageService.isSupported) {
      this.localStorageService.set(key, value);
      return;
    }

    this.data[key] = value;
  }

  get(key: string): any {
    if (this.localStorageService.isSupported) {
      return this.localStorageService.get(key);
    }

    return this.data[key];
  }

  remove(key: string): void {
    if (this.localStorageService.isSupported) {
      this.localStorageService.remove(key);
      return;
    }

    delete this.data[key];
  }
}
