/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { XmlWarning } from 'error';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { GeneralEntityReferencePToken } from 'token';
import { makeGeneralEntityReference } from 'token-test';

import { generalEntityReferenceValidate } from '../generalEntityReferenceValidate';
import { ValidityError } from '../../error/ValidityError';
import { ValidateState } from '../../validateState';

describe('generalEntityReferenceValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports no error when the declaration is defined', () => {
      state = new ValidateState({
         generalEntities: {
            testRef: {
               isInternal: true,
            },
         },
      });

      generalEntityReferenceValidate(makeGeneralEntityReference(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the declaration is not defined', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidateState({
         generalEntities: {
            frog: {
               isInternal: true,
            },
         },
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.GEREF_UNDEFINED,
         params: ['testRef'],
         position: ref.name,
         lastPosition: undefined,
      });
   });

   it('reports no warning if a predefined entity has been declared', () => {
      const ref = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('amp'),
      });
      state = new ValidateState({
         generalEntities: {
            amp: {
               isInternal: true,
            },
         },
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports a warning if a predefined entity has not been declared', () => {
      const ref = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('lt'),
      });
      state = new ValidateState({
         generalEntities: {
            frog: {
               isInternal: true,
            },
         },
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.PREDEFINED_UNDECLARED,
         params: ['lt'],
         position: ref.name,
         lastPosition: undefined,
      });
   });
});
