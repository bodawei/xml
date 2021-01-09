/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, ConformanceVersion } from 'basic';
import { WellFormedError } from 'error';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
} from 'pToken';
import { toSToken, STokenSource } from 'sToken';
import {
   ElidedEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
   XmlError,
} from 'token';

import { expandEntityValue } from '../expandEntityValue';
import { ExpandParams, RetrieveResults } from '../../types';
import { EntityDetails } from '../EntityDetails';
import { EntityContextStack } from '../EntityContextStack';

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
         externalId: {},
      });
      entityDetails = new EntityDetails();
      entityDetails.addEntity(peDecl, undefined, '');
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({ open: toSToken('<!'), name: toSToken('ge1') }),
         undefined,
         '',
      );

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
            parseBody: (): void => {
               return undefined;
            },
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

   it('calls back with an shallow copied unchanged value when given an entity value with no references', (done) => {
      expandEntityValue([textPToken], params, new EntityContextStack(), (result) => {
         expect(result.newValue).toEqual([textPToken]);
         expect(result.newValue).not.toBe([textPToken]);
         done();
      });
   });

   it('calls back with no errors when given an entity value with no references', (done) => {
      expandEntityValue([textPToken], params, new EntityContextStack(), (result) => {
         expect(result.byproducts).toEqual([]);
         done();
      });
   });

   it('calls back with an expanded entity value when the referenced entity is already present', (done) => {
      entityDetails.updateDeclaredValue(peDecl, [textPToken], []);

      expandEntityValue([textPToken, peRefPToken], params, new EntityContextStack(), (result) => {
         expect(result).toEqual({
            byproducts: [],
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
      expandEntityValue(
         [peRefPToken, textPToken, peRefPToken],
         params,
         new EntityContextStack(),
         (result) => {
            expect(result).toEqual({
               byproducts: [new ElidedEntityDeclarationPToken(peDecl, [textPToken])],
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
         },
      );
   });

   it('calls back with a value with a raw reference when it can not be found', (done) => {
      params.utils.parseEntityValue = (sTokenSource, done): void => {
         done([]);
      };
      params.utils.retrieveExternalEntity = (): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}),
            getErrors: (): Array<XmlError> => [],
         };
      };

      expandEntityValue([textPToken, peRefPToken], params, new EntityContextStack(), (result) => {
         expect(result).toEqual({
            byproducts: [new ElidedEntityDeclarationPToken(peDecl, [])],
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
      params.utils.retrieveExternalEntity = (): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}),
            getErrors: (): Array<XmlError> => [
               new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS),
            ],
         };
      };

      expandEntityValue([textPToken, peRefPToken], params, new EntityContextStack(), (result) => {
         expect(result.byproducts).toEqual([
            new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS),
            new ElidedEntityDeclarationPToken(peDecl, []),
         ]);
         done();
      });
   });

   it('does not expand a reference when it references an undeclared entity', (done) => {
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('peBogus'),
      });

      expandEntityValue([peRefPToken, textPToken], params, new EntityContextStack(), (result) => {
         expect(result).toEqual({
            byproducts: [],
            newValue: [peRefPToken, textPToken],
         });
         done();
      });
   });

   it('does not expand a reference when it has no name', (done) => {
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: undefined,
      });

      expandEntityValue([peRefPToken, textPToken], params, new EntityContextStack(), (result) => {
         expect(result).toEqual({
            byproducts: [],
            newValue: [peRefPToken, textPToken],
         });
         done();
      });
   });

   it('does not expand a reference when is already in the process of being expanded (§4.1.0)', (done) => {
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('already'),
      });

      expandEntityValue(
         [peRefPToken, textPToken],
         params,
         new EntityContextStack().cloneWithRef(peRefPToken, ''),
         (result) => {
            expect(result).toEqual({
               byproducts: [],
               newValue: [peRefPToken, textPToken],
            });
            done();
         },
      );
   });

   it('does not expand a reference that then references itself (§4.1.0)', (done) => {
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('recur'),
      });
      const second = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('recur'),
      });
      peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('recur'),
         value: [second],
      });
      entityDetails.addEntity(peDecl, undefined, '');
      entityDetails.updateDeclaredValue(peDecl, [second], []);
      params.utils.parseEntityValue = (sTokenSource, done): void => {
         done([second]);
      };
      params.utils.retrieveExternalEntity = (): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}),
            getErrors: (): Array<XmlError> => [],
         };
      };

      expandEntityValue([peRefPToken, textPToken], params, new EntityContextStack(), (result) => {
         expect(result).toEqual({
            byproducts: [],
            newValue: [
               new ParameterEntityStartPToken(peRefPToken),
               second,
               new ParameterEntityEndPToken(peRefPToken),
               textPToken,
            ],
         });
         done();
      });
   });
});
