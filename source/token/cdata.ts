/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { SectionStart } from './bridge/section';

const CDATA_PTOKEN = 'CDATA_PTOKEN';
const CDATA_XTOKEN = 'CDATA_XTOKEN';

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
