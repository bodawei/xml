/* Copyright ® 2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData} from 'basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import * as xToken from '../../token';

import PTokenFromLiteralStream from '../PTokenFromLiteralStream';
import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../../token';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('PTokenFromLiteralStream (integration)', () => {

   function expectInputToProduceTypes(input: string | void, options: Object, types: Array<string> | string, done: () => void) {
      const results: TokenArray = [];
      const sTokenStream = new STokenSource(defaultExtractors, new EntityMetaData());
      const pTokenStream = new PTokenFromLiteralStream(sTokenStream, options);

      pTokenStream.on('data', (data: Token) => results.push(data));
      pTokenStream.on('end', () => {
         let expecteds: Array<string>;
         if (!Array.isArray(types)) {
            expecteds = [ types ];
         } else {
            expecteds = types;
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected);

            expect(actuals[0]).toContainPTokenProps({
               type: expected,
            });
         });
         done();
      });

      if (input) {
         sTokenStream.addText(input);
         sTokenStream.endText();
      }
   }

   it('produces a single text token if given no types of references to look for', (done) => {
      expectInputToProduceTypes('one %two; three <four>', {}, xToken.text.PTYPE, done);
   });

   it('produces a mixture of text and parameter entity references if asked to', (done) => {
      expectInputToProduceTypes('one %two; three <four>', { peRef: true }, [
         xToken.text.PTYPE,
         PARAMETER_ENTITY_REFERENCE_PTOKEN,
      ], done);
   });

});
