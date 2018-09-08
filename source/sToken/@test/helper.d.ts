import { SToken, STokenSource } from '../index';

declare class MockSTokenSource extends STokenSource {
   static PEEK: (peekValue: string) => any;
   constructor(expectedValues: any, index?: number, row?: number, column?: number);
   respondInAsyncTime(): void;
}

//declare function sTokenMaker(str: string): SToken;
type sTokenMaker = (str: string) => SToken;

declare function makeSTokenMaker(location?: any, index?: number, row?: number, column?: number, endIndex?: number, endRow?: number, endColumn?: number): sTokenMaker;

export {
   sTokenMaker,
   MockSTokenSource,
   makeSTokenMaker,
};