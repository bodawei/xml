/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';
import { TextPToken } from 'token';

import { parseExternalId, ExternalId } from '../externalId';

describe('parseExternalId()', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource(defaultExtractors);
   });

   it('parses the public and system value (check literal.parse())', (done) => {
      source.addText('PUBLIC "pub.xml"\t"sys.xml">');

      parseExternalId(source, [], false, (result) => {
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
         done();
      });
   });

   it('parses a PERef (check unsasigned calls)', (done) => {
      source.addText('PUBLIC "pub.xml"%foo;>');

      parseExternalId(source, [], true, (result) => {
         const externalId: ExternalId = {
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

         expect(result).toEqualRangeless({
            externalId,
            nextPropName: 'system',
         });

         done();
      });
   });
});
