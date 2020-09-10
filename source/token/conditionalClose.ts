/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';

const CONDITIONAL_CLOSE_PTOKEN = 'CONDITIONAL_CLOSE_PTOKEN';

type ConditionalProps = {
   open: SToken;
}

/**********************************************************************\
 Represents the end of a conditional section

 SYNTAX
    [62]  includeSect        ::= ...']]>'
    [63]  ignoreSect         ::= ...']]>'
\**********************************************************************/

class ConditionalClosePToken {
   public readonly type: typeof CONDITIONAL_CLOSE_PTOKEN = CONDITIONAL_CLOSE_PTOKEN;
   public readonly open: SToken;

   constructor(param: ConditionalClosePToken | ConditionalProps) {
      this.open = param.open;
   }
}

export {
   CONDITIONAL_CLOSE_PTOKEN,

   ConditionalClosePToken,
};
