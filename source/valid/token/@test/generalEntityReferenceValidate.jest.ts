/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { warning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import { makeGeneralEntityDeclaration, makeGeneralEntityReference } from 'token-test';

import { generalEntityReferenceValidate } from '../generalEntityReferenceValidate';
import { ValidateState } from '../../common/validateState';
import { validCodes } from '../../error/validCodes';

const VID = validCodes.id;

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
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
      });

      generalEntityReferenceValidate(makeGeneralEntityReference(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the declaration is not defined and standalone is set', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidateState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         isStandalone: true,
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the declaration is not defined and there is no external subset or perefs', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidateState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: false,
         hasPeRefs: false,
         isStandalone: false,
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the declaration is not defined and there is an external subset', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidateState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: true,
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.GENERALENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['testRef'],
         position: ref.name,
      });
   });

   it('reports an error when the declaration is not defined and there is are PE refs', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidateState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasPeRefs: true,
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.GENERALENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['testRef'],
         position: ref.name,
      });
   });

   it('reports no warning if a predefined entity has been declared', () => {
      const ref = new GeneralEntityReferencePToken({
         name: toSToken('amp'),
         open: toSToken('&'),
      });
      state = new ValidateState({
         generalEntities: {
            amp: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         isStandalone: true,
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports a warning if a predefined entity has not been declared', () => {
      const ref = new GeneralEntityReferencePToken({
         name: toSToken('lt'),
         open: toSToken('&'),
      });
      state = new ValidateState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: true,
         isStandalone: false,
      });

      generalEntityReferenceValidate(ref, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.ENTITY_PREDEFINED_NO_DECLARATION,
         lastPosition: undefined,
         params: ['lt'],
         position: ref.name,
      });
   });
});
