/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParamCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import {
   makeParameterEntityDeclaration,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';

import { validityErrorCodes } from '../../error/validityErrorCodes';
import { entityDeclarationValueValidate } from '../entityDeclarationValueValidate';
import { ValidityState } from '../validityState';

const VID = validityErrorCodes.id;

describe('entityDeclarationValueValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
   });

   it('reports no error when the declaration is defined (§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
         parameterEntities: {
            entityName: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeParameterEntityDeclaration(),
            },
         },
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error when the declaration is for a reference is not declared, but the document is standalone (§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: false,
         isStandalone: true,
         parameterEntities: {},
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error when the declaration is for a reference is not declared and there is an external subset (§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
         parameterEntities: {},
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.PARAMETERENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['entityName'],
         position: makeParameterEntityReference().open,
      });
   });

   it('reports an error when the declaration is for a reference is not declared and there are perefs (§4.1.0)', () => {
      state = new ValidityState({
         hasPeRefs: true,
         parameterEntities: {},
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.PARAMETERENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['entityName'],
         position: makeParameterEntityReference().open,
      });
   });

   it('reports an error when the declaration for a start is not declared (§4.1.0)', () => {
      state = new ValidityState({
         hasExternalSubset: true,
         parameterEntities: {},
      });
      const geDecl = new GeneralEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityStart()],
      });

      entityDeclarationValueValidate(geDecl, state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.PARAMETERENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['entityName'],
         position: makeParameterEntityStart().referencePToken.open,
      });
   });
});
