/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { toSToken, STokenSource } from 'sToken';
import {
   AttributeValuePToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityEndPToken,
   ParameterEntityReferencePToken,
   GeneralEntityStartPToken,
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
      entityDetails.addEntity(peDecl, [textPToken]);
      parseSpy.and.callFake((stoken: any, isElement: any, cb: any) => {
         cb([{ type: UnassignedType.WORD, token: text2PToken }]);
      });
      addSpy.and.callFake((ref: any, expand: any, chain: any, cb: any) => {
         cb([]);
      });

      params = {
         entityDetails,
         utils: {
            parseBody: (): void => undefined,
            parseEntityValue: (sTokenSource, done): void => {
               done([textPToken]);
            },
            retrieveExternalEntity: (externalId, entityMetaData): RetrieveResults => {
               return {
                  sTokenSource: new STokenSource({}, entityMetaData),
                  getErrors: (): Array<XmlError> => [],
               };
            },
            parseAttributeValue: (): void => {},
         },
         emd: new EntityMetaData(),
      };
   });

   it('calls back with a copy of the unassigned value', (done) => {
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.WORD, token: textPToken }];

      expandUnassigned(unassignedValue, params, [], false, (result) => {
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

      expandUnassigned(unassignedValue, params, [], false, (result) => {
         expect(result.newValue).toEqualShallowDifferent(unassignedValue);
         done();
      });
   });

   it('calls back with the original PE Ref when there is no declaration', (done) => {
      const peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('peInProgress'),
      });
      const peInProgress = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('peInProgress'),
      });
      entityDetails.addEntity(peDecl, [textPToken]);
      const unassignedValue: UnassignedArray = [
         { type: UnassignedType.REFERENCE, token: peInProgress },
      ];

      expandUnassigned(unassignedValue, params, ['peInProgress'], false, (result) => {
         expect(result.newValue).toEqualShallowDifferent(unassignedValue);
         done();
      });
   });

   it('passes the contents of the protoReplacementText to unassigned.parseAllValues()', (done) => {
      const unassignedValue: UnassignedArray = [{ type: UnassignedType.REFERENCE, token: peRef }];

      expandUnassigned(unassignedValue, params, [], false, (result) => {
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
      entityDetails.addEntity(peDecl2, [textPToken]);
      const unassignedValue: UnassignedArray = [
         { type: UnassignedType.REFERENCE, token: peRef },
         { type: UnassignedType.REFERENCE, token: peRef2 },
      ];

      expandUnassigned(unassignedValue, params, [], false, (result) => {
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
      entityDetails.addEntity(peDecl, [textPToken]);
      addSpy.and.callFake((ref: any, expand: any, chain: any, cb: any) => {
         cb([attrError]);
      });

      expandUnassigned(unassignedValue, params, [], false, (result) => {
         expect(result.errors).toEqual([attrError]);
         done();
      });
   });
});
