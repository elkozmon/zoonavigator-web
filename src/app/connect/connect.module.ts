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

import {NgModule} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {MdCardModule, MdInputModule, MdSnackBarModule} from "@angular/material";
import {CovalentCommonModule, CovalentLoadingModule} from "@covalent/core";
import {Angular2FontawesomeModule} from "angular2-fontawesome";
import {ConnectRoutingModule} from "./connect-routing.module";
import {ConnectComponent} from "./connect.component";

@NgModule({
  imports: [
    Angular2FontawesomeModule,
    ReactiveFormsModule,
    CovalentCommonModule,
    CovalentLoadingModule,
    ConnectRoutingModule,
    MdCardModule,
    MdInputModule,
    MdSnackBarModule
  ],
  declarations: [
    ConnectComponent
  ]
})
export class ConnectModule {
}
