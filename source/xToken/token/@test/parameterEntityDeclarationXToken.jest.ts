/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import {
   CharRefPToken,
   ExternalIdP,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { ParameterEntityEndXToken } from '../../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../../marker/parameterEntityStartXToken';
import { CharRefXToken } from '../charRefXToken';
import {
   PARAMETER_ENTITY_DECLARATION_XTOKEN,
   ParameterEntityDeclarationXToken,
} from '../parameterEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from '../parameterEntityReferenceXToken';
import { TextXToken } from '../textXToken';

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
      const result = new ParameterEntityDeclarationXToken(pToken);
      const modifiedResult = {
         ...result,
         value: result.value.map((x) => {
            delete x.pToken;

            return x;
         }),
      };

      expect(modifiedResult).toEqual({
         type: PARAMETER_ENTITY_DECLARATION_XTOKEN,
         name: 'entityName',
         externalId: undefined,
         value: [
            new TextXToken('value'),
            new TextXToken('two'),
            new CharRefXToken('A'),
            new ParameterEntityStartXToken('Ref0'),
            new ParameterEntityReferenceXToken('Ref1'),
            new ParameterEntityReferenceXToken('Ref2'),
            new TextXToken('three'),
            new ParameterEntityEndXToken('Ref0'),
         ],
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
      });
   });

   it('constructs an entity declaration token with blank values when no value is provided', () => {
      expect(new ParameterEntityDeclarationXToken('eName')).toEqual({
         type: PARAMETER_ENTITY_DECLARATION_XTOKEN,
         name: 'eName',
         externalId: undefined,
         value: [],
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
