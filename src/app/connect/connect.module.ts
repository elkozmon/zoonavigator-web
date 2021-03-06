/*
 * Copyright (C) 2019  Ľuboš Kozmon <https://www.elkozmon.com>
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

import {NgModule} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule, MatCardModule, MatInputModule, MatSelectModule, MatSnackBarModule} from "@angular/material";
import {CovalentCommonModule, CovalentLoadingModule} from "@covalent/core";
import {AngularFontAwesomeModule} from "angular-font-awesome";
import {ConnectRoutingModule} from "./connect-routing.module";
import {ConnectComponent} from "./connect.component";

@NgModule({
  imports: [
    AngularFontAwesomeModule,
    ReactiveFormsModule,
    CovalentCommonModule,
    CovalentLoadingModule,
    ConnectRoutingModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  declarations: [
    ConnectComponent
  ]
})
export class ConnectModule {
}
