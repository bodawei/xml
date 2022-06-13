/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { TextPToken } from 'pToken';
import { STokenSource, toSToken } from 'basic';

import { parseExternalId, ExternalIdP } from '../externalId';

describe('parseExternalId()', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource();
   });

   it('parses the public and system value (check literal.parse())', (done) => {
      source.addText('PUBLIC "pub.xml"\t"sys.xml">');

      parseExternalId(source, [], (result) => {
         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless({
            externalId: {
               externalType: toSToken('PUBLIC'),
               externalTypeSpace: toSToken(' '),
               public: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('pub.xml') })],
                  closeQuote: toSToken('"'),
               },
               publicSpace: toSToken('\t'),
               system: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('sys.xml') })],
                  closeQuote: toSToken('"'),
               },
            },
         });
         done?.();
      });
   });

   it('parses a PERef (check unsasigned calls)', (done) => {
      source.addText('PUBLIC "pub.xml"%foo;>');

      parseExternalId(source, [], (result) => {
         const externalId: ExternalIdP = {
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('pub.xml') })],
               closeQuote: toSToken('"'),
            },
            publicSpace: undefined,
            system: undefined,
         };

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless({
            externalId,
            nextPropName: 'system',
         });

         done?.();
      });
   });
});
