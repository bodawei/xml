import { SToken } from '../sToken';

declare class ErrorCollector {
   setPos(item:SToken);
   check(condition:any, code: string);
}

declare class XmlWarning {
}

type IDToStringMapping = {
   [name: string]: string;
};

declare class WellFormedError {
   static ID: IDToStringMapping;
   new(): WellFormedError;
}

export {
   ErrorCollector,
   XmlWarning,
   WellFormedError
};