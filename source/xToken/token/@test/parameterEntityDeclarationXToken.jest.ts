/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import {
   CharRefPToken,
   ExternalIdP,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';

import {
   ParameterEntityDeclarationXToken,
   PARAMETER_ENTITY_DECLARATION_XTOKEN,
} from '../parameterEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from '../parameterEntityReferenceXToken';

import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

describe('ParameterEntityDeclarationXToken()', () => {
   let pToken: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      const otherRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('Ref0'),
      });
      pToken = new ParameterEntityDeclarationPToken({
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
      expect(new ParameterEntityDeclarationXToken(pToken)).toEqual({
         type: PARAMETER_ENTITY_DECLARATION_XTOKEN,
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
         isParameter: true,
         pToken,
      });
   });

   it('constructs an entity declaration token with provided parameters', () => {
      expect(
         new ParameterEntityDeclarationXToken(
            'eName',
            [],
            { publicId: '', systemId: '' },
            'notation',
         ),
      ).toEqual({
         type: PARAMETER_ENTITY_DECLARATION_XTOKEN,
         name: 'eName',
         externalId: { publicId: '', systemId: '' },
         value: [],
         isParameter: true,
      });
   });

   it('constructs an entity declaration token with blank values when no value is provided', () => {
      expect(new ParameterEntityDeclarationXToken('eName')).toEqual({
         type: PARAMETER_ENTITY_DECLARATION_XTOKEN,
         name: 'eName',
         externalId: undefined,
         value: [],
         isParameter: true,
      });
   });

   it('returns a entity declaration with blank values when none are provided in the pToken', () => {
      pToken = new ParameterEntityDeclarationPToken({
         open: toSToken('&'),
         name: undefined,
         nameSpace: undefined,
         externalIdSpace: undefined,
         value: [],
         close: undefined,
      });

      expect(new ParameterEntityDeclarationXToken(pToken)).toEqual({
         type: PARAMETER_ENTITY_DECLARATION_XTOKEN,
         name: '',
         externalId: undefined,
         value: [],
         isParameter: true,
         pToken,
      });
   });

   it('returns a entity declaration with an ExternalIdX', () => {
      pToken = new ParameterEntityDeclarationPToken({
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

      expect(new ParameterEntityDeclarationXToken(pToken).externalId).toEqual({
         publicId: 'foo',
         systemId: 'bar',
      });
   });
});
