/* Copyright ® 2017-201 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';
import {  WellFormedError } from '../wellformedness/error/WellFormedError';

import attribute, { AttributePToken, AttributeXToken } from './common/attribute';
import misc from './common/misc';

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ELEMENT_START_PTOKEN = 'ELEMENT_START_PTOKEN';
const ELEMENT_EMPTY_PTOKEN = 'ELEMENT_EMPTY_PTOKEN';
const ELEMENT_START_XTOKEN = 'ELEMENT_START_XTOKEN';
const ELEMENT_EMPTY_XTOKEN = 'ELEMENT_EMPTY_XTOKEN';

type DeliverElementStartPToken = (pToken?: ElementStartPToken|ElementEmptyPToken) => void;
type ProtoToken = { open: SToken; [ any: string]: any };

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class ElementStartXToken {
   public readonly type: typeof ELEMENT_START_XTOKEN = ELEMENT_START_XTOKEN;
   public readonly name: string;
   public readonly attributes: ReadonlyArray<AttributeXToken>;
   public pToken?: ElementStartPToken;

   constructor(name: string, attributes: Array<AttributeXToken>, pToken?: ElementStartPToken) {
      this.name = name;
      this.attributes = attributes;
      this.pToken = pToken;
   }

}

class ElementEmptyXToken {
   public readonly type: typeof ELEMENT_EMPTY_XTOKEN = ELEMENT_EMPTY_XTOKEN;
   public readonly name: string;
   public readonly attributes: ReadonlyArray<AttributeXToken>;
   public pToken?: ElementEmptyPToken;

   constructor(name: string, attributes: Array<AttributeXToken>, pToken?: ElementEmptyPToken) {
      this.name = name;
      this.attributes = attributes;
      this.pToken = pToken;
   }

}

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

   toXToken() {
      return pTokenToXTokenStart(this);
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

   toXToken() {
      return pTokenToXTokenEmpty(this);
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
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXTokenEmpty(pToken: ElementEmptyPToken) {
   return new ElementEmptyXToken(strOrBlank(pToken.name),
      attribute.makeTokenCompatible(pToken.attributes), pToken);
}

function pTokenToXTokenStart(pToken: ElementStartPToken) {
   return new ElementStartXToken(strOrBlank(pToken.name),
      attribute.makeTokenCompatible(pToken.attributes), pToken);
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
   ELEMENT_EMPTY_XTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_START_XTOKEN,

   ElementEmptyPToken,
   ElementEmptyXToken,
   ElementStartPToken,
   ElementStartXToken,

   parseElementStart,
};
