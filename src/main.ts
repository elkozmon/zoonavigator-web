import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";

import {APP_VERSION} from "./app/app.version";
import {AppModule} from "./app/app.module";
import {environment} from "./environments/environment";

// tslint:disable-next-line
console.info("Starting ZooNavigator Web " + APP_VERSION);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
