import { EntityMetaData, Range } from '../basic';

declare class  SToken {
   new(str: string, originalStr: string, range?: Array<Range>): SToken;
   str?: string;
   oritinalStr: string;
   ranges: Array<any>;
}

declare class STokenSource {
   new(extractorMap: any, info?: EntityMetaData): STokenSource;
   extract(type: string, deliverResult: (sToken: SToken) => void);
   extract(type: string, params: any, deliverResult: (sToken: SToken) => void);
   extractToObject(type: string, obj: Object, propName: string);
   extractToObject(type: string, params: any, obj: Object, propName: string);
}

export {
   STokenSource,
   SToken,
};