/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { CharRefPToken, ExternalIdP, TextPToken } from 'pToken';
import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import { errorCodes } from '../../error/errorCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { externalIdCheck } from '../externalIdCheck';
import { literalCheck } from '../literalCheck';

vi.mock('../literalCheck');

const EID = errorCodes.id;
const WFEID = wellFormedErrorCodes.id;

describe('externalIdCheck()', () => {
   let collector: ParamCollector;
   let externalId: ExternalIdP;
   let mockLiteralCheck: MockedFunction<typeof literalCheck>;

   beforeEach(() => {
      collector = new ParamCollector();

      externalId = {
         externalType: toSToken('PUBLIC'),
         externalTypeSpace: toSToken(' '),
         public: {
            closeQuote: toSToken('"'),
            openQuote: toSToken('"'),
            value: [new TextPToken({ text: toSToken('pub.xml') })],
         },
         publicSpace: toSToken(' '),
         system: {
            closeQuote: toSToken('"'),
            openQuote: toSToken('"'),
            value: [new TextPToken({ text: toSToken('sys.xml') })],
         },
      };
      mockLiteralCheck = literalCheck as MockedFunction<typeof literalCheck>;
   });

   it('calls literalCheck() to check the PUBLIC value', () => {
      const confVer = new ConformanceVersion();
      externalIdCheck(externalId, false, collector, confVer);

      expect(literalCheck).toHaveBeenCalledWith(
         externalId.public,
         collector,
         confVer,
         WFEID.NOUN_EXTERNALID_PUBLIC,
         (expect as any).any(Function), // eslint-disable-line
      );
   });

   it('calls literalCheck() to check the SYSTEM value', () => {
      const confVer = new ConformanceVersion();
      externalIdCheck(externalId, false, collector, confVer);

      expect(literalCheck).toHaveBeenCalledWith(
         externalId.system,
         collector,
         confVer,
         WFEID.NOUN_EXTERNALID_SYSTEM,
         expect.any(Function),
      );
   });

   it('reports an error if there is a fragment identifier (#) in the system literal', () => {
      externalId = new ExternalIdP(externalId, {
         system: {
            value: [
               new TextPToken({ text: toSToken('stuff') }),
               new CharRefPToken({
                  digits: toSToken('35'),
                  open: toSToken('&'),
               }),
            ],
         },
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // invoke the callback function
      const mockLiteralCheck = literalCheck as MockedFunction<typeof literalCheck>;
      const cb = mockLiteralCheck.mock.calls[1][4]; // eslint-disable-line
      cb?.();

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.SYSTEMLITERAL_NO_FRAGMENT,
         params: ['stuff#'],
         position: externalId.publicSpace, // This is only because we call the callback after
      });
   });

   it('reports an error if the PUBLIC value has illegal characters', () => {
      externalId = new ExternalIdP(externalId, {
         public: {
            value: [new TextPToken({ text: toSToken('bad&chars') })],
         },
      });
      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // invoke the callback function
      const mockLiteralCheck = literalCheck as MockedFunction<typeof literalCheck>;
      const cb = mockLiteralCheck.mock.calls[0][4]; // eslint-disable-line
      cb?.();

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
         params: ['&'],
         position: externalId.publicSpace, // This is only because we call the callback after
      });
   });

   it('reports no errors when no PToken part is passed in', () => {
      externalIdCheck(undefined, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if the public value contains invalid characters', () => {
      mockLiteralCheck.mockImplementation((_1, _2, _3, _4, callback) => {
         if (callback) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         public: {
            value: [new TextPToken({ text: toSToken('{}{}{}{}') })],
         },
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
         params: ['{'],
         position: externalId.externalTypeSpace, // wrong due to mocking
      });
   });

   it('does not blow up if the public value has no text when we are checking for invalid characters', () => {
      mockLiteralCheck.mockImplementation((_1, _2, _3, _4, callback) => {
         if (callback) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         public: {
            value: [],
         },
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveWellFormedError({
         id: WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
         params: ['{'],
         position: externalId.externalTypeSpace, // wrong due to mocking
      });
   });

   it('reports an error if type is neither PUBLIC or SYSTEM', () => {
      externalId = new ExternalIdP(externalId, {
         externalType: toSToken('Bogus'),
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_UNKNOWN,
         params: ['Bogus'],
         position: externalId.externalType,
      });
   });

   it('reports an error if type is the wrong case', () => {
      externalId = new ExternalIdP(externalId, {
         externalType: toSToken('public'),
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_INVALID_CASE,
         params: ['PUBLIC', 'public'],
         position: externalId.externalType,
      });
   });

   it('reports an error if there is no space after the id type', () => {
      externalId = new ExternalIdP(externalId, {
         externalTypeSpace: undefined,
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_EXTERNALTYPE_NO_SPACE,
         lastPosition: externalId.externalType,
         params: [],
      });
   });

   it('reports an error if there is no space after a PUBLIC part', () => {
      externalId = new ExternalIdP(externalId, {
         publicSpace: undefined,
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
         lastPosition: externalId.externalTypeSpace, // beccause we are mocking out the quotes call
         params: [],
      });
   });

   it('reports an error if there is no public part', () => {
      mockLiteralCheck.mockImplementation((publicOrSystem, _2, _3, _4, callback) => {
         if (callback && !publicOrSystem) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         public: undefined,
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_MISSING_PUBLIC_VALUE,
         params: [],
         position: toSToken(' '),
      });
   });

   it('reports an error if there is no system part', () => {
      mockLiteralCheck.mockImplementation((publicOrSystem, _2, _3, _4, callback) => {
         if (callback && !publicOrSystem) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         system: undefined,
      });

      externalIdCheck(externalId, false, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_MISSING_SYSTEM_VALUE,
         params: [],
         position: toSToken(' '),
      });
   });

   it('reports no error if there is no system part and this is a PublicID on a notation', () => {
      mockLiteralCheck.mockImplementation((publicOrSystem, _2, _3, _4, callback) => {
         if (callback && !publicOrSystem) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         system: undefined,
      });

      externalIdCheck(externalId, true, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });
});
