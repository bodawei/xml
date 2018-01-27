declare namespace jasmine {
   interface Matchers<T> {
      toContainPTokenProps(matcher: any): void;
   }
}

declare interface ObjectConstructor {
   assign(...objects: Object[]): Object;
}
