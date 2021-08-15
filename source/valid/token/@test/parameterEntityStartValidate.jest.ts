/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import { ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import { ParameterEntityStartPToken } from 'token';
import { makeParameterEntityDeclaration, makeParameterEntityStart } from 'token-test';

import { validCodes } from '../../error/validCodes';
import { ValidateState } from '../../common/validateState';
import { ancestorPERefsValidate } from '../ancestorPERefsValidate';
import { parameterEntityStartValidate } from '../parameterEntityStartValidate';

const VID = validCodes.id;

jest.mock('../ancestorPERefsValidate');

describe('parameterEntityStartValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   describe('Standalone Document Declaration (§2.9.0)', () => {
      [
         {
            isExternalMarkupDeclaration: true,
            isPredefined: false,
            isStandalone: true,
            pass: false,
         },
         {
            isExternalMarkupDeclaration: true,
            isPredefined: true, // not really, since a PE can not be one of the predefined. but make sure we do not accidentally react to these
            isStandalone: true,
            pass: false,
         },
         {
            isExternalMarkupDeclaration: false,
            isPredefined: false,
            isStandalone: true,
            pass: true,
         },
         {
            isExternalMarkupDeclaration: true,
            isPredefined: false,
            isStandalone: false,
            pass: true,
         },
         {
            isExternalMarkupDeclaration: false,
            isPredefined: false,
            isStandalone: false,
            pass: true,
         },
      ].forEach((params) => {
         const { isExternalMarkupDeclaration, isPredefined, isStandalone, pass } = params;
         const testDescription = `reports an error if a general entity reference is found in the content, and the entity was${
            isExternalMarkupDeclaration ? '' : ' not'
         } externally declared, the document was${isStandalone ? '' : ' not'} standalone (§2.9.0)`;

         it(testDescription, () => {
            const peDecl = makeParameterEntityDeclaration();
            state = new ValidateState({
               isStandalone,
               parameterEntities: {
                  entityName: {
                     isExternalMarkupDeclaration,
                     isInternalValue: true,
                     token: peDecl,
                  },
                  lt: {
                     isExternalMarkupDeclaration,
                     isInternalValue: true,
                     token: peDecl,
                  },
               },
            });
            let peStart = makeParameterEntityStart();
            if (isPredefined) {
               peStart = new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({
                     name: toSToken('lt'),
                     open: toSToken('%'),
                  }),
               );
            }

            parameterEntityStartValidate(peStart, state, mockErrorCollector);

            if (pass) {
               expect(mockErrorCollector.errors).toEqual([]);
            } else {
               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportValidityError({
                  id: VID.ENTITYREF_EXTERNAL,
                  lastPosition: undefined,
                  params: [peStart.referencePToken.name?.str],
                  position: peStart.referencePToken.open,
               });
            }
         });
      });

      it('calls ancestorPERefsValidate() to validate ancestors (§2.9.0)', () => {
         const peDecl = makeParameterEntityDeclaration();
         state = new ValidateState({
            isStandalone: true,
            parameterEntities: {
               testRef: {
                  isExternalMarkupDeclaration: true,
                  isInternalValue: true,
                  token: peDecl,
               },
            },
         });
         const peStart = makeParameterEntityStart();

         parameterEntityStartValidate(peStart, state, mockErrorCollector);

         expect(ancestorPERefsValidate).toHaveBeenCalledWith(peStart, state, mockErrorCollector);
      });
   });
});
