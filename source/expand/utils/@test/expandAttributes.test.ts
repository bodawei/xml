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
   ElidedEntityDeclarationPToken,
} from 'token';

import { expandAttributes } from '../expandAttributes';
import { ExpandParams, RetrieveResults, AttributeValueResults } from '../../types';
import { WellFormedError } from 'error';
import { lookupPredefinedEntityValue } from '../lookupPredefinedEntityValue';
import * as addProtoReplacementText from '../addProtoReplacementText';
import { EntityDetails } from '../EntityDetails';
import { EntityNameStack } from '../EntityNameStack';

describe('expandAttributes() (unit)', () => {
   let entityDetails: EntityDetails;
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

      entityDetails = new EntityDetails();
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('ge1'),
            value: [text2PToken],
         }),
         [text2PToken],
      );

      params = {
         emd: new EntityMetaData(),
         entityDetails,
         conditionalStack: [],
         loadExternalEntities: true,
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
      };
   });

   it('calls back with a copy of the set of attribute values when it contains no general entity references', (done) => {
      expandAttributes([{ value: [textPToken] }], params, new EntityNameStack(), (result) => {
         expect(result).toEqualShallowDifferent([{ newValue: [textPToken], byproducts: [] }]);
         done();
      });
   });

   it('calls back with the original GE Ref when there is no declaration', (done) => {
      const bogus = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('bogus'),
      });

      expandAttributes(
         [{ value: [textPToken, bogus] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([textPToken, bogus]);
            done();
         },
      );
   });

   it('calls back with multiple attribute values populated', (done) => {
      const bogus = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('bogus'),
      });

      expandAttributes(
         [{ value: [textPToken, bogus] }, { value: [textPToken, bogus] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([textPToken, bogus]);
            expect(result[1].newValue).toEqual([textPToken, bogus]);
            done();
         },
      );
   });

   it('calls back with a predefined entity value even when that was not declared', (done) => {
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValueResults) => void,
      ): void => {
         done({ newValue: [new TextPToken({ text: toSToken('<') })], errors: [] });
      };
      const ltRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('lt'),
      });

      expandAttributes(
         [{ value: [textPToken, ltRef] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([
               textPToken,
               new GeneralEntityStartPToken(ltRef),
               new TextPToken({ text: toSToken('<') }),
               new GeneralEntityEndPToken(ltRef),
            ]);
            done();
         },
      );
   });

   it('calls back with the original GE Ref when the declaration is of an unparsed entity', (done) => {
      const unparsedRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('unparsed'),
      });
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('unparsed'),
            nData: toSToken('NDATA'),
         }),
      );

      expandAttributes(
         [{ value: [textPToken, unparsedRef] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([textPToken, unparsedRef]);
            done();
         },
      );
   });

   it('calls back with the original refernce if it can not be parsed for some reason', (done) => {
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValueResults) => void,
      ): void => {
         done({ newValue: undefined, errors: [] });
      };

      expandAttributes(
         [{ value: [textPToken, geRefPToken] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([textPToken, geRefPToken]);
            done();
         },
      );
   });

   it('calls back with the original refernce if it has no name', (done) => {
      const namlessGERef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
      });

      expandAttributes(
         [{ value: [textPToken, namlessGERef] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([textPToken, namlessGERef]);
            done();
         },
      );
   });

   it('calls back with the a copy of the general entity reference when there is a recursive call within the attribute itsel (§4.1.0)', (done) => {
      const firstGeRefPToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge2'),
      });
      const anotherGeRefPToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge2'),
      });
      const sourceToken = new TextPToken({ text: toSToken('&ge2;') });
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('ge2'),
            value: [sourceToken],
         }),
         [sourceToken],
      );
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValueResults) => void,
      ): void => {
         done({ newValue: [anotherGeRefPToken], errors: [] });
      };

      expandAttributes(
         [{ value: [textPToken, firstGeRefPToken] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([
               textPToken,
               new GeneralEntityStartPToken(firstGeRefPToken, [sourceToken]),
               anotherGeRefPToken,
               new GeneralEntityEndPToken(firstGeRefPToken, [sourceToken]),
            ]);
            done();
         },
      );
   });

   it('calls back with the a copy of the general entity reference when there is recursive call from outside the attribute (§4.1.0)', (done) => {
      const anotherGeRefPToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge2'),
      });
      const sourceToken = new TextPToken({ text: toSToken('&ge2;') });
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('ge2'),
            value: [sourceToken],
         }),
         [sourceToken],
      );

      expandAttributes(
         [{ value: [textPToken, anotherGeRefPToken] }],
         params,
         new EntityNameStack().cloneWithGEName('ge2'),
         (result) => {
            expect(result[0].newValue).toEqual([textPToken, anotherGeRefPToken]);
            done();
         },
      );
   });

   it('calls back with the entity parsed as an attribute value when the general entity exists', (done) => {
      const pToken = new TextPToken({ text: toSToken('INNER PARSE') });
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValueResults) => void,
      ): void => {
         done({ newValue: [pToken], errors: [] });
      };

      expandAttributes(
         [{ value: [textPToken, geRefPToken] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([
               textPToken,
               new GeneralEntityStartPToken(geRefPToken, [text2PToken]),
               pToken,
               new GeneralEntityEndPToken(geRefPToken, [text2PToken]),
            ]);
            done();
         },
      );
   });

   it('calls back with the parsed contents when the entity can not be loaded', (done) => {
      const attrError = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
      const unloadable = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('unloadable'),
      });
      entityDetails.addEntity(
         new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('unloadable'),
         }),
      );
      const addProtoReplacementTextSpy = spyOn(addProtoReplacementText, 'addProtoReplacementText');
      addProtoReplacementTextSpy.and.callFake(
         (
            a: any,
            b: any,
            chain: any,
            callback: (result: {
               byproducts: Array<XmlError | ElidedEntityDeclarationPToken>;
            }) => void,
         ) => {
            callback({ byproducts: [attrError] });
         },
      );

      expandAttributes(
         [{ value: [textPToken, unloadable] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result).toEqual([
               {
                  newValue: [textPToken, unloadable],
                  byproducts: [attrError],
               },
            ]);
            done();
         },
      );
   });

   it('calls back with the entity parsed as an attribute value when the general entity is loaded', (done) => {
      const pToken = new TextPToken({ text: toSToken('INNER PARSE') });
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValueResults) => void,
      ): void => {
         done({ newValue: [pToken], errors: [] });
      };

      expandAttributes(
         [{ value: [textPToken, geRefPToken] }],
         params,
         new EntityNameStack(),
         (result) => {
            expect(result[0].newValue).toEqual([
               textPToken,
               new GeneralEntityStartPToken(geRefPToken, [pToken]),
               pToken,
               new GeneralEntityEndPToken(geRefPToken, [pToken]),
            ]);
            done();
         },
      );
   });

   describe('error reporting', () => {
      it('calls back with no errors when there is no declaration', (done) => {
         const bogus = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('bogus'),
         });

         expandAttributes(
            [{ value: [textPToken, bogus] }],
            params,
            new EntityNameStack(),
            (results) => {
               expect(results[0].byproducts).toEqual([]);
               done();
            },
         );
      });

      it('calls back with errors from parsing the geref contents as an attribute value', (done) => {
         const attrError = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
         params.utils.parseAttributeValue = (
            sTokenSource: STokenSource,
            done: (results: AttributeValueResults) => void,
         ): void => {
            done({ newValue: [textPToken], errors: [attrError] });
         };

         expandAttributes(
            [{ value: [textPToken, geRefPToken] }],
            params,
            new EntityNameStack(),
            (result) => {
               expect(result[0].byproducts).toEqual([attrError]);
               done();
            },
         );
      });

      it('calls back with errors from loading an external entity', (done) => {
         const geExternalRefPToken = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('external'),
         });
         entityDetails.addEntity(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('external'),
               externalId: {} as any,
            }),
         );
         const loadingError = new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, ['foo']);
         const addProtoReplacementTextSpy = spyOn(
            addProtoReplacementText,
            'addProtoReplacementText',
         );
         addProtoReplacementTextSpy.and.callFake(
            (
               a: any,
               b: any,
               chain: any,
               callback: (result: {
                  byproducts: Array<XmlError | ElidedEntityDeclarationPToken>;
               }) => void,
            ) => {
               callback({ byproducts: [loadingError] });
            },
         );
         params.utils.parseAttributeValue = (
            sTokenSource: STokenSource,
            done: (results: AttributeValueResults) => void,
         ): void => {
            done({ newValue: [textPToken], errors: [] });
         };

         expandAttributes(
            [{ value: [textPToken, geExternalRefPToken] }],
            params,
            new EntityNameStack(),
            (results) => {
               expect(results[0].byproducts).toEqual([loadingError]);
               done();
            },
         );
      });
   });

   it('calls back with errors from two levels of entity reference parsing and a loading error', (done) => {
      const attrError1 = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS, []);
      const attrError2 = new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, ['foo']);
      const loadingError = new WellFormedError(WellFormedError.ID.TOKEN_INVALID_CONTEXT, ['foo']);
      const get2Decl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge2'),
      });
      const ge2Value = new TextPToken({ text: toSToken('ge2Value') });
      const ge2Ref = new GeneralEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('ge2'),
      });
      let ctr = 0;
      entityDetails.addEntity(get2Decl);
      const addProtoReplacementTextSpy = spyOn(addProtoReplacementText, 'addProtoReplacementText');
      addProtoReplacementTextSpy.and.callFake(
         (
            a: any,
            b: any,
            chain: any,
            callback: (result: {
               byproducts: Array<XmlError | ElidedEntityDeclarationPToken>;
            }) => void,
         ) => {
            entityDetails.updateDeclaredValue(get2Decl, [ge2Value], []);
            callback({ byproducts: [loadingError] });
         },
      );
      params.utils.parseAttributeValue = (
         sTokenSource: STokenSource,
         done: (results: AttributeValueResults) => void,
      ): void => {
         if (ctr === 0) {
            ctr++;
            done({ newValue: [ge2Ref], errors: [attrError1] });
            return;
         }
         done({ newValue: [textPToken], errors: [attrError2] });
      };

      expandAttributes(
         [{ value: [textPToken, geRefPToken] }],
         params,
         new EntityNameStack(),
         (results) => {
            expect(results[0].byproducts).toEqual([attrError1, loadingError, attrError2]);
            done();
         },
      );
   });
});
