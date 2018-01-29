declare namespace jasmine {
   interface Matchers<T> {
      toEqualProps(anObject: Object): void;
   }
}

declare interface ObjectConstructor {
   assign(...objects: Object[]): Object;
}
