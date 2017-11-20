/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource } from '../../sToken/test';

import * as entityReference from '../entityReference.js';

import * as literal from './literal.js';
import * as usp from './usp.js';

describe('usp (unit)', () => {

   function expectDelivery(spy, value) {
      expect(spy.calls.allArgs()).toEqual([ [ value ] ]);
   }

   describe('parse()', () => {
      let mockSource;
      let deliverySpy;
      let makeSToken;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         spyOn(literal, 'parse');
         spyOn(entityReference, 'paramParse');

         makeSToken = makeSTokenMaker();
      });

      it('returns an empty array if the input is empty', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, []);
      });

      it('returns a space SToken if that is found first', () => {
         mockSource = new MockSTokenSource([
            [ '   ', 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ makeSToken('   ') ]);
      });

      it('returns nothing if a ">" is found', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('>'), 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, []);
      });

      it('returns a literal if a double quote is entcountered', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.found = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('"'), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'literal',
            found: true,
         } ]);
      });

      it('returns a literal if a single quote is entcountered', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.found = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('\''), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'literal',
            found: true,
         } ]);
      });

      it('returns a parameter entity reference PToken if a "%" is found', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ type: 'peref' });
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ { type: 'peref' } ]);
      });

      it('returns an SToken if some other character encoutnered', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('x'), 'peekChar' ],
            [ 'xyzzy', 'word', [ '>', '"', '\'', '%' ] ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ makeSToken('xyzzy') ]);
      });

      it('returns multiple values when presented with all', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ type: 'peref' });
         });
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.found = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('t'), 'peekChar' ],
            [ 'testWord', 'word' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
            [ ' ', 'space' ],
            [ MockSTokenSource.PEEK('\''), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [
            makeSToken('testWord'),
            { type: 'peref' },
            makeSToken(' '), {
               type: 'literal',
               found: true,
            } ]);
      });
   });

});
