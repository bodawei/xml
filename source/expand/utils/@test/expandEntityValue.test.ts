/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { toSToken, STokenSource } from 'sToken';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
   TextPToken,
   XmlError,
} from 'token';

import { expandEntityValue } from '../expandEntityValue';
import { ExpandParams, RetrieveResults } from '../../types';
import { EntityDetails } from '../EntityDetails';

describe('expandEntityValue() (unit)', () => {
   let entityDetails: EntityDetails;
   let params: ExpandParams;
   let textPToken: TextPToken;
   let peRefPToken: ParameterEntityReferencePToken;
   let peDecl: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('pe1'),
      });

      peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe1'),
         externalId: {} as any,
      });
      entityDetails = new EntityDetails();
      entityDetails.addEntity(peDecl);
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({ open: toSToken('<!'), name: toSToken('ge1') }),
      );

      params = {
         entityDetails,
         utils: {
            parseBody: (): void => {
               return undefined;
            },
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

   it('calls back with an shallow copied unchanged value when given an entity value with no references', (done) => {
      expandEntityValue([textPToken], params, (result) => {
         expect(result).toEqual({ errors: [], newValue: [textPToken] });
         expect(result.newValue).not.toBe([textPToken]);
         done();
      });
   });

   it('calls back with no errors when given an entity value with no references', (done) => {
      expandEntityValue([textPToken], params, (result) => {
         expect(result.errors).toEqual([]);
         done();
      });
   });

   it('calls back with an expanded entity value when the referenced entity is already present', (done) => {
      entityDetails.updateDeclaredValue(peDecl, [textPToken], []);

      expandEntityValue([textPToken, peRefPToken], params, (result) => {
         expect(result).toEqual({
            errors: [],
            newValue: [
               textPToken,
               new ParameterEntityStartPToken(peRefPToken),
               textPToken,
               new ParameterEntityEndPToken(peRefPToken),
            ],
         });
         done();
      });
   });

   it('calls back with an expanded entity value when the referenced entity is already present', (done) => {
      entityDetails.updateDeclaredValue(peDecl, [textPToken], []);

      expandEntityValue([textPToken, peRefPToken], params, (result) => {
         expect(result).toEqual({
            errors: [],
            newValue: [
               textPToken,
               new ParameterEntityStartPToken(peRefPToken),
               textPToken,
               new ParameterEntityEndPToken(peRefPToken),
            ],
         });
         done();
      });
   });

   it('calls back with an expanded entity value when the referenced entity is referenced twice', (done) => {
      expandEntityValue([peRefPToken, textPToken, peRefPToken], params, (result) => {
         expect(result).toEqual({
            errors: [],
            newValue: [
               new ParameterEntityStartPToken(peRefPToken),
               textPToken,
               new ParameterEntityEndPToken(peRefPToken),
               textPToken,
               new ParameterEntityStartPToken(peRefPToken),
               textPToken,
               new ParameterEntityEndPToken(peRefPToken),
            ],
         });
         done();
      });
   });

   it('calls back with a value with a raw reference when it can not be found', (done) => {
      params.utils.parseEntityValue = (sTokenSource, done): void => {
         done([]);
      };
      params.utils.retrieveExternalEntity = (externalId, entityMetaData): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}, entityMetaData),
            getErrors: (): Array<XmlError> => [],
         };
      };

      expandEntityValue([textPToken, peRefPToken], params, (result) => {
         expect(result).toEqual({
            errors: [],
            newValue: [
               textPToken,
               new ParameterEntityStartPToken(peRefPToken),
               new ParameterEntityEndPToken(peRefPToken),
            ],
         });
         done();
      });
   });

   it('calls back with an error when a reference can not be found', (done) => {
      params.utils.parseEntityValue = (sTokenSource, done): void => {
         done([]);
      };
      params.utils.retrieveExternalEntity = (externalId, entityMetaData): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}, entityMetaData),
            getErrors: (): Array<XmlError> => [
               new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS),
            ],
         };
      };

      expandEntityValue([textPToken, peRefPToken], params, (result) => {
         expect(result.errors).toEqual([new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS)]);
         done();
      });
   });

   it('does not expand a reference when it references an undeclared entity', (done) => {
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('peBogus'),
      });

      expandEntityValue([peRefPToken, textPToken], params, (result) => {
         expect(result).toEqual({ errors: [], newValue: [peRefPToken, textPToken] });
         done();
      });
   });

   it('does not expand a reference when it has no name', (done) => {
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: undefined,
      });

      expandEntityValue([peRefPToken, textPToken], params, (result) => {
         expect(result).toEqual({ errors: [], newValue: [peRefPToken, textPToken] });
         done();
      });
   });
});
