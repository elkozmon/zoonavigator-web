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

import {APP_INITIALIZER, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ReactiveFormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {CovalentCoreModule} from "@covalent/core";
import {Angular2FontawesomeModule} from "angular2-fontawesome/angular2-fontawesome";
import {LocalStorageModule} from "angular-2-local-storage";
import {ConfigService, getConfigLoader} from "./config";
import {AppComponent} from "./app.component";
import {AppRoutingModule} from "./app-routing.module";
import {CoreModule} from "./core";
import {ConnectModule} from "./connect";
import {EditorModule} from "./editor";

@NgModule({
  imports: [
    LocalStorageModule.withConfig({
      prefix: "zoonavigator",
      storageType: "localStorage"
    }),
    BrowserAnimationsModule,
    Angular2FontawesomeModule,
    ReactiveFormsModule,
    BrowserModule,
    HttpModule,
    CovalentCoreModule,
    CoreModule,
    ConnectModule,
    EditorModule,
    AppRoutingModule
  ],
  providers: [
    ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: getConfigLoader,
      deps: [ConfigService],
      multi: true
    }
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
