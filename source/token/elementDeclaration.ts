/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error/index';

import declaration, { DeclarationPToken } from './bridge/declaration';
import nameList, { NameListPToken, XNameList } from './common/nameList';
import misc from './common/misc.js';
import base from './base';
import entityReference from './entityReference';
import unassigned, { UnassignedArray } from './unassigned';
import { SToken, STokenSource } from '../sToken/index';

const ELEMENTDECL = 'ELEMENTDECL';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;
const ALLOWED_CONTENT_SPEC = [ 'EMPTY', 'ANY' ];

type DeliverCB = (ptoken: ElementDeclarationPToken) => void;

/**********************************************************************\
 The elementDeclaration namespace contains the usual tools for processing
 an element declarations.
\**********************************************************************/

type ContentSpecType = 'EMPTY' | 'ANY' | 'CHILDREN';

class ElementDeclaration extends base.XToken {
   public name: string;
   public contentSpecType: string; // if not malformed, would only be ContentSpecType
   public children: XNameList;

   constructor(name: string, contentSpecType: string, children: XNameList, pToken: ElementDeclarationPToken) {
      super(pToken);

      this.name = name;
      this.contentSpecType = contentSpecType;
      this.children = children;
   }
}

class ElementDeclarationPToken extends declaration.PToken {
   public name?: SToken;
   public postNameSpace?: SToken;
   public contentSpec?: SToken;
   public postContentSpecSpace?: SToken;
   public children?: NameListPToken;
   public close?: SToken;
   public unassigned?: Array<any>;
   public extra?: Array<any>;
   public nextPropName?: string;

   constructor(props?: Object) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(ELEMENTDECL, props);
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
      source.extractToObject('space', pToken, 'postNameSpace');
      parseContentSpec(source, pToken, deliverPToken);
   });

   unassigned.checkForPERef(source, callback);
}

function parseContentSpec(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken: DeliverCB) {
   const callback = unassigned.makeCheckCallback(pToken, 'contentSpec', deliverPToken, () => {
      source.extract('peekChar', (charSToken) => {
         if (!charSToken) {
            deliverPToken(pToken);
            return;
         }

         if (charSToken.str !== '(') {
            source.extractToObject('word', [ '>' ], pToken, 'contentSpec');
            source.extractToObject('space', pToken, 'postContentSpecSpace');
            deliverPToken(pToken);
            return;
         }

         nameList.parse(source, 'ANY', (nameList: NameListPToken) => {
            pToken.children = nameList;
            source.extract('peekChar', (nextChar) => {
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
 Recover from finding a parameter param entity ref in the declaration
\**********************************************************************/

function assignUnassigned(edPToken: ElementDeclarationPToken) {
   const unValues: UnassignedArray = edPToken.unassigned || [];

   if (unValues.length === 0) {
      delete edPToken.unassigned;
      delete edPToken.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item) => (item.type === entityReference.PARAM_PTYPE));

   if (unexpandedRef.length !== 0) {
      return;
   }

   if (edPToken.nextPropName === 'name') {
      unassigned.assignToProps(edPToken.unassigned, edPToken, edPToken.nextPropName, [
         { name: 'postDeclTypeSpace', type: 'space' },
         { name: 'name', type: 'word' },
         { name: 'postNameSpace', type: 'space' },
      ]);

      edPToken.nextPropName = 'contentSpec';
   }

   if (edPToken.nextPropName === 'contentSpec') {
      const nextValue: Object = unValues.length > 0 ? unValues[0] : {};

      if (unassigned.isTypedText(nextValue) && nextValue.text.str === '(') {
         nameList.assignUnassigned(edPToken.children, edPToken.unassigned);
      } else {
         unassigned.assignToProps(edPToken.unassigned, edPToken, edPToken.nextPropName, [
            { name: 'contentSpec', type: 'word' },
            { name: 'postContentSpecSpace', type: 'space' },
         ]);
      }
   } else {
      nameList.assignUnassigned(edPToken.children, edPToken.unassigned);
   }

   if (unValues.length !== 0) {
      edPToken.extra = edPToken.unassigned;
   }

   delete edPToken.nextPropName;
   delete edPToken.unassigned;
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ElementDeclarationPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   const nameText = misc.textOrBlank(pToken.name);

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENTDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ELEMENTDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData,
      WARN.ELEMENTDECL_NAME_XMLDASH_RESERVED,
      WARN.ELEMENTDECL_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.ELEMENTDECL_NAME_NO_SPACE, [ nameText ]);

   if (pToken.children) {
      nameList.checkWellFormed(pToken.children, ec, entityMetaData, 'children', 'ANY', );
   } else {
      const contentSpec: string = misc.textOrBlank(pToken.contentSpec);
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
   let contentSpec: string = misc.textOrBlank(pToken.contentSpec);
   let children: XNameList;

   if (pToken.children) {
      contentSpec = 'CHILDREN';
      children = nameList.makeXTokenCompatible(pToken.children, 'ANY');
   }

   return new ElementDeclaration(misc.textOrBlank(pToken.name),
      contentSpec, children, pToken);
}

const elementDeclaration = {
   PTYPE: ELEMENTDECL,
   XToken: ElementDeclaration,
   PToken: ElementDeclarationPToken,
   parse,
   assignUnassigned,
   checkWellFormed,
   pTokenToXToken,
};

export default elementDeclaration;
export { ElementDeclarationPToken };