/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityId } from 'basic';
import { toSToken } from 'sToken';
import { ConditionalClosePToken, ConditionalPToken } from 'token';
import {
   makeAttListDeclaration,
   makeCharRef,
   makeGeneralEntityReference,
   makeNotationDeclaration,
   makeParameterEntityReference,
   makeProcessingInstruction,
   makeTextDecl,
   makeXmlDecl,
} from 'token-test';
import { ATTLIST_DECLARATION_XTOKEN, TEXTDECL_XTOKEN, XMLDECL_XTOKEN } from 'xToken';

import { convertPTokenToXToken } from '../convertPTokenToXToken';
import { CHARREF_XTOKEN } from '../token/charRefXToken';
import { CONDITIONAL_SECTION_END_XTOKEN } from '../token/conditionalSectionEndXToken';
import { CONDITIONAL_SECTION_START_XTOKEN } from '../token/conditionalSectionStartXToken';
import { GENERAL_ENTITY_REFERENCE_XTOKEN } from '../token/generalEntityReferenceXToken';
import { NOTATION_DECLARATION_XTOKEN } from '../token/notationDeclarationXToken';
import { PARAMETER_ENTITY_REFERENCE_XTOKEN } from '../token/parameterEntityReferenceXToken';
import { PROCESSING_INSTRUCTION_XTOKEN } from '../token/processingInstructionXToken';

describe('convertPTokenToXToken() (integration)', () => {
   it('converts an ATTLIST Declaration', () => {
      const pToken = makeAttListDeclaration();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(ATTLIST_DECLARATION_XTOKEN);
   });

   it('converts an CharRef token', () => {
      const pToken = makeCharRef();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(CHARREF_XTOKEN);
   });

   it('converts an ConditionalClose token', () => {
      const result = convertPTokenToXToken(new ConditionalClosePToken({ open: toSToken('<![') }));

      expect(result.type).toEqual(CONDITIONAL_SECTION_END_XTOKEN);
   });

   it('converts an ConditionalSection token', () => {
      const result = convertPTokenToXToken(new ConditionalPToken({ open: toSToken('<![') }));

      expect(result.type).toEqual(CONDITIONAL_SECTION_START_XTOKEN);
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

   it('converts an prameter entity reference token', () => {
      const pToken = makeParameterEntityReference();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(PARAMETER_ENTITY_REFERENCE_XTOKEN);
   });

   it('converts an processing instruction token', () => {
      const pToken = makeProcessingInstruction();

      const result = convertPTokenToXToken(pToken);

      expect(result.type).toEqual(PROCESSING_INSTRUCTION_XTOKEN);
   });

   it('converts an Text Declaration', () => {
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
