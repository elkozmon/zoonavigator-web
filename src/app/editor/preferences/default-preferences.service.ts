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
import {Observable} from "rxjs/Rx";
import {Maybe} from "tsmonad";
import {Mode} from "../mode";
import {PreferencesService} from "./preferences.service";
import {StorageService} from "../../core/storage";

@Injectable()
export class DefaultPreferencesService extends PreferencesService {

  private static getModeKey(path: string, creationId: number): string {
    return "DefaultPreferencesService.mode:" + path + "@" + creationId;
  }

  private static getWrapKey(path: string, creationId: number): string {
    return "DefaultPreferencesService.wrap:" + path + "@" + creationId;
  }

  constructor(private storageService: StorageService) {
    super();
  }

  setModeFor(path: string, creationId: number, mode: Mode): Observable<void> {
    const key = DefaultPreferencesService.getModeKey(path, creationId);

    return this.storageService.set(key, mode);
  }

  getModeFor(path: string, creationId: number): Observable<Maybe<Mode>> {
    const key = DefaultPreferencesService.getModeKey(path, creationId);

    return this.storageService.get(key).map(Maybe.maybe);
  }

  setWrapFor(path: string, creationId: number, enabled: boolean): Observable<void> {
    const key = DefaultPreferencesService.getWrapKey(path, creationId);

    return this.storageService.set(key, enabled ? "true" : "false");
  }

  getWrapFor(path: string, creationId: number): Observable<Maybe<boolean>> {
    const key = DefaultPreferencesService.getWrapKey(path, creationId);

    return this.storageService.get(key).map(Maybe.maybe).map(ms => ms.map(s => s === "true"));
  }
}
