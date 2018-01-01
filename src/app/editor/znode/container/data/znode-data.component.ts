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

import {Component, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs/Rx";
import "brace";
import "brace/mode/text";
import "brace/mode/json";
import "brace/mode/yaml";
import "brace/mode/xml";
import "brace/theme/chrome";
import {ZNodeMetaWith} from "../meta";
import {ZNodeData} from "./znode-data";
import {ZNodeService} from "../../znode.service";
import {FeedbackService} from "../../../../core";
import {CanDeactivateComponent} from "../../../../shared";
import {EDITOR_QUERY_NODE_PATH} from "../../../editor-routing.constants";
import {AceEditorComponent} from "ng2-ace-editor";
import {Either} from "tsmonad";

@Component({
  templateUrl: "znode-data.component.html",
  styleUrls: ["znode-data.component.scss"]
})
export class ZNodeDataComponent implements OnInit, CanDeactivateComponent {

  @ViewChild("dataEditor") editor: AceEditorComponent;

  editorModes: string[] = ["text", "json", "yaml", "xml"];
  editorMode = "text";
  editorOpts: any = {
    fontSize: "10pt"
  };

  metaWithData: ZNodeMetaWith<ZNodeData>;

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
    (<Observable<Either<Error, ZNodeMetaWith<ZNodeData>>>> this.route.data.pluck("data"))
      .forEach(either =>
        either.caseOf<void>({
          left: err => {
            this.feedbackService.showError(err.message, this.viewContainerRef);
            this.metaWithData = null;
          },
          right: meta => this.updateDataForm(meta)
        })
      );
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.editorDirty) {
      return this.feedbackService.showDiscardChanges(this.viewContainerRef);
    }

    return Observable.of(true);
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
          .switchMap(ref => ref.afterOpened())
      )
      .catch(err => this.feedbackService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .subscribe();
  }

  private updateDataForm(metaWithData: ZNodeMetaWith<ZNodeData>): void {
    this.metaWithData = metaWithData;
    this.dataPristine = metaWithData.data;
  }

  private getCurrentPath(): string | null {
    return this.route.snapshot.queryParamMap.get(EDITOR_QUERY_NODE_PATH);
  }
}
