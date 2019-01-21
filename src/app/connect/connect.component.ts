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

import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {switchMap, finalize} from "rxjs/operators";
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {LoadingMode, LoadingType, TdLoadingService} from "@covalent/core";
import {AuthInfo, ZSessionHandler, ZSessionService, Scheme} from "../core";
import {CONNECT_QUERY_ERROR_MSG, CONNECT_QUERY_RETURN_URL} from "./connect-routing.constants";

@Component({
  templateUrl: "./connect.component.html",
  styleUrls: ["./connect.component.scss"]
})
export class ConnectComponent implements OnInit {

  connectForm: FormGroup;

  errorMsg: any = null;

  private redirectUrl: string;

  private loadingFullscreenKey = "loadingFullscreen";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private zSessionService: ZSessionService,
    private zSessionHandler: ZSessionHandler,
    private loadingService: TdLoadingService
  ) {
  }

  ngOnInit(): void {
    this.loadingService.create({
      name: this.loadingFullscreenKey,
      mode: LoadingMode.Indeterminate,
      type: LoadingType.Linear,
      color: "accent",
    });

    this.route
      .queryParamMap
      .subscribe(paramMap => {
        this.errorMsg = paramMap.get(CONNECT_QUERY_ERROR_MSG) || null;
        this.redirectUrl = paramMap.get(CONNECT_QUERY_RETURN_URL) || "/editor";
      });

    this.connectForm = this.newConnectForm();
  }

  onCredentialsChange(index: number): void {
    const isEmpty = this.isCredentialsFormGroupEmpty(index);
    const isLast = this.getCredentialsLastNonEmptyIndex() < index;

    if (isEmpty && !isLast) {
      this.credentialsFormArray.removeAt(index);
      return;
    }

    if (!isEmpty && isLast) {
      this.credentialsFormArray.push(this.newCredentialsFormGroup());
    }
  }

  onSubmit(): void {
    this.errorMsg = null;
    this.startLoader();

    this.zSessionService
      .create({
        connectionString: this.getConnectionStringFormValue(),
        authInfo: this.getAuthInfoFormValue()
      })
      .pipe(
        switchMap((sessionInfo) => this.zSessionHandler.setSessionInfo(sessionInfo)),
        finalize(() => this.stopLoader())
      )
      // .first()
      .subscribe(
        () => this.router.navigateByUrl(this.redirectUrl),
        error => this.errorMsg = error
      );
  }

  get credentialsFormArray(): FormArray {
    return <FormArray>this.connectForm.get("credentialsArray");
  }

  private newConnectForm(): FormGroup {
    return this.formBuilder.group({
      connectionString: ["", [Validators.required]],
      credentialsArray: this.formBuilder.array([
        this.newCredentialsFormGroup()
      ])
    });
  }

  private newCredentialsFormGroup(): FormGroup {
    return this.formBuilder.group({
      username: [""],
      password: [""]
    });
  }

  private getCredentialsFormGroup(index: number): FormGroup {
    return <FormGroup>this.credentialsFormArray.at(index);
  }

  private isCredentialsFormGroupEmpty(index: number): boolean {
    return this.getCredentialsUsernameFormValue(index).length + this.getCredentialsPasswordFormValue(index).length === 0;
  }

  private getCredentialsLastNonEmptyIndex(): number {
    // -2 since last row is always empty
    return this.credentialsFormArray.controls.length - 2;
  }

  private getConnectionStringFormValue(): string {
    return this.connectForm.value.connectionString;
  }

  private getCredentialsUsernameFormValue(index: number): string {
    return this.getCredentialsFormGroup(index).get("username").value;
  }

  private getCredentialsPasswordFormValue(index: number): string {
    return this.getCredentialsFormGroup(index).get("password").value;
  }

  private getAuthInfoFormValue(): AuthInfo[] {
    const lastIndex: number = this.getCredentialsLastNonEmptyIndex();
    const authInfos: AuthInfo[] = [];

    for (let i = 0; i <= lastIndex; i++) {
      authInfos.push({
        id: `${this.getCredentialsUsernameFormValue(i)}:${this.getCredentialsPasswordFormValue(i)}`,
        scheme: <Scheme>"digest"
      });
    }

    return authInfos;
  }

  private startLoader(): void {
    this.loadingService.register(this.loadingFullscreenKey);
  }

  private stopLoader(): void {
    this.loadingService.resolve(this.loadingFullscreenKey);
  }
}
