/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { toSToken } from 'sToken';
import {
   ElementStartPToken,
   ElementEmptyPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   ParameterEntityDeclarationPToken,
} from 'token';

import {
   scanAttributeValues,
   checkGeneralEntity,
   checkParameterEntity,
   isParamEntityExternal,
   CheckState,
} from '../checkUtils';

describe('checkUtils (unit)', () => {
   let state: CheckState;
   let ec: MockErrorCollector;
   let generalEntityStart: GeneralEntityStartPToken;
   let generalEntityEnd: GeneralEntityEndPToken;
   let generalEntityReference: GeneralEntityReferencePToken;

   beforeEach(() => {
      state = new CheckState();
      generalEntityReference = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('testRef'),
      });
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);
      ec = new MockErrorCollector();
   });

   describe('scanAttributeValues()', () => {
      it('reports an error in the case of unbalanced entity starts and ends', () => {
         const refTwo = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('second'),
         });
         const generalEntityStartTwo = new GeneralEntityStartPToken(refTwo);
         const unbalancedElement = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
               },
            ],
         });

         scanAttributeValues(unbalancedElement.attributes, {}, state, [], ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED,
            params: ['testRef', 'second'],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports no errors when entity start and ends are properly blanced', () => {
         const unbalancedElement = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [
                     generalEntityStart,
                     generalEntityStart,
                     generalEntityEnd,
                     generalEntityEnd,
                  ],
               },
            ],
         });

         scanAttributeValues(unbalancedElement.attributes, {}, state, [], ec);

         expect(ec).toNotReportError(WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED);
      });

      it('reports an error if an undeclared reference is found', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });

         scanAttributeValues(undeclaredRef.attributes, {}, state, [], ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found, but not all declarations are known', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });
         state.peRefCount = 1;

         scanAttributeValues(undeclaredRef.attributes, {}, state, [], ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error if an undeclared reference is found, but it is a predefined one', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });
         (generalEntityReference as any).name = toSToken('lt');

         scanAttributeValues(undeclaredRef.attributes, {}, state, [], ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if an entity references an external entiy (§3.1.0)', () => {
         const withExternalRef = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart],
               },
            ],
         });

         scanAttributeValues(
            withExternalRef.attributes,
            {
               testRef: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  externalId: {},
               }),
            },
            state,
            [],
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error if an entity references an unparsed entity (§4.1.0)', () => {
         const withUnparsedRef = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart],
               },
            ],
         });

         scanAttributeValues(
            withUnparsedRef.attributes,
            {
               testRef: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  nDataName: toSToken('foo'),
               }),
            },
            state,
            [],
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error there is a recursive general entity start in an attribute value (§4.1.0)', () => {
         const ge1 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('one'),
         });
         const ge1Start = new GeneralEntityStartPToken(ge1);
         const ge2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('two'),
         });
         const ge2Start = new GeneralEntityStartPToken(ge2);
         const ge1B = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('one'),
         });
         const ge1BStart = new GeneralEntityStartPToken(ge1B);

         const emptyElement = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [ge1Start, ge2Start, ge1BStart],
               },
            ],
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
               two: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
            },
            state,
            [],
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['one'],
            position: ge1B.open,
         });
      });

      it('reports an error there is a recursive general entity reference in an attribute value (§4.1.0)', () => {
         const ge1 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('one'),
         });
         const ge1Start = new GeneralEntityStartPToken(ge1);
         const ge2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('two'),
         });
         const ge2Start = new GeneralEntityStartPToken(ge2);
         const ge1B = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('one'),
         });

         const emptyElement = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [ge1Start, ge2Start, ge1B],
               },
            ],
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
               two: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
            },
            state,
            [],
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['one'],
            position: ge1B.open,
         });
      });

      it('reports an error when an attribute value has a general entity start that the attribute, itself, is within (§4.1.0)', () => {
         const emptyElement = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart],
               },
            ],
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
            },
            state,
            ['testRef'],
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      // This seems impossible, but lets check anyway
      it('reports an error when an attribute value has a general entity reference that the attribute, itself, is within (§4.1.0)', () => {
         const emptyElement = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
            },
            state,
            ['testRef'],
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });
   });

   describe('checkGeneralEntity()', () => {
      it('reports an error if an undeclared reference is found (§4.1.0)', () => {
         checkGeneralEntity(generalEntityReference, false, {}, state, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found, but not all declarations are known (§4.1.0)', () => {
         state.peRefCount = 1;
         checkGeneralEntity(generalEntityReference, false, {}, state, ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error if an undeclared reference is found, but it is a predefined one (§4.1.0)', () => {
         (generalEntityReference as any).name = toSToken('lt');

         checkGeneralEntity(generalEntityReference, false, {}, state, ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if an entity references an unparsed entity (§4.1.0)', () => {
         checkGeneralEntity(
            generalEntityReference,
            false,
            {
               testRef: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  nDataName: toSToken('foo'),
               }),
            },
            state,
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if an attribute has a reference to an external entity (§3.1.0)', () => {
         checkGeneralEntity(
            generalEntityReference,
            true,
            {
               testRef: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  externalId: {},
               }),
            },
            state,
            ec,
         );

         expect(ec).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });
   });

   describe('isParamEntityExternal()', () => {
      it('reports true if the param entity reference is to an external declaration', () => {
         const refTwo = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('second'),
         });

         const result = isParamEntityExternal(refTwo, {
            second: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('second'),
               externalId: {},
            }),
         });

         expect(result).toEqual(true);
      });

      it('reports false if the param entity reference is to an external declaration', () => {
         const refTwo = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('second'),
         });

         const result = isParamEntityExternal(refTwo, {
            second: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('second'),
            }),
         });

         expect(result).toEqual(false);
      });
   });

   describe('checkParameterEntity()', () => {
      it('reports an error if the specified parameter entity has no declaration', () => {
         const peRef = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('testRef'),
         });

         checkParameterEntity(peRef, {}, state, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: peRef.open,
         });
      });

      it('reports no error if the parameter entity is declared', () => {
         const peRef = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('testRef'),
         });

         checkParameterEntity(
            peRef,
            {
               testRef: new ParameterEntityDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('testRef'),
               }),
            },
            state,
            ec,
         );

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error if the parameter entity is not declared but we do not have all decls', () => {
         state.peRefCount = 1;
         const peRef = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('testRef'),
         });

         checkParameterEntity(peRef, {}, state, ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });
   });
});
