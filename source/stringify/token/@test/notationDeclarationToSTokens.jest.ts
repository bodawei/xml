/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { NotationDeclarationPToken, TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { notationDeclarationToSTokens } from '../notationDeclarationToSTokens';

describe('notationDeclarationToSTokens() (unit)', () => {
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
         toSToken('- // public'),
         toSToken('system.xml'),
         toSToken(' '),
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
         toSToken('pubLic'),
         toSToken('- // public'),
         toSToken('system.xml'),
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
         toSToken('pubLic'),
         toSToken('- // public'),
         toSToken('system.xml'),
         toSToken(' '),
         toSToken('>'),
      ]);
   });
});
