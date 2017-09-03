/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityMetaData, EntityLocation } from '../basic';
import { LToken } from '../lToken';
import lTokenUtil from '../lToken/test';
import { WellFormedError } from '../error';

import ErrorCollector from './ErrorCollector.js';

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

   describe('checkName', () => {
      let ec;
      let errorId;
      let emdV1R5;
      let emdV1R4;
      let emdV11R2;

      beforeEach(() => {
         ec = new ErrorCollector({}, WellFormedError);
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         emdV1R4 = new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 4);
         emdV1R5 = new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 5);
         emdV11R2 = new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.1, 2);

         spyOn(ec, 'report');
      });

      it('accepts a name that  is just plain letters', () => {
         const name = 'good';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has a hyphen, period or digit', () => {
         const name = 'on.-8';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has the allowable chars above ascii in it', () => {
         const name = 'o\u00B7\u0310\u2040e';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that starts with an astral character (e.g. an emoji)', () => {
         const name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has a uFDF1 in it', () => {
         const name = 'o\uFDF1e';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects a name with a $ in it', () => {
         const name = 'o$e';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that starts with a digit', () => {
         const name = '1ne';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that starts with a hyphen', () => {
         const name = '-ne';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that starts with a period', () => {
         const name = '.ne';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that starts with a u00B7', () => {
         const name = '\u00B7ne';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that starts with a u0320', () => {
         const name = '\u0320ne';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that starts with a u2040', () => {
         const name = '\u2040';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('rejects a name that has u03F4 in version 1.0/4', () => {
         const name = '\u03F4';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R4);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('accepts a name that has u03F4 in version 1.0/5', () => {
         const name = '\u03F4';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has u03F4 in version 1.1', () => {
         const name = '\u03F4';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV11R2);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects a name that contains with some bad 1.0 characters in version 1.0/4', () => {
         const name = 'f\u0eceb';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R4);

         expect(ec.report).toHaveBeenCalledWith(WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ]);
      });

      it('accepts a name that contains with some bad 1.0 characters in version 1.0/5', () => {
         const name = 'f\u0eceb';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV1R5);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that contains with some bad 1.0 characters in version 1.1', () => {
         const name = 'f\u0eceb';

         ec.checkName(lTokenUtil.makeLToken(name), errorId, emdV11R2);

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

});
