/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ConditionalStartPToken } from 'token';
import { makeElementDeclaration, makeParameterEntityReference } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ElDeclType, ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { conditionalStartValidate } from '../conditionalStartValidate';

const VID = validityErrorCodes.id;

describe('conditionalStartValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();

      state = new ValidityState({
         elementContext: {
            contextStack: [
               {
                  details: {
                     graph: { endId: 0, startId: 0, states: {} },
                     isExternalMarkupDeclaration: false,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ELEMENT,
                  },
                  lastToken: undefined,
                  parentName: 'foo',
                  stateId: 0,
               },
            ],
            pastEnd: false,
         },
      });
   });

   describe('Proper conditional section/PE nesting (§3.4.0)', () => {
      it('reports an error when in element content (§3.4.0)', () => {
         const peRef = makeParameterEntityReference();
         const conditional = new ConditionalStartPToken({
            open: toSToken('<!['),
            unexpanded: {
               includedBracket: true,
               peRef,
               propName: 'test',
            },
         });

         conditionalStartValidate(conditional, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.CONDITIONALSECTION_PEREF_INVALID_BRACKET,
            lastPosition: undefined,
            params: ['entityName'],
            position: peRef.open,
         });
      });

      it('reports no error when there is no unexpanded (§3.4.0)', () => {
         const conditional = new ConditionalStartPToken({
            open: toSToken('<!['),
         });

         conditionalStartValidate(conditional, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when we did not include the bracket (§3.4.0)', () => {
         const peRef = makeParameterEntityReference();
         const conditional = new ConditionalStartPToken({
            open: toSToken('<!['),
            unexpanded: {
               includedBracket: false,
               peRef,
               propName: 'test',
            },
         });

         conditionalStartValidate(conditional, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
