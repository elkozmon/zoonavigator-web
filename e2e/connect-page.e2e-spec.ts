import {ConnectPage} from "./connect-page.po";

describe("Connect page", () => {
  let page: ConnectPage;

  beforeEach(() => {
    page = new ConnectPage();
  });

  it("should display message saying 'ZooNavigator. An awesome Zookeeper web admin.'", () => {
    page.navigateTo();
    expect<any>(page.getHeaderText()).toEqual("ZooNavigator. An awesome Zookeeper web admin.");
  });
});
