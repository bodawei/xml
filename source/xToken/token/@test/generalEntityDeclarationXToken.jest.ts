/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import {
   CharRefPToken,
   ExternalIdP,
   GeneralEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import { ParameterEntityEndXToken } from '../../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../../marker/parameterEntityStartXToken';
import { CharRefXToken } from '../charRefXToken';
import {
   GeneralEntityDeclarationXToken,
   GENERAL_ENTITY_DECLARATION_XTOKEN,
} from '../generalEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from '../parameterEntityReferenceXToken';
import { TextXToken } from '../textXToken';

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
      const result = new GeneralEntityDeclarationXToken(pToken);
      const modifiedResult = {
         ...result,
         value: result.value.map((x) => {
            delete x.pToken;

            return x;
         }),
      };

      expect(modifiedResult).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
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
         notationDataName: undefined,
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
      });
   });

   it('constructs an entity declaration token with blank values when no value is provided', () => {
      expect(new GeneralEntityDeclarationXToken('eName')).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
         name: 'eName',
         externalId: undefined,
         value: [],
         notationDataName: undefined,
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
         notationDataName: undefined,
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

   it('returns a entity declaration with a notation declaration', () => {
      pToken = new GeneralEntityDeclarationPToken({
         open: toSToken('&'),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         value: [new TextPToken({ text: toSToken('value') })],
         nDataName: toSToken('foo'),
         close: toSToken('>'),
      });

      expect(new GeneralEntityDeclarationXToken(pToken)).toEqual({
         type: GENERAL_ENTITY_DECLARATION_XTOKEN,
         name: 'entityName',
         externalId: undefined,
         value: [new TextXToken(new TextPToken({ text: toSToken('value') }))],
         notationDataName: 'foo',
         pToken,
      });
   });
});
