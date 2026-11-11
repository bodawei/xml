/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { EntityId } from 'basic';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalStart,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclarationWithContentModel,
   makeElementEmpty,
   makeElementEnd,
   makeElementStartWithAttrValueFromString,
   makeGeneralEntityDeclarationWithExternalId,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeProcessingInstruction,
   makeSpace,
   makeTextDecl,
   makeTextPToken,
   makeUnknownDeclaration,
   makeXmlDecl,
} from 'token-test';
import { describe, expect, it } from 'vitest';

import { convertPTokenToXToken } from '../convertPTokenToXToken';
import { GeneralEntityEndXToken } from '../marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from '../marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from '../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../marker/parameterEntityStartXToken';
import { AttListDeclarationXToken } from '../token/attListDeclarationXToken';
import { CdataXToken } from '../token/cdataXToken';
import { CharDataXToken } from '../token/charDataXToken';
import { CharRefXToken } from '../token/charRefXToken';
import { CommentXToken } from '../token/commentXToken';
import { ConditionalEndXToken } from '../token/conditionalEndXToken';
import { ConditionalStartXToken } from '../token/conditionalStartXToken';
import { DocTypeEndXToken } from '../token/docTypeEndXToken';
import { DocTypeStartXToken } from '../token/docTypeStartXToken';
import { ElementDeclarationXToken } from '../token/elementDeclarationXToken';
import { ElementEmptyXToken } from '../token/elementEmptyXToken';
import { ElementEndXToken } from '../token/elementEndXToken';
import { ElementStartXToken } from '../token/elementStartXToken';
import { GeneralEntityDeclarationXToken } from '../token/generalEntityDeclarationXToken';
import { GeneralEntityReferenceXToken } from '../token/generalEntityReferenceXToken';
import { NotationDeclarationXToken } from '../token/notationDeclarationXToken';
import { ParameterEntityDeclarationXToken } from '../token/parameterEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from '../token/parameterEntityReferenceXToken';
import { ProcessingInstructionXToken } from '../token/processingInstructionXToken';
import { SpaceXToken } from '../token/spaceXtoken';
import { TextDeclarationXToken } from '../token/textDeclarationXToken';
import { TextXToken } from '../token/textXToken';
import { UnknownDeclarationXToken } from '../token/unknownDeclarationXToken';
import { XmlDeclarationXToken } from '../token/xmlDeclarationXToken';

describe('convertPTokenToXToken() (integration)', () => {
   it('converts an ATTLIST Declaration', () => {
      const pToken = makeAttListDeclaration();

      const result = convertPTokenToXToken(pToken);

      delete (result as AttListDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         AttListDeclarationXToken {
           "attDefs": [
             {
               "defaultType": "REQUIRED",
               "enumeration": undefined,
               "name": "att1",
               "type": "CDATA",
               "value": [
                 TextXToken {
                   "pToken": TextPToken {
                     "text": SToken {
                       "originalStr": "x",
                       "ranges": [
                         Range {
                           "endColumn": 0,
                           "endIndex": 0,
                           "endRow": 0,
                           "entityId": EntityId {
                             "publicId": undefined,
                             "systemId": "",
                             "type": "ENTITY_ID",
                           },
                           "startColumn": 0,
                           "startIndex": 0,
                           "startRow": 0,
                         },
                       ],
                       "str": "x",
                     },
                     "type": "TEXT_PTOKEN",
                   },
                   "text": "x",
                   "type": "TEXT_XTOKEN",
                 },
               ],
             },
           ],
           "elementName": "elStart",
           "type": "ATTLIST_DECLARATION_XTOKEN",
         }
      `);
   });

   it('converts a CDATA Section', () => {
      const pToken = makeCdata();

      const result = convertPTokenToXToken(pToken);

      delete (result as CdataXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         CdataXToken {
           "text": "test text",
           "type": "CDATA_SECTION_XTOKEN",
         }
      `);
   });

   it('converts a CharData token', () => {
      const pToken = makeCharData();

      const result = convertPTokenToXToken(pToken);

      delete (result as CharDataXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         CharDataXToken {
           "text": "test text",
           "type": "CHARDATA_XTOKEN",
         }
      `);
   });

   it('converts a CharRef token', () => {
      const pToken = makeCharRef();

      const result = convertPTokenToXToken(pToken);

      delete (result as CharRefXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         CharRefXToken {
           "char": "D",
           "type": "CHARREF_XTOKEN",
         }
      `);
   });

   it('converts a comment token', () => {
      const pToken = makeComment();

      const result = convertPTokenToXToken(pToken);

      delete (result as CommentXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         CommentXToken {
           "text": "commentText",
           "type": "COMMENT_XTOKEN",
         }
      `);
   });

   it('converts a ConditionalClose token', () => {
      const pToken = makeConditionalClose();

      const result = convertPTokenToXToken(pToken);

      delete (result as ConditionalEndXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ConditionalEndXToken {
           "type": "CONDITIONAL_SECTION_END_XTOKEN",
         }
      `);
   });

   it('converts an ConditionalSection token', () => {
      const pToken = makeConditionalStart();

      const result = convertPTokenToXToken(pToken);

      delete (result as ConditionalStartXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ConditionalStartXToken {
           "type": "CONDITIONAL_SECTION_START_XTOKEN",
         }
      `);
   });

   it('converts an DocTypeEnd token', () => {
      const pToken = makeDocTypeEnd();

      const result = convertPTokenToXToken(pToken);

      delete (result as DocTypeEndXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         DocTypeEndXToken {
           "type": "DOCTYPE_END_XTOKEN",
         }
      `);
   });

   it('converts an DocTypeStart token', () => {
      const pToken = makeDocTypeStart();

      const result = convertPTokenToXToken(pToken);

      delete (result as DocTypeStartXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         DocTypeStartXToken {
           "externalId": undefined,
           "name": "root",
           "type": "DOCTYPE_START_XTOKEN",
         }
      `);
   });

   it('converts an ELEMENT Declaration', () => {
      const pToken = makeElementDeclarationWithContentModel();

      const result = convertPTokenToXToken(pToken);

      delete (result as ElementDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ElementDeclarationXToken {
           "contentModel": ContentModelX {
             "listType": "CHOICE",
             "particles": [
               {
                 "name": "aName",
                 "repeat": "ONEPLUS",
               },
               ContentModelX {
                 "listType": "SEQUENCE",
                 "particles": [
                   {
                     "name": "first",
                     "repeat": "ONE",
                   },
                   {
                     "name": "second",
                     "repeat": "ZEROONE",
                   },
                 ],
                 "repeat": "ZEROPLUS",
               },
             ],
             "repeat": "ZEROPLUS",
           },
           "contentSpec": "ELEMENT",
           "name": "elementName",
           "type": "ELEMENT_DECLARATION_XTOKEN",
         }
      `);
   });

   it('converts an empty element', () => {
      const pToken = makeElementEmpty();

      const result = convertPTokenToXToken(pToken);

      delete (result as ElementEmptyXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ElementEmptyXToken {
           "attributes": [],
           "name": "elStart",
           "type": "ELEMENT_EMPTY_XTOKEN",
         }
      `);
   });

   it('converts an element end', () => {
      const pToken = makeElementEnd();

      const result = convertPTokenToXToken(pToken);

      delete (result as ElementEndXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ElementEndXToken {
           "name": "elStart",
           "type": "ELEMENT_END_XTOKEN",
         }
      `);
   });

   it('converts an element start', () => {
      const pToken = makeElementStartWithAttrValueFromString('attr');

      const result = convertPTokenToXToken(pToken);

      delete (result as ElementStartXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ElementStartXToken {
           "attributes": [
             AttributeX {
               "name": "att1",
               "value": [
                 TextXToken {
                   "pToken": TextPToken {
                     "text": SToken {
                       "originalStr": "attr",
                       "ranges": [],
                       "str": "attr",
                     },
                     "type": "TEXT_PTOKEN",
                   },
                   "text": "attr",
                   "type": "TEXT_XTOKEN",
                 },
               ],
             },
           ],
           "name": "elStart",
           "type": "ELEMENT_START_XTOKEN",
         }
      `);
   });

   it('converts an general entity declaration token', () => {
      const pToken = makeGeneralEntityDeclarationWithExternalId();

      const result = convertPTokenToXToken(pToken);

      delete (result as GeneralEntityDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         GeneralEntityDeclarationXToken {
           "externalId": ExternalIdX {
             "publicId": "- foo -",
             "systemId": "http://foo.com",
           },
           "name": "geDecl",
           "notationDataName": undefined,
           "type": "GENERAL_ENTITY_DECLARATION_XTOKEN",
           "value": [],
         }
      `);
   });

   it('converts an GeneralEntityEnd token', () => {
      const pToken = makeGeneralEntityEnd();

      const result = convertPTokenToXToken(pToken);

      delete (result as GeneralEntityEndXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         GeneralEntityEndXToken {
           "name": "testRef",
           "type": "GENERAL_ENTITY_END_XTOKEN",
         }
      `);
   });

   it('converts an GeneralEntityStart token', () => {
      const pToken = makeGeneralEntityStart();

      const result = convertPTokenToXToken(pToken);

      delete (result as GeneralEntityStartXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         GeneralEntityStartXToken {
           "name": "testRef",
           "type": "GENERAL_ENTITY_START_XTOKEN",
         }
      `);
   });

   it('converts an ParameterEntityEnd token', () => {
      const pToken = makeParameterEntityEnd();

      const result = convertPTokenToXToken(pToken);

      delete (result as ParameterEntityEndXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ParameterEntityEndXToken {
           "name": "entityName",
           "type": "PARAMETER_ENTITY_END_XTOKEN",
         }
      `);
   });

   it('converts an ParameterEntityStart token', () => {
      const pToken = makeParameterEntityStart();

      const result = convertPTokenToXToken(pToken);

      delete (result as ParameterEntityStartXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ParameterEntityStartXToken {
           "name": "entityName",
           "type": "PARAMETER_ENTITY_START_XTOKEN",
         }
      `);
   });

   it('converts an General entity reference token', () => {
      const pToken = makeGeneralEntityReference();

      const result = convertPTokenToXToken(pToken);

      delete (result as GeneralEntityReferenceXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         GeneralEntityReferenceXToken {
           "name": "testRef",
           "type": "GENERAL_ENTITY_REFERENCE_XTOKEN",
         }
      `);
   });

   it('converts an NOTATION Declaration', () => {
      const pToken = makeNotationDeclaration();

      const result = convertPTokenToXToken(pToken);

      delete (result as NotationDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         NotationDeclarationXToken {
           "externalId": ExternalIdX {
             "publicId": undefined,
             "systemId": "",
           },
           "name": "notationName",
           "type": "NOTATION_DECLARATION_XTOKEN",
         }
      `);
   });

   it('converts an parameter entity declaration token', () => {
      const pToken = makeParameterEntityDeclaration();

      const result = convertPTokenToXToken(pToken);

      delete (result as ParameterEntityDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ParameterEntityDeclarationXToken {
           "externalId": undefined,
           "name": "entityName",
           "type": "PARAMETER_ENTITY_DECLARATION_XTOKEN",
           "value": [
             TextXToken {
               "pToken": TextPToken {
                 "text": SToken {
                   "originalStr": "value",
                   "ranges": [
                     Range {
                       "endColumn": 0,
                       "endIndex": 0,
                       "endRow": 0,
                       "entityId": EntityId {
                         "publicId": undefined,
                         "systemId": "",
                         "type": "ENTITY_ID",
                       },
                       "startColumn": 0,
                       "startIndex": 0,
                       "startRow": 0,
                     },
                   ],
                   "str": "value",
                 },
                 "type": "TEXT_PTOKEN",
               },
               "text": "value",
               "type": "TEXT_XTOKEN",
             },
           ],
         }
      `);
   });

   it('converts an parameter entity reference token', () => {
      const pToken = makeParameterEntityReference();

      const result = convertPTokenToXToken(pToken);

      delete (result as ParameterEntityReferenceXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ParameterEntityReferenceXToken {
           "name": "entityName",
           "type": "PARAMETER_ENTITY_REFERENCE_XTOKEN",
         }
      `);
   });

   it('converts an processing instruction token', () => {
      const pToken = makeProcessingInstruction();

      const result = convertPTokenToXToken(pToken);

      delete (result as ProcessingInstructionXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         ProcessingInstructionXToken {
           "instruction": "blah",
           "target": "foo",
           "type": "PROCESSING_INSTRUCTION_XTOKEN",
         }
      `);
   });

   it('converts a Text', () => {
      const pToken = makeSpace();

      const result = convertPTokenToXToken(pToken);

      delete (result as SpaceXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         SpaceXToken {
           "text": " ",
           "type": "SPACE_XTOKEN",
         }
      `);
   });

   it('converts a Text', () => {
      const pToken = makeTextPToken('foo');

      const result = convertPTokenToXToken(pToken);

      delete (result as TextXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         TextXToken {
           "text": "foo",
           "type": "TEXT_XTOKEN",
         }
      `);
   });

   it('converts a Text Declaration', () => {
      const pToken = makeTextDecl();

      const result = convertPTokenToXToken(pToken);

      delete (result as TextDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         TextDeclarationXToken {
           "encoding": "utf-8",
           "type": "TEXTDECL_XTOKEN",
           "version": 1.1,
         }
      `);
   });

   it('converts un UnknownDeclarat', () => {
      const pToken = makeUnknownDeclaration();

      const result = convertPTokenToXToken(pToken);

      delete (result as UnknownDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         UnknownDeclarationXToken {
           "type": "UNKNOWN_DECLARATION_XTOKEN",
         }
      `);
   });

   it('converts an XML Declaration', () => {
      const pToken = makeXmlDecl();

      const result = convertPTokenToXToken(pToken);

      delete (result as XmlDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         XmlDeclarationXToken {
           "encoding": "utf-8",
           "standalone": false,
           "type": "XMLDECL_XTOKEN",
           "version": 1.1,
         }
      `);
   });

   it('does not change other types', () => {
      const result = convertPTokenToXToken(new EntityId('foo'));

      expect(result).toEqual(new EntityId('foo'));
   });
});
