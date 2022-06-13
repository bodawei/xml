/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ConditionalEndPToken } from 'token';
import { makeConditionalStart, makeParameterEntityStart } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { conditionalEndValidate } from '../conditionalEndValidate';

const VID = validityErrorCodes.id;

describe('conditionalEndValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();

      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
            lastPToken: undefined,
         },
      });
   });

   describe('Proper conditional section/PE nesting (§3.4.0)', () => {
      it('reports an error when the previous thing in the enclosingStack is not a conditional start (§3.4.0)', () => {
         const conditional = new ConditionalEndPToken({
            open: toSToken('<!['),
         });

         conditionalEndValidate(conditional, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PEREF_INVALID_CONDITIONALSECTION_END_NESTING,
            lastPosition: undefined,
            params: [],
            position: conditional.open,
         });
      });

      it('reports an error when the enclosingStack is somehow empty (§3.4.0)', () => {
         state = new ValidityState({
            dtdContext: {
               enclosingStack: [],
               inExternalMarkupContext: false,
               inExternalSubset: false,
               lastPToken: undefined,
            },
         });
         const conditional = new ConditionalEndPToken({
            open: toSToken('<!['),
         });

         conditionalEndValidate(conditional, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PEREF_INVALID_CONDITIONALSECTION_END_NESTING,
            lastPosition: undefined,
            params: [],
            position: conditional.open,
         });
      });

      it('reports no error when the previous thing in the enclosingStack is a conditional start (§3.4.0)', () => {
         const conditional = new ConditionalEndPToken({
            open: toSToken('<!['),
         });
         state = new ValidityState({
            dtdContext: {
               enclosingStack: [makeConditionalStart()],
               inExternalMarkupContext: false,
               inExternalSubset: false,
               lastPToken: undefined,
            },
         });

         conditionalEndValidate(conditional, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
