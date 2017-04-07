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

import {Component, Output, EventEmitter} from "@angular/core";

@Component({
  selector: "zoo-regexp-filter",
  templateUrl: "regexp-filter.component.html",
  styleUrls: ["regexp-filter.component.scss"]
})
export class RegexpFilterComponent {

  @Output() update: EventEmitter<RegExp> = new EventEmitter();
  @Output() error: EventEmitter<any> = new EventEmitter();

  filterError: any;

  private filter: RegExp;

  onChange(value: string): void {
    if (!this.filter || this.filter.source !== value) {
      try {
        this.update.emit(new RegExp(value));
        this.filterError = null;
      } catch (e) {
        this.filterError = e;
        this.error.emit(e);
      }
    }
  }
}
