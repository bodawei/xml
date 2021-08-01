/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { warning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import {
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
} from 'token-test';

import { attributeValueValidate } from '../attributeValueValidate';
import { ValidateState } from '../../validateState';
import { validityConstraint } from '../../error/validityConstraint';

const VID = validityConstraint.id;

describe('attributeValueValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports no error when the declaration is defined (§4.1.0)', () => {
      state = new ValidateState({
         generalEntities: {
            testRef: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
      });

      attributeValueValidate([makeGeneralEntityReference()], state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when a general entity start references a declaration is not declared and the doc has an external subset (§4.1.0)', () => {
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

      attributeValueValidate([makeGeneralEntityStart()], state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.GENERAL_ENTITY_UNDECLARED,
         lastPosition: undefined,
         params: ['testRef'],
         position: ref.open,
      });
   });

   it('reports an error when a general entity start references a declaration is not declared and the doc has perefs (§4.1.0)', () => {
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

      attributeValueValidate([makeGeneralEntityStart()], state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.GENERAL_ENTITY_UNDECLARED,
         lastPosition: undefined,
         params: ['testRef'],
         position: ref.open,
      });
   });

   it('reports no error when the declaration is not declared and standalone is yes (§4.1.0)', () => {
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

      attributeValueValidate([ref], state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no warning if a predefined entity has been declared (§4.1.0)', () => {
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
         hasExternalSubset: true,
      });

      attributeValueValidate([ref], state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports a warning if a predefined entity has not been declared (§4.1.0)', () => {
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
      });

      attributeValueValidate([ref], state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: warning.id.PREDEFINED_UNDECLARED,
         lastPosition: undefined,
         params: ['lt'],
         position: ref.open,
      });
   });
});
