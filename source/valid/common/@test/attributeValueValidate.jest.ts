/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParamCollector } from 'basic-test';
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
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
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

      attributeValueValidate([makeGeneralEntityReference()], state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('passes validation of a ref in a general entity start to geRefValidate() (§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
      });

      attributeValueValidate([makeGeneralEntityStart()], state, collector);

      expect(geRefValidate).toHaveBeenCalledWith(
         makeGeneralEntityStart().referencePToken,
         state,
         collector,
      );
   });

   it('passes validation of a general entity reference to geRefValidate() (§4.1.0)', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidityState({
         hasExternalSubset: true,
      });

      attributeValueValidate([ref], state, collector);

      expect(geRefValidate).toHaveBeenCalledWith(ref, state, collector);
   });

   it('accepts other values in the attribute value that are not eneity references or starts(§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
      });

      attributeValueValidate([makeTextPToken('boo')], state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });
});
