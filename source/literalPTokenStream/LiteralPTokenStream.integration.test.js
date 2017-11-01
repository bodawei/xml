/* Copyright ® 2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData} from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import * as xToken from '../xToken';

import LiteralPTokenStream from './LiteralPTokenStream.js';

describe('LiteralPTokenStream (integration)', () => {
   let lTokenStream;

   beforeEach(() => {
   });

   function expectInputToProduceTypes(input, options, types, done) {
      const results = [];
      const lTokenStream = new LTokenSource(defaultExtractors, new EntityMetaData());
      const pTokenStream = new LiteralPTokenStream(lTokenStream, options);

      pTokenStream.on('data', (data) => results.push(data));
      pTokenStream.on('end', () => {
         let expecteds = types;
         if (!Array.isArray(types)) {
            expecteds = [ types ];
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected);

            expect(actuals[0]).toContainParsedProps({
               type: expected,
            });
         });
         done();
      });

      if (input) {
         lTokenStream.addText(input);
         lTokenStream.endText();
      }
   }

   it('produces a single text token if given no types of references to look for', (done) => {
      expectInputToProduceTypes('one %two; three <four>', {}, xToken.text.TYPE, done);
   });

   it('produces a mixture of text and parameter entity references if asked to', (done) => {
      expectInputToProduceTypes('one %two; three <four>', { peRef: true }, [
         xToken.text.TYPE,
         xToken.entityReference.PARAM_TYPE,
      ], done);
   });

});
