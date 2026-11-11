/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { contentEndValidate } from '../contentEndValidate';

const VID = validityErrorCodes.id;

describe('contentEndValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
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

         contentEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
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

         contentEndValidate(state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
