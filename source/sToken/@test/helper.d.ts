import { SToken } from '../index';

declare class MockSTokenSource {
   new(expectedValues: any, index?: number, row?: number, column?: number): MockSTokenSource;
}

//declare function sTokenMaker(str: string): SToken;
type sTokenMaker = (str: string) => SToken;

declare function makeSTokenMaker(location?: any, index?: number, row?: number, column?: number): sTokenMaker;

export {
   MockSTokenSource,
   makeSTokenMaker,
};