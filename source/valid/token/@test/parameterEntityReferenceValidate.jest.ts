/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParamCollector } from 'basic-test';
import { makeParameterEntityDeclaration, makeParameterEntityReference } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { parameterEntityReferenceValidate } from '../parameterEntityReferenceValidate';

const VID = validityErrorCodes.id;

describe('parameterEntityReferenceValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
   });

   describe('Validity Constraint: Entity Declared (§4.1.0)', () => {
      it('reports no error when the declaration is defined', () => {
         state = new ValidityState({
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  replacementText: undefined,
                  token: makeParameterEntityDeclaration(),
               },
            },
         });

         parameterEntityReferenceValidate(makeParameterEntityReference(), state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error when the reference has not been declared (and not standalone and has external subset) (§4.1.0)', () => {
         const ref = makeParameterEntityReference();
         state = new ValidityState({
            hasExternalSubset: true,
            isStandalone: false,
            parameterEntities: {
               frog: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: makeParameterEntityDeclaration(),
               },
            },
         });

         parameterEntityReferenceValidate(ref, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PARAMETERENTITY_NO_DECLARATION,
            lastPosition: undefined,
            params: ['entityName'],
            position: ref.name,
         });
      });

      it('reports an error when the reference has not been declared (and not standalone and has external subset) (§4.1.0)', () => {
         const ref = makeParameterEntityReference();
         state = new ValidityState({
            hasExternalSubset: false,
            isStandalone: false,
            parameterEntities: {
               frog: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: makeParameterEntityDeclaration(),
               },
            },
         });

         parameterEntityReferenceValidate(ref, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PARAMETERENTITY_NO_DECLARATION,
            lastPosition: undefined,
            params: ['entityName'],
            position: ref.name,
         });
      });

      it('reports no error when the reference has not been declared but the document is standalone (§4.1.0)', () => {
         const ref = makeParameterEntityReference();
         state = new ValidityState({
            hasExternalSubset: false,
            isStandalone: true,
            parameterEntities: {
               frog: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: makeParameterEntityDeclaration(),
               },
            },
         });

         parameterEntityReferenceValidate(ref, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
