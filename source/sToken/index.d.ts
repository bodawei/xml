import { EntityMetaData, Range } from '../basic/index';

declare class  SToken {
   static fromString(str: string): SToken;
   constructor(str: string, originalStr: string, range?: Range | Array<Range>);
   str: string;
   originalStr: string;
   ranges: Array<any>;
   merge(other:SToken): SToken;
   clone(): SToken;
}

declare class STokenSource {
   constructor(extractorMap: any, info?: EntityMetaData);
   addText(text: string): void;
   endText(): void;
   extract(type: string, deliverResult: (sToken: SToken) => void): void;
   extract(type: string, params: any, deliverResult: (sToken: SToken) => void): void;
   extractToObject(type: string, obj: Object, propName: string): void;
   extractToObject(type: string, params: any, obj: Object, propName: string): void;
}

export {
   STokenSource,
   SToken,
};