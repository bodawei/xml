/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParamCollector } from 'basic-test';
import {
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
} from 'pToken';
import { toSToken } from 'sToken';
import {
   ElementStartPToken,
   ElementEmptyPToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   ParameterEntityStartPToken,
} from 'token';
import { makeParameterExternalEntityDeclaration, makeParameterEntityReference } from 'token-test';

import { wellFormedErrorCodes } from '../error/wellFormedError';
import {
   scanAttributeValues,
   checkGeneralEntity,
   checkParameterEntity,
   isParamEntityExternal,
   CheckState,
} from '../checkUtils';

const WFEID = wellFormedErrorCodes.id;

describe('checkUtils (unit)', () => {
   let state: CheckState;
   let collector: ParamCollector;
   let generalEntityStart: GeneralEntityStartPToken;
   let generalEntityEnd: GeneralEntityEndPToken;
   let generalEntityReference: GeneralEntityReferencePToken;

   beforeEach(() => {
      state = new CheckState();
      generalEntityReference = new GeneralEntityReferencePToken({
         name: toSToken('testRef'),
         open: toSToken('&'),
      });
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);
      collector = new ParamCollector();
   });

   describe('scanAttributeValues()', () => {
      it('reports an error in the case of unbalanced entity starts and ends', () => {
         const refTwo = new GeneralEntityReferencePToken({
            name: toSToken('second'),
            open: toSToken('&'),
         });
         const generalEntityStartTwo = new GeneralEntityStartPToken(refTwo);
         const unbalancedElement = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(unbalancedElement.attributes, {}, state, [], collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_REFERENCE_UNBALANCED,
            params: ['testRef', 'second'],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports no errors when entity start and ends are properly blanced', () => {
         const unbalancedElement = new ElementStartPToken({
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
            open: toSToken('<'),
         });

         scanAttributeValues(unbalancedElement.attributes, {}, state, [], collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.ATTRIBUTE_REFERENCE_UNBALANCED);
      });

      it('reports an error if an undeclared reference is found', () => {
         const undeclaredRef = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(undeclaredRef.attributes, {}, state, [], collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found, but not all declarations are known', () => {
         const undeclaredRef = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });
         state.peRefCount = 1;

         scanAttributeValues(undeclaredRef.attributes, {}, state, [], collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error if an undeclared reference is found, but it is a predefined one', () => {
         generalEntityReference = new GeneralEntityReferencePToken(generalEntityReference, {
            name: toSToken('lt'),
            open: generalEntityReference.open,
         });
         const undeclaredRef = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(undeclaredRef.attributes, {}, state, [], collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if an entity references an external entiy (§3.1.0)', () => {
         const withExternalRef = new ElementEmptyPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(
            withExternalRef.attributes,
            {
               testRef: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            [],
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error if an entity references an unparsed entity (§4.1.0)', () => {
         const withUnparsedRef = new ElementEmptyPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(
            withUnparsedRef.attributes,
            {
               testRef: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     nDataName: toSToken('foo'),
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            [],
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_UNPARSED_NO_USE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error there is a recursive general entity start in an attribute value (§4.1.0)', () => {
         const ge1 = new GeneralEntityReferencePToken({
            name: toSToken('one'),
            open: toSToken('&'),
         });
         const ge1Start = new GeneralEntityStartPToken(ge1);
         const ge2 = new GeneralEntityReferencePToken({
            name: toSToken('two'),
            open: toSToken('&'),
         });
         const ge2Start = new GeneralEntityStartPToken(ge2);
         const ge1B = new GeneralEntityReferencePToken({
            name: toSToken('one'),
            open: toSToken('&'),
         });
         const ge1BStart = new GeneralEntityStartPToken(ge1B);

         const emptyElement = new ElementEmptyPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [ge1Start, ge2Start, ge1BStart],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                  }),
               },
               two: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            [],
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['one'],
            position: ge1B.open,
         });
      });

      it('reports an error there is a recursive general entity reference in an attribute value (§4.1.0)', () => {
         const ge1 = new GeneralEntityReferencePToken({
            name: toSToken('one'),
            open: toSToken('&'),
         });
         const ge1Start = new GeneralEntityStartPToken(ge1);
         const ge2 = new GeneralEntityReferencePToken({
            name: toSToken('two'),
            open: toSToken('&'),
         });
         const ge2Start = new GeneralEntityStartPToken(ge2);
         const ge1B = new GeneralEntityReferencePToken({
            name: toSToken('one'),
            open: toSToken('&'),
         });

         const emptyElement = new ElementEmptyPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [ge1Start, ge2Start, ge1B],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                  }),
               },
               two: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            [],
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['one'],
            position: ge1B.open,
         });
      });

      it('reports an error when an attribute value has a general entity start that the attribute, itself, is within (§4.1.0)', () => {
         const emptyElement = new ElementEmptyPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            ['testRef'],
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      // This seems impossible, but lets check anyway
      it('reports an error when an attribute value has a general entity reference that the attribute, itself, is within (§4.1.0)', () => {
         const emptyElement = new ElementEmptyPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });

         scanAttributeValues(
            emptyElement.attributes,
            {
               one: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            ['testRef'],
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });
   });

   describe('checkGeneralEntity()', () => {
      it('reports an error if an undeclared reference is found (§4.1.0)', () => {
         checkGeneralEntity(generalEntityReference, false, {}, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found, but not all declarations are known (§4.1.0)', () => {
         state.peRefCount = 1;
         checkGeneralEntity(generalEntityReference, false, {}, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error if an undeclared reference is found, but it is a predefined one (§4.1.0)', () => {
         generalEntityReference = new GeneralEntityReferencePToken(generalEntityReference, {
            name: toSToken('lt'),
            open: generalEntityReference.open,
         });

         checkGeneralEntity(generalEntityReference, false, {}, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if an entity references an unparsed entity (§4.1.0)', () => {
         checkGeneralEntity(
            generalEntityReference,
            false,
            {
               testRef: {
                  declaredInInternalSubset: false,
                  token: new GeneralEntityDeclarationPToken({
                     nDataName: toSToken('foo'),
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_UNPARSED_NO_USE,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if an attribute has a reference to an external entity (§3.1.0)', () => {
         checkGeneralEntity(
            generalEntityReference,
            true, // in an attribute
            {
               testRef: {
                  declaredInInternalSubset: true,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if an attribute has a geref formed from an external parameter entity (§3.1.0)', () => {
         const peRef = makeParameterEntityReference();
         const peRefDecl = makeParameterExternalEntityDeclaration();

         checkGeneralEntity(
            generalEntityReference,
            true, // in an attribute
            {
               testRef: {
                  declaredInInternalSubset: false,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                     value: [new ParameterEntityStartPToken(peRef)],
                  }),
               },
            },
            {
               ...state,
               paramDecls: {
                  entityName: peRefDecl,
               },
            },
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['entityName'],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if an attribute has a geref from a peref that is formed from a peref that is external  (§3.1.0)', () => {
         const peRef = makeParameterEntityReference();
         const externalRefDecl = makeParameterExternalEntityDeclaration();

         checkGeneralEntity(
            generalEntityReference,
            true, // in an attribute
            {
               testRef: {
                  declaredInInternalSubset: false,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                     value: [
                        new ParameterEntityReferencePToken({
                           name: toSToken('intermediate'),
                           open: toSToken('%'),
                        }),
                     ],
                  }),
               },
            },
            {
               ...state,
               paramDecls: {
                  entityName: externalRefDecl,
                  intermediate: new ParameterEntityDeclarationPToken({
                     open: toSToken('<!'),
                     value: [peRef],
                  }),
               },
            },
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['entityName'],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if an attribute has an unexpanded geref formed from an external parameter entity (§3.1.0)', () => {
         const peRef = makeParameterEntityReference();
         const peRefDecl = makeParameterExternalEntityDeclaration();

         checkGeneralEntity(
            generalEntityReference,
            true, // in an attribute
            {
               testRef: {
                  declaredInInternalSubset: false,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                     value: [peRef],
                  }),
               },
            },
            {
               ...state,
               paramDecls: {
                  entityName: peRefDecl,
               },
            },
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['entityName'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an attribute has a geref formed from a parameter entity, but there is no declaration (§3.1.0)', () => {
         const peRef = makeParameterEntityReference();

         checkGeneralEntity(
            generalEntityReference,
            true, // in an attribute
            {
               testRef: {
                  declaredInInternalSubset: false,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                     value: [new ParameterEntityStartPToken(peRef)],
                  }),
               },
            },
            {
               ...state,
               paramDecls: {},
            },
            collector,
         );

         expect(collector.getParams().length).toEqual(1);
         expect(collector.getParams()[0].id).toEqual(WFEID.ATTRIBUTE_INVALID_REFERENCE);
      });

      it('reports an error if the general entity is external but document is standalone (§4.1.0)', () => {
         state.isStandalone = true;
         checkGeneralEntity(
            generalEntityReference,
            true,
            {
               testRef: {
                  declaredInInternalSubset: false,
                  token: new GeneralEntityDeclarationPToken({
                     externalId: {},
                     open: toSToken('<!'),
                  }),
               },
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_STANDALONE,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });
   });

   describe('isParamEntityExternal()', () => {
      it('reports true if the param entity reference is to an external declaration', () => {
         const refTwo = new ParameterEntityReferencePToken({
            name: toSToken('second'),
            open: toSToken('%'),
         });

         const result = isParamEntityExternal(refTwo, {
            second: new ParameterEntityDeclarationPToken({
               externalId: {},
               name: toSToken('second'),
               open: toSToken('<!'),
            }),
         });

         expect(result).toEqual(true);
      });

      it('reports false if the param entity reference is to an external declaration', () => {
         const refTwo = new ParameterEntityReferencePToken({
            name: toSToken('second'),
            open: toSToken('%'),
         });

         const result = isParamEntityExternal(refTwo, {
            second: new ParameterEntityDeclarationPToken({
               name: toSToken('second'),
               open: toSToken('<!'),
            }),
         });

         expect(result).toEqual(false);
      });
   });

   describe('checkParameterEntity()', () => {
      it('reports an error if the specified parameter entity has no declaration', () => {
         const peRef = new ParameterEntityReferencePToken({
            name: toSToken('testRef'),
            open: toSToken('%'),
         });

         checkParameterEntity(peRef, {}, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: peRef.open,
         });
      });

      it('reports no error if the parameter entity is declared', () => {
         const peRef = new ParameterEntityReferencePToken({
            name: toSToken('testRef'),
            open: toSToken('%'),
         });

         checkParameterEntity(
            peRef,
            {
               testRef: new ParameterEntityDeclarationPToken({
                  name: toSToken('testRef'),
                  open: toSToken('<!'),
               }),
            },
            state,
            collector,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error if the parameter entity is not declared but we do not have all decls', () => {
         state.peRefCount = 1;
         const peRef = new ParameterEntityReferencePToken({
            name: toSToken('testRef'),
            open: toSToken('%'),
         });

         checkParameterEntity(peRef, {}, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });
   });
});
