/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { GeneralEntityStartPToken } from 'token';
import { makeGeneralEntityDeclaration, makeGeneralEntityStart } from 'token-test';
import { describe, expect, it, vi } from 'vitest';

import { ancestorPERefsValidate } from '../../common/ancestorPERefsValidate';
import { geRefValidate } from '../../common/geRefValidate';
import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { generalEntityStartValidate } from '../generalEntityStartValidate';

const VID = validityErrorCodes.id;

vi.mock('../../common/ancestorPERefsValidate');
vi.mock('../../common/geRefValidate');

describe('generalEntityStartValidate (unit)', () => {
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
            state = new ValidityState({
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

            generalEntityStartValidate(geStart, state, collector);

            if (pass) {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
                  id: VID.ENTITYREF_EXTERNAL,
                  lastPosition: undefined,
                  params: [geStart.referencePToken.name?.str],
                  position: geStart.referencePToken.open,
               });
            }
         });
      });

      it('calls ancestorPERefsValidate() to validate ancestors (§2.9.0)', () => {
         const geDecl = makeGeneralEntityDeclaration();
         state = new ValidityState({
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

         generalEntityStartValidate(geStart, state, collector);

         expect(ancestorPERefsValidate).toHaveBeenCalledWith(geStart, state, collector);
      });
   });

   describe('Validity Constraint: Entity Declared (§4.1.0)', () => {
      it('calls geRefValidate() to validate the entity reference (§4.1.0)', () => {
         const geDecl = makeGeneralEntityDeclaration();
         state = new ValidityState({
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

         generalEntityStartValidate(geStart, state, collector);

         expect(geRefValidate).toHaveBeenCalledWith(geStart.referencePToken, state, collector);
      });
   });
});
