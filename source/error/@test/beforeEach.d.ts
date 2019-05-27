interface ErrorProps {
   id: string,
   params?: Array<string>,
   position?: any,
   lastPosition?: any,
}

declare namespace jasmine {
   interface Matchers<T> {
      toReportError(errorProps: ErrorProps): void;
      toNotReportError(id: string): void;
      toReportWarning(errorProps: ErrorProps): void;
   }
}
