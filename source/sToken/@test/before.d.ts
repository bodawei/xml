declare namespace jasmine {
   interface Matchers<T> {
      toEqualSTokenText(value: any): void;
      toEqualSTokenTexts(values: any): void;
   }
}
