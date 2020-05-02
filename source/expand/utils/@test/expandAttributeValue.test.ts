/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { toSToken, STokenSource } from 'sToken';
import {
   AttributeValuePToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityEndPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   TextPToken,
   XmlError,
} from 'token';

import { expandAttributeValue } from '../expandAttributeValue';
import { ExpandParams, RetrieveResults } from '../../types';
import { WellFormedError } from 'error';
import { lookupPredefinedValue } from '../predefinedEntities';

fdescribe('expandAttributeValue() (unit)', () => {
   let params: ExpandParams;
   let textPToken: TextPToken;
   let text2PToken: TextPToken;
   let geRefPToken: GeneralEntityReferencePToken;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      text2PToken = new TextPToken({ text: toSToken('two') });
      geRefPToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge1'),
      });

      params = {
         peDeclCache: {},
         geDeclCache: {
            ge1: {
               token: new GeneralEntityDeclarationPToken({ open: toSToken('<!') }),
               isInternal: true,
               isUnparsed: false,
               valueCache: [text2PToken],
            },
         },
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

   it('calls back with a copy of the attribute value when it contains no general entity references', (done) => {
      expandAttributeValue([textPToken], params, ({ newValue }) => {
         expect(newValue).toEqualShallowDifferent([textPToken]);
         done();
      });
   });

   it('calls back with the original GE Ref when there is no declaration', (done) => {
      const bogus = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('bogus'),
      });

      expandAttributeValue([textPToken, bogus], params, (result) => {
         expect(result.newValue).toEqual([textPToken, bogus]);
         done();
      });
   });

   it('calls back with a predefined entity value even when that was not declared', (done) => {
      const ltRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('lt'),
      });
      const ltEntityValue = lookupPredefinedValue('lt');

      expandAttributeValue([textPToken, ltRef], params, (result) => {
         expect(result.newValue).toEqual([
            textPToken,
            new GeneralEntityStartPToken(ltRef, ltEntityValue),
            ...(ltEntityValue as AttributeValuePToken),
            new GeneralEntityEndPToken(ltRef, ltEntityValue),
         ]);
         done();
      });
   });

   it('calls back with the original GE Ref when the declaration is of an unparsed entity', (done) => {
      params.geDeclCache.ge1.isUnparsed = true;

      expandAttributeValue([textPToken, geRefPToken], params, (result) => {
         expect(result.newValue).toEqual([textPToken, geRefPToken]);
         done();
      });
   });

   it('calls back with the original refernce if it can not be parsed for some reason', (done) => {
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
      ): void => {
         done(undefined, []);
      };

      expandAttributeValue([textPToken, geRefPToken], params, (result) => {
         expect(result.newValue).toEqual([textPToken, geRefPToken]);
         done();
      });
   });

   it('calls back with the original refernce if it has no name', (done) => {
      const namlessGERef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
      });

      expandAttributeValue([textPToken, namlessGERef], params, (result) => {
         expect(result.newValue).toEqual([textPToken, namlessGERef]);
         done();
      });
   });

   it('calls back with the a copy of the general entity reference when this is a recursive call', (done) => {
      const pToken = geRefPToken;
      const sourceToken = new TextPToken({ text: toSToken('&ge1;') });
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
      ): void => {
         done([pToken], []);
      };

      expandAttributeValue([textPToken, geRefPToken], params, (result) => {
         expect(result.newValue).toEqual([
            textPToken,
            new GeneralEntityStartPToken(geRefPToken, [sourceToken]),
            pToken,
            new GeneralEntityEndPToken(geRefPToken, [sourceToken]),
         ]);
         done();
      });
   });

   it('calls back with the entity parsed as an attribute value when the general entity exists', (done) => {
      const pToken = new TextPToken({ text: toSToken('INNER PARSE') });
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
      ): void => {
         done([pToken], []);
      };

      expandAttributeValue([textPToken, geRefPToken], params, (result) => {
         expect(result.newValue).toEqual([
            textPToken,
            new GeneralEntityStartPToken(geRefPToken, [pToken]),
            pToken,
            new GeneralEntityEndPToken(geRefPToken, [pToken]),
         ]);
         done();
      });
   });

   it('calls back with the a with the parsed contents when the entity can not be loaded', (done) => {
      delete params.geDeclCache.ge1.valueCache;
      params.utils.parseEntityValue = (sTokenSource, done): void => {
         done();
      };

      expandAttributeValue([textPToken, geRefPToken], params, (result) => {
         expect(result.newValue).toEqual([textPToken, geRefPToken]);
         done();
      });
   });

   it('calls back with the entity parsed as an attribute value when the general entity is loaded', (done) => {
      delete params.geDeclCache.ge1.valueCache;
      const pToken = new TextPToken({ text: toSToken('INNER PARSE') });
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
      ): void => {
         done([pToken], []);
      };

      expandAttributeValue([textPToken, geRefPToken], params, (result) => {
         expect(result.newValue).toEqual([
            textPToken,
            new GeneralEntityStartPToken(geRefPToken, [pToken]),
            pToken,
            new GeneralEntityEndPToken(geRefPToken, [pToken]),
         ]);
         done();
      });
   });

   describe('error reporting', () => {
      it('calls back with no errors when there is no declaration', (done) => {
         const bogus = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('bogus'),
         });

         expandAttributeValue([textPToken, bogus], params, ({ errors }) => {
            expect(errors).toEqual([]);
            done();
         });
      });

      it('calls back with errors from parsing the geref contents as an attribute value', (done) => {
         const attrError = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
         params.utils.parseAttributeValue = (
            sTokenSource: STokenSource,
            done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
         ): void => {
            done([textPToken], [attrError]);
         };

         expandAttributeValue([textPToken, geRefPToken], params, ({ errors }) => {
            expect(errors).toEqual([attrError]);
            done();
         });
      });

      it('calls back with errors from loading an external entity', (done) => {
         delete params.geDeclCache.ge1.valueCache;
         const loadingError = new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, ['foo']);
         params.utils.retrieveExternalEntity = (externalId, entityMetaData): RetrieveResults => {
            return {
               sTokenSource: new STokenSource({}, entityMetaData),
               getErrors: (): Array<XmlError> => [loadingError],
            };
         };
         params.utils.parseAttributeValue = (
            sTokenSource: STokenSource,
            done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
         ): void => {
            done([textPToken], []);
         };

         expandAttributeValue([textPToken, geRefPToken], params, ({ errors }) => {
            expect(errors).toEqual([loadingError]);
            done();
         });
      });
   });

   it('calls back with errors from two levels of entity reference parsing and a loading error', (done) => {
      const attrError1 = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
      const attrError2 = new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, ['foo']);
      const loadingError = new WellFormedError(WellFormedError.ID.TOKEN_INVALID_CONTEXT, ['foo']);
      const ge2RefPToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge2'),
      });
      let ctr = 0;
      params.geDeclCache.ge2 = {
         token: new GeneralEntityDeclarationPToken({ open: toSToken('<!') }),
         isInternal: true,
         isUnparsed: false,
      };
      params.utils.retrieveExternalEntity = (externalId, entityMetaData): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}, entityMetaData),
            getErrors: (): Array<XmlError> => [loadingError],
         };
      };
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
      ): void => {
         if (ctr === 0) {
            ctr++;
            done([ge2RefPToken], [attrError1]);
         }
         done([textPToken], [attrError2]);
      };

      expandAttributeValue([textPToken, geRefPToken], params, ({ errors }) => {
         expect(errors).toEqual([attrError1, loadingError, attrError2]);
         done();
      });
   });
});
