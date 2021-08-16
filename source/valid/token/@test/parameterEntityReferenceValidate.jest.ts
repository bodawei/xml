/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { makeParameterEntityDeclaration, makeParameterEntityReference } from 'token-test';

import { parameterEntityReferenceValidate } from '../parameterEntityReferenceValidate';
import { ValidityState } from '../../common/validityState';
import { validCodes } from '../../error/validCodes';

const VID = validCodes.id;

describe('parameterEntityReferenceValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

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

      parameterEntityReferenceValidate(makeParameterEntityReference(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
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

      parameterEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
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

      parameterEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
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

      parameterEntityReferenceValidate(ref, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
