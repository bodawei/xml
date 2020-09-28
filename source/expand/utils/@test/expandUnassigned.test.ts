/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, ConformanceVersion } from 'basic';
import { toSToken, STokenSource } from 'sToken';
import {
   ParameterEntityReferencePToken,
   TextPToken,
   XmlError,
   ParameterEntityDeclarationPToken,
} from 'token';

import * as unassigned from '../../../token/common/unassigned';
import { UnassignedArray, UnassignedType } from '../../../token/common/unassigned';

import { ExpandParams, RetrieveResults } from '../../types';
import { WellFormedError } from 'error';
import * as addProtoReplacementText from '../addProtoReplacementText';
import { EntityDetails } from '../EntityDetails';
import { EntityContextStack } from '../EntityContextStack';
import { expandUnassigned } from '../expandUnassigned';

describe('expandUnassigned() (unit)', () => {
   let entityDetails: EntityDetails;
   let params: ExpandParams;
   let textPToken: TextPToken;
   let text2PToken: TextPToken;
   let peDecl: ParameterEntityDeclarationPToken;
   let peRef: ParameterEntityReferencePToken;
   let parseSpy: jasmine.Spy;
   let addSpy: jasmine.Spy;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      text2PToken = new TextPToken({ text: toSToken('two') });
      entityDetails = new EntityDetails();

      peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe1'),
      });
      peRef = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('pe1'),
      });
      parseSpy = spyOn(unassigned.default, 'parseAllValues');
      addSpy = spyOn(addProtoReplacementText, 'addProtoReplacementText');
      entityDetails.addEntity(peDecl, [textPToken], '');
      parseSpy.and.callFake((stoken: any, isElement: any, cb: any) => {
         cb([{ type: UnassignedType.WORD, token: text2PToken }]);
      });
      addSpy.and.callFake((ref: any, expand: any, chain: any, cb: any) => {
         cb([]);
      });

      params = {
         entityId: {
            type: ENTITY_ID,
            systemId: '',
         },
         confVer: new ConformanceVersion(),
         entityDetails,
         conditionalStack: [],
         loadExternalEntities: true,
         utils: {
            parseBody: (): void => undefined,
            parseEntityValue: (sTokenSource, done): void => {
               done([textPToken]);
            },
            resolveEntityId: () => '',
            retrieveExternalEntity: (): RetrieveResults => {
               return {
                  sTokenSource: new STokenSource({}),
                  getErrors: (): Array<XmlError> => [],
               };
            },
            parseAttributeValue: (): void => {},
         },
      };
   });

   it('calls back with a copy of the unassigned value', (done) => {
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.WORD, token: textPToken }];

      expandUnassigned(unassignedValue, params, new EntityContextStack(), false, (result) => {
         expect(result.newValue).toEqualShallowDifferent(unassignedValue);
         done();
      });
   });

   it('calls back with the original PE Ref when there is no declaration', (done) => {
      const bogus = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('bogus'),
      });
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.REFERENCE, token: bogus }];

      expandUnassigned(unassignedValue, params, new EntityContextStack(), false, (result) => {
         expect(result.newValue).toEqualShallowDifferent(unassignedValue);
         done();
      });
   });

   it('calls back with the original PE Ref when we already in the process of processing a pe ref with that name (§4.1.0)', (done) => {
      const peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('peInProgress'),
      });
      const peInProgress = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('peInProgress'),
      });
      entityDetails.addEntity(peDecl, [textPToken], '');
      const nameStack = new EntityContextStack();
      nameStack.pushName(peInProgress, '');
      const unassignedValue: UnassignedArray = [
         { type: UnassignedType.REFERENCE, token: peInProgress },
      ];

      expandUnassigned(unassignedValue, params, nameStack, false, (result) => {
         expect(result.newValue).toEqual(unassignedValue);
         done();
      });
   });

   it('passes the contents of the protoReplacementText to unassigned.parseAllValues()', (done) => {
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.REFERENCE, token: peRef }];

      expandUnassigned(unassignedValue, params, new EntityContextStack(), false, (result) => {
         expect(result.newValue).toEqual([
            { type: UnassignedType.ENTITY_START, token: peRef },
            { type: UnassignedType.WORD, token: text2PToken },
            { type: UnassignedType.ENTITY_END, token: peRef },
         ]);
         done();
      });
   });

   it('will process multiple references in the unassigned array', (done) => {
      const peDecl2 = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe1'),
      });
      const peRef2 = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('pe1'),
      });
      entityDetails.addEntity(peDecl2, [textPToken], '');
      const unassignedValue: UnassignedArray = [
         { type: UnassignedType.REFERENCE, token: peRef },
         { type: UnassignedType.REFERENCE, token: peRef2 },
      ];

      expandUnassigned(unassignedValue, params, new EntityContextStack(), false, (result) => {
         expect(result.newValue).toEqual([
            { type: UnassignedType.ENTITY_START, token: peRef },
            { type: UnassignedType.WORD, token: text2PToken },
            { type: UnassignedType.ENTITY_END, token: peRef },
            { type: UnassignedType.ENTITY_START, token: peRef2 },
            { type: UnassignedType.WORD, token: text2PToken },
            { type: UnassignedType.ENTITY_END, token: peRef2 },
         ]);
         done();
      });
   });

   it('returns errors from the process of setting up references', (done) => {
      const attrError = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.REFERENCE, token: peRef }];
      entityDetails.addEntity(peDecl, [textPToken], '');
      addSpy.and.callFake((ref: any, expand: any, chain: any, cb: any) => {
         cb({ byproducts: [attrError] });
      });

      expandUnassigned(unassignedValue, params, new EntityContextStack(), false, (result) => {
         expect(result.byproducts).toEqual([attrError]);
         done();
      });
   });

   it('returns the original reference if the replacement text could not be constructed', (done) => {
      const attrError = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
      const peDecl2 = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe2'),
      });
      const peRef2 = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('pe2'),
      });
      entityDetails.addEntity(peDecl2, undefined, '');
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.REFERENCE, token: peRef2 }];
      addSpy.and.callFake((ref: any, expand: any, chain: any, cb: any) => {
         cb({ byproducts: [attrError] });
      });

      expandUnassigned(unassignedValue, params, new EntityContextStack(), false, (result) => {
         expect(result).toEqual({
            newValue: [{ type: UnassignedType.REFERENCE, token: peRef2 }],
            byproducts: [attrError],
         });
         done();
      });
   });
});
