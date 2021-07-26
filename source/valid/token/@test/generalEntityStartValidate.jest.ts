/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import { GeneralEntityStartPToken } from 'token';
import { makeGeneralEntityDeclaration, makeGeneralEntityStart } from 'token-test';

import { validityConstraint } from '../../error/validityConstraint';
import { ValidateState } from '../../validateState';
import { ancestorPERefsValidate } from '../ancestorPERefsValidate';
import { generalEntityStartValidate } from '../generalEntityStartValidate';

const VID = validityConstraint.id;

jest.mock('../ancestorPERefsValidate');

describe('generalEntityStartValidate (unit)', () => {
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
            isPredefined: true,
            isStandalone: true,
            pass: true,
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
         } externally declared, the document was${
            isStandalone ? '' : ' not'
         } standalone and the entity is${isPredefined ? '' : ' not'} a predefined entity (§2.9.0)`;

         it(testDescription, () => {
            const geDecl = makeGeneralEntityDeclaration();
            state = new ValidateState({
               generalEntities: {
                  testRef: {
                     isExternalMarkupDeclaration,
                     isInternalValue: true,
                     token: geDecl,
                  },
               },
               isStandalone,
            });
            let geStart = makeGeneralEntityStart();
            if (isPredefined) {
               geStart = new GeneralEntityStartPToken(
                  new GeneralEntityReferencePToken({
                     name: toSToken('lt'),
                     open: toSToken('&'),
                  }),
               );
            }

            generalEntityStartValidate(geStart, state, mockErrorCollector);

            if (pass) {
               expect(mockErrorCollector.errors).toEqual([]);
            } else {
               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportValidityError({
                  id: VID.ENTITYREF_EXTERNALLY_DECLARED,
                  lastPosition: undefined,
                  params: [geStart.referencePToken.name?.str],
                  position: geStart.referencePToken.open,
               });
            }
         });
      });

      it('calls ancestorPERefsValidate() to validate ancestors (§2.9.0)', () => {
         const geDecl = makeGeneralEntityDeclaration();
         state = new ValidateState({
            generalEntities: {
               testRef: {
                  isExternalMarkupDeclaration: true,
                  isInternalValue: true,
                  token: geDecl,
               },
            },
            isStandalone: true,
         });
         const geStart = makeGeneralEntityStart();

         generalEntityStartValidate(geStart, state, mockErrorCollector);

         expect(ancestorPERefsValidate).toHaveBeenCalledWith(geStart, state, mockErrorCollector);
      });
   });
});
