declare namespace jasmine {
   interface Matchers<T> {
      toEqualProps(anObject: Object): void;
      toEqualShape(anObject: Object): void;
   }
}

declare interface ObjectConstructor {
   assign(...objects: Object[]): Object;
}


// declare global {
//    interface console {
//        json(...args: Array<any>): void;
//    }
// }

// export {};  // needed to allow the declare global