/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource } from '../../sToken/test';

import entityReference from '../entityReference.js';

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

         expectDelivery(deliverySpy, [ {
            type: 'space',
            item: makeSToken('   '),
         } ]);
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
            container.pToken.isLiteral = true;
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
            item: {
               isLiteral: true,
            },
         } ]);
      });

      it('returns a literal if a single quote is entcountered', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
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
            item: {
               isLiteral: true,
            },
         } ]);
      });

      it('returns a parameter entity reference PToken if a "%" is found', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ isPeref: true });
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'peref',
            item: {
               isPeref: true,
            },
         } ]);
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

         expectDelivery(deliverySpy, [ {
            type: 'word',
            item: makeSToken('xyzzy'),
         } ]);
      });

      it('returns multiple values when presented with all', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ peRef: true });
         });
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
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

         expectDelivery(deliverySpy, [ {
            type: 'word',
            item: makeSToken('testWord'),
         }, {
            type: 'peref',
            item: { peRef: true },
         }, {
            type: 'space',
            item: makeSToken(' '),
         }, {
            type: 'literal',
            item: {
               isLiteral: true,
            },
         } ]);
      });
   });

});
