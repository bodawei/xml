/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import {
   makeParameterEntityDeclaration,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';

import { entityDeclarationValueValidate } from '../entityDeclarationValueValidate';
import { ValidateState } from '../validateState';
import { validCodes } from '../../error/validCodes';

const VID = validCodes.id;

describe('entityDeclarationValueValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports no error when the declaration is defined (§4.1.0)', () => {
      state = new ValidateState({
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

      entityDeclarationValueValidate(peDecl, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the declaration is for a reference is not declared, but the document is standalone (§4.1.0)', () => {
      state = new ValidateState({
         hasExternalSubset: false,
         isStandalone: true,
         parameterEntities: {},
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the declaration is for a reference is not declared and there is an external subset (§4.1.0)', () => {
      state = new ValidateState({
         hasExternalSubset: true,
         parameterEntities: {},
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.PARAMETERENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['entityName'],
         position: makeParameterEntityReference().open,
      });
   });

   it('reports an error when the declaration is for a reference is not declared and there are perefs (§4.1.0)', () => {
      state = new ValidateState({
         hasPeRefs: true,
         parameterEntities: {},
      });
      const peDecl = new ParameterEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityReference()],
      });

      entityDeclarationValueValidate(peDecl, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.PARAMETERENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['entityName'],
         position: makeParameterEntityReference().open,
      });
   });

   it('reports an error when the declaration for a start is not declared (§4.1.0)', () => {
      state = new ValidateState({
         hasExternalSubset: true,
         parameterEntities: {},
      });
      const geDecl = new GeneralEntityDeclarationPToken({
         name: toSToken('myPeRef'),
         open: toSToken('<!'),
         value: [makeParameterEntityStart()],
      });

      entityDeclarationValueValidate(geDecl, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.PARAMETERENTITY_NO_DECLARATION,
         lastPosition: undefined,
         params: ['entityName'],
         position: makeParameterEntityStart().referencePToken.open,
      });
   });
});
