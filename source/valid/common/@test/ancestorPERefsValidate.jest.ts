/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
} from 'pToken';
import { ParameterEntityStartPToken } from 'token';
import {
   makeGeneralEntityStart,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeTextPToken,
} from 'token-test';
import { describe, expect, it } from 'vitest';

import { validityErrorCodes } from '../../error/validityErrorCodes';
import { ancestorPERefsValidate } from '../ancestorPERefsValidate';
import { ValidityState } from '../validityState';

const VID = validityErrorCodes.id;

describe('ancestorPERefsValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;
   let peRef: ParameterEntityReferencePToken;

   beforeEach(() => {
      collector = new ParamCollector();

      peRef = new ParameterEntityReferencePToken({
         name: toSToken('peRef'),
         open: toSToken('<!'),
      });

      state = new ValidityState({
         generalEntities: {
            testRef: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [peRef, makeTextPToken('goo')],
               }),
            },
         },
         isStandalone: true,
         parameterEntities: {
            entityName: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [new ParameterEntityStartPToken(peRef)],
               token: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new ParameterEntityStartPToken(peRef)],
               }),
            },
            peRef: {
               isExternalMarkupDeclaration: true,
               isInternalValue: true,
               replacementText: [],
               token: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [],
               }),
            },
            peRefTwo: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [peRef],
               token: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [peRef],
               }),
            },
         },
      });
   });

   it('reports an error when a general entity references a peref that is declared externally (§2.9.0)', () => {
      ancestorPERefsValidate(makeGeneralEntityStart(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.ENTITYREF_EXTERNAL,
         lastPosition: undefined,
         params: ['peRef'],
         position: peRef.open,
      });
   });

   it('reports no error when a general entity references a peref that is declared externally but the document is not standalone (§2.9.0)', () => {
      state = new ValidityState({
         ...state,
         isStandalone: false,
      });

      ancestorPERefsValidate(makeGeneralEntityStart(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error when a parameter entity references a peref that is declared externally (§2.9.0)', () => {
      const peRefTwo = new ParameterEntityReferencePToken({
         name: toSToken('peRefTwo'),
         open: toSToken('<!'),
      });

      ancestorPERefsValidate(peRefTwo, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.ENTITYREF_EXTERNAL,
         lastPosition: undefined,
         params: ['peRef'],
         position: peRefTwo.open,
      });
   });

   it('reports an error when a parameter entity start references a peref that is declared externally (§2.9.0)', () => {
      ancestorPERefsValidate(makeParameterEntityStart(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.ENTITYREF_EXTERNAL,
         lastPosition: undefined,
         params: ['peRef'],
         position: toSToken('<!'),
      });
   });

   it('reports an error a problematic reference is found through several indirections (§2.9.0)', () => {
      state = new ValidityState({
         isStandalone: true,
         parameterEntities: {
            entityName: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [new ParameterEntityStartPToken(peRef)],
               token: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new ParameterEntityStartPToken(peRef)],
               }),
            },
            peRef: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               replacementText: [
                  new ParameterEntityReferencePToken({
                     name: toSToken('second'),
                     open: toSToken('%'),
                  }),
               ],
               token: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [
                     new ParameterEntityReferencePToken({
                        name: toSToken('second'),
                        open: toSToken('%'),
                     }),
                  ],
               }),
            },
            second: {
               isExternalMarkupDeclaration: true,
               isInternalValue: true,
               replacementText: [],
               token: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [],
               }),
            },
         },
      });

      ancestorPERefsValidate(makeParameterEntityStart(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.ENTITYREF_EXTERNAL,
         lastPosition: undefined,
         params: ['second'],
         position: toSToken('%'),
      });
   });

   it('reports no error when there is no declaraton for the general entity reference (§2.9.0)', () => {
      state = new ValidityState({
         isStandalone: true,
      });

      ancestorPERefsValidate(makeGeneralEntityStart(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error when there is no declaraton for the parameter entity start reference (§2.9.0)', () => {
      state = new ValidityState({
         isStandalone: true,
      });

      ancestorPERefsValidate(makeParameterEntityStart(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error when there is no declaraton for the parameter entity reference (§2.9.0)', () => {
      state = new ValidityState({
         isStandalone: true,
      });

      ancestorPERefsValidate(makeParameterEntityReference(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });
});
