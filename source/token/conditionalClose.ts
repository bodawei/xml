/* Copyright ® 2019 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { SectionStart } from './bridge/section';
import misc from './common/misc';

const CONDITIONAL_CLOSE_PTOKEN = 'CONDITIONAL_CLOSE_PTOKEN';
const CONDITIONAL_CLOSE_XTOKEN = 'CONDITIONAL_CLOSE_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: ConditionalClosePToken) => void;

type ConditionalProps = {
   open: SToken,
}

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a Conditional Section element
\**********************************************************************/

class ConditionalCloseXToken {
   public readonly type: typeof CONDITIONAL_CLOSE_XTOKEN = CONDITIONAL_CLOSE_XTOKEN;
   public readonly pToken?: ConditionalClosePToken;

   constructor(pToken?: ConditionalClosePToken) {
      this.pToken = pToken;
   }
}

class ConditionalClosePToken {
   public readonly type: typeof CONDITIONAL_CLOSE_PTOKEN = CONDITIONAL_CLOSE_PTOKEN;
   public readonly open: SToken;

   constructor(param: ConditionalClosePToken | ConditionalProps) {
      this.open = param.open;
   }

   // checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData): void {
   //    checkWellFormed(this, ec, entityMetaData);
   // }

   toXToken(): ConditionalCloseXToken {
      return pTokenToXToken(this);
   }

   // toSTokenArray(): Array<SToken> {
   //    return sTokensFromPToken(this);
   // }
}


/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ConditionalClosePToken) {
   const token = new ConditionalCloseXToken(pToken);

   return token;
}

export {
   CONDITIONAL_CLOSE_PTOKEN,
   CONDITIONAL_CLOSE_XTOKEN,
   ConditionalClosePToken,
   ConditionalCloseXToken,
};
