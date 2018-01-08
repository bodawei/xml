/* Copyright ® 2016 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import {
   entityReference,
   text,
} from '../../token';

import PTokenFromLiteralStream from '../PTokenFromLiteralStream.js';

describe('PTokenFromLiteralStream (unit)', () => {
   let sTokenSource;

   beforeEach(() => {
      sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
   });

   describe('read()', () => {

      it('reports the end of stream if no next character is found', () => {
         spyOn(sTokenSource, 'extract').and.callFake((_1, cb) => cb());
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource);
         spyOn(pTokenStream, 'push');

         pTokenStream.read();

         expect(pTokenStream.push).toHaveBeenCalledWith(null);
      });

      it('calls entityReference.parse if it is to be looking for entity references and finds a %', () => {
         spyOn(sTokenSource, 'extract').and.callFake((_1, cb) => cb({ str: '%' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
         spyOn(entityReference, 'paramParse');

         pTokenStream.read();

         expect(entityReference.paramParse.calls.argsFor(0)[0]).toEqual(sTokenSource);
         expect(entityReference.paramParse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
      });

      it('does not entityReference.parse if it is not to be looking for entity references and finds a %', () => {
         spyOn(sTokenSource, 'extract').and.callFake((_1, cb) => cb({ str: '%' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource);
         spyOn(entityReference, 'paramParse');
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(entityReference.paramParse).not.toHaveBeenCalled();
      });

      it('calls text.parse with no terminators if not looking for any types', () => {
         spyOn(sTokenSource, 'extract').and.callFake((_1, cb) => cb({ str: '%' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource);
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(text.parse.calls.argsFor(0)[0]).toEqual(sTokenSource);
         expect(text.parse.calls.argsFor(0)[1]).toEqual([]);
         expect(text.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('calls text.parse with a % terminator if looking for PE References', () => {
         spyOn(sTokenSource, 'extract').and.callFake((_1, cb) => cb({ str: 'x' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(text.parse.calls.argsFor(0)[0]).toEqual(sTokenSource);
         expect(text.parse.calls.argsFor(0)[1]).toEqual([ '%' ]);
         expect(text.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

   });

});
