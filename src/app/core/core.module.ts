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

import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {MatButtonModule, MatCheckboxModule, MatDialogModule, MatInputModule} from "@angular/material";
import {CovalentFileModule} from "@covalent/core";
import {ApiRequestFactory, ApiService, DefaultApiRequestFactory, DefaultApiService} from "./api";
import {ApiZSessionService, DefaultZSessionHandler, ZSessionHandler, ZSessionService} from "./zsession";
import {
  DialogService,
  DefaultDialogService,
  MoveZNodeDialogComponent,
  CreateZNodeDialogComponent,
  DuplicateZNodeDialogComponent,
  DiscardChangesDialogComponent,
  SessionInfoDialogComponent,
  ImportZNodesDialogComponent
} from "./dialog";
import {StorageService, LocalStorageService} from "./storage";
import {FileSaverService, DefaultFileSaverService} from "./file-saver";
import {DefaultZPathService, ZPathService} from "./zpath";
import {ApiZNodeService, ZNodeService} from "./znode";
import {DefaultFileReaderService, FileReaderService} from "./file-reader";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
    CovalentFileModule
  ],
  providers: [
    {provide: ApiService, useClass: DefaultApiService},
    {provide: ApiRequestFactory, useClass: DefaultApiRequestFactory},
    {provide: StorageService, useClass: LocalStorageService},
    {provide: FileSaverService, useClass: DefaultFileSaverService},
    {provide: FileReaderService, useClass: DefaultFileReaderService},
    {provide: ZNodeService, useClass: ApiZNodeService},
    {provide: ZPathService, useClass: DefaultZPathService},
    {provide: ZSessionService, useClass: ApiZSessionService},
    {provide: ZSessionHandler, useClass: DefaultZSessionHandler},
    {provide: DialogService, useClass: DefaultDialogService}
  ],
  entryComponents: [
    MoveZNodeDialogComponent,
    CreateZNodeDialogComponent,
    ImportZNodesDialogComponent,
    DuplicateZNodeDialogComponent,
    DiscardChangesDialogComponent,
    SessionInfoDialogComponent
  ],
  declarations: [
    MoveZNodeDialogComponent,
    CreateZNodeDialogComponent,
    ImportZNodesDialogComponent,
    DuplicateZNodeDialogComponent,
    DiscardChangesDialogComponent,
    SessionInfoDialogComponent
  ]
})
export class CoreModule {
}
