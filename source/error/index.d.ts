import { SToken } from '../sToken/index';

declare class ErrorCollector {
   constructor(foo: any, errorType: Function);
   setPos(item:SToken | void): void;
   report(code: string, params?: Array<string>): void;
   check(condition:any, code: string, params?: Array<string>): void;
   reportError(id: string, constr: Function, params: Array<string>): void;
   getErrors(): Array<any>;
}

declare class XmlError {
   static ID: IDToStringMapping;
   constructor(id: string, params: Array<string>, place?: any, contextOffset?: any);
}

declare class XmlWarning {
   static ID: IDToStringMapping;
   constructor(id: string, params: Array<string>, place?: any, contextOffset?: any);
}

type IDToStringMapping = {
   [name: string]: string;
};

declare class WellFormedError {
   static ID: IDToStringMapping;
   constructor();
}

declare class ValidityError {
   static ID: IDToStringMapping;
   constructor(id: string, params: Array<string>, place?: any, contextOffset?: any);
}

export {
   ErrorCollector,
   XmlError,
   XmlWarning,
   WellFormedError,
   ValidityError,
};