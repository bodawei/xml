/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import {
   ExternalIdP,
   GeneralEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';

import {
   GeneralEntityDeclarationXToken,
   GENERAL_ENTITY_DECLARATION_XTOKEN,
} from '../GeneralEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from '../parameterEntityReferenceXToken';

import { CharRefPToken, ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

describe('GeneralEntityDeclarationXToken()', () => {
   let pToken: GeneralEntityDeclarationPToken;

   beforeEach(() => {
      const otherRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('Ref0'),
      });
      pToken = new GeneralEntityDeclarationPToken({
         open: toSToken('&'),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         externalIdSpace: toSToken(' '),
         value: [
            new TextPToken({ text: toSToken('value') }),
            new TextPToken({ text: toSToken('two') }),
            new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
            new ParameterEntityStartPToken(otherRef),
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref2') }),
            new TextPToken({ text: toSToken('three') }),
            new ParameterEntityEndPToken(otherRef),
         ],
         close: toSToken('>'),
      });
   });

   it('constructs an entity declaration token with the name and value found in the PToken', () => {
      expect(new GeneralEntityDeclarationXToken(pToken)).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
         name: 'entityName',
         externalId: undefined,
         value: [
            'valuetwoA',
            new ParameterEntityReferenceXToken(
               new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
            ),
            new ParameterEntityReferenceXToken(
               new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref2') }),
            ),
            'three',
         ],
         notationDataName: '',
         isParameter: false,
         pToken,
      });
   });

   it('constructs an entity declaration token with provided parameters', () => {
      expect(
         new GeneralEntityDeclarationXToken(
            'eName',
            [],
            { publicId: '', systemId: '' },
            'notation',
         ),
      ).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
         name: 'eName',
         externalId: { publicId: '', systemId: '' },
         value: [],
         notationDataName: 'notation',
         isParameter: false,
      });
   });

   it('constructs an entity declaration token with blank values when no value is provided', () => {
      expect(new GeneralEntityDeclarationXToken('eName')).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
         name: 'eName',
         externalId: undefined,
         value: [],
         notationDataName: '',
         isParameter: false,
      });
   });

   it('returns a entity declaration with blank values when none are provided in the pToken', () => {
      pToken = new GeneralEntityDeclarationPToken({
         open: toSToken('&'),
         name: undefined,
         nameSpace: undefined,
         externalIdSpace: undefined,
         nDataName: undefined,
         value: [],
         close: undefined,
      });

      expect(new GeneralEntityDeclarationXToken(pToken)).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
         name: '',
         externalId: undefined,
         value: [],
         notationDataName: '',
         isParameter: false,
         pToken,
      });
   });

   it('returns a entity declaration with an ExternalIdX', () => {
      pToken = new GeneralEntityDeclarationPToken({
         open: toSToken('&'),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         externalId: new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('foo') })],
               closeQuote: toSToken('"'),
            },
            publicSpace: toSToken(' '),
            system: {
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('bar') })],
               closeQuote: toSToken('"'),
            },
         }),
         externalIdSpace: toSToken(' '),
         value: [new TextPToken({ text: toSToken('value') })],
         close: toSToken('>'),
      });

      expect(new GeneralEntityDeclarationXToken(pToken).externalId).toEqual({
         publicId: 'foo',
         systemId: 'bar',
      });
   });
});
