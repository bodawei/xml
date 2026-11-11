/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ContentModelP } from 'pToken';

import { ElementDeclarationPToken } from '../../../pToken/token/elementDeclaration';
import { CpRepeat, CpType } from '../../common/contentModelX';
import {
   ELEMENT_DECLARATION_XTOKEN,
   ContentSpecType,
   ElementDeclarationXToken,
} from '../elementDeclarationXToken';

describe('ElementDeclarationXToken', () => {
   it('returns an element declaration token built from a PToken', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentSpec: toSToken('ANY'),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpec: 'ANY',
         contentModel: undefined,
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration token built from a PToken that is EMPTY', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentSpec: toSToken('EMPTY'),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpec: 'EMPTY',
         contentModel: undefined,
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration token with blank values if none in the PToken', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: '',
         contentSpec: 'ANY',
         contentModel: undefined,
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration token with contentModel if there is a namelist', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentModel: new ContentModelP({ open: toSToken('('), repeat: toSToken('+') }),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpec: 'ELEMENT',
         contentModel: {
            listType: CpType.CHOICE,
            particles: [],
            repeat: CpRepeat.ONEPLUS,
         },
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration token with mixed type with an adjusted #PCDATA entry', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentModel: new ContentModelP({
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: { name: toSToken('#pcdata') },
               },
               {
                  particle: { name: toSToken('foo') },
               },
            ],
            repeat: toSToken('+'),
         }),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpec: 'MIXED',
         contentModel: {
            listType: CpType.CHOICE,
            particles: [
               { name: '#PCDATA', repeat: 'ONE' },
               { name: 'foo', repeat: 'ONE' },
            ],
            repeat: CpRepeat.ONEPLUS,
         },
         pToken: elementDeclaration,
      });
   });

   it('returns an element declaration when provided with specific parameters', () => {
      const result = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
         listType: CpType.CHOICE,
         particles: [],
         repeat: CpRepeat.ZEROPLUS,
      });

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'one',
         contentSpec: 'ELEMENT',
         contentModel: {
            listType: CpType.CHOICE,
            particles: [],
            repeat: CpRepeat.ZEROPLUS,
         },
      });
   });

   it('returns a notation declaration when called with minimal parameters', () => {
      const result = new ElementDeclarationXToken('one');

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'one',
         contentSpec: 'ANY',
         contentModel: undefined,
      });
   });

   it('ignores the provided contentSpec type if there is a content model provided', () => {
      const result = new ElementDeclarationXToken('one', ContentSpecType.ANY, {
         listType: CpType.CHOICE,
         particles: [],
         repeat: CpRepeat.ZEROPLUS,
      });

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'one',
         contentSpec: ContentSpecType.ELEMENT,
         contentModel: {
            listType: CpType.CHOICE,
            particles: [],
            repeat: CpRepeat.ZEROPLUS,
         },
      });
   });

   it('ignores the provided contentSpec type if there is a content model for a mixed type is provided', () => {
      const result = new ElementDeclarationXToken('one', ContentSpecType.ANY, {
         listType: CpType.CHOICE,
         particles: [
            {
               name: '#PCDATA',
               repeat: CpRepeat.ZEROPLUS,
            },
         ],
         repeat: CpRepeat.ZEROPLUS,
      });

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'one',
         contentSpec: ContentSpecType.MIXED,
         contentModel: {
            listType: CpType.CHOICE,
            particles: [
               {
                  name: '#PCDATA',
                  repeat: CpRepeat.ZEROPLUS,
               },
            ],
            repeat: CpRepeat.ZEROPLUS,
         },
      });
   });

   it('returns an element declaration token with mixed type with duplicate #PCDATA entries removed', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         contentModel: new ContentModelP({
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: { name: toSToken('foo') },
               },
               {
                  particle: { name: toSToken('#pcdata') },
               },
               {
                  particle: { name: toSToken('#PCData') },
               },
            ],
            repeat: toSToken('+'),
         }),
         close: toSToken('>'),
      });
      const result = new ElementDeclarationXToken(elementDeclaration);

      expect(result).toEqual({
         type: ELEMENT_DECLARATION_XTOKEN,
         name: 'elementName',
         contentSpec: 'MIXED',
         contentModel: {
            listType: CpType.CHOICE,
            particles: [
               { name: '#PCDATA', repeat: 'ONE' },
               { name: 'foo', repeat: 'ONE' },
            ],
            repeat: CpRepeat.ONEPLUS,
         },
         pToken: elementDeclaration,
      });
   });
});
