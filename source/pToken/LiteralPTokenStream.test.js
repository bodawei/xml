/* Copyright ® 2016 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import {
   entityReference,
   text,
} from '../xToken';

import LiteralPTokenStream from './LiteralPTokenStream.js';

describe('LiteralPTokenStream (unit)', () => {
   let lTokenStream;

   beforeEach(() => {
      lTokenStream = new LTokenSource(defaultExtractors, new EntityMetaData());
   });

   describe('read()', () => {

      it('reports the end of stream if no next character is found', () => {
         spyOn(lTokenStream, 'extract').and.callFake((_1, cb) => cb());
         const pTokenStream = new LiteralPTokenStream(lTokenStream);
         spyOn(pTokenStream, 'push');

         pTokenStream.read();

         expect(pTokenStream.push).toHaveBeenCalledWith(null);
      });

      it('calls entityReference.parse if it is to be looking for entity references and finds a %', () => {
         spyOn(lTokenStream, 'extract').and.callFake((_1, cb) => cb({ text: '%' }));
         const pTokenStream = new LiteralPTokenStream(lTokenStream, { peRef: true });
         spyOn(entityReference, 'paramParse');

         pTokenStream.read();

         expect(entityReference.paramParse.calls.argsFor(0)[0]).toEqual(lTokenStream);
         expect(entityReference.paramParse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
      });

      it('does not entityReference.parse if it is not to be looking for entity references and finds a %', () => {
         spyOn(lTokenStream, 'extract').and.callFake((_1, cb) => cb({ text: '%' }));
         const pTokenStream = new LiteralPTokenStream(lTokenStream);
         spyOn(entityReference, 'paramParse');
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(entityReference.paramParse).not.toHaveBeenCalled();
      });

      it('calls text.parse with no terminators if not looking for any types', () => {
         spyOn(lTokenStream, 'extract').and.callFake((_1, cb) => cb({ text: '%' }));
         const pTokenStream = new LiteralPTokenStream(lTokenStream);
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(text.parse.calls.argsFor(0)[0]).toEqual(lTokenStream);
         expect(text.parse.calls.argsFor(0)[1]).toEqual([]);
         expect(text.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('calls text.parse with a % terminator if looking for PE References', () => {
         spyOn(lTokenStream, 'extract').and.callFake((_1, cb) => cb({ text: 'x' }));
         const pTokenStream = new LiteralPTokenStream(lTokenStream, { peRef: true });
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(text.parse.calls.argsFor(0)[0]).toEqual(lTokenStream);
         expect(text.parse.calls.argsFor(0)[1]).toEqual([ '%' ]);
         expect(text.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

   });

});
