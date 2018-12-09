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

   function expectInputToProduceTypes(input: string | void, options: Object, types: Array<string>, done: () => void) {
      const results: TokenArray = [];
      const sTokenStream = new STokenSource(defaultExtractors, new EntityMetaData());
      const pTokenStream = new PTokenFromLiteralStream(sTokenStream, options);

      pTokenStream.on('data', (data: Token) => results.push(data));
      pTokenStream.on('end', () => {
         const resultTypes = results.map((result) => result.type);

         expect(resultTypes).toEqual(types);
         done();
      });

      if (input) {
         sTokenStream.addText(input);
         sTokenStream.endText();
      }
   }

   it('produces a single text token if not told to look for perefs', (done) => {
      expectInputToProduceTypes('one %two; three <four>', {}, [ xToken.text.PTYPE ], done);
   });

   it('produces a mixture of text and charRefs if asked to', (done) => {
      expectInputToProduceTypes('one %two; &three &#x40; <four>', {}, [
         xToken.text.PTYPE,
         xToken.text.PTYPE,
         xToken.text.PTYPE,
         xToken.charRef.PTYPE,
         xToken.text.PTYPE,
      ], done);
   });

   it('produces a mixture of text, charrefs and parameter entity references if asked to', (done) => {
      expectInputToProduceTypes('one %two; three &#65; <four>', { peRef: true }, [
         xToken.text.PTYPE,
         PARAMETER_ENTITY_REFERENCE_PTOKEN,
         xToken.text.PTYPE,
         xToken.charRef.PTYPE,
         xToken.text.PTYPE,
      ], done);
   });

});
