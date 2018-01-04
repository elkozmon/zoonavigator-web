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
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {MatCheckboxModule, MatInputModule, MatDialogModule, MatButtonModule} from "@angular/material";
import {ApiRequestFactory, ApiService, DefaultApiService, DefaultApiRequestFactory} from "./api";
import {ApiZSessionService, DefaultZSessionHandler, ZSessionHandler, ZSessionService} from "./zsession";
import {DialogService, DefaultDialogService, CreateZNodeDialogComponent} from "./dialog";
import {StorageService, DefaultLocalStorageService} from "./storage";
import {ZPathService, DefaultZPathService} from "./zpath";
import {ZNodeService, ApiZNodeService} from "./znode";
import {MoveZNodeDialogComponent} from "./dialog/dialogs";
import {DuplicateZNodeDialogComponent} from "./dialog/dialogs/duplicate-znode.dialog";
import {DiscardChangesDialogComponent} from "./dialog/dialogs/discard-changes.dialog";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule
  ],
  providers: [
    {provide: ApiService, useClass: DefaultApiService},
    {provide: ApiRequestFactory, useClass: DefaultApiRequestFactory},
    {provide: StorageService, useClass: DefaultLocalStorageService},
    {provide: ZNodeService, useClass: ApiZNodeService},
    {provide: ZPathService, useClass: DefaultZPathService},
    {provide: ZSessionService, useClass: ApiZSessionService},
    {provide: ZSessionHandler, useClass: DefaultZSessionHandler},
    {provide: DialogService, useClass: DefaultDialogService}
  ],
  entryComponents: [
    MoveZNodeDialogComponent,
    CreateZNodeDialogComponent,
    DuplicateZNodeDialogComponent,
    DiscardChangesDialogComponent
  ],
  declarations: [
    MoveZNodeDialogComponent,
    CreateZNodeDialogComponent,
    DuplicateZNodeDialogComponent,
    DiscardChangesDialogComponent
  ]
})
export class CoreModule {
}
