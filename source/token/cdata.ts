/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

import { SectionStart } from './bridge/section';

const CDATA_PTOKEN = 'CDATA_PTOKEN';

type DeliverPToken = (pToken: CdataPToken) => void;

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

function parseCdata(
   source: STokenSource,
   sectionStart: SectionStart,
   deliverPToken: DeliverPToken,
) {
   const props: any = Object.assign({}, sectionStart);

   source.extractToObject('match', '[', props, 'bracket');

   source.extractToObject('all', [']]>'], props, 'text');

   source.extract('match', ']]>', (sToken) => {
      props.close = sToken;
      deliverPToken(new CdataPToken(props));
   });
}

export { CDATA_PTOKEN, CdataPToken, parseCdata };
