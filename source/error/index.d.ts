import { SToken } from '../sToken';

declare class ErrorCollector {
   constructor(foo: any, errorType: Function);
   setPos(item:SToken | void);
   check(condition:any, code: string);
   reportError(id: string, constr: Function, params: Array<string>): void;
   getErrors(): Array<any>;
}

declare class XmlWarning {
   static ID: IDToStringMapping;
}

type IDToStringMapping = {
   [name: string]: string;
};

declare class WellFormedError {
   static ID: IDToStringMapping;
   constructor();
}

export {
   ErrorCollector,
   XmlWarning,
   WellFormedError
};