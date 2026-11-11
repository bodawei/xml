/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken, SToken } from 'basic';
import { ExternalIdP, TextPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { externalIdNormalize } from '../externalIdNormalize';

describe('externalIdNormalize', () => {
   beforeEach(() => {});

   it('does not change the value if there is no public value', () => {
      const result = externalIdNormalize(
         new ExternalIdP({
            externalType: toSToken('SYSTEM'),
            externalTypeSpace: toSToken(' '),
            system: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('wow'))],
               closeQuote: toSToken('"'),
            },
         }),
      );

      expect(result).toEqual(
         new ExternalIdP({
            externalType: toSToken('SYSTEM'),
            externalTypeSpace: toSToken(' '),
            system: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('wow'))],
               closeQuote: toSToken('"'),
            },
         }),
      );
   });

   it('does not change an external id with an empty public identifier', () => {
      const result = externalIdNormalize(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [],
               closeQuote: toSToken('"'),
            },
         }),
      );

      expect(result).toEqual(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [],
               closeQuote: toSToken('"'),
            },
         }),
      );
   });

   it('does not change tab characters', () => {
      const result = externalIdNormalize(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('one\tfour'))],
               closeQuote: toSToken('"'),
            },
         }),
      );

      expect(result).toEqual(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('one\tfour'))],
               closeQuote: toSToken('"'),
            },
         }),
      );
   });

   it('does not trim tab characters', () => {
      const result = externalIdNormalize(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('one\t'))],
               closeQuote: toSToken('"'),
            },
         }),
      );

      expect(result).toEqual(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('one\t'))],
               closeQuote: toSToken('"'),
            },
         }),
      );
   });

   it('does not change an external id with an public identifier that is already in normalized form', () => {
      const result = externalIdNormalize(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('one two thre four'))],
               closeQuote: toSToken('"'),
            },
         }),
      );

      expect(result).toEqual(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('one two thre four'))],
               closeQuote: toSToken('"'),
            },
         }),
      );
   });

   it('normalizes whitespace in a public identifier and trims', () => {
      const result = externalIdNormalize(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken(toSToken('    one   \n two \n  thre\n\n four    '))],
               closeQuote: toSToken('"'),
            },
         }),
      );

      expect(result).toEqual(
         new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [
                  new TextPToken(
                     new SToken(
                        'one two thre four',
                        '    one   \n two \n  thre\n\n four    ',
                        toSToken('junk').ranges,
                     ),
                  ),
               ],
               closeQuote: toSToken('"'),
            },
         }),
      );
   });
});
