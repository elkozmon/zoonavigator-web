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

import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {ZPath, ZPathService} from "../zpath";
import {MatButton, MatInput} from "@angular/material";
import {Router} from "@angular/router";
import {EDITOR_QUERY_NODE_PATH} from "../editor-routing.constants";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: "zoo-editor-path",
  templateUrl: "editor-path.component.html",
  styleUrls: ["editor-path.component.scss"],
  animations: [
    trigger("rotatedState", [
      state("default", style({transform: "rotate(0)"})),
      state("rotated", style({transform: "rotate(360deg)"})),
      transition("default => rotated", animate("400ms ease-in"))
    ])
  ]
})
export class EditorPathComponent {

  @ViewChild("pathInput") pathInput: MatInput;

  @Output() refresh: EventEmitter<any> = new EventEmitter();

  @Input() zPath: ZPath;

  navigationError: string;

  refreshButtonRotatedState = "default";

  constructor(
    private router: Router,
    private zPathService: ZPathService
  ) {
  }

  onRefreshClick(): void {
    this.refreshButtonRotatedState = "default";
    setTimeout(() => this.refreshButtonRotatedState = "rotated", 0);

    this.refresh.emit();
  }

  onPathKeyPress(event: KeyboardEvent): void {
    if (event.which === 13) {
      // enter pressed
      this.navigatePath(this.pathInput.value);
    }
  }

  navigatePath(path: string): void {
    const zPath = this.zPathService.parse(path);

    if (zPath.isRoot()) {
      this.router
        .navigate(["/editor"])
        .catch(err => this.handleNavigateError(err));

      return;
    }

    this.router
      .navigate(["/editor/node"], {
        queryParams: {
          [EDITOR_QUERY_NODE_PATH]: path
        },
        queryParamsHandling: "merge"
      })
      .catch(err => this.handleNavigateError(err));
  }

  handleNavigateError(error: string): void {
    this.navigationError = error;
  }
}
