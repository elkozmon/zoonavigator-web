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

import {Component, OnInit} from "@angular/core";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute} from "@angular/router";
import {EDITOR_QUERY_NODE_PATH} from "./editor/editor-routing.constants";

@Component({
  selector: "zoo-app",
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {

  constructor(
    private titleService: Title,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.activatedRoute
      .queryParamMap
      .subscribe(
        map => {
          if (map.has(EDITOR_QUERY_NODE_PATH)) {
            this.titleService.setTitle("ZooNavigator - " + map.get(EDITOR_QUERY_NODE_PATH));
          } else {
            this.titleService.setTitle("ZooNavigator");
          }
        }
      );
  }
}
