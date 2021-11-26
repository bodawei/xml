/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import {
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeTextPToken,
} from 'token-test';

import { attributeValueValidate } from '../attributeValueValidate';
import { geRefValidate } from '../geRefValidate';
import { ValidityState } from '../validityState';

jest.mock('../geRefValidate');

describe('attributeValueValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports no error when the declaration is defined (§4.1.0)', () => {
      state = new ValidityState({
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

   it('passes validation of a ref in a general entity start to geRefValidate() (§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
      });

      attributeValueValidate([makeGeneralEntityStart()], state, mockErrorCollector);

      expect(geRefValidate).toHaveBeenCalledWith(
         makeGeneralEntityStart().referencePToken,
         state,
         mockErrorCollector,
      );
   });

   it('passes validation of a general entity reference to geRefValidate() (§4.1.0)', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidityState({
         hasExternalSubset: true,
      });

      attributeValueValidate([ref], state, mockErrorCollector);

      expect(geRefValidate).toHaveBeenCalledWith(ref, state, mockErrorCollector);
   });

   it('accepts other values in the attribute value that are not eneity references or starts(§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
      });

      attributeValueValidate([makeTextPToken('boo')], state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
