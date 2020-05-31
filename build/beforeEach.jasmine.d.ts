declare namespace jasmine {
   interface Matchers<T> {
      // I do'nt understand why I need this here. I shouldn't.
      toReportError(errorProps: ErrorProps): void;
      toNotReportError(id: string): void;
      toReportWarning(errorProps: ErrorProps): void;
      // From token
      toContainPTokenProps(matcher: any): void;
      toEqualRangeless(matcher: any): void;
      toBeInstanceOf(klazz: any):void;
      // from stoken
      toEqualSTokenText(expectedText: any): void;
      toEqualSTokenTexts(expectedTexts: Array<any>): void;
      toEqualSTokenRange(expectedRange: Range): void;


      toEqualProps(anObject: Object): void;
      toEqualShape(anObject: Object): void;
      toEqualShallowDifferent(objectOrArray: Object | Array<any>): void;
   }
}

declare interface ObjectConstructor {
   assign(...objects: Object[]): Object;
}
