/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';

const CONDITIONAL_END_PTOKEN = 'CONDITIONAL_END_PTOKEN';

type ConditionalProps = {
   open: SToken;
}

/**********************************************************************\
 Represents the end of a conditional section

 SYNTAX
    [62]  includeSect        ::= ...']]>'
    [63]  ignoreSect         ::= ...']]>'
\**********************************************************************/

class ConditionalEndPToken {
   public readonly type: typeof CONDITIONAL_END_PTOKEN = CONDITIONAL_END_PTOKEN;
   public readonly open: SToken;

   constructor(param: ConditionalEndPToken | ConditionalProps) {
      this.open = param.open;
   }
}

export {
   CONDITIONAL_END_PTOKEN,

   ConditionalEndPToken,
};
