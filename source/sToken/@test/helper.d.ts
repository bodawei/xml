import { SToken, STokenSource } from '../index';

declare class MockSTokenSource extends STokenSource {
   constructor(expectedValues: any, index?: number, row?: number, column?: number);
   respondInAsyncTime(): void;
}

//declare function sTokenMaker(str: string): SToken;
type sTokenMaker = (str: string) => SToken;

declare function makeSTokenMaker(location?: any, index?: number, row?: number, column?: number): sTokenMaker;

export {
   MockSTokenSource,
   makeSTokenMaker,
};