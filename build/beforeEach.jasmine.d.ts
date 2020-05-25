declare namespace jasmine {
   interface Matchers<T> {
      toEqualProps(anObject: Object): void;
      toEqualShape(anObject: Object): void;
      toEqualShallowDifferent(objectOrArray: Object | Array<any>): void;
   }
}

declare interface ObjectConstructor {
   assign(...objects: Object[]): Object;
}
