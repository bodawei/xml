/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';

import { docEndValidate } from '../docEndValidate';
import { validCodes } from '../../error/validCodes';
import { ValidityState } from '../../common/validityState';

const VID = validCodes.id;

describe('docEndValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   describe('IDREF (§3.3.1)', () => {
      it('reports an error when an idref value has no corresponding id value (§3.3.1)', () => {
         state = new ValidityState({
            idRefs: {
               value1: {
                  attName: 'otherAtt',
                  elName: 'otherElement',
                  sToken: toSToken('otherAtt'),
               },
            },
            ids: {},
         });

         docEndValidate(state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ELEMENTSTART_ATT_IDREF_NO_ID,
            lastPosition: undefined,
            params: ['otherElement', 'otherAtt', 'value1'],
            position: toSToken('otherAtt'),
         });
      });

      it('reports no error when an idref value has a corresponding id value (§3.3.1)', () => {
         state = new ValidityState({
            idRefs: {
               value1: {
                  attName: 'otherAtt',
                  elName: 'otherElement',
                  sToken: toSToken('otherAtt'),
               },
            },
            ids: {
               value1: {
                  attName: 'attName',
                  elName: 'elementName',
               },
            },
         });

         docEndValidate(state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });
});
