/* Copyright ® 2018-220 by 柏大衛. All rights reserved. */

import { EntityId, Range } from 'basic';
import { SToken, toSToken } from 'basic';
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
   ContentModelP,
   TEXT_PTOKEN,
} from 'pToken';
import {
   CdataPToken,
   CommentPToken,
   ConditionalStartPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
   SpacePToken,
   CharDataPToken,
   DeclarationPToken,
} from 'token';

import { AttrValue } from '../../token/common/attribute';
import { ConditionalEndPToken } from '../conditionalEnd';

const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';
const RANGE = new Range(new EntityId(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1);

function makeInsertedRange() {
   return new Range(RANGE);
}

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

function makeCharData(text: string = 'test text'): CharDataPToken {
   return new CharDataPToken({
      text: toSToken(text),
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

function makeConditionalClose(): ConditionalEndPToken {
   return new ConditionalEndPToken({
      open: toSToken(']]>'),
   });
}

function makeConditionalStart(): ConditionalStartPToken {
   return new ConditionalStartPToken({
      open: toSToken('<['),
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
      externalId: {},
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

function makeElementStartWithAttrValue(
   value: AttrValue,
   addedProps: Record<string, unknown> = {},
): ElementStartPToken {
   return new ElementStartPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      nameSpace: undefined,
      attributes: [
         {
            name: toSToken('att1'),
            value,
            ...addedProps,
         },
      ],
   });
}

function makeElementEmptyWithAttrValue(
   value: AttrValue,
   addedProps: Record<string, unknown> = {},
): ElementEmptyPToken {
   return new ElementEmptyPToken({
      open: toSToken('<'),
      name: toSToken('elStart'),
      nameSpace: undefined,
      attributes: [
         {
            name: toSToken('att1'),
            value,
            ...addedProps,
         },
      ],
   });
}
function makeElementEmptyWithAttrValueFromString(
   value: string,
   origValue?: string,
   addedProps?: Record<string, unknown>,
): ElementEmptyPToken {
   return makeElementEmptyWithAttrValue(
      [new TextPToken({ text: new SToken(value, origValue || value, []) })],
      addedProps,
   );
}

function makeElementStartWithAttrValueFromString(
   value: string,
   origValue?: string,
   addedProps?: Record<string, unknown>,
): ElementStartPToken {
   return makeElementStartWithAttrValue(
      [new TextPToken({ text: new SToken(value, origValue || value, []) })],
      addedProps,
   );
}

function makeElementDeclaration(contentSpec?: string): ElementDeclarationPToken {
   return new ElementDeclarationPToken({
      open: toSToken('<!'),
      openSpace: undefined,
      declType: toSToken('ELEMENT'),
      declTypeSpace: toSToken(' '),
      name: toSToken('elementName'),
      nameSpace: toSToken(' '),
      contentSpec: toSToken(contentSpec ?? 'ANY'),
      contentSpecSpace: toSToken(' '),
      close: toSToken('>'),
   });
}

function makeElementDeclarationWithContentModel(): ElementDeclarationPToken {
   return new ElementDeclarationPToken({
      open: toSToken('<!'),
      openSpace: undefined,
      declType: toSToken('ELEMENT'),
      declTypeSpace: toSToken(' '),
      name: toSToken('elementName'),
      nameSpace: toSToken(' '),
      contentSpec: undefined,
      contentModel: new ContentModelP({
         open: toSToken('('),
         delimitedParticles: [
            {
               particle: {
                  name: toSToken('aName'),
                  repeat: toSToken('+'),
               },
               delimiter: toSToken('|'),
            },
            {
               particle: {
                  open: toSToken('('),
                  delimitedParticles: [
                     {
                        particle: {
                           name: toSToken('first'),
                        },
                        delimiter: toSToken(','),
                     },
                     {
                        particle: {
                           name: toSToken('second'),
                           repeat: toSToken('?'),
                        },
                     },
                  ],
                  close: toSToken(')'),
                  repeat: toSToken('*'),
               },
            },
         ],
         close: toSToken(')'),
         repeat: toSToken('*'),
      }),
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
      value: [
         {
            type: TEXT_PTOKEN,
            text: toSToken('blah'),
         },
      ],
      close: toSToken('>'),
   });
}

function makeGeneralEntityDeclarationWithExternalId(
   name = 'geDecl',
): GeneralEntityDeclarationPToken {
   return new GeneralEntityDeclarationPToken({
      open: toSToken('<!'),
      name: toSToken(name),
      externalId: {
         externalType: toSToken('PUBLIC'),
         public: {
            openQuote: toSToken('"'),
            value: [new TextPToken(toSToken('- foo -'))],
            closeQuote: toSToken('"'),
         },
         system: {
            openQuote: toSToken("'"),
            value: [new TextPToken(toSToken('http://foo.com'))],
            closeQuote: toSToken("'"),
         },
      },
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

function makeUnknownDeclaration(): DeclarationPToken {
   return new DeclarationPToken();
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

function makeXmlDecl10(): XmlDeclarationPToken {
   return new XmlDeclarationPToken({
      open: toSToken('<?'),
      target: toSToken('xml'),
      targetSpace: toSToken(' '),
      fields: [
         {
            name: toSToken('version'),
            equal: toSToken('='),
            value: toSToken('1.0'),
         },
      ],
      close: toSToken('?>'),
   });
}

const helper = {
   BLANK_ORIGIN,
   makeInsertedRange,
};

export default helper;
export {
   BLANK_ORIGIN,
   makeInsertedRange,
   makeAttListDeclaration,
   makeCharData,
   makeCdata,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalStart,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementDeclarationWithContentModel,
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
   makeGeneralEntityDeclarationWithExternalId,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
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
   makeUnknownDeclaration,
   makeXmlDecl,
   makeXmlDecl10,
};
