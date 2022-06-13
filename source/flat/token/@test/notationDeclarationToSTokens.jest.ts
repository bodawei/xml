/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { NotationDeclarationPToken, TextPToken } from 'pToken';
import { toSToken } from 'basic';

import { externalIdToSTokens } from '../../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../../common/unexpandedToSTokens';

import { notationDeclarationToSTokens } from '../notationDeclarationToSTokens';

jest.mock('../../common/externalIdToSTokens');
jest.mock('../../common/unexpandedToSTokens');

describe('notationDeclarationToSTokens() (unit)', () => {
   beforeEach(() => {
      (externalIdToSTokens as jest.Mock).mockReturnValue([toSToken('externalID')]);
      (unexpandedToSTokens as jest.Mock).mockReturnValue([toSToken('unexpanded')]);
   });

   it('returns all the STokens', () => {
      const notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken('\t'),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            system: {
               value: [new TextPToken({ text: toSToken('system.xml') })],
            },
            public: {
               value: [new TextPToken({ text: toSToken('- // public') })],
            },
         },
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      expect(notationDeclarationToSTokens(notationPToken)).toEqual([
         toSToken('<!'),
         toSToken('\t'),
         toSToken('NOTATION'),
         toSToken(' '),
         toSToken('notationName'),
         toSToken(' '),
         toSToken('externalID'),
         toSToken(' '),
         toSToken('unexpanded'),
         toSToken('>'),
      ]);
   });

   it('returns all the STokens, including extra if it is an SToken', () => {
      const notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken('\t'),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            externalType: toSToken('pubLic'),
            system: {
               value: [new TextPToken({ text: toSToken('system.xml') })],
            },
            public: {
               value: [new TextPToken({ text: toSToken('- // public') })],
            },
         },
         extra: toSToken('zoiks'),
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      expect(notationDeclarationToSTokens(notationPToken)).toEqual([
         toSToken('<!'),
         toSToken('\t'),
         toSToken('NOTATION'),
         toSToken(' '),
         toSToken('notationName'),
         toSToken(' '),
         toSToken('externalID'),
         toSToken(' '),
         toSToken('zoiks'),
         toSToken('>'),
      ]);
   });

   it('returns all the STokens, excluding extra if it false', () => {
      const notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken('\t'),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            externalType: toSToken('pubLic'),
            system: {
               value: [new TextPToken({ text: toSToken('system.xml') })],
            },
            public: {
               value: [new TextPToken({ text: toSToken('- // public') })],
            },
         },
         extra: false,
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      expect(notationDeclarationToSTokens(notationPToken)).toEqual([
         toSToken('<!'),
         toSToken('\t'),
         toSToken('NOTATION'),
         toSToken(' '),
         toSToken('notationName'),
         toSToken(' '),
         toSToken('externalID'),
         toSToken(' '),
         toSToken('>'),
      ]);
   });
});
