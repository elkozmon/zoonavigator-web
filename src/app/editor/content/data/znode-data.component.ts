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

import {AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {AceEditorComponent} from "ng2-ace-editor";
import {Observable} from "rxjs/Rx";
import {Either, Maybe} from "tsmonad";
import "brace";
import "brace/ext/searchbox";
import "brace/mode/text";
import "brace/mode/json";
import "brace/mode/yaml";
import "brace/mode/xml";
import "brace/theme/chrome";
import {DialogService, ZNodeService, ZNodeWithChildren} from "../../../core";
import {CanDeactivateComponent} from "../../../shared";
import {PreferencesService} from "../../preferences";
import {ZPathService} from "../../../core/zpath";
import {Mode} from "../../mode";
import {Formatter, FormatterProvider} from "../../formatter";
import {ZNodeMeta} from "../../../core/znode";

@Component({
  templateUrl: "znode-data.component.html",
  styleUrls: ["znode-data.component.scss"]
})
export class ZNodeDataComponent implements OnInit, AfterViewInit, CanDeactivateComponent {

  @ViewChild("dataEditor") editor: AceEditorComponent;

  defaultMode: Mode = Mode.Text;

  currentNode: ZNodeWithChildren;

  isSubmitting = false;

  editorData: string;
  editorModes: Mode[] = [
    Mode.Text,
    Mode.Json,
    Mode.Yaml,
    Mode.Xml
  ];
  editorMode: Mode = this.defaultMode;
  editorOpts: any = {
    fontFamily: "DejaVu Sans Mono, monospace",
    fontSize: "10pt",
    wrap: true
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zNodeService: ZNodeService,
    private zPathService: ZPathService,
    private dialogService: DialogService,
    private preferencesService: PreferencesService,
    private formatterProvider: FormatterProvider,
    private viewContainerRef: ViewContainerRef
  ) {
  }

  get editorDirty(): boolean {
    if (!this.currentNode) {
      return false;
    }

    return this.currentNode.data !== this.editorData;
  }

  ngOnInit(): void {
    const currentNodeObservable: Observable<Either<Error, ZNodeWithChildren>> =
      this.route
        .parent
        .data
        .pluck("zNodeWithChildren");

    // Update current node
    currentNodeObservable
      .do(either => either.caseOf({
        left: error => this.currentNode = null,
        right: node => this.currentNode = node
      }))
      .subscribe();

    // Show popup on error or update editor data
    currentNodeObservable
      .do(either => either.caseOf<void>({
        left: error => this.dialogService.showError(error.message, this.viewContainerRef),
        right: node => this.editorData = node.data
      }))
      .subscribe();

    // Try to recall mode used the last time with this node
    currentNodeObservable
      .switchMap(either => either.caseOf({
        left: () => Observable.empty<Maybe<Mode>>(),
        right: n => this.preferencesService.getModeFor(n.path, n.meta.creationId)
      }))
      .do(maybeMode => this.editorMode = maybeMode.valueOr(this.defaultMode))
      .subscribe();
  }

  ngAfterViewInit(): void {
    // Check if editor exists since its guarded by ngIf
    if (this.editor) {
      // Disable Ace editors search box
      this.editor
        ._editor
        .commands
        .removeCommand("find");
    }
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.editorDirty && !this.isSubmitting) {
      return this.dialogService
        .showDiscardChanges(this.viewContainerRef)
        .switchMap(ref => ref.afterClosed());
    }

    return Observable.of(true);
  }

  onSubmit(): void {
    this.isSubmitting = true;

    this.zNodeService
      .setData(
        this.currentNode.path,
        this.currentNode.meta.dataVersion,
        this.editorData
      )
      .switchMap((newMeta: ZNodeMeta) => {
        // refresh node data in resolver
        const redirect = this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            dataVersion: newMeta.dataVersion
          },
          queryParamsHandling: "merge"
        });

        return Observable
          .fromPromise(redirect)
          .switchMap(() =>
            this.dialogService
              .showSnackbar("Changes saved", this.viewContainerRef)
              .switchMap(ref => ref.afterOpened())
          );
      })
      .catch(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef))
      .do(() => this.isSubmitting = false)
      .subscribe();
  }

  onKeyDown(event: KeyboardEvent): void {
    const code = event.which || event.keyCode;

    if (!(code === 115 && event.ctrlKey) && code !== 19) {
      return;
    }

    // Submit on CTRL + S
    event.preventDefault();
    this.onSubmit();
  }

  formatData(): void {
    this.formatterProvider
      .getFormatter(this.editorMode)
      .map<Either<Error, Formatter>>(Either.right)
      .valueOrCompute(() => Either.left<Error, Formatter>(
        new Error("Unsupported mode '" + this.editorMode.toUpperCase() + "'")
      ))
      .bind((f: Formatter) => f.format(this.editorData))
      .caseOf({
        left: error => {
          this.dialogService
            .showSnackbar("Error:  " + error.message, this.viewContainerRef)
            .subscribe()
        },
        right: data => this.editorData = data
      });
  }

  get formatterAvailable(): boolean {
    return this.formatterProvider
      .getFormatter(this.editorMode)
      .caseOf({
        just: () => true,
        nothing: () => false
      });
  }

  toggleWrap(): void {
    this.editorOpts.wrap = !this.editorOpts.wrap;
    this.updateOpts();
  }

  switchMode(mode: Mode): void {
    this.editorMode = mode;

    // Remember mode used for this node
    this.preferencesService
      .setModeFor(
        this.currentNode.path,
        this.currentNode.meta.creationId,
        mode
      )
      .subscribe();
  }

  private updateOpts(): void {
    this.editor.setOptions(this.editorOpts);
  }
}
