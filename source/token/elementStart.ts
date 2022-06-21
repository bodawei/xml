/* Copyright ® 2017-201 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

import attribute, { AttributePToken } from './common/attribute';

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

   source.extractToObject('space', protoToken, 'openSpace');
   source.extractToObject('word', [ '>', '/>' ], protoToken, 'name');
   source.extractToObject('space', protoToken, 'nameSpace');

   attribute.parse(source, {
      geRef: true,
      terminators: [ '/', '>', '/>' ],
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


export {
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,

   ElementEmptyPToken,
   ElementStartPToken,

   parseElementStart,
};
