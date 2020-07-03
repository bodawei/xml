/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { toSToken, STokenSource } from 'sToken';
import {
   EXTERNAL_ID,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   PToken,
   TextPToken,
   XmlError,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
} from 'token';

import { ExpandParams, RetrieveResults } from '../../types';
import { EntityDetails } from '../EntityDetails';
import { ExternalDtdSubsetPseudoToken } from '../ExternalDtdSubsetPseudoToken';
import { streamParsedReplacementText } from '../streamParsedReplacementText';

function noopFunction(): void {
   // do nothing
}

describe('streamParsedReplacementText() (unit)', () => {
   let entityDetails: EntityDetails;
   let params: ExpandParams;
   let textPToken: TextPToken;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      entityDetails = new EntityDetails();
      entityDetails.addExternalSubset({
         type: EXTERNAL_ID,
      });

      params = {
         entityDetails,
         loadExternalEntities: true,
         conditionalStack: [],
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
            parseAttributeValue: noopFunction,
         },
         emd: new EntityMetaData(),
      };
   });

   function gatherResults(
      token:
         | ParameterEntityReferencePToken
         | GeneralEntityReferencePToken
         | ExternalDtdSubsetPseudoToken,
      deliverResults: (results: Array<PToken>) => void,
   ): void {
      const allResults: Array<PToken> = [];

      streamParsedReplacementText(token, params, (result, handled) => {
         if (!result) {
            deliverResults(allResults);
         } else {
            allResults.push(result);
         }
         handled();
      });
   }

   it('delivers the external DTD tokens', (done) => {
      params.utils.parseBody = (source, inContent, cb) => {
         cb(textPToken, () => {
            cb(undefined, noopFunction);
         });
      };

      gatherResults(entityDetails.getExternalSubsetReference() as any, (results: Array<PToken>) => {
         expect(results).toEqual([
            new ExternalSubsetStartToken(),
            textPToken,
            new ExternalSubsetEndToken(),
         ]);
         done();
      });
   });

   it('does not deliver the external DTD tokens when loadExternalEntities is false', (done) => {
      params.loadExternalEntities = false;
      const input = entityDetails.getExternalSubsetReference() as any;

      gatherResults(input, (results: Array<PToken>) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('delivers nothing if the token has not been declared', (done) => {
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge2'),
      });

      gatherResults(geRef, (results: Array<PToken>) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('delivers any errors before the end token', (done) => {
      const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['x']);
      const error2 = new WellFormedError(WellFormedError.ID.XMLDECL_NO_CLOSE, ['x']);
      params.utils.parseBody = (source, inContent, cb) => {
         cb(textPToken, () => {
            cb(undefined, noopFunction);
         });
      };
      params.utils.retrieveExternalEntity = (externalId, entityMetaData): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}, entityMetaData),
            getErrors: (): Array<XmlError> => [error1, error2],
         };
      };

      gatherResults(entityDetails.getExternalSubsetReference() as any, (results: Array<PToken>) => {
         expect(results).toEqual([
            new ExternalSubsetStartToken(),
            textPToken,
            error1,
            error2,
            new ExternalSubsetEndToken(),
         ]);
         done();
      });
   });

   it('calls parseBody() with the content from the internal ge declaration and that it is in the content', () => {
      const parseBodySpy = spyOn(params.utils, 'parseBody');
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge'),
      });
      entityDetails.addEntity(geDecl, [textPToken]);
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      streamParsedReplacementText(geRef, params, (value, cb) => {
         cb();
      });

      const args = parseBodySpy.calls.argsFor(0);
      expect(args[0]).toBeInstanceOf(STokenSource);
      expect(args[0]._segments[0].text).toEqual('foo');
      expect(args[1]).toEqual(true);
      expect(args[2]).toBeInstanceOf(Function);
   });

   it('delivers the parsed content of an already prepared entity wrapped in a start and end general entity', (done) => {
      params.utils.parseBody = (source, inContent, cb) => {
         cb(textPToken, () => {
            cb(undefined, noopFunction);
         });
      };
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge'),
      });
      entityDetails.addEntity(geDecl, [textPToken]);
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      gatherResults(geRef, (results: Array<PToken>) => {
         expect(results).toEqual([
            new GeneralEntityStartPToken(geRef),
            textPToken,
            new GeneralEntityEndPToken(geRef),
         ]);
         done();
      });
   });

   it('does not deliver any entity content when loadExternalEntities is false', (done) => {
      params.loadExternalEntities = false;
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      gatherResults(geRef, (results: Array<PToken>) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('calls parseBody() with the content from the external PE declaration and that it is not in the content', () => {
      const parseBodySpy = spyOn(params.utils, 'parseBody');
      const sTokenSource: STokenSource = { fake: true } as any;
      const peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe'),
         externalId: {
            type: EXTERNAL_ID,
         },
      });
      entityDetails.addEntity(peDecl);
      const peRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('pe'),
      });
      const retrieveSpy = spyOn(params.utils, 'retrieveExternalEntity');
      retrieveSpy.and.returnValue({
         sTokenSource,
         getErrors: (): Array<XmlError> => [],
      });

      streamParsedReplacementText(peRef, params, (value, cb) => {
         cb();
      });

      expect(retrieveSpy).toHaveBeenCalledWith({ type: EXTERNAL_ID }, params.emd);
      const args = parseBodySpy.calls.argsFor(0);
      expect(args[0]).toEqual(sTokenSource);
      expect(args[1]).toEqual(false);
      expect(args[2]).toBeInstanceOf(Function);
   });

   it('delivers the parsed content of an already prepared entity wrapped in a start and end parameter entity', (done) => {
      params.utils.parseBody = (source, inContent, cb) => {
         cb(textPToken, () => {
            cb(undefined, () => {
               // do nothing
            });
         });
      };
      const peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe'),
      });
      entityDetails.addEntity(peDecl, [textPToken]);
      const peRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('pe'),
      });

      gatherResults(peRef, (results: Array<PToken>) => {
         expect(results).toEqual([
            new ParameterEntityStartPToken(peRef),
            textPToken,
            new ParameterEntityEndPToken(peRef),
         ]);
         done();
      });
   });
});
