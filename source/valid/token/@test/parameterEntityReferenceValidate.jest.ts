/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { makeParameterEntityDeclaration, makeParameterEntityReference } from 'token-test';

import { parameterEntityReferenceValidate } from '../parameterEntityReferenceValidate';
import { ValidityError } from '../../error/ValidityError';
import { ValidateState } from '../../validateState';

describe('parameterEntityReferenceValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports no error when the declaration is defined', () => {
      state = new ValidateState({
         parameterEntities: {
            entityName: {
               isInternal: true,
               token: makeParameterEntityDeclaration(),
               replacementText: undefined,
            },
         },
      });

      parameterEntityReferenceValidate(makeParameterEntityReference(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the reference has not been declared', () => {
      const ref = makeParameterEntityReference();
      state = new ValidateState({
         parameterEntities: {
            frog: {
               token: makeParameterEntityDeclaration(),
               isInternal: true,
            },
         },
      });

      parameterEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.PEREF_UNDEFINED,
         params: ['entityName'],
         position: ref.name,
         lastPosition: undefined,
      });
   });
});
