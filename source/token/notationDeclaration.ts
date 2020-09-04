/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { ExternalId, parseExternalId, checkExternalIdWellFormed, getSTokens } from './common/externalId';
import misc from './common/misc';
import unassigned, { UnassignedArray } from './common/unassigned';
import { DeclarationStart } from './bridge/declaration';
import { ExternalIdXToken } from 'xToken';

const NOTATION_DECLARATION_PTOKEN = 'NOTATION_DECLARATION_PTOKEN';
const NOTATION_DECLARATION_XTOKEN = 'NOTATION_DECLARATION_XTOKEN';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: NotationDeclarationPToken) => void;
type ProtoToken = DeclarationStart & {
   type: string,
   [key: string] : any,
};

/**********************************************************************\
 §4.7 Notation Declaration
 Contains parsing, well formed checks and conversion routines for
 Notation Declarations
\**********************************************************************/

class NotationDeclarationXToken {
   public readonly type: typeof NOTATION_DECLARATION_XTOKEN = NOTATION_DECLARATION_XTOKEN;
   public readonly name: string;
   public readonly externalId?: ExternalIdXToken;
   public pToken?: NotationDeclarationPToken;

   constructor(name: string, externalId?: ExternalIdXToken, pToken?: NotationDeclarationPToken) {
      this.name = name;
      this.externalId = externalId;
      this.pToken = pToken;
   }
}

class NotationDeclarationPToken {
   public readonly type: typeof NOTATION_DECLARATION_PTOKEN = NOTATION_DECLARATION_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly declType?: SToken;
   public readonly declTypeSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly externalId?: ExternalId;
   public readonly externalIdSpace?: SToken;
   public readonly close?: SToken;
   public readonly peRefPlus: UnassignedArray;
   public unassigned: UnassignedArray;
   public readonly nextPropName?: string;
   public extra?: UnassignedArray;

   constructor(props: NotationDeclarationPToken | DeclarationStart) {
      this.unassigned = [];

      Object.assign(this, props);

      this.type = NOTATION_DECLARATION_PTOKEN;
      this.open = props.open;
      this.peRefPlus = (props as any).peRefPlus || [];
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData) {
      return checkWellFormed(this, ec, entityMetaData);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parse() extracts a notation declaration.

 This assumes that the "<!NOTATION" has already been processed and has
 been passed as an argument to this

 PARAM
 source: A STokenSource to read from
 declarationPToken: The pToken value from declaration
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §4.7
      [82] NotationDecl ::=
         '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
   Lax:
      [82] NotationDecl ::=
         '<! S? NOTATION' S? Name S? (ExternalID | PublicID) S? '>'
\**********************************************************************/

function parseNotationDeclaration(source: STokenSource, declarationStart: DeclarationStart, deliverPToken: DeliverPToken): void {
   const protoToken: ProtoToken = Object.assign({}, declarationStart) as ProtoToken;

   unassigned.parsePERefOrOrdinary(source, (protoToken as any), 'name', () => {
      getClose(source, protoToken, deliverPToken);
   }, () => {
      source.extractToObject('word', [ '>' ], protoToken, 'name');
      source.extractToObjectNoParams('space', protoToken, 'nameSpace');

      parseExternalId(source, [ '>' ], true, (parsedResult) => {
         protoToken.externalId = parsedResult.externalId;
         protoToken.unassigned = parsedResult.peRefPlus;
         protoToken.nextPropName = parsedResult.nextPropName;
         protoToken.peRefPlus = parsedResult.peRefPlus;

         if (protoToken.externalId && parsedResult.peRefPlus.length === 0) {
            source.extractToObjectNoParams('space', protoToken, 'externalIdSpace');
         }

         getClose(source, protoToken, deliverPToken);
      });
   });
}

function getClose(source: STokenSource, protoToken: ProtoToken, deliverPToken: DeliverPToken): void {
   source.extract('match', '>', (sToken) => {
      protoToken.close = sToken;

      if (!protoToken.unassigned || protoToken.unassigned.length === 0) {
         protoToken.unassigned = [];
         protoToken.extra = [];
      }

      deliverPToken(new NotationDeclarationPToken(protoToken));
   });
}


/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: NotationDeclarationPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   const nameText: string = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   ec.setPos(pToken.open);

   ec.check((pToken.unassigned && pToken.unassigned.length > 0) && !pToken.extra, WFEID.NOTATIONDECL_UNASSIGNED);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'NOTATION', WFEID.NOTATIONDECL_DECLTYPE_INVALID, [ declType ]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.NOTATIONDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.NOTATIONDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData, 'NOTATION',
      WARN.NOTATIONDECL_NAME_XMLDASH_RESERVED,
      WARN.NOTATIONDECL_NAME_XML_RESERVED);

   ec.setPos(pToken.nameSpace);
   ec.check(!pToken.nameSpace, WFEID.NOTATIONDECL_NAME_NO_SPACE, [ nameText ]);

   ec.check(!pToken.externalId, WFEID.NOTATIONDECL_NO_EXTERNALID);
   checkExternalIdWellFormed(pToken.externalId, ec, entityMetaData);

   ec.setPos(pToken.externalIdSpace);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NOTATIONDECL_NO_CLOSE, [ nameText ]);

   unassigned.checkExtra(pToken.extra, ec, WFEID.NOTATIONDECL_EXTRA_TEXT);
}

/**********************************************************************\
 pTokenToXToken() converts a pToken into a token.
\**********************************************************************/

function pTokenToXToken(pToken: NotationDeclarationPToken): NotationDeclarationXToken {
   return new NotationDeclarationXToken(strOrBlank(pToken.name),
      pToken.externalId ? new ExternalIdXToken(pToken.externalId) : undefined, pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: NotationDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.name,
      pToken.nameSpace,
      getSTokens(pToken.externalId),
      pToken.externalIdSpace,
      unassigned.getSTokens(pToken.extra || []),
      pToken.close);

   return builder.sTokenArray;
}

export {
   NOTATION_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_XTOKEN,

   NotationDeclarationPToken,
   NotationDeclarationXToken,

   parseNotationDeclaration,
};
