/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { TextPToken } from 'token';

import literal from '../../../token/common/literal';

import { ExternalIdP } from '../../../pToken/common/externalId';
import { externalIdCheck } from '../externalIdCheck';
import { toSToken } from 'sToken';

jest.mock('../../../token/common/literal');

describe('externalIdCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let externalId: ExternalIdP;
   let litWell: jest.Mock;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      externalId = {
         externalType: toSToken('PUBLIC'),
         externalTypeSpace: toSToken(' '),
         public: {
            openQuote: toSToken('"'),
            value: [new TextPToken({ text: toSToken('pub.xml') })],
            closeQuote: toSToken('"'),
         },
         publicSpace: toSToken(' '),
         system: {
            openQuote: toSToken('"'),
            value: [new TextPToken({ text: toSToken('sys.xml') })],
            closeQuote: toSToken('"'),
         },
      };
      litWell = literal.checkWellFormed as jest.Mock;
   });

   it('calls literal.checkWellFormed() to check the PUBLIC value', () => {
      const confVer = new ConformanceVersion();
      externalIdCheck(externalId, mockErrorCollector, confVer);

      expect(literal.checkWellFormed).toHaveBeenCalledWith(
         externalId.public,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.NOUN_EXTERNALID_PUBLIC,
         (expect as any).any(Function), // eslint-disable-line
      );
   });

   it('calls literal.checkWellFormed() to check the SYSTEM value', () => {
      const confVer = new ConformanceVersion();
      externalIdCheck(externalId, mockErrorCollector, confVer);

      expect(literal.checkWellFormed).toHaveBeenCalledWith(
         externalId.system,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.NOUN_EXTERNALID_SYSTEM,
      );
   });

   it('reports an error if the PUBLIC value has illegal characters', () => {
      externalId = new ExternalIdP(externalId, {
         public: {
            value: [new TextPToken({ text: toSToken('bad&chars') })],
         },
      });
      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      // invoke the callback function
      const cb: () => void = (literal.checkWellFormed as jest.Mock).mock.calls[0][4]; // eslint-disable-line
      cb();

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
         params: ['&'],
         position: externalId.publicSpace, // This is only because we call the callback after
      });
   });

   it('reports no errors when no PToken part is passed in', () => {
      externalIdCheck(undefined, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports an error if the public value contains invalid characters', () => {
      litWell.mockImplementation((_1: any, _2: any, _3: any, _4: any, callback: () => void) => {
         if (callback) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         public: {
            value: [new TextPToken({ text: toSToken('{}{}{}{}') })],
         },
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
         params: ['{'],
         position: externalId.externalTypeSpace, // wrong due to mocking
      });
   });

   it('does not blow up if the public value has no text when we are checking for invalid characters', () => {
      litWell.mockImplementation((_1: any, _2: any, _3: any, _4: any, callback: () => void) => {
         if (callback) {
            callback();
         }
      });
      externalId = new ExternalIdP(externalId, {
         public: {
            value: [],
         },
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).not.toReportError({
         id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
         params: ['{'],
         position: externalId.externalTypeSpace, // wrong due to mocking
      });
   });

   it('reports an error if type is neither PUBLIC or SYSTEM', () => {
      externalId = new ExternalIdP(externalId, {
         externalType: toSToken('Bogus'),
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.EXTERNALID_UNKNOWN,
         params: ['Bogus'],
         position: externalId.externalType,
      });
   });

   it('reports an error if type is the wrong case', () => {
      externalId = new ExternalIdP(externalId, {
         externalType: toSToken('public'),
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
         params: ['PUBLIC', 'public'],
         position: externalId.externalType,
      });
   });

   it('reports an error if there is no space after the id type', () => {
      externalId = new ExternalIdP(externalId, {
         externalTypeSpace: undefined,
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.EXTERNALID_EXTERNALTYPE_NO_SPACE,
         params: undefined,
         lastPosition: externalId.externalType,
      });
   });

   it('reports an error if there is no space after a PUBLIC part', () => {
      externalId = new ExternalIdP(externalId, {
         publicSpace: undefined,
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
         params: undefined,
         lastPosition: externalId.externalTypeSpace, // beccause we are mocking out the quotes call
      });
   });

   it('reports no error if there is no system part', () => {
      externalId = new ExternalIdP(externalId, {
         system: undefined,
      });

      externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('throws no errors if there is no public part', () => {
      litWell.mockImplementation(
         (publicOrSystem: any, _2: any, _3: any, _4: any, callback: () => void) => {
            if (callback && !publicOrSystem) {
               callback();
            }
         },
      );
      externalId = new ExternalIdP(externalId, {
         public: undefined,
      });

      expect(() => {
         externalIdCheck(externalId, mockErrorCollector, new ConformanceVersion());
      }).not.toThrow();
   });
});
