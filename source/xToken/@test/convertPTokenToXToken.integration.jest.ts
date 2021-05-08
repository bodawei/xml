/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { EntityId } from 'basic';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalSection,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeGeneralEntityDeclaration,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeProcessingInstruction,
   makeTextDecl,
   makeTextPToken,
   makeXmlDecl,
} from 'token-test';
import { TEXTDECL_XTOKEN, XMLDECL_XTOKEN } from 'xToken';

import { GeneralEntityEndXToken } from '../marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from '../marker/generalEntityStartXToken';
import { ParameterEntityStartXToken } from '../marker/parameterEntityStartXToken';
import { ParameterEntityEndXToken } from '../marker/parameterEntityEndXToken';

import { AttListDeclarationXToken } from '../token/attListDeclarationXToken';
import { CdataXToken } from '../token/cdataXToken';
import { CharDataXToken } from '../token/charDataXToken';
import { CharRefXToken } from '../token/charRefXToken';
import { CommentXToken } from '../token/commentXToken';
import { ConditionalEndXToken } from '../token/conditionalEndXToken';
import { ConditionalStartXToken } from '../token/conditionalStartXToken';
import { DocTypeEndXToken } from '../token/docTypeEndXToken';
import { DocTypeStartXToken } from '../token/docTypeStartXToken';
import { ELEMENT_DECLARATION_XTOKEN } from '../token/elementDeclarationXToken';
import { GENERAL_ENTITY_DECLARATION_XTOKEN } from '../token/generalEntityDeclarationXToken';
import { GENERAL_ENTITY_REFERENCE_XTOKEN } from '../token/generalEntityReferenceXToken';
import { NOTATION_DECLARATION_XTOKEN } from '../token/notationDeclarationXToken';
import { PARAMETER_ENTITY_DECLARATION_XTOKEN } from '../token/parameterEntityDeclarationXToken';
import { PARAMETER_ENTITY_REFERENCE_XTOKEN } from '../token/parameterEntityReferenceXToken';
import { PROCESSING_INSTRUCTION_XTOKEN } from '../token/processingInstructionXToken';
import { TEXT_XTOKEN } from '../token/textXToken';

import { convertPTokenToXToken } from '../convertPTokenToXToken';

describe('convertPTokenToXToken() (integration)', () => {
   it('converts an ATTLIST Declaration', () => {
      const pToken = makeAttListDeclaration();

      const result = convertPTokenToXToken(pToken);

      delete (result as AttListDeclarationXToken).pToken;
      expect(result).toMatchInlineSnapshot(`
         AttListDeclarationXToken {
           "attDefs": Array [
             Object {
               "defaultType": "REQUIRED",
               "enumeration": undefined,
               "name": "att1",
               "type": "CDATA",
               "value": Array [
                 TextXToken {
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
      const pToken = makeConditionalSection();

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

   it('converts an ELEMENT Declaration', () => {
      const pToken = makeElementDeclaration();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(ELEMENT_DECLARATION_XTOKEN);
   });

   it('converts an General entity reference token', () => {
      const pToken = makeGeneralEntityReference();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(GENERAL_ENTITY_REFERENCE_XTOKEN);
   });

   it('converts an NOTATION Declaration', () => {
      const pToken = makeNotationDeclaration();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(NOTATION_DECLARATION_XTOKEN);
   });

   it('converts an general entity declaration token', () => {
      const pToken = makeGeneralEntityDeclaration();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(GENERAL_ENTITY_DECLARATION_XTOKEN);
   });

   it('converts an parameter entity declaration token', () => {
      const pToken = makeParameterEntityDeclaration();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(PARAMETER_ENTITY_DECLARATION_XTOKEN);
   });

   it('converts an parameter entity reference token', () => {
      const pToken = makeParameterEntityReference();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(PARAMETER_ENTITY_REFERENCE_XTOKEN);
   });

   it('converts an processing instruction token', () => {
      const pToken = makeProcessingInstruction();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(PROCESSING_INSTRUCTION_XTOKEN);
   });

   it('converts a Text', () => {
      const pToken = makeTextPToken('foo');

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(TEXT_XTOKEN);
   });

   it('converts a Text Declaration', () => {
      const pToken = makeTextDecl();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(TEXTDECL_XTOKEN);
   });

   it('converts an XML Declaration', () => {
      const pToken = makeXmlDecl();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(XMLDECL_XTOKEN);
   });

   it('does not change other types', () => {
      const result = convertPTokenToXToken(new EntityId('foo'));

      expect(result).toEqual(new EntityId('foo'));
   });
});
