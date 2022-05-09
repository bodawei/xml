/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ENUMERATION_PTOKEN } from 'token';

import { xmlSpaceValidate } from '../xmlSpaceValidate';
import { ValidityState } from '../validityState';
import { errorCodes } from '../../error/errorCodes';

const EID = errorCodes.id;

describe('xmlSpaceValidate (unit)', () => {
   let state: ValidityState;
   let mockErrorCollector: MockErrorCollector;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      state = new ValidityState();
   });

   it('reports no error when the attribute is not xml:space (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            enumeration: {
               open: toSToken('('),
               type: ENUMERATION_PTOKEN,
               words: [
                  {
                     word: toSToken('xxxx'),
                  },
               ],
            },
            name: toSToken('frog'),
            value: [],
         },
         'elOne',
         'frog',
         state,
         mockErrorCollector,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error the attribute is a healthy xml:space (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            enumeration: {
               open: toSToken('('),
               type: ENUMERATION_PTOKEN,
               words: [
                  {
                     word: toSToken('default'),
                  },
                  {
                     word: toSToken('preserve'),
                  },
               ],
            },
            name: toSToken('xml:space'),
            value: [],
         },
         'elOne',
         'xml:space',
         state,
         mockErrorCollector,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the xml:space has no enumeration (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            name: toSToken('xml:space'),
            value: [],
         },
         'elOne',
         'xml:SPACE',
         state,
         mockErrorCollector,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: EID.XMLSPACE_NO_ENUMERATED_VALUES,
         lastPosition: undefined,
         params: ['elOne'],
         position: toSToken('xml:space'),
      });
   });

   it('reports no error when the xml:space has no enumeration but the version is less than 1.0/3 (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            name: toSToken('xml:space'),
            value: [],
         },
         'elOne',
         'xml:SPACE',
         new ValidityState(state, { confVer: new ConformanceVersion(1.0, 2) }),
         mockErrorCollector,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the xml:space has something other than preserve and default (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            enumeration: {
               open: toSToken('('),
               type: ENUMERATION_PTOKEN,
               words: [
                  {
                     word: toSToken('preserve'),
                  },
                  {
                     word: toSToken('default'),
                  },
                  {
                     word: toSToken('outch'),
                  },
               ],
            },
            name: toSToken('xml:space'),
            value: [],
         },
         'elOne',
         'xml:space',
         state,
         mockErrorCollector,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: EID.XMLSPACE_XTRA_ENUMERATED_VALUE,
         lastPosition: undefined,
         params: ['elOne', 'outch'],
         position: toSToken('outch'),
      });
   });

   it('reports no error when the xml:space has something other than preserve and default and the version is less than 1.0/3 (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            enumeration: {
               open: toSToken('('),
               type: ENUMERATION_PTOKEN,
               words: [
                  {
                     word: toSToken('preserve'),
                  },
                  {
                     word: toSToken('default'),
                  },
                  {
                     word: toSToken('outch'),
                  },
               ],
            },
            name: toSToken('xml:space'),
            value: [],
         },
         'elOne',
         'xml:space',
         new ValidityState(state, { confVer: new ConformanceVersion(1.0, 2) }),
         mockErrorCollector,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
