/* Copyright ® 2016-2018 by David John Burrowes. All rights reserved. */
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
   let sTokenSource: STokenSource;

   beforeEach(() => {
      sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
   });

   describe('read()', () => {

      it('reports the end of stream if no next character is found', () => {
         spyOn(sTokenSource, 'extractNoParams').and.callFake((_1: any, cb: () => void) => cb());
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource);
         spyOn(pTokenStream, 'push');

         pTokenStream.read();

         expect(pTokenStream.push).toHaveBeenCalledWith(null);
      });

      it('calls entityReference.paramParse if it is to be looking for entity references and finds a %', () => {
         spyOn(sTokenSource, 'extractNoParams').and.callFake((_1: any, cb: (arg: any) => void) => cb({ str: '%' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
         const parseSpy = spyOn(entityReference, 'paramParse');

         pTokenStream.read();

         expect(parseSpy.calls.argsFor(0)[0]).toEqual(sTokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
      });

      it('does not entityReference.paramParse if it is not to be looking for entity references and finds a %', () => {
         spyOn(sTokenSource, 'extractNoParams').and.callFake((_1: any, cb: (arg: any) => void) => cb({ str: '%' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource);
         spyOn(entityReference, 'paramParse');
         spyOn(text, 'parse');

         pTokenStream.read();

         expect(entityReference.paramParse).not.toHaveBeenCalled();
      });

      it('calls text.parse with no terminators if not looking for any types', () => {
         spyOn(sTokenSource, 'extractNoParams').and.callFake((_1: any, cb: (arg: any) => void) => cb({ str: '%' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource);
         const parseSpy = spyOn(text, 'parse');

         pTokenStream.read();

         expect(parseSpy.calls.argsFor(0)[0]).toEqual(sTokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual([]);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('calls text.parse with a % terminator if looking for PE References', () => {
         spyOn(sTokenSource, 'extractNoParams').and.callFake((_1: any, cb: (arg: any) => void) => cb({ str: 'x' }));
         const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
         const parseSpy = spyOn(text, 'parse');

         pTokenStream.read();

         expect(parseSpy.calls.argsFor(0)[0]).toEqual(sTokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '%' ]);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

   });

});
