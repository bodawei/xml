/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../../basic/index';
import { SToken } from '../../sToken/index';

import ErrorCollector from '../ErrorCollector';
import WellFormedError from '../WellFormedError.js';

describe('ErrorCollector', () => {

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new ErrorCollector(SToken.fromString('foo'), WellFormedError);
         }).not.toThrow();
      });

   });

   describe('check', () => {
      let ec;

      it('calls report if condition is truthy', () => {
         ec = new ErrorCollector(SToken.fromString('foo'), WellFormedError);
         spyOn(ec, 'report');

         ec.check(true, 'foo', [], SToken.fromString('x'));

         expect(ec.report).toHaveBeenCalledWith('foo', [], SToken.fromString('x'));
      });

      it('does not call report if condition is falsy', () => {
         ec = new ErrorCollector(SToken.fromString('foo'), WellFormedError);
         spyOn(ec, 'report');

         ec.check(false, 'foo', [], SToken.fromString('x'));

         expect(ec.report).not.toHaveBeenCalled();
      });

   });

   describe('report', () => {
      let ec: ErrorCollector;
      let errorId: string;
      let loc: EntityLocation;
      let constructorSpy: jasmine.Spy;
      let contextStart: SToken;
      let errorStart: SToken;

      beforeEach(() => {
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         loc = new EntityLocation();
         constructorSpy = jasmine.createSpy('').and.returnValue({ error: true });
         contextStart = new SToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1));
         errorStart = new SToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6));
         ec = new ErrorCollector(contextStart, constructorSpy as any); // typeHack
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
      let ec: ErrorCollector;
      let loc: EntityLocation;
      let constructorSpy: jasmine.Spy;
      let contextStart: SToken;
      let errorStart: SToken;

      beforeEach(() => {
         loc = new EntityLocation();
         constructorSpy = jasmine.createSpy('').and.returnValue({ error: true });
         contextStart = new SToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1));
         errorStart = new SToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6));
         ec = new ErrorCollector(contextStart, constructorSpy as any); // typeHack
      });

      it('uses the specified constructor instead of the default', () => {
         const otherConstructorSpy = jasmine.createSpy('').and.returnValue({ otherError: true });
         ec.reportError('FOO', otherConstructorSpy as any, [ 'name' ], errorStart); // typeHack

         expect(ec.getErrors()).toEqual([ { otherError: true } ]);
      });

      it('passes the start position and the context to the error by default', () => {
         const otherConstructorSpy = jasmine.createSpy('').and.returnValue({ otherError: true });
         ec.reportError('FOO', otherConstructorSpy as any, [ 'name' ], errorStart); // typeHack

         expect(otherConstructorSpy).toHaveBeenCalledWith('FOO', [ 'name' ], new Offset(loc, 1, 0, 1), contextStart);
      });

      it('accepts an offset as the position', () => {
         const otherConstructorSpy = jasmine.createSpy('').and.returnValue({ otherError: true });
         ec.reportError('FOO', otherConstructorSpy as any, [ 'name' ], new Offset(loc, 5, 5, 5)); // typeHack

         expect(otherConstructorSpy).toHaveBeenCalledWith('FOO', [ 'name' ], new Offset(loc, 5, 5, 5), contextStart);
      });

   });

});
