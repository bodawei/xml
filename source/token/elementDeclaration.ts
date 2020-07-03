/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import declaration, { DeclarationPToken } from './bridge/baseDeclaration';
import misc from './common/misc';
import unassigned, { UnassignedArray } from './common/unassigned';
import nameList, { NameListPToken, XNameList, isXName } from './contentspec/nameList';

const ELEMENTDECL = 'ELEMENTDECL';
const ELEMENTDECL_XTOKEN = 'ELEMENTDECL_XTOKEN';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;
const ALLOWED_CONTENT_SPEC = [ 'EMPTY', 'ANY' ];

type DeliverCB = (ptoken: ElementDeclarationPToken) => void;

/**********************************************************************\
 The elementDeclaration namespace contains the usual tools for processing
 an element declarations.
\**********************************************************************/

class ElementDeclaration {
   public readonly type = ELEMENTDECL_XTOKEN;
   public name: string;
   public contentSpecType: string; // if not malformed, would only be ContentSpecType
   public children: XNameList | void;
   public pToken?: ElementDeclarationPToken;

   constructor(name: string, contentSpecType: string, children?: XNameList | void, pToken?: ElementDeclarationPToken) {
      this.name = name;
      this.contentSpecType = contentSpecType;
      this.children = children;
      this.pToken = pToken;
   }
}

class ElementDeclarationPToken extends declaration.PToken {
   public readonly type: typeof ELEMENTDECL = ELEMENTDECL;
   public name?: SToken;
   public postNameSpace?: SToken;
   public contentSpec?: SToken;
   public postContentSpecSpace?: SToken;
   public children?: NameListPToken;
   public close?: SToken;
   public peRefPlus: UnassignedArray;
   public unassigned?: UnassignedArray;
   public extra?: UnassignedArray;
   public nextPropName?: string;

   constructor(props?: Object) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(ELEMENTDECL, props);

      if (props) {
         this.peRefPlus = (props as any).peRefPlus || []
      } else {
         this.peRefPlus = [];
      }
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(
         this.name,
         this.postNameSpace,
         this.contentSpec,
         this.postContentSpecSpace,
      );

      if (this.children) {
         results.pushSTokens(...this.children.getSTokenArray());
      }

      results.pushSTokens(
         this.close,
      );

      return results;
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData) {
      checkWellFormed(this, ec, entityMetaData);
   }
}

/**********************************************************************\
 parse() extracts an element declaration.

 This assumes that the "<!ELEMENT" has already been processed and has
 been passed as an argument to this.

 PARAM
   source: A STokenSource to read from
   declarationPToken: The pToken value from declaration
   deliverPToken: Callback to deliver the PToken

 SYNTAX
   §3.2.0
   [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
   [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
   Note that Mixed and children are handled by nameList
\**********************************************************************/

function parse(source: STokenSource, declarationPToken: DeclarationPToken, deliverPToken: DeliverCB) {
   const pToken = new ElementDeclarationPToken(declarationPToken);

   parseName(source, pToken, (resultToken: ElementDeclarationPToken) => {
      parseClose(source, resultToken, deliverPToken);
   });

}

function parseName(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken: DeliverCB) {
   const callback = unassigned.makeCheckCallback(pToken, 'name', deliverPToken, () => {
      source.extractToObject('word', [ '>', '(' ], pToken, 'name');
      source.extractToObjectNoParams('space', pToken, 'postNameSpace');
      parseContentSpec(source, pToken, deliverPToken);
   });

   unassigned.checkForPERef(source, callback);
}

function parseContentSpec(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken: DeliverCB) {
   const callback = unassigned.makeCheckCallback(pToken, 'contentSpec', deliverPToken, () => {
      source.extractNoParams('peekChar', (charSToken) => {
         if (!charSToken) {
            deliverPToken(pToken);
            return;
         }

         if (charSToken.str !== '(') {
            source.extractToObject('word', [ '>' ], pToken, 'contentSpec');
            source.extractToObjectNoParams('space', pToken, 'postContentSpecSpace');
            deliverPToken(pToken);
            return;
         }

         nameList.parse(source, (nameList?: NameListPToken) => {
            pToken.children = nameList;
            source.extractNoParams('peekChar', (nextChar) => {
               if (nextChar && nextChar.str === '%') {
                  unassigned.parseAllValues(source, true, (values) => {
                     pToken.nextPropName = 'midContentSpec';
                     pToken.unassigned = values;
                     deliverPToken(pToken);
                  });
               } else {
                  deliverPToken(pToken);
               }
            });
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseClose(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken: DeliverCB) {
   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;

      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ElementDeclarationPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   const nameText = strOrBlank(pToken.name);

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENTDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ELEMENTDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData, 'ELEMENT',
      WARN.ELEMENTDECL_NAME_XMLCOLON_RESERVED,
      WARN.ELEMENTDECL_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.ELEMENTDECL_NAME_NO_SPACE, [ nameText ]);

   if (pToken.children) {
      nameList.checkWellFormed(pToken.children, ec, entityMetaData);
   } else {
      const contentSpec: string = strOrBlank(pToken.contentSpec);
      const upperContentSpec = contentSpec.toLocaleUpperCase();
      ec.setPos(pToken.contentSpec);

      if (!pToken.contentSpec) {
         ec.report(WFEID.ELEMENTDECL_NO_SPEC, [ nameText ]);
      } else if (ALLOWED_CONTENT_SPEC.indexOf(upperContentSpec) === -1) {
         ec.report(WFEID.ELEMENTDECL_SPEC_UNKNOWN, [ nameText, contentSpec ]);
      } else if (contentSpec !== upperContentSpec) {
         ec.report(WFEID.ELEMENTDECL_SPEC_INVALID_CASE, [ nameText, upperContentSpec, contentSpec ]);
      }

      ec.setPos(pToken.postContentSpecSpace);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENTDECL_NO_CLOSE, [ nameText ]);

   unassigned.checkExtra(pToken.extra, ec, WFEID.ELEMENTDECL_EXTRA_TEXT);
}

/**********************************************************************\
 pTokenToXToken() converts a pToken into a token.
\**********************************************************************/

function pTokenToXToken(pToken: ElementDeclarationPToken) {
   let contentSpec: string = strOrBlank(pToken.contentSpec);   // We will introduce garbage here
   let children: XNameList | void;

   if (pToken.children) {
      contentSpec = 'CHILDREN';
      children = nameList.makeXTokenCompatible(pToken.children);
   }

   return new ElementDeclaration(strOrBlank(pToken.name),
   contentSpec, children, pToken);
}

const elementDeclaration = {
   PTYPE: ELEMENTDECL,
   XTYPE: ELEMENTDECL_XTOKEN,
   XToken: ElementDeclaration,
   PToken: ElementDeclarationPToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};

export default elementDeclaration;
export {
   ElementDeclarationPToken,
   ElementDeclaration,
   XNameList,
   isXName,
   ELEMENTDECL as ELEMENT_DECLARATION_PTOKEN,
};