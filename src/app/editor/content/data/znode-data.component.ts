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

import {ChangeDetectionStrategy, Component, OnInit, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, ReplaySubject, Subject} from "rxjs/Rx";
import {Either, Maybe} from "tsmonad";
import {DialogService, ZNodeMeta, ZNodeService, ZNodeWithChildren, ZPathService} from "../../../core";
import {CanDeactivateComponent} from "../../../shared";
import {PreferencesService} from "../../preferences";
import {Mode, ModeId, ModeProvider} from "./mode";
import {Formatter, FormatterProvider} from "../../formatter";
import {Compression, CompressionId, CompressionProvider} from "./compression";

@Component({
  templateUrl: "znode-data.component.html",
  styleUrls: ["znode-data.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZNodeDataComponent implements OnInit, CanDeactivateComponent {

  static defaultMode = ModeId.Text;
  static defaultWrap = true;

  editorNode: Subject<ZNodeWithChildren | null> = new ReplaySubject(1);
  editorDataTxt: Subject<string> = new ReplaySubject(1);
  editorDataRaw: Observable<string>;

  formatter: Observable<Maybe<Formatter>>;
  isFormatterAvailable: Observable<boolean>;
  isEditorDataPristine: Observable<boolean>;
  isEditorReady: Observable<boolean>;
  isSubmitReady: Observable<boolean>;

  editorWrap: Subject<boolean> = new ReplaySubject(1);
  editorModeId: Subject<ModeId> = new ReplaySubject(1);
  editorCompId: Subject<Maybe<CompressionId>> = new ReplaySubject(1);

  editorMode: Observable<Mode>;
  editorComp: Observable<Maybe<Compression>>;

  modeIds: ModeId[];
  compIds: CompressionId[];

  private isSubmitOngoing: Subject<boolean> = new ReplaySubject(1);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zPathService: ZPathService,
    private zNodeService: ZNodeService,
    private dialogService: DialogService,
    private preferencesService: PreferencesService,
    private modeProvider: ModeProvider,
    private compressionProvider: CompressionProvider,
    private formatterProvider: FormatterProvider,
    private viewContainerRef: ViewContainerRef,
  ) {
    this.compIds = Object.keys(CompressionId).map(k => CompressionId[k]);
    this.modeIds = Object.keys(ModeId).map(k => ModeId[k]);
  }

  ngOnInit(): void {
    // update editor node
    this.route.parent.data
      .pluck("zNodeWithChildren")
      .switchMap((either: Either<Error, ZNodeWithChildren>) =>
        either.caseOf({
          left: error => {
            return this.dialogService
              .showError(error.message, this.viewContainerRef)
              .mapTo(null)
          },
          right: node =>
            Observable.of(node)
        })
      )
      .forEach(nodeOrNull => this.editorNode.next(nodeOrNull));

    // update editor ready
    this.isEditorReady = Observable
      .combineLatest(this.editorNode, this.editorModeId, this.editorCompId, this.editorWrap)
      .map(([n, m, c, w]) => n != null && m != null && c != null && w != null);

    // init rest of the observables and subjects
    this.editorMode = this.editorModeId.map(id => this.modeProvider.getMode(id));
    this.editorComp = this.editorCompId.map(mId => mId.map(id => this.compressionProvider.getCompression(id)));
    this.isSubmitOngoing.next(false);

    // update raw data on change of: txtData or mode or comp
    this.editorDataRaw = Observable
      .combineLatest(this.editorDataTxt, this.editorMode, this.editorComp)
      .switchMap(([txtData, mode, mComp]) => ZNodeDataComponent.encodeToRawData(txtData, mode, mComp));

    // update txt data on change of: mode
    this.editorMode
      .bufferCount(2, 1)
      .switchMap(([oldMode, newMode]) => this.editorDataTxt.combineLatest(Observable.of(oldMode), Observable.of(newMode)).take(1))
      .map(([txt, oldMode, newMode]) => ZNodeDataComponent.translateDataMode(txt, oldMode, newMode))
      .forEach(data => this.editorDataTxt.next(data));

    // update formatter
    this.formatter = this.editorModeId.map(mode => this.formatterProvider.getFormatter(mode));
    this.isFormatterAvailable = this.formatter.map(maybe => maybe.map(() => true).valueOr(false));

    // update pristine flag
    this.isEditorDataPristine = Observable
      .combineLatest(this.editorNode, this.editorDataRaw)
      .map(([node, rawData]) => node.data == rawData);

    // update submit ready flag
    this.isSubmitReady = Observable
      .combineLatest(this.isEditorDataPristine, this.isSubmitOngoing)
      .map(([isEditorDataPristine, isSubmitOngoing]) => !isEditorDataPristine && !isSubmitOngoing);

    // on change of node do following
    this.editorNode
      .switchMap(node => {
        // change compression
        const o1 = ZNodeDataComponent.inferCompression(node.data, this.compIds, this.compressionProvider)
          .do(comp => this.editorCompId.next(comp));

        // change mode
        const o2 = this.preferencesService
          .getModeFor(node.path, node.meta.creationId)
          .map(maybeModeId => maybeModeId.valueOr(ZNodeDataComponent.defaultMode))
          .do(mode => this.editorModeId.next(mode));

        // change wrap
        const o3 = this.preferencesService
          .getWrapFor(node.path, node.meta.creationId)
          .map(maybeWrap => maybeWrap.valueOr(ZNodeDataComponent.defaultWrap))
          .do(wrap => this.editorWrap.next(wrap));

        return Observable.zip(o1, o2, o3).take(1);
      })
      // update data txt
      .switchMap(() => Observable.combineLatest(this.editorNode, this.editorMode, this.editorComp).take(1))
      .switchMap(([node, mode, mComp]) => ZNodeDataComponent.decodeFromRawData(node.data, mode, mComp))
      .forEach(data => this.editorDataTxt.next(data));
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.isSubmitReady.switchMap(ready => {
      if (ready) {
        return this.dialogService
          .showDiscardChanges(this.viewContainerRef)
          .switchMap(ref => ref.afterClosed());
      }

      return Observable.of(true);
    });
  }

  onSubmit(): void {
    this.isSubmitReady
      .switchMap(ready => {
        if (!ready) {
          return Observable.empty();
        }

        this.isSubmitOngoing.next(true);

        return Observable.combineLatest(this.editorNode, this.editorDataRaw);
      })
      .switchMap(([node, rawData]) =>
        this.zNodeService
          .setData(
            node.path,
            node.meta.dataVersion,
            rawData
          )
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
      .do(() => this.isSubmitOngoing.next(false))
      .take(1)
      .subscribe();
  }

  onCompressionChange(newComp: Maybe<CompressionId>): void {
    this.editorCompId.next(newComp);
  }

  onModeChange(newMode: ModeId): void {
    this.editorNode
      .take(1)
      .switchMap(node =>
        this.preferencesService
          .setModeFor(
            node.path,
            node.meta.creationId,
            Maybe.just(newMode)
          )
          .mapTo(newMode)
      )
      .forEach(newMode => this.editorModeId.next(newMode));
  }

  onWrapChange(newWrap: boolean): void {
    this.editorNode
      .take(1)
      .switchMap(node =>
        this.preferencesService
          .setWrapFor(
            node.path,
            node.meta.creationId,
            Maybe.just(newWrap)
          )
          .mapTo(newWrap)
      )
      .forEach(newMode => this.editorWrap.next(newMode));
  }

  onFormatData(): void {
    Observable
      .combineLatest(this.editorDataTxt, this.formatter)
      .switchMap(([txtData, maybeFormatter]) =>
        maybeFormatter.caseOf<Observable<Either<Error, string>>>({
          just: fmt => Observable.of(fmt.format(txtData)),
          nothing: () => Observable.throw(new Error("Formatter unavailable"))
        })
      )
      .switchMap(either => either.caseOf<Observable<string>>({
        left: err => Observable.throw(err),
        right: data => Observable.of(data)
      }))
      .take(1)
      .do(data => this.editorDataTxt.next(data))
      .catch(error => this.dialogService.showSnackbar("Error:  " + error.message, this.viewContainerRef))
      .subscribe();
  }

  static inferCompression(base64: string, compIds: CompressionId[], compProvider: CompressionProvider): Observable<Maybe<CompressionId>> {
    const raw = Buffer
      .from(base64, "base64")
      .buffer;

    return Observable.of(
      Maybe.maybe(
        compIds.find(c => compProvider.getCompression(c).isCompressed(raw) || null)
      )
    );
  }

  static translateDataMode(data: string, oldMode: Mode, newMode: Mode): string {
    const encodedData = oldMode.encodeData(data);

    return newMode.decodeData(encodedData);
  }

  static decodeFromRawData(base64: string, mode: Mode, maybeComp: Maybe<Compression>): Observable<string> {
    const raw = Buffer
      .from(base64, "base64")
      .buffer;

    const decompressedRx = maybeComp
      .map(c => c.decompress(raw))
      .valueOr(Observable.of(raw));

    return decompressedRx.map(decompressed => mode.decodeData(decompressed));
  }

  static encodeToRawData(text: string, mode: Mode, maybeComp: Maybe<Compression>): Observable<string> {
    const encoded = mode.encodeData(text);

    const compressedRx = maybeComp
      .map(c => c.compress(encoded))
      .valueOr(Observable.of(encoded));

    return compressedRx.map(compressed =>
      Buffer
        .from(compressed)
        .toString("base64")
    );
  }
}
