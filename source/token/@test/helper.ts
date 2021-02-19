/* Copyright ® 2018-220 by 柏大衛. All rights reserved. */

import { EntityId, Range } from 'basic';
import {
   AttListDeclarationPToken,
   CharRefPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   NotationDeclarationPToken,
   ParameterEntityReferencePToken,
   ProcessingInstructionPToken,
   TextDeclarationPToken,
   XmlDeclarationPToken,
   ElementDeclarationPToken,
   TextPToken,
 } from 'pToken';
import { SToken, toSToken } from 'sToken';
import {
   CdataPToken,
   CommentPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   
   InternalSubsetStartToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   InternalSubsetEndToken,
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
   SpacePToken,
   CharDataPToken,
} from 'token';
import { AttrValue } from '../../token/common/attribute';

const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';
const RANGE = new Range(new EntityId(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1);

function makeInsertedRange() {
   return RANGE.clone();
};

function makeAttListDeclaration(type = 'CDATA'): AttListDeclarationPToken {
   return new AttListDeclarationPToken({
      open: toSToken('<!'),
      elementName: toSToken('elStart'),
      elementNameSpace: toSToken(' '),
      attDefs: [
         {
            name: toSToken('att1'),
            nameSpace: toSToken(' '),
            type: toSToken(type),
            typeSpace: toSToken(' '),
            defaultType: toSToken('#REQUIRED'),
            defaultTypeSpace: toSToken(' '),
            openQuote: toSToken('"'),
            value: [new TextPToken({ text: toSToken('x') })],
            closeQuote: toSToken('"'),
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
      externalId: { },
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


function makeElementStartWithAttrValue(value: AttrValue, addedProps: Record<string, unknown> = {}): ElementStartPToken {
   return new ElementStartPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      nameSpace: undefined,
      attributes: [
         {
            name: toSToken('att1'),
            value,
            ...addedProps
         },
      ],
   });
}

function makeElementEmptyWithAttrValue(value: AttrValue, addedProps: Record<string, unknown> = {}): ElementEmptyPToken {
   return new ElementEmptyPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      nameSpace: undefined,
      attributes: [
         {
            name: toSToken('att1'),
            value,
            ...addedProps
         },
      ],
   });
}
function makeElementEmptyWithAttrValueFromString(value: string, origValue?: string, addedProps?: Record<string, unknown>): ElementEmptyPToken {
   return makeElementEmptyWithAttrValue([
      new TextPToken({ text: new SToken(value, origValue || value, []) }),
   ], addedProps);
}


function makeElementStartWithAttrValueFromString(value: string, origValue?: string, addedProps?: Record<string, unknown> ): ElementStartPToken {
   return makeElementStartWithAttrValue([
      new TextPToken({ text: new SToken(value, origValue || value, []) }),
   ], addedProps);
}

function makeElementDeclaration(): ElementDeclarationPToken {
   return new ElementDeclarationPToken({
      open: toSToken('<!'),
      openSpace: undefined,
      declType: toSToken('ELEMENT'),
      declTypeSpace: toSToken(' '),
      name: toSToken('elementName'),
      nameSpace: toSToken(' '),
      contentSpec: toSToken('ANY'),
      contentSpecSpace: toSToken(' '),
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
      open: toSToken('<!'),
      parameter: toSToken('%'),
      parameterSpace: toSToken(' '),
      name: toSToken('entityName'),
      nameSpace: toSToken(' '),
      openQuote: toSToken('"'),
      value: [new TextPToken({ text: toSToken('value') })],
      closeQuote: toSToken('"'),
      close: toSToken('>'),
   });
}

function makeParameterExternalEntityDeclaration(): ParameterEntityDeclarationPToken {
   return new ParameterEntityDeclarationPToken({
      open: toSToken('<!'),
      parameter: toSToken('%'),
      parameterSpace: toSToken(' '),
      name: toSToken('entityName'),
      nameSpace: toSToken(' '),
      externalId: {
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

function makeTextPToken(text: string, origText?: string): TextPToken {
   return new TextPToken({
      text: new SToken(text, origText || text, []),
   });
}

function makeTextDecl(): TextDeclarationPToken {
   return new TextDeclarationPToken({
      open: toSToken('<?'),
      openSpace: undefined,
      target: toSToken('xml'),
      targetSpace: toSToken(' '),
      fields: [
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
      fields: [
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
   makeElementEmptyWithAttrValue,
   makeElementEmptyWithAttrValueFromString,
   makeElementEnd,
   makeElementStart,
   makeElementStartWithAttrValue,
   makeElementStartWithAttrValueFromString,
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
   makeTextPToken,
   makeTextDecl,
   makeXmlDecl,
};