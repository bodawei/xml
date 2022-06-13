/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ParameterEntityReferencePToken } from 'pToken';
import { ParameterEntityStartPToken } from 'token';
import { makeParameterEntityDeclaration, makeParameterEntityStart } from 'token-test';

import { ancestorPERefsValidate } from '../../common/ancestorPERefsValidate';
import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { parameterEntityStartValidate } from '../parameterEntityStartValidate';

const VID = validityErrorCodes.id;

jest.mock('../../common/ancestorPERefsValidate');

describe('parameterEntityStartValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
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
            state = new ValidityState({
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

            parameterEntityStartValidate(peStart, state, collector);

            if (pass) {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
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
         state = new ValidityState({
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

         parameterEntityStartValidate(peStart, state, collector);

         expect(ancestorPERefsValidate).toHaveBeenCalledWith(peStart, state, collector);
      });
   });
});
