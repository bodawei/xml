/* Copyright ® 2017-201 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import attribute, { AttributePToken, AttributeXToken } from './common/attribute';

const ELEMENT_START_PTOKEN = 'ELEMENT_START_PTOKEN';
const ELEMENT_EMPTY_PTOKEN = 'ELEMENT_EMPTY_PTOKEN';

type DeliverElementStartPToken = (pToken?: ElementStartPToken|ElementEmptyPToken) => void;
type ProtoToken = { open: SToken; [ any: string]: any };


class ElementStartPToken {
   public readonly type: typeof ELEMENT_START_PTOKEN = ELEMENT_START_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly attributes: Array<AttributePToken>;
   public readonly close?: SToken;

   constructor(basePToken: ElementStartPToken | ProtoToken) {
      this.attributes = [];
      Object.assign(this, basePToken);

      this.type = ELEMENT_START_PTOKEN;
      this.open = basePToken.open; // Make sure type system knows we always assign open
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

class ElementEmptyPToken {
   public readonly type: typeof ELEMENT_EMPTY_PTOKEN = ELEMENT_EMPTY_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly attributes: Array<AttributePToken>;
   public readonly close?: SToken;

   constructor(basePToken: ElementStartPToken | ProtoToken) {
      this.attributes = [];
      Object.assign(this, basePToken);

      this.type = ELEMENT_EMPTY_PTOKEN;
      this.open = basePToken.open; // Make sure type system knows we always assign open
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parse() extracts the pieces of an element start tag.

 This assumes that the "<" has already been process and has been passed
 as an argument to this

 PARAM
 source: An STokenSource to read from
 open: the SToken corresponding to the opening <
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §3.0.0
   [40] STag ::= '<' Name (S Attribute)* S? '>'
   [42] ETag ::= '</' Name S? '>'
   [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
\**********************************************************************/

function parseElementStart(source: STokenSource, open: SToken, deliverPToken: DeliverElementStartPToken) {
   const protoToken: ProtoToken = {
      open,
   };

   source.extractToObjectNoParams('space', protoToken, 'openSpace');
   source.extractToObject('word', [ '>', '/>' ], protoToken, 'name');
   source.extractToObjectNoParams('space', protoToken, 'nameSpace');

   attribute.parse(source, {
      geRef: true,
      terminators: [ '>', '/>' ],
   }, (attributes) => {
      protoToken.attributes = attributes;

      source.extract('match', '>', (sToken) => {
         if (sToken) {
            protoToken.close = sToken;
            deliverPToken(new ElementStartPToken(protoToken));
            return;
         }

         source.extract('match', '/>', (sToken) => {
            protoToken.close = sToken;

            if (sToken) {
               deliverPToken(new ElementEmptyPToken(protoToken));
            } else {
               deliverPToken(new ElementStartPToken(protoToken));
            }
         });
      });
   });
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the component STokens
\**********************************************************************/

function sTokensFromPToken(pToken: ElementStartPToken | ElementEmptyPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const sTokens = attribute.getSTokens(pToken.attributes);

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.name,
      pToken.nameSpace,
      sTokens,
      pToken.close);

   return builder.sTokenArray;
}

export {
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,

   ElementEmptyPToken,
   ElementStartPToken,

   parseElementStart,
};
