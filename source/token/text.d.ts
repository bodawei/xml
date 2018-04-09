import { SToken } from '../sToken';

declare class TextPToken {
   public type: string;
   public text?: SToken;

   constructor();
   getSTokenArray(): Array<SToken>;
}

declare var text: {
   PToken: TextPToken;
}

export {
   TextPToken
};

export default text;