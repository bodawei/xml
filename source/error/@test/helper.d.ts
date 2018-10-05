import ErrorCollector from '../ErrorCollector';

declare class MockErrorCollector extends ErrorCollector {
   constructor();
   errors: Array<object>;
   setPos(sToken:any): void;
   report(id: string, params: any, position?: any): void;
   check(condition: any, id: string, params: any): void;
   reportError(id: string, context: any, params: any): void;
}

export {
   MockErrorCollector
};