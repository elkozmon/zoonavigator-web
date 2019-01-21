/*
 * Copyright (C) 2019  Ľuboš Kozmon <https://www.elkozmon.com>
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
import {combineLatest, EMPTY, from, Observable, of, ReplaySubject, Subject, throwError, zip} from "rxjs";
import {bufferCount, catchError, filter, finalize, map, mapTo, pluck, switchMap, take, tap} from "rxjs/operators";
import {Either, Maybe} from "tsmonad";
import {Buffer} from "buffer";
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

  editorNode: Subject<Maybe<ZNodeWithChildren>> = new ReplaySubject(1);

  editorDataTxt: Subject<string> = new ReplaySubject(1);
  editorDataRaw: Observable<string>;
  editorFormatter: Observable<Maybe<Formatter>>;

  isEditorFormatterAvailable: Observable<boolean>;
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
      .pipe(
        pluck("zNodeWithChildren"),
        switchMap((either: Either<Error, ZNodeWithChildren>) =>
          either.caseOf<Observable<Maybe<ZNodeWithChildren>>>({
            left: error =>
              this.dialogService
                .showError(error.message, this.viewContainerRef)
                .pipe(mapTo(Maybe.nothing())),
            right: node =>
              of(Maybe.just(node))
          })
        )
      )
      .forEach(maybeNode => this.editorNode.next(maybeNode));

    // update editor ready
    this.isEditorReady =
      combineLatest(this.editorNode, this.editorModeId, this.editorCompId, this.editorWrap)
        .pipe(map(([n, m, c, w]) => n != null && m != null && c != null && w != null));

    // init rest of the observables and subjects
    this.editorMode = this.editorModeId.pipe(map(id => this.modeProvider.getMode(id)));
    this.editorComp = this.editorCompId.pipe(map(mId => mId.map(id => this.compressionProvider.getCompression(id))));
    this.isSubmitOngoing.next(false);

    // update raw data on change of: txtData or mode or comp
    this.editorDataRaw =
      combineLatest(this.editorDataTxt, this.editorMode, this.editorComp)
        .pipe(switchMap(([txtData, mode, mComp]) => ZNodeDataComponent.encodeToRawData(txtData, mode, mComp)));

    // update txt data on change of: mode
    this.editorMode
      .pipe(
        bufferCount(2, 1),
        switchMap(([oldMode, newMode]) => combineLatest(this.editorDataTxt, of(oldMode), of(newMode)).pipe(take(1))),
        map(([txt, oldMode, newMode]) => ZNodeDataComponent.translateDataMode(txt, oldMode, newMode))
      )
      .forEach(data => this.editorDataTxt.next(data));

    // update formatter
    this.editorFormatter = this.editorModeId.pipe(map(mode => this.formatterProvider.getFormatter(mode)));
    this.isEditorFormatterAvailable = this.editorFormatter.pipe(map(maybe => maybe.map(() => true).valueOr(false)));

    // update pristine flag (note: if node not available -> editor is pristine)
    this.isEditorDataPristine =
      combineLatest(this.editorNode, this.editorDataRaw)
        .pipe(map(([node, rawData]) => node.map(n => n.data == rawData).valueOr(true)));

    // update submit ready flag
    this.isSubmitReady =
      combineLatest(this.isEditorDataPristine, this.isSubmitOngoing)
        .pipe(map(([isEditorDataPristine, isSubmitOngoing]) => !isEditorDataPristine && !isSubmitOngoing));

    // on change of node do following
    this.editorNode
      .pipe(
        map(maybeNode => maybeNode.valueOr(null)),
        filter(nullableNode => nullableNode != null),
        switchMap(node => {
          // change compression
          const o1 = ZNodeDataComponent.inferCompression(node.data, this.compIds, this.compressionProvider)
            .pipe(
              tap(comp => this.editorCompId.next(comp))
            );

          // change mode
          const o2 = this.preferencesService
            .getModeFor(node.path, node.meta.creationId)
            .pipe(
              map(maybeModeId => maybeModeId.valueOr(ZNodeDataComponent.defaultMode)),
              tap(mode => this.editorModeId.next(mode))
            );

          // change wrap
          const o3 = this.preferencesService
            .getWrapFor(node.path, node.meta.creationId)
            .pipe(
              map(maybeWrap => maybeWrap.valueOr(ZNodeDataComponent.defaultWrap)),
              tap(wrap => this.editorWrap.next(wrap))
            );

          return zip(of(node), o1, o2, o3).pipe(take(1));
        }),
        // update data txt
        switchMap(([node]) => combineLatest(of(node), this.editorMode, this.editorComp).pipe(take(1))),
        switchMap(([node, mode, mComp]) => ZNodeDataComponent.decodeFromRawData(node.data, mode, mComp))
      )
      .forEach(data => this.editorDataTxt.next(data));
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.isEditorDataPristine.pipe(
      switchMap(pristine => {
        if (!pristine) {
          return this.dialogService
            .showDiscardChanges(this.viewContainerRef)
            .pipe(switchMap(ref => ref.afterClosed()));
        }

        return of(true);
      })
    );
  }

  onSubmit(): void {
    const submitNode = this.editorNode.pipe(
      map(maybeNode => maybeNode.valueOr(null)),
      filter(nullableNode => nullableNode != null)
    );

    combineLatest(submitNode, this.isSubmitReady)
      .pipe(
        switchMap(([node, ready]) => {
          if (!ready) {
            return EMPTY;
          }

          this.isSubmitOngoing.next(true);

          return combineLatest(of(node), this.editorDataRaw);
        }),
        switchMap(([node, rawData]) =>
          this.zNodeService
            .setData(
              node.path,
              node.meta.dataVersion,
              rawData
            )
        ),
        switchMap((newMeta: ZNodeMeta) => {
          // refresh node data in resolver
          const redirect = this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              dataVersion: newMeta.dataVersion
            },
            queryParamsHandling: "merge"
          });

          return from(redirect);
        }),
        switchMap(() => this.dialogService.showSnackbar("Changes saved", this.viewContainerRef)),
        switchMap(ref => ref.afterOpened()),
        take(1),
        catchError(err => this.dialogService.showErrorAndThrowOnClose(err, this.viewContainerRef)),
        finalize(() => this.isSubmitOngoing.next(false))
      )
      .subscribe();
  }

  onCompressionChange(newComp: Maybe<CompressionId>): void {
    this.editorCompId.next(newComp);
  }

  onModeChange(newMode: ModeId): void {
    this.editorNode
      .pipe(
        map(maybeNode => maybeNode.valueOr(null)),
        filter(nullableNode => nullableNode != null),
        switchMap(node =>
          this.preferencesService.setModeFor(
            node.path,
            node.meta.creationId,
            Maybe.just(newMode)
          )
        ),
        mapTo(newMode),
        take(1)
      )
      .forEach(newMode => this.editorModeId.next(newMode));
  }

  onWrapChange(newWrap: boolean): void {
    this.editorNode
      .pipe(
        map(maybeNode => maybeNode.valueOr(null)),
        filter(nullableNode => nullableNode != null),
        switchMap(node =>
          this.preferencesService.setWrapFor(
            node.path,
            node.meta.creationId,
            Maybe.just(newWrap)
          )
        ),
        mapTo(newWrap),
        take(1)
      )
      .forEach(newMode => this.editorWrap.next(newMode));
  }

  onFormatData(): void {
    combineLatest(this.editorDataTxt, this.editorFormatter)
      .pipe(
        switchMap(([txtData, maybeFormatter]) =>
          maybeFormatter.caseOf<Observable<string>>({
            just: fmt => fmt.format(txtData),
            nothing: () => throwError("Formatter unavailable")
          })
        ),
        take(1),
        tap(data => this.editorDataTxt.next(data)),
        catchError(error => this.dialogService.showSnackbar("Error:  " + error.message, this.viewContainerRef))
      )
      .subscribe();
  }

  static inferCompression(base64: string, compIds: CompressionId[], compProvider: CompressionProvider): Observable<Maybe<CompressionId>> {
    const raw = Buffer
      .from(base64, "base64")
      .buffer;

    return of(
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
      .valueOr(of(raw));

    return decompressedRx.pipe(
      map(decompressed =>
        mode.decodeData(decompressed)
      )
    );
  }

  static encodeToRawData(text: string, mode: Mode, maybeComp: Maybe<Compression>): Observable<string> {
    const encoded = mode.encodeData(text);

    const compressedRx = maybeComp
      .map(c => c.compress(encoded))
      .valueOr(of(encoded));

    return compressedRx.pipe(
      map(compressed =>
        Buffer
          .from(compressed)
          .toString("base64")
      )
    );
  }
}
