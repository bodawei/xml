/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { toSToken } from 'sToken';
import {
   CdataPToken,
   CommentPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityEndPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   NotationDeclarationPToken,
   ProcessingInstructionPToken,
   TextDeclarationPToken,
   InternalSubsetStartToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   InternalSubsetEndToken,
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   SpacePToken,
   TextPToken,
   ParameterEntityDeclarationPToken,
   XmlDeclarationPToken,
   attListDeclaration,
   elementDeclaration,
   CharDataPToken,
   CharRefPToken,
} from 'token';

function makeAttListDeclaration(): any {
   return new attListDeclaration.PToken({
      open: toSToken('<!'),
      elementName: toSToken('elementName'),
      postElementNameSpace: toSToken(' '),
      attDefs: [
         {
            name: toSToken('att1'),
            postNameSpace: toSToken(' '),
            type: toSToken('CDATA'),
            postTypeSpace: toSToken(' '),
            defaultType: toSToken('#REQUIRED'),
            postDefaultTypeSpace: toSToken(' '),
            value: [],
         },
      ],
      close: toSToken('>'),
   });
}

const makeCharData = () =>
   new CharDataPToken({
      text: toSToken('test text'),
   });

const makeCdata = () =>
   new CdataPToken({
      open: toSToken('<!['),
      sectionType: toSToken('CDATA'),
      bracket: toSToken('['),
      text: toSToken('test text'),
      close: toSToken(']]>'),
   });

const makeCharRef = () =>
   new CharRefPToken({
      open: toSToken('&#'),
      digits: toSToken('68'),
      close: toSToken(';'),
      charCode: 68,
   });

const makeComment = () =>
   new CommentPToken({
      open: toSToken('<!--'),
      text: [toSToken('commentText')],
      close: toSToken('-->'),
   });

const makeDocTypeStart = () =>
   new DocTypeStartPToken({
      open: toSToken('<!'),
      declType: toSToken('DOCTYPE'),
      name: toSToken('root'),
      openSubset: toSToken('['),
   });

const makeDocTypeEnd = () =>
   new DocTypeEndPToken({
      docTypeStartPToken: makeDocTypeStart(),
      closeSubset: toSToken(']'),
      close: toSToken('>'),
   });

function makeNotationDeclaration(): NotationDeclarationPToken {
   return new NotationDeclarationPToken({
      open: toSToken('<!'),
      openSpace: undefined,
      declType: toSToken('NOTATION'),
      declTypeSpace: toSToken(' '),
      name: toSToken('notationName'),
      nameSpace: toSToken(' '),
      externalId: { type: 'EXTERNAL_ID', peRefPlus: [] },
      externalIdSpace: toSToken(' '),
      close: toSToken('>'),
   });
}

function makeElementEmpty(): ElementEmptyPToken {
   return new ElementEmptyPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      close: toSToken('/>'),
   });
}

function makeElementEnd(): ElementEndPToken {
   return new ElementEndPToken({
      open: toSToken('</'),
      name: toSToken('elStart'),
      close: toSToken('>'),
   });
}

const makeElementStart = () =>
   new ElementStartPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      close: toSToken('>'),
   });

const makeElementDeclaration = () =>
   new elementDeclaration.PToken({
      open: toSToken('<!'),
      postOpenSpace: undefined,
      declType: toSToken('ELEMENT'),
      postDeclTypeSpace: toSToken(' '),
      name: toSToken('elementName'),
      postNameSpace: toSToken(' '),
      contentSpec: toSToken('ANY'),
      postContentSpecSpace: toSToken(' '),
      close: toSToken('>'),
   });

function makeExternalSubsetEnd() {
   return new ExternalSubsetEndToken();
}
function makeExternalSubsetStart() {
   return new ExternalSubsetStartToken();
}

function makeGeneralEntityDeclaration(name = 'geDecl'): GeneralEntityDeclarationPToken {
   return new GeneralEntityDeclarationPToken({
      open: toSToken('<!'),
      name: toSToken(name),
      close: toSToken('>'),
   });
}

function makeGeneralEntityReference(): GeneralEntityReferencePToken {
   return new GeneralEntityReferencePToken({
      open: toSToken('&'),
      name: toSToken('testRef'),
      close: toSToken(';'),
   });
}

function makeGeneralEntityStart(): GeneralEntityStartPToken {
   return new GeneralEntityStartPToken(makeGeneralEntityReference());
}
function makeGeneralEntityEnd(): GeneralEntityEndPToken {
   return new GeneralEntityEndPToken(makeGeneralEntityReference());
}

function makeInternalSubsetEnd(): InternalSubsetEndToken {
   return new InternalSubsetEndToken();
}
function makeInternalSubsetStart(): InternalSubsetStartToken {
   return new InternalSubsetStartToken();
}

function makeParameterEntityDeclaration(): ParameterEntityDeclarationPToken {
   return new ParameterEntityDeclarationPToken({
      parameter: toSToken('%'),
      parameterSpace: toSToken(' '),
      name: toSToken('entityName'),
      nameSpace: toSToken(' '),
      openQuote: toSToken('"'),
      value: [toSToken('value')],
      closeQuote: toSToken('"'),
      close: toSToken('>'),
   });
}

function makeParameterExternalEntityDeclaration(): ParameterEntityDeclarationPToken {
   return new ParameterEntityDeclarationPToken({
      parameter: toSToken('%'),
      parameterSpace: toSToken(' '),
      name: toSToken('entityName'),
      nameSpace: toSToken(' '),
      externalId: {
         type: 'EXTERNAL_ID',
         peRefPlus: [],
         externalType: toSToken('PUBLIC'),
         externalTypeSpace: toSToken(' '),
         public: {
            openQuote: toSToken('"'),
            value: [new TextPToken({ text: toSToken('pub.xml') })],
            closeQuote: toSToken('"'),
         },
      },
      close: toSToken('>'),
   });
}

const makeParameterEntityReference = () =>
   new ParameterEntityReferencePToken({
      open: toSToken('&'),
      name: toSToken('entityName'),
      close: toSToken(';'),
   });

const makeParameterEntityStart = () =>
   new ParameterEntityStartPToken(makeParameterEntityReference());
function makeParameterEntityEnd() {
   return new ParameterEntityEndPToken(makeParameterEntityReference());
}

const makeProcessingInstruction = () =>
   new ProcessingInstructionPToken({
      open: toSToken('<?'),
      target: toSToken('foo'),
      targetSpace: toSToken(' '),
      instruction: toSToken('blah'),
      close: toSToken('?>'),
   });

const makeSpace = () =>
   new SpacePToken({
      text: toSToken(' '),
   });

const makeTextDecl = () =>
   new TextDeclarationPToken({
      open: toSToken('<?'),
      openSpace: undefined,
      target: toSToken('xml'),
      targetSpace: toSToken(' '),
      params: [
         {
            name: toSToken('version'),
            nameSpace: undefined,
            equal: toSToken('='),
            equalSpace: undefined,
            value: toSToken('1.1'),
         },
      ],
      close: toSToken('?>'),
   });

const makeXmlDecl = () =>
   new XmlDeclarationPToken({
      open: toSToken('<?'),
      openSpace: undefined,
      target: toSToken('xml'),
      targetSpace: toSToken(' '),
      params: [
         {
            name: toSToken('version'),
            nameSpace: undefined,
            equal: toSToken('='),
            equalSpace: undefined,
            value: toSToken('1.1'),
         },
      ],
      close: toSToken('?>'),
   });

export {
   makeAttListDeclaration,
   makeCharData,
   makeCdata,
   makeCharRef,
   makeComment,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeInternalSubsetEnd,
   makeInternalSubsetStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterExternalEntityDeclaration,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeProcessingInstruction,
   makeSpace,
   makeTextDecl,
   makeXmlDecl,
};
