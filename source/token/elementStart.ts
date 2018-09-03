/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error/index';
import { SToken, STokenSource } from '../sToken/index';

import attribute, { AttributeXToken } from './common/attribute';
import misc from './common/misc.js';
import base from './base';

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ELEMENT_START = 'ELEMENT_START';
const ELEMENT_EMPTY = 'ELEMENT_EMPTY';
const ELEMENT_START_XTOKEN = 'ELEMENT_START_XTOKEN';
const ELEMENT_EMPTY_XTOKEN = 'ELEMENT_EMPTY_XTOKEN';

type DeliverElementStartPToken = (pToken?: ElementStartPToken) => void;

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class ElementStart {
   public readonly type: string = ELEMENT_START_XTOKEN;
   public name: string;
   public attributes: Array<AttributeXToken>;
   public pToken?: ElementStartPToken;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(name: string, attributes: Array<AttributeXToken>, pToken?: ElementStartPToken) {
      this.name = name;
      this.attributes = attributes;
      this.pToken = pToken;
   }

}

class ElementEmpty {
   public readonly type: string = ELEMENT_EMPTY_XTOKEN;
   public name: string;
   public attributes: Array<AttributeXToken>;
   public pToken?: ElementEmptyPToken;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(name: string, attributes: Array<AttributeXToken>, pToken?: ElementEmptyPToken) {
      this.name = name;
      this.attributes = attributes;
      this.pToken = pToken;
   }

}

class ElementStartPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(props?: { [ any: string]: any }) {
      super(ELEMENT_START, props);
   }

   getSTokenArray() {
      /* istanbul ignore next */ // Istanbul is confused by node transpilation
      const results = super.getSTokenArray();
      const sTokens = attribute.getSTokens(this.attributes);

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.name,
         this.postNameSpace);
      results.pushSTokens.apply(results, sTokens); // eslint-disable-line prefer-spread
      results.pushSTokens(this.close);

      return results;
   }
}

class ElementEmptyPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(props?: { [ any: string]: any }) {
      super(ELEMENT_EMPTY, props);
   }

   getSTokenArray() {
      /* istanbul ignore next */ // Istanbul is confused by node transpilation
      const results = super.getSTokenArray();
      const sTokens = attribute.getSTokens(this.attributes);

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.name,
         this.postNameSpace);
      results.pushSTokens.apply(results, sTokens); // eslint-disable-line prefer-spread
      results.pushSTokens(this.close);

      return results;
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
   [40] STag ::= '<' Name (S Attribute)* S? '>'
   [42] ETag ::= '</' Name S? '>'
   [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
\**********************************************************************/

function parse(source: STokenSource, open: SToken, deliverPToken: DeliverElementStartPToken) {
   const pToken = new ElementStartPToken({
      open,
   });

   source.extractToObjectNoParams('space', pToken, 'postOpenSpace');
   source.extractToObject('word', [ '>', '/>' ], pToken, 'name');
   source.extractToObjectNoParams('space', pToken, 'postNameSpace');

   attribute.parse(source, {
      geRef: true,
      terminators: [ '>', '/>' ],
   }, (attributes) => {
      pToken.attributes = attributes;

      source.extract('match', '>', (sToken) => {
         if (sToken) {
            pToken.close = sToken;
            deliverPToken(pToken);
            return;
         }

         source.extract('match', '/>', (sToken) => {
            pToken.close = sToken;

            if (sToken) {
               deliverPToken(new ElementEmptyPToken(pToken));
            } else {
               deliverPToken(pToken);
            }
         });
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ElementStartPToken | ElementEmptyPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.ELEMENT_XTRA_LEADING_SPACE);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENT_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ELEMENT_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData, true,
      WARN.ELEMENT_NAME_XMLCOLON_RESERVED,
      WARN.ELEMENT_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);

   const attribs = pToken.attributes || [];
   attribute.checkWellFormed(attribs, ec, entityMetaData, pToken.postNameSpace, WFEID.NOUN_ATTRIBUTE);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENT_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ElementStartPToken | ElementEmptyPToken) {
   const className = (pToken.type === ELEMENT_START) ? ElementStart : ElementEmpty;

   return new className(misc.textOrBlank(pToken.name),
      attribute.makeTokenCompatible(pToken.attributes), pToken);
}

export {
   ELEMENT_START as PTYPE,
   ELEMENT_START_XTOKEN as XTYPE,
   ElementStart as XToken,
   ElementStartPToken as PToken,
   ELEMENT_EMPTY as EMPTY_TYPE,
   ELEMENT_EMPTY_XTOKEN as EMPTY_XTYPE,
   ElementEmpty as EmptyToken,
   ElementEmptyPToken as EmptyPToken,
   parse,
   checkWellFormed,
   pTokenToXToken,

   ElementStart,
};
