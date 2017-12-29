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
import {RouterModule} from "@angular/router";
import {CanDeactivateComponentGuard} from "../shared";
import {EditorComponent} from "./editor.component";
import {
  ZNodeAclComponent,
  ZNodeAclResolver,
  ZNodeChildrenResolver,
  ZNodeContainerComponent,
  ZNodeContainerGuard,
  ZNodeDataComponent,
  ZNodeDataResolver,
  ZNodeMetaComponent,
  ZNodeMetaResolver
} from "./znode";
import {EditorGuard} from "./editor.guard";

const editorRoutes = [
  {
    path: "editor",
    component: EditorComponent,
    canActivate: [EditorGuard],
    canActivateChild: [EditorGuard],
    resolve: {
      children: ZNodeChildrenResolver
    },
    children: [
      {
        path: "node",
        component: ZNodeContainerComponent,
        canActivate: [ZNodeContainerGuard],
        canActivateChild: [ZNodeContainerGuard],
        children: [
          {
            path: "data",
            component: ZNodeDataComponent,
            canDeactivate: [CanDeactivateComponentGuard],
            resolve: {
              data: ZNodeDataResolver
            }
          },
          {
            path: "acl",
            component: ZNodeAclComponent,
            canDeactivate: [CanDeactivateComponentGuard],
            resolve: {
              acl: ZNodeAclResolver
            }
          },
          {
            path: "meta",
            component: ZNodeMetaComponent,
            resolve: {
              meta: ZNodeMetaResolver
            }
          },
          {
            path: "**",
            redirectTo: "data"
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(editorRoutes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    EditorGuard,
    ZNodeContainerGuard,
    ZNodeChildrenResolver,
    ZNodeDataResolver,
    ZNodeAclResolver,
    ZNodeMetaResolver
  ]
})
export class EditorRoutingModule {
}
