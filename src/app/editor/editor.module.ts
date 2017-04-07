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
import {DomSanitizer} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MdIconRegistry} from "@angular/material";
import {CovalentCoreModule, CovalentDialogsModule} from "@covalent/core";
import {AceEditorModule} from "ng2-ace-editor";
import {
  ZNodeContainerComponent,
  ZNodeAclComponent,
  ZNodeDataComponent,
  ZNodeMetaComponent,
  ZNodeService,
  ApiZNodeService
} from "./znode";
import {EditorPathComponent} from "./toolbar";
import {NavActionsComponent, NavListComponent} from "./sidenav";
import {EditorRoutingModule} from "./editor-routing.module";
import {EditorComponent} from "./editor.component";
import {ZPathService, DefaultZPathService} from "./zpath";
import {SharedModule} from "../shared";

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CovalentCoreModule,
    CovalentDialogsModule,
    AceEditorModule,
    EditorRoutingModule,
    SharedModule
  ],
  providers: [
    {provide: ZNodeService, useClass: ApiZNodeService},
    {provide: ZPathService, useClass: DefaultZPathService}
  ],
  declarations: [
    EditorComponent,
    EditorPathComponent,
    NavListComponent,
    NavActionsComponent,
    ZNodeContainerComponent,
    ZNodeAclComponent,
    ZNodeDataComponent,
    ZNodeMetaComponent
  ]
})
export class EditorModule {

  constructor(
    iconRegistry: MdIconRegistry,
    domSanitizer: DomSanitizer
  ) {
    iconRegistry.addSvgIconInNamespace(
      "assets",
      "paw",
      domSanitizer.bypassSecurityTrustResourceUrl("assets/paw.svg")
    );
  }
}
