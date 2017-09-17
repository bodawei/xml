/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../basic';
import { LToken } from '../lToken';

import ErrorCollector from './ErrorCollector.js';
import WellFormedError from './WellFormedError.js';

describe('ErrorCollector', () => {

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new ErrorCollector();
         }).not.toThrow();
      });

   });

   describe('check', () => {
      let ec;

      it('calls report if condition is truthy', () => {
         ec = new ErrorCollector({}, WellFormedError);
         spyOn(ec, 'report');

         ec.check(true, 1, 2, 3);

         expect(ec.report).toHaveBeenCalledWith(1, 2, 3);
      });

      it('does not call report if condition is falsy', () => {
         ec = new ErrorCollector({}, WellFormedError);
         spyOn(ec, 'report');

         ec.check(false, 1, 2, 3);

         expect(ec.report).not.toHaveBeenCalled();
      });

   });

   describe('report', () => {
      let ec;
      let errorId;
      let loc;
      let constructorSpy;
      let contextStart;
      let errorStart;

      beforeEach(() => {
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         loc = new EntityLocation();
         constructorSpy = jasmine.createSpy('').and.returnValue({ error: true });
         contextStart = new LToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1));
         errorStart = new LToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6));
         ec = new ErrorCollector(contextStart, constructorSpy);
      });

      it('adds an instance of the error to the set of errors', () => {
         ec.report(errorId, [ 'name' ], errorStart);

         expect(ec.getErrors()).toEqual([ { error: true } ]);
      });

      it('passes the start position and the context to the error by default', () => {
         ec.report(errorId, [ 'name' ], errorStart);

         expect(constructorSpy).toHaveBeenCalledWith(errorId, [ 'name' ], new Offset(loc, 1, 0, 1), contextStart);
      });

      it('uses the start position from the last setPos if no position passed', () => {
         ec.setPos(errorStart);
         ec.report(errorId, [ 'name' ]);

         expect(constructorSpy).toHaveBeenCalledWith(errorId, [ 'name' ], new Offset(loc, 1, 0, 1), contextStart);
      });

      it('uses the end position from setPos() if no position passed and setPos() was last called with nothing', () => {
         ec.setPos(errorStart);
         ec.setPos();
         ec.report(errorId, [ 'name' ]);

         expect(constructorSpy).toHaveBeenCalledWith(errorId, [ 'name' ], new Offset(loc, 6, 0, 6), contextStart);
      });

   });

   describe('reportError()', () => {
      let ec;
      let loc;
      let constructorSpy;
      let contextStart;
      let errorStart;

      beforeEach(() => {
         loc = new EntityLocation();
         constructorSpy = jasmine.createSpy('').and.returnValue({ error: true });
         contextStart = new LToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1));
         errorStart = new LToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6));
         ec = new ErrorCollector(contextStart, constructorSpy);
      });

      it('uses the specified constructor instead of the default', () => {
         const otherConstructorSpy = jasmine.createSpy('').and.returnValue({ otherError: true });
         ec.reportError('FOO', otherConstructorSpy, [ 'name' ], errorStart);

         expect(ec.getErrors()).toEqual([ { otherError: true } ]);
      });

      it('passes the start position and the context to the error by default', () => {
         const otherConstructorSpy = jasmine.createSpy('').and.returnValue({ otherError: true });
         ec.reportError('FOO', otherConstructorSpy, [ 'name' ], errorStart);

         expect(otherConstructorSpy).toHaveBeenCalledWith('FOO', [ 'name' ], new Offset(loc, 1, 0, 1), contextStart);
      });

      it('accepts an offset as the position', () => {
         const otherConstructorSpy = jasmine.createSpy('').and.returnValue({ otherError: true });
         ec.reportError('FOO', otherConstructorSpy, [ 'name' ], new Offset(loc, 5, 5, 5));

         expect(otherConstructorSpy).toHaveBeenCalledWith('FOO', [ 'name' ], new Offset(loc, 5, 5, 5), contextStart);
      });

   });

});
