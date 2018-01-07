/* Copyright ® 2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData} from '../../basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import * as xToken from '../../token';

import PTokenFromLiteralStream from '../PTokenFromLiteralStream.js';

describe('PTokenFromLiteralStream (integration)', () => {

   function expectInputToProduceTypes(input, options, types, done) {
      const results = [];
      const sTokenStream = new STokenSource(defaultExtractors, new EntityMetaData());
      const pTokenStream = new PTokenFromLiteralStream(sTokenStream, options);

      pTokenStream.on('data', (data) => results.push(data));
      pTokenStream.on('end', () => {
         let expecteds = types;
         if (!Array.isArray(types)) {
            expecteds = [ types ];
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
         xToken.entityReference.PARAM_PTYPE,
      ], done);
   });

});
