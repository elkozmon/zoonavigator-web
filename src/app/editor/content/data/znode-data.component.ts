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
import {ReplaySubject} from "rxjs/ReplaySubject";

@Component({
  templateUrl: "znode-data.component.html",
  styleUrls: ["znode-data.component.scss"]
})
export class ZNodeDataComponent implements OnInit, CanDeactivateComponent {

  @ViewChild("dataEditor") set dataEditor(comp: AceEditorComponent) {
    if (comp) {
      this.editorSubject.next(comp);
    }
  }

  editorSubject: ReplaySubject<AceEditorComponent> = new ReplaySubject(1);
  editor: Observable<AceEditorComponent> = Observable.from(this.editorSubject);

  defaultMode: Mode = Mode.Text;
  defaultWrap = true;

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
    wrap: this.defaultWrap
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
      .do(maybeMode => this.setMode(maybeMode.valueOr(this.defaultMode), false))
      .subscribe();

    // Try to recall wrap setting used the last time with this node
    currentNodeObservable
      .switchMap(either => either.caseOf({
        left: () => Observable.empty<Maybe<boolean>>(),
        right: n => this.preferencesService.getWrapFor(n.path, n.meta.creationId)
      }))
      .do(maybeWrap => this.setWrap(maybeWrap.valueOr(this.defaultWrap), false))
      .subscribe();

    // Disable Ace editors search box
    this.editor.forEach(e => e._editor.commands.removeCommand("find"))
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

  setMode(mode: Mode, remember: boolean): void {
    this.editorMode = mode;

    if (remember) {
      // Remember mode used for this node
      this.preferencesService
        .setModeFor(
          this.currentNode.path,
          this.currentNode.meta.creationId,
          mode
        )
        .subscribe();
    }
  }

  setWrap(enabled: boolean, remember: boolean): void {
    this.editorOpts.wrap = enabled;
    this.updateOpts();

    if (remember) {
      // Remember wrap used for this node
      this.preferencesService
        .setWrapFor(
          this.currentNode.path,
          this.currentNode.meta.creationId,
          enabled
        )
        .subscribe();
    }
  }

  getWrap(): boolean {
    return this.editorOpts.wrap;
  }

  private updateOpts(): void {
    this.editor.forEach(e => e.setOptions(this.editorOpts));
  }
}
