declare namespace jasmine {
   interface Matchers<T> {
      toContainPTokenProps(matcher: any): void;
      toEqualRangeless(matcher: any): void;
      toBeInstanceOf(klazz: any):void;
   }
}

declare interface ObjectConstructor {
   assign(...objects: Object[]): Object;
}
