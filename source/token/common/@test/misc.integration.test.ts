/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { makeSToken } from 'sToken-test';
import { SToken } from 'sToken';

import misc from '../misc';

describe('misc', () => {

   describe('checkName', () => {
      let ec: ErrorCollector;
      let errorId: string;
      let confVerV1R5: ConformanceVersion;
      let confVerV1R4: ConformanceVersion;
      let confVerV11R2: ConformanceVersion;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         confVerV1R4 = new ConformanceVersion(1.0, 4);
         confVerV1R5 = new ConformanceVersion(1.0, 5);
         confVerV11R2 = new ConformanceVersion(1.1, 2);
         spyOn(ec, 'report');
      });

      it('accepts a name that  is just plain letters', () => {
         const name = 'good';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has a hyphen, period or digit', () => {
         const name = 'on.-8';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has the allowable chars above ascii in it', () => {
         const name = 'o\u00B7\u0310\u2040e';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that starts with an astral character (e.g. an emoji)', () => {
         const name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has a uFDF1 in it', () => {
         const name = 'o\uFDF1e';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects a name with a $ in it', () => {
         const name = 'o$e';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that starts with a digit', () => {
         const name = '1ne';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that starts with a hyphen', () => {
         const name = '-ne';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that starts with a period', () => {
         const name = '.ne';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that starts with a u00B7', () => {
         const name = '\u00B7ne';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that starts with a u0320', () => {
         const name = '\u0320ne';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that starts with a u2040', () => {
         const name = '\u2040';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('rejects a name that has u03F4 in version 1.0/4', () => {
         const name = '\u03F4';

         misc.checkName(makeSToken(name), ec, confVerV1R4, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('accepts a name that has u03F4 in version 1.0/5', () => {
         const name = '\u03F4';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that has u03F4 in version 1.1', () => {
         const name = '\u03F4';

         misc.checkName(makeSToken(name), ec, confVerV11R2, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects a name that contains with some bad 1.0 characters in version 1.0/4', () => {
         const name = 'f\u0eceb';

         misc.checkName(makeSToken(name), ec, confVerV1R4, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('accepts a name that contains with some bad 1.0 characters in version 1.0/5', () => {
         const name = 'f\u0eceb';

         misc.checkName(makeSToken(name), ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts a name that contains with some bad 1.0 characters in version 1.1', () => {
         const name = 'f\u0eceb';

         misc.checkName(makeSToken(name), ec, confVerV11R2, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

   });

});
