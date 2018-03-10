declare class MockErrorCollector {
   constructor();
   errors: Array<object>;
   setPos(sToken:any);
   report(id: string, params: any, position?: any);
   check(condition: any, id: string, params: any);
   reportError(id: string, context: any, params: any);
}

export {
   MockErrorCollector
};