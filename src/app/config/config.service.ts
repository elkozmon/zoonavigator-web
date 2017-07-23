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

import {Http} from "@angular/http";
import {Injectable} from "@angular/core";
import {Config} from "./config";
import "rxjs/add/operator/map";

@Injectable()
export class ConfigService {

  private _config: Config;

  constructor(private http: Http) {
  }

  load() {
    return new Promise((resolve, reject) => {
      this.http
        .get("/config.json")
        .map(res => res.json())
        .subscribe(
          data => {
            this._config = data;
            resolve(true);
          },
          error => {
            reject(error);
          }
        );
    });
  }

  get config(): Config {
    return this._config;
  }
}
