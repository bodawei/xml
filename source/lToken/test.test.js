/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import LToken from './LToken';

import { RangeMaker, makeLTokenMaker, MockLTokenSource } from './test';

describe('lToken test utils', () => {

   describe('RangeMaker', () => {

      it('generates defaults when called with no arguments', () => {
         const maker = new RangeMaker();
         expect(maker.makeRange('foo')).toEqual(new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3));
      });

      it('uses the arguments passed', () => {
         const maker = new RangeMaker(new EntityLocation('foo.xml', 'bar.xml'), 3, 3, 3);
         expect(maker.makeRange('foo')).toEqual(
            new Range(new EntityLocation('foo.xml', 'bar.xml'), 3, 3, 3, 6, 3, 6));
      });

   });

   describe('makeLTokenMaker()', () => {

      it('generates defaults when called with no arguments', () => {
         const maker = makeLTokenMaker();
         expect(maker('foo')).toEqual(
            new LToken('foo', 'foo', new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3)));
      });

      it('uses the arguments passed', () => {
         const maker = makeLTokenMaker(new EntityLocation('foo.xml', 'bar.xml'), 3, 3, 3);
         expect(maker('foo')).toEqual(
            new LToken('foo', 'foo', new Range(new EntityLocation('foo.xml', 'bar.xml'), 3, 3, 3, 6, 3, 6)));
      });

   });

   describe('MockLTokenSource()', () => {

      it('uses the following LToken to populate the value for a peek', () => {
         const mock = new MockLTokenSource([
            'ww',
            MockLTokenSource.PEEK('x'),
            'xyzzy',
         ]);

         expect(mock.expectedValues[1].token.range[0].startIndex).toEqual(2);
      });

      it('uses the previous LToken to populate the value for a peek if there is no following', () => {
         const mock = new MockLTokenSource([
            'www',
            MockLTokenSource.PEEK('x'),
         ]);

         expect(mock.expectedValues[1].token.range[0].startIndex).toEqual(3);
      });

      it('uses starting values if there is no previous or following ltoken when a peek is done', () => {
         const mock = new MockLTokenSource([
            MockLTokenSource.PEEK('x'),
         ]);

         expect(mock.expectedValues[0].token.range[0].startIndex).toEqual(0);
      });

      it('throws an error if there are insuficient values to satisfy an extract()', () => {
         const mock = new MockLTokenSource([ 'one' ]);
         mock.extract('foo', [], () => {});

         mock.extract('foo', [], () => {});  // one too many calls

         expect(() => {
            mock.respondInAsyncTime();
         }).toThrowError('NO value provided for extraction type "foo" in MockLTokenSource.');
      });

      it('throws an error if there are insuficient values to satisfy an extractToObject()', () => {
         const mock = new MockLTokenSource([ 'one' ]);
         mock.extract('foo', [], () => {});

         mock.extractToObject('bar', [], {}, 'name');  // one too many calls

         expect(() => {
            mock.respondInAsyncTime();
         }).toThrowError('NO value provided to "name" in MockLTokenSource.');
      });

      it('throws an error if the operation type does not match the expected', () => {
         const mock = new MockLTokenSource([
            [ 'one', 'all' ],
         ]);

         expect(() => {
            mock.extract('word', [], () => {});
            mock.respondInAsyncTime();
         }).toThrowError('Type of call did not match expectation. Expected "all" but got "word".');
      });

      it('throws an error if the operation param do not match', () => {
         const mock = new MockLTokenSource([
            [ 'one', 'word', '<' ],
         ]);

         expect(() => {
            mock.extract('word', [], () => {});
            mock.respondInAsyncTime();
         }).toThrowError('Parameters passed to LTokenSource did not match expectation. Expected "<" but got "".');
      });

      it('throws an error if the operation param is an array and does not match', () => {
         const mock = new MockLTokenSource([
            [ 'one', 'word', [ '<', '!' ] ],
         ]);

         expect(() => {
            mock.extract('word', [ '<' ], () => {});
            mock.respondInAsyncTime();
         }).toThrowError('Parameters passed to LTokenSource did not match expectation. ' +
            'Expected "!" but got "undefined".');
      });

   });

});
