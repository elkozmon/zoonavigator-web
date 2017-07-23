export abstract class RequestContent {
  constructor(
    public data: any,
    public type: string
  ) {
  }
}

export class JsonRequestContent extends RequestContent {
  constructor(data: any) {
    super(data, "application/json; charset=UTF-8");
  }
}

export class TextRequestContent extends RequestContent {
  constructor(data: string) {
    super(data, "text/plain; charset=UTF-8");
  }
}
