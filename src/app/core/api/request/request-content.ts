export abstract class RequestContent {
  constructor(
    public data: any,
    public type: string
  ) {
  }
}

export class JsonRequestContent extends RequestContent {
  constructor(data: any) {
    super(data, "application/json");
  }
}

export class TextRequestContent extends RequestContent {
  constructor(data: string) {
    super(data, "text/plain");
  }
}
