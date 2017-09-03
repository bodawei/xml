/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import LToken from './LToken';

import { RangeMaker, makeLTokenMaker } from './test';

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

});
