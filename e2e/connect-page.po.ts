import {browser, by, element} from "protractor";

export class ConnectPage {
  navigateTo() {
    return browser.get("/connect");
  }

  getHeaderText() {
    return element(by.css(".md-subhead")).getText();
  }
}
