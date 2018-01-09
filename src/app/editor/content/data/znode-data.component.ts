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

import {Component, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {AceEditorComponent} from "ng2-ace-editor";
import {Observable} from "rxjs/Rx";
import {Either} from "tsmonad";
import "brace";
import "brace/mode/text";
import "brace/mode/json";
import "brace/mode/yaml";
import "brace/mode/xml";
import "brace/theme/chrome";
import {DialogService, ZNode, ZNodeService, ZNodeWithChildren} from "../../../core";
import {CanDeactivateComponent} from "../../../shared";
import {EDITOR_QUERY_NODE_PATH} from "../../editor-routing.constants";
import {ZPathService} from "../../../core/zpath";

@Component({
  templateUrl: "znode-data.component.html",
  styleUrls: ["znode-data.component.scss"]
})
export class ZNodeDataComponent implements OnInit, CanDeactivateComponent {

  @ViewChild("dataEditor") editor: AceEditorComponent;

  editorData: string;
  editorModes: string[] = ["text", "json", "yaml", "xml"];
  editorMode = "text";
  editorOpts: any = {
    fontSize: "10pt",
    wrap : true
  };

  zNode: ZNode;

  constructor(
    private route: ActivatedRoute,
    private zNodeService: ZNodeService,
    private zPathService: ZPathService,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  get editorDirty(): boolean {
    if (!this.zNode) {
      return false;
    }

    return this.editorData !== this.zNode.data;
  }

  ngOnInit(): void {
    (<Observable<Either<Error, ZNodeWithChildren>>> this.route.parent.data.pluck("zNodeWithChildren"))
      .forEach(either =>
        either.caseOf<void>({
          left: error => {
            this.dialogService.showError(error.message, this.viewContainerRef);
            this.zNode = null;
          },
          right: node => this.updateData(node)
        })
      );
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.editorDirty) {
      return this.dialogService
        .showDiscardChanges(this.viewContainerRef)
        .switchMap(ref => ref.afterClosed());
    }

    return Observable.of(true);
  }

  onSubmit(): void {
    const newData = this.editorData;

    this.zNodeService
      .setData(
        this.currentPath,
        this.zNode.meta.dataVersion,
        newData
      )
      .map(newMeta => {
        const newNode: ZNode = {
          acl: this.zNode.acl,
          path: this.zNode.path,
          data: newData,
          meta: newMeta
        };

        this.updateData(newNode);
      })
      .switchMap(() =>
        this
          .dialogService
          .showSuccess(
            "Changes saved",
            this.viewContainerRef
          )
          .switchMap(ref => ref.afterOpened())
      )
      .catch(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .subscribe();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!(event.which === 115 && event.ctrlKey) && event.which !== 19) {
      return;
    }

    // Submit on CTRL + S
    event.preventDefault();
    this.onSubmit();
  }

  toggleWrap(): void {
    this.editorOpts.wrap = !this.editorOpts.wrap;
    this.updateOpts();
  }

  switchMode(mode: string): void {
    this.editorMode = mode;
  }

  private updateOpts(): void {
    this.editor.setOptions(this.editorOpts);
  }

  private updateData(node: ZNode): void {
    this.zNode = node;
    this.editorData = node.data;
  }

  private get currentPath(): string | null {
    return this.zPathService
      .parse(this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH) || "/")
      .path;
  }
}
