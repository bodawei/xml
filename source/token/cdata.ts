/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { SectionStart } from './bridge/section';
import misc from './common/misc';

const CDATA_PTOKEN = 'CDATA_PTOKEN';
const CDATA_XTOKEN = 'CDATA_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: CdataPToken) => void;

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a CDATA element
\**********************************************************************/

class CdataXToken {
   public readonly type: typeof CDATA_XTOKEN = CDATA_XTOKEN;
   public readonly text: string;
   public readonly pToken?: CdataPToken;

   constructor(text: string, pToken?: CdataPToken) {
      this.text = text;
      this.pToken = pToken;
   }
}

class CdataPToken {
   public readonly type: typeof CDATA_PTOKEN = CDATA_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly sectionType?: SToken;
   public readonly sectionTypeSpace?: SToken;
   public readonly bracket?: SToken;
   public readonly text?: SToken;
   public readonly close?: SToken;

   constructor(param: CdataPToken | SectionStart) {
      Object.assign(this, param);
      this.open = param.open;
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion): void {
      checkWellFormed(this, ec, confVer);
   }

   toXToken(): CdataXToken {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parseCdata() extracts a CDATA section.

 PARAM
 source: An STokenSource to read from
 sectionStart: The parsing up to and including the 'CDATA'
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [18] CDSect  ::= CDStart CData CDEnd
   [19] CDStart ::= '<![CDATA['
   [20] CData   ::= (Char* - (Char* ']]>' Char*))
   [21] CDEnd   ::= ']]>'
\**********************************************************************/

function parseCdata(source: STokenSource, sectionStart: SectionStart, deliverPToken: DeliverPToken) {
   const props: any = Object.assign({}, sectionStart);

   source.extractToObject('match', '[', props, 'bracket');

   source.extractToObject('all', [ ']]>' ], props, 'text');

   source.extract('match', ']]>', (sToken) => {
      props.close = sToken;
      deliverPToken(new CdataPToken(props));
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: CdataPToken, ec: ErrorCollector, confVer: ConformanceVersion): void {
   const typeText = strOrBlank(pToken.sectionType);

   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.CDATA_XTRA_SPACE_AFTER_OPEN, [ typeText ]);

   ec.setPos(pToken.sectionType);

   if (pToken.sectionType) {
      const upperType = typeText.toLocaleUpperCase();

      ec.check(upperType !== 'CDATA', WFEID.CDATA_UNKNOWN, [ typeText ]);
      ec.check(typeText !== upperType, WFEID.CDATA_INVALID_CASE, [ upperType, typeText ]);
   } else {
      ec.report(WFEID.CDATA_NO_TYPE);
   }

   ec.setPos(pToken.sectionTypeSpace);

   ec.check(pToken.sectionTypeSpace, WFEID.CDATA_XTRA_SPACE_AFTER_TYPE, [ typeText ]);

   ec.setPos(pToken.bracket);
   ec.check(!pToken.bracket, WFEID.CDATA_NO_SECOND_BRACKET, [ typeText ]);

   ec.setPos(pToken.text);
   misc.checkCharWellFormed(pToken.text, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.CDATA_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: CdataPToken) {
   const token = new CdataXToken(strOrBlank(pToken.text), pToken);

   return token;
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: CdataPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.sectionType,
      pToken.sectionTypeSpace,
      pToken.bracket,
      pToken.text,
      pToken.close);

   return builder.sTokenArray;
}

export {
   CDATA_PTOKEN,
   CDATA_XTOKEN,
   CdataPToken,
   CdataXToken,

   parseCdata,
};
