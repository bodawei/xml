/* Copyright ® 2018-220 by 柏大衛. All rights reserved. */

import { EntityId, Range } from 'basic';
import { TextDeclarationPToken,XmlDeclarationPToken } from 'pToken';
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
   attListDeclaration,
   elementDeclaration,
   CharDataPToken,
   CharRefPToken,
   ElementDeclarationPToken,
} from 'token';

const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';
const RANGE = new Range(new EntityId(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1);

function makeInsertedRange() {
   return RANGE.clone();
};

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

function makeCharData(): CharDataPToken {
   return new CharDataPToken({
      text: toSToken('test text'),
   });
}

function makeCdata(): CdataPToken {
   return new CdataPToken({
      open: toSToken('<!['),
      sectionType: toSToken('CDATA'),
      bracket: toSToken('['),
      text: toSToken('test text'),
      close: toSToken(']]>'),
   });
}

function makeCharRef(): CharRefPToken {
   return new CharRefPToken({
      open: toSToken('&#'),
      digits: toSToken('68'),
      close: toSToken(';'),
      charCode: 68,
   });
}

function makeComment(): CommentPToken {
   return new CommentPToken({
      open: toSToken('<!--'),
      text: [toSToken('commentText')],
      close: toSToken('-->'),
   });
}

function makeDocTypeStart(): DocTypeStartPToken {
   return new DocTypeStartPToken({
      open: toSToken('<!'),
      declType: toSToken('DOCTYPE'),
      name: toSToken('root'),
      openSubset: toSToken('['),
   });
}

function makeDocTypeEnd(): DocTypeEndPToken {
   return new DocTypeEndPToken({
      docTypeStartPToken: makeDocTypeStart(),
      closeSubset: toSToken(']'),
      close: toSToken('>'),
   });
}

function makeNotationDeclaration(): NotationDeclarationPToken {
   return new NotationDeclarationPToken({
      open: toSToken('<!'),
      openSpace: undefined,
      declType: toSToken('NOTATION'),
      declTypeSpace: toSToken(' '),
      name: toSToken('notationName'),
      nameSpace: toSToken(' '),
      externalId: { type: 'EXTERNAL_ID' },
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

function makeElementStart(): ElementStartPToken {
   return new ElementStartPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      close: toSToken('>'),
   });
}

function makeElementDeclaration(): ElementDeclarationPToken {
   return new elementDeclaration.PToken({
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
}

function makeExternalSubsetEnd(): ExternalSubsetEndToken {
   return new ExternalSubsetEndToken();
}
function makeExternalSubsetStart(): ExternalSubsetStartToken {
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

function makeParameterEntityReference(): ParameterEntityReferencePToken {
   return new ParameterEntityReferencePToken({
      open: toSToken('&'),
      name: toSToken('entityName'),
      close: toSToken(';'),
   });
}

function makeParameterEntityStart(): ParameterEntityStartPToken {
   return new ParameterEntityStartPToken(makeParameterEntityReference());
}

function makeParameterEntityEnd(): ParameterEntityEndPToken {
   return new ParameterEntityEndPToken(makeParameterEntityReference());
}

function makeProcessingInstruction(): ProcessingInstructionPToken {
   return new ProcessingInstructionPToken({
      open: toSToken('<?'),
      target: toSToken('foo'),
      targetSpace: toSToken(' '),
      instruction: toSToken('blah'),
      close: toSToken('?>'),
   });
}

function makeSpace(): SpacePToken {
   return new SpacePToken({
      text: toSToken(' '),
   });
}

function makeTextDecl(): TextDeclarationPToken {
   return new TextDeclarationPToken({
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
}

function makeXmlDecl(): XmlDeclarationPToken {
   return new XmlDeclarationPToken({
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
}


const helper = {
   BLANK_ORIGIN,
   makeInsertedRange
}

export default helper;
export {
   BLANK_ORIGIN,
   makeInsertedRange,
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