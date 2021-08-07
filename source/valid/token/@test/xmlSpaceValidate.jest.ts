/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { error } from 'basic';
import { toSToken } from 'sToken';
import { MockErrorCollector } from 'basic-test';

import { xmlSpaceValidate } from '../xmlSpaceValidate';
import { ENUMERATION_PTOKEN } from 'token';

const EID = error.id;

describe('xmlSpaceValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
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
         mockErrorCollector,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the xml:space is the wrong case (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            enumeration: {
               open: toSToken('('),
               type: ENUMERATION_PTOKEN,
               words: [
                  {
                     word: toSToken('preserve'),
                  },
               ],
            },
            name: toSToken('xml:SPACE'),
            value: [],
         },
         'elOne',
         'xml:SPACE',
         mockErrorCollector,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: EID.XML_SPACE_BAD_CASE,
         lastPosition: undefined,
         params: ['elOne', 'xml:SPACE'],
         position: toSToken('xml:SPACE'),
      });
   });

   it('reports an error when the xml:space has no enumeration (§2.10.0)', () => {
      xmlSpaceValidate(
         {
            name: toSToken('xml:space'),
            value: [],
         },
         'elOne',
         'xml:SPACE',
         mockErrorCollector,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: EID.XML_SPACE_BAD_DECLARATION,
         lastPosition: undefined,
         params: ['elOne'],
         position: toSToken('xml:space'),
      });
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
         mockErrorCollector,
      );

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: EID.XML_SPACE_BAD_ENUMRATION,
         lastPosition: undefined,
         params: ['elOne', 'outch'],
         position: toSToken('xml:space'),
      });
   });
});
