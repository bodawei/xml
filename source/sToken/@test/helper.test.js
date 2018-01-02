/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';
import SToken from '../SToken.js';

import { makeSToken, RangeMaker, makeSTokenMaker, MockSTokenSource } from './helper';

describe('SToken test utils', () => {

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

   describe('makeSToken()', () => {

      it('makes an SToken with a default range if no range maker provided', () => {
         const sToken = makeSToken('foo');
         expect(sToken).toEqual(
            new SToken('foo', 'foo', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('makeSTokenMaker()', () => {

      it('generates defaults when called with no arguments', () => {
         const maker = makeSTokenMaker();
         expect(maker('foo')).toEqual(
            new SToken('foo', 'foo', new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3)));
      });

      it('uses the arguments passed', () => {
         const maker = makeSTokenMaker(new EntityLocation('foo.xml', 'bar.xml'), 3, 3, 3);
         expect(maker('foo')).toEqual(
            new SToken('foo', 'foo', new Range(new EntityLocation('foo.xml', 'bar.xml'), 3, 3, 3, 6, 3, 6)));
      });

   });

   describe('MockSTokenSource()', () => {

      it('uses the following SToken to populate the value for a peek', () => {
         const mock = new MockSTokenSource([
            'ww',
            MockSTokenSource.PEEK('x'),
            'xyzzy',
         ]);

         expect(mock.expectedValues[1].token.ranges[0].startIndex).toEqual(2);
      });

      it('will adjust offsets using the parameters if provided', () => {
         const mock = new MockSTokenSource([
            'ww',

            MockSTokenSource.PEEK('x'),
            'xyzzy',
         ], 99, 100, 101);

         expect(mock.expectedValues[0].token.ranges[0])
            .toEqual(new Range(new EntityLocation(), 99, 100, 101, 101, 100, 103));
      });

      it('uses the previous SToken to populate the value for a peek if there is no following', () => {
         const mock = new MockSTokenSource([
            'www',
            MockSTokenSource.PEEK('x'),
         ]);

         expect(mock.expectedValues[1].token.ranges[0].startIndex).toEqual(3);
      });

      it('uses starting values if there is no previous or following SToken when a peek is done', () => {
         const mock = new MockSTokenSource([
            MockSTokenSource.PEEK('x'),
         ]);

         expect(mock.expectedValues[0].token.ranges[0].startIndex).toEqual(0);
      });

      it('uses starting values if there is no following SToken and current and previous are PEEKs', () => {
         const mock = new MockSTokenSource([
            MockSTokenSource.PEEK('x'),
            MockSTokenSource.PEEK('x'),
         ]);

         expect(mock.expectedValues[1].token.ranges[0].startIndex).toEqual(0);
      });

      it('throws an error if there are insuficient values to satisfy an extract()', () => {
         const mock = new MockSTokenSource([ 'one' ]);
         mock.extract('foo', [], () => {});

         mock.extract('foo', [], () => {});  // one too many calls

         expect(() => {
            mock.respondInAsyncTime();
         }).toThrowError('NO value provided for extraction type "foo" in MockSTokenSource.');
      });

      it('throws an error if there are insuficient values to satisfy an extractToObject()', () => {
         const mock = new MockSTokenSource([ 'one' ]);
         mock.extract('foo', [], () => {});

         mock.extractToObject('bar', [], {}, 'name');  // one too many calls

         expect(() => {
            mock.respondInAsyncTime();
         }).toThrowError('NO value provided to "name" in MockSTokenSource.');
      });

      it('throws an error if the operation type does not match the expected', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'all' ],
         ]);

         expect(() => {
            mock.extract('word', [], () => {});
            mock.respondInAsyncTime();
         }).toThrowError('Type of call did not match expectation. Expected "all" but got "word".');
      });

      it('throws an error if the operation param do not match', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'word', '<' ],
         ]);

         expect(() => {
            mock.extract('word', [], () => {});
            mock.respondInAsyncTime();
         }).toThrowError('Parameters passed to STokenSource did not match expectation. Expected "<" but got "".');
      });

      it('throws an error if the operation param is an array and does not match', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'word', [ '<', '!' ] ],
         ]);

         expect(() => {
            mock.extract('word', [ '<' ], () => {});
            mock.respondInAsyncTime();
         }).toThrowError('Parameters passed to STokenSource did not match expectation. ' +
            'Expected "!" but got "undefined".');
      });

      it('extractToObject() extracts the next value to the specified object', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'all' ],
         ]);
         const obj = {};

         mock.extractToObject('all', [], obj, 'propName');
         mock.respondInAsyncTime();

         expect(obj.propName).toEqual(new SToken('one', 'one', [ new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3) ]));
      });

      it('extractToObject() allows the parameters to be omitted', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'all' ],
         ]);
         const obj = {};

         mock.extractToObject('all', obj, 'propName');
         mock.respondInAsyncTime();

         expect(obj.propName).toEqual(new SToken('one', 'one', [ new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3) ]));
      });

      it('extract() extracts the next value to the specified object', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'all' ],
         ]);
         let actual;

         mock.extract('all', [], (result) => {
            actual = result;
         });
         mock.respondInAsyncTime();

         expect(actual).toEqual(new SToken('one', 'one', [ new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3) ]));
      });

      it('extract() allows the parameters to be omitted', () => {
         const mock = new MockSTokenSource([
            [ 'one', 'all' ],
         ]);
         let actual;

         mock.extract('all', (result) => {
            actual = result;
         });
         mock.respondInAsyncTime();

         expect(actual).toEqual(new SToken('one', 'one', [ new Range(new EntityLocation(), 0, 0, 0, 3, 0, 3) ]));
      });

      it('allows undefined to be a returned value', () => {
         const mock = new MockSTokenSource([
            [ undefined, 'all' ],
         ]);
         let actual;

         mock.extract('all', (result) => {
            actual = result;
         });
         mock.respondInAsyncTime();

         expect(actual).toEqual(undefined);
      });

      it('throws no error if the parameters do match', () => {
         const mock = new MockSTokenSource([
            [ undefined, 'all', 'f' ],
         ]);
         let actual;

         mock.extract('all', 'f', (result) => {
            actual = result;
         });
         mock.respondInAsyncTime();

         expect(actual).toEqual(undefined);
      });

   });

});
