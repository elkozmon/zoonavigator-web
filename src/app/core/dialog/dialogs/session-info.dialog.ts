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

import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material"
import {ZSessionInfo} from "../../zsession/zsession-info";
import {APP_VERSION} from "../../../app.version";

@Component({
  selector: "zoo-session-info.dialog",
  templateUrl: "session-info.dialog.html",
  styleUrls: ["dialog.scss"]
})
export class SessionInfoDialogComponent {

  appVersion = APP_VERSION;

  constructor(@Inject(MAT_DIALOG_DATA) public sessionInfo: ZSessionInfo) {
  }
}
