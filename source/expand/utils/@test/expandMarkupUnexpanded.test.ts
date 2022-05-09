/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, ConformanceVersion, XmlErrorToken } from 'basic';
import {
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   UnexpandedMarkupToken,
   TextPToken,
} from 'pToken';
import { toSToken, STokenSource } from 'sToken';
import { WellFormedError } from 'wellformedness';
import { ParameterEntityStartPToken, ParameterEntityEndPToken } from 'token';

import { ExpandParams, RetrieveResults } from '../../types';
import * as addProtoReplacementText from '../addProtoReplacementText';
import { AddProtoReplacementTextResult } from '../addProtoReplacementText';
import { EntityDetails } from '../EntityDetails';
import { EntityContextStack } from '../EntityContextStack';
import { expandMarkupUnexpanded } from '../expandMarkupUnexpanded';

describe('expandMarkupUnexpanded() (unit)', () => {
   let entityDetails: EntityDetails;
   let params: ExpandParams;
   let textPToken: TextPToken;
   let peDecl: ParameterEntityDeclarationPToken;
   let peRef: ParameterEntityReferencePToken;
   let addSpy: jasmine.Spy;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      entityDetails = new EntityDetails();

      peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe1'),
      });
      peRef = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('pe1'),
      });
      addSpy = spyOn(addProtoReplacementText, 'addProtoReplacementText');
      entityDetails.addEntity(peDecl, [textPToken], '');
      addSpy.and.callFake(
         (
            ref: any,
            expand: any,
            chain: any,
            cb: (result: AddProtoReplacementTextResult) => void,
         ) => {
            cb({ byproducts: [] });
         },
      );

      params = {
         entityId: {
            type: ENTITY_ID,
            systemId: '',
         },
         confVer: new ConformanceVersion(),
         entityDetails,
         loadExternalEntities: true,
         utils: {
            parseBody: (): void => undefined,
            parseEntityValue: (sTokenSource, done): void => {
               done([textPToken]);
            },
            resolveEntityId: () => '',
            retrieveExternalEntity: (): RetrieveResults => {
               return {
                  sTokenSource: new STokenSource(),
                  getErrors: (): Array<XmlErrorToken> => [],
               };
            },
            parseAttributeValue: (): void => {},
         },
      };
   });

   it('calls back with a copy of the unexpanded value with no PE refs', (done) => {
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [textPToken];

      expandMarkupUnexpanded(unexpandedTokens, params, new EntityContextStack(), (result) => {
         expect(result.expandedTokens).toEqual(unexpandedTokens);
         expect(result.expandedTokens).not.toBe(unexpandedTokens);
         done();
      });
   });

   it('calls back with the original PE Ref when there is no declaration', (done) => {
      const bogus = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('bogus'),
      });
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [bogus];

      expandMarkupUnexpanded(unexpandedTokens, params, new EntityContextStack(), (result) => {
         expect(result.expandedTokens).toEqual(unexpandedTokens);
         expect(result.expandedTokens).not.toBe(unexpandedTokens);
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
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [peInProgress];

      expandMarkupUnexpanded(unexpandedTokens, params, nameStack, (result) => {
         expect(result.expandedTokens).toEqual(unexpandedTokens);
         done();
      });
   });

   it('expands a peref with a start, the proto replacement text and an end', (done) => {
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [peRef];

      expandMarkupUnexpanded(unexpandedTokens, params, new EntityContextStack(), (result) => {
         expect(result.expandedTokens).toEqual([
            new ParameterEntityStartPToken(peRef),
            textPToken,
            new ParameterEntityEndPToken(peRef),
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
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [peRef, peRef2];

      expandMarkupUnexpanded(unexpandedTokens, params, new EntityContextStack(), (result) => {
         expect(result.expandedTokens).toEqual([
            new ParameterEntityStartPToken(peRef),
            textPToken,
            new ParameterEntityEndPToken(peRef),
            new ParameterEntityStartPToken(peRef2),
            textPToken,
            new ParameterEntityEndPToken(peRef2),
         ]);
         done();
      });
   });

   it('returns errors from the process of setting up references', (done) => {
      const attrError = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [peRef];
      entityDetails.addEntity(peDecl, [textPToken], '');
      addSpy.and.callFake(
         (
            ref: any,
            expand: any,
            chain: any,
            cb: (result: AddProtoReplacementTextResult) => void,
         ) => {
            cb({ byproducts: [attrError] } as any);
         },
      );

      expandMarkupUnexpanded(unexpandedTokens, params, new EntityContextStack(), (result) => {
         expect(result.byproducts as any).toEqual([attrError]);
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
      const unexpandedTokens: Array<UnexpandedMarkupToken> = [peRef2];
      addSpy.and.callFake(
         (
            ref: any,
            expand: any,
            chain: any,
            cb: (result: AddProtoReplacementTextResult) => void,
         ) => {
            cb({ byproducts: [attrError] } as any);
         },
      );

      expandMarkupUnexpanded(unexpandedTokens, params, new EntityContextStack(), (result) => {
         expect(result as any).toEqual({
            expandedTokens: [peRef2],
            byproducts: [attrError],
         });
         done();
      });
   });
});
