import { EntityMetaData, Range } from '../basic';

declare class  SToken {
   static fromString(str: string): SToken;
   constructor(str: string, originalStr: string, range?: Array<Range>);
   str?: string;
   oritinalStr: string;
   ranges: Array<any>;
}

declare class STokenSource {
   constructor(extractorMap: any, info?: EntityMetaData);
   addText(text: string): void;
   endText(): void;
   extract(type: string, deliverResult: (sToken: SToken) => void);
   extract(type: string, params: any, deliverResult: (sToken: SToken) => void);
   extractToObject(type: string, obj: Object, propName: string);
   extractToObject(type: string, params: any, obj: Object, propName: string);
}

export {
   STokenSource,
   SToken,
};