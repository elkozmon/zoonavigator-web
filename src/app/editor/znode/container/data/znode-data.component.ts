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

import {AfterViewChecked, Component, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs/Rx";
import "brace";
import "brace/mode/text";
import "brace/mode/json";
import "brace/mode/yaml";
import "brace/mode/xml";
import "brace/theme/chrome";
import {ZNodeMetaWith} from "../meta/znode-meta-with";
import {ZNodeData} from "./znode-data";
import {ZNodeService} from "../../znode.service";
import {FeedbackService} from "../../../../core";
import {CanDeactivateComponent} from "../../../../shared";
import {EDITOR_QUERY_NODE_PATH} from "../../../editor-routing.constants";
import {AceEditorComponent} from "ng2-ace-editor";

@Component({
  templateUrl: "znode-data.component.html",
  styleUrls: ["znode-data.component.scss"]
})
export class ZNodeDataComponent implements OnInit, AfterViewChecked, CanDeactivateComponent {

  @ViewChild("dataEditor") editor: AceEditorComponent;

  editorModes: string[] = ["text", "json", "yaml", "xml"];
  editorMode = "text";
  editorOpts: any = {
    fontSize: "10pt"
  };

  metaWithData: ZNodeMetaWith<ZNodeData>;

  private shouldClearDataFormSelection: boolean;
  private dataPristine: string;

  constructor(
    private route: ActivatedRoute,
    private zNodeService: ZNodeService,
    private feedbackService: FeedbackService,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  get editorDirty(): boolean {
    if (!this.metaWithData) {
      return false;
    }

    return this.metaWithData.data !== this.dataPristine;
  }

  ngOnInit(): void {
    this.updateDataForm(this.route.snapshot.data["data"]);
    this.scheduleDataFormSelectionClear();

    this.route
      .queryParams
      .skip(1)
      .switchMap(queryParams => {
        const newNodePath = queryParams[EDITOR_QUERY_NODE_PATH] || "/";

        return this.reloadDataForm(newNodePath);
      })
      .subscribe();
  }

  ngAfterViewChecked(): void {
    // https://github.com/fxmontigny/ng2-ace-editor/issues/34
    if (this.shouldClearDataFormSelection) {
      this.clearDataFormSelection();
    }
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.editorDirty) {
      return this.feedbackService.showDiscardChanges(this.viewContainerRef);
    }

    return Observable.of(true);
  }

  onRefresh(): void {
    const path = this.getCurrentPath();

    if (!this.editorDirty) {
      this.reloadDataForm(path).subscribe();

      return;
    }

    this.feedbackService
      .showDiscardChanges(this.viewContainerRef)
      .switchMap(discard => {
        if (discard) {
          return this.reloadDataForm(path);
        }

        return Observable.empty<void>();
      })
      .subscribe();
  }

  onSubmit(): void {
    const data = this.metaWithData.data;

    this.zNodeService
      .setData(
        this.getCurrentPath(),
        this.metaWithData.meta.dataVersion,
        data
      )
      .map(meta => this.updateDataForm({data: data, meta: meta}))
      .switchMap(() =>
        this
          .feedbackService
          .showSuccess(
            "Changes saved",
            this.viewContainerRef
          )
          .afterOpened()
      )
      .catch(err => this.feedbackService.showErrorAndThrowOnClose(err))
      .subscribe();
  }

  private reloadDataForm(path: string): Observable<void> {
    return this.zNodeService
      .getData(path)
      .map(metaWithData => {
        this.updateDataForm(metaWithData);
        this.scheduleDataFormSelectionClear();
      })
      .catch(err => this.feedbackService.showErrorAndThrowOnClose<void>(err));
  }

  private updateDataForm(metaWithData: ZNodeMetaWith<ZNodeData>): void {
    this.metaWithData = metaWithData;
    this.dataPristine = metaWithData.data;
  }

  private getCurrentPath(): string | null {
    return this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH);
  }

  private scheduleDataFormSelectionClear(): void {
    this.shouldClearDataFormSelection = true;
  }

  private clearDataFormSelection(): void {
    const editor = this.editor.getEditor();

    editor.selection.moveCursorFileStart();
    editor.clearSelection();

    this.shouldClearDataFormSelection = false;
  }
}
