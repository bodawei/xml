/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { makeGeneralEntityDeclaration, makeGeneralEntityReference } from 'token-test';
import { describe, expect, it } from 'vitest';

import { validityErrorCodes } from '../../error/validityErrorCodes';
import { warningCodes } from '../../error/warningCodes';
import { geRefValidate } from '../geRefValidate';
import { ValidityState } from '../validityState';

const VID = validityErrorCodes.id;

describe('geRefValidate (unit)', () => {
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

      geRefValidate(makeGeneralEntityReference(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error when the declaration is not defined and standalone is set (§4.1.0)', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidityState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         isStandalone: true,
      });

      geRefValidate(ref, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error when the declaration is not defined and there is no external subset or perefs (§4.1.0)', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidityState({
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

      geRefValidate(ref, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error when the declaration is not defined and there is an external subset (§4.1.0)', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidityState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: true,
      });

      geRefValidate(ref, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.GENERALENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['testRef'],
         position: ref.name,
      });
   });

   it('reports an error when the declaration is not defined and there is are PE refs (§4.1.0)', () => {
      const ref = makeGeneralEntityReference();
      state = new ValidityState({
         generalEntities: {
            frog: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasPeRefs: true,
      });

      geRefValidate(ref, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.GENERALENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['testRef'],
         position: ref.name,
      });
   });

   it('reports no warning if a predefined entity has been declared (§4.1.0)', () => {
      const ref = new GeneralEntityReferencePToken({
         name: toSToken('amp'),
         open: toSToken('&'),
      });
      state = new ValidityState({
         generalEntities: {
            amp: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
         },
         isStandalone: true,
      });

      geRefValidate(ref, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if a predefined entity has not been declared (§4.1.0)', () => {
      const ref = new GeneralEntityReferencePToken({
         name: toSToken('lt'),
         open: toSToken('&'),
      });
      state = new ValidityState({
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

      geRefValidate(ref, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidWarning({
         id: warningCodes.id.ENTITY_PREDEFINED_NO_DECLARATION,
         lastPosition: undefined,
         params: ['lt'],
         position: ref.name,
      });
   });
});
