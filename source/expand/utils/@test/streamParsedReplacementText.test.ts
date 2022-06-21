/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, ConformanceVersion, EntityId, Problem } from 'basic';
import {
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
   ParseToken,
} from 'pToken';
import { toSToken, STokenSource } from 'basic';
import { WellFormedError, wellFormedErrorCodes } from 'wellformedness';
import {
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
import { ParseType } from 'pToken';
import { EntityContextStack } from '../EntityContextStack';

function noopFunction(): void {
   // do nothing
}

const WFEID = wellFormedErrorCodes.id;

describe('streamParsedReplacementText() (unit)', () => {
   let entityDetails: EntityDetails;
   let params: ExpandParams;
   let textPToken: TextPToken;
   let stack: EntityContextStack;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      stack = new EntityContextStack();
      entityDetails = new EntityDetails();
      entityDetails.addExternalSubset({
         system: {
            value: [new TextPToken({ text: toSToken('theExternalID') })],
         },
      });

      params = {
         entityDetails,
         entityId: {
            type: ENTITY_ID,
            systemId: '',
         },
         confVer: new ConformanceVersion(),
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
                  sTokenSource: new STokenSource(),
                  getErrors: (): Array<Problem> => [],
               };
            },
            parseAttributeValue: noopFunction,
         },
      };
   });

   function gatherResults(
      token:
         | ParameterEntityReferencePToken
         | GeneralEntityReferencePToken
         | ExternalDtdSubsetPseudoToken,
      deliverResults: (results: Array<ParseToken>) => void,
   ): void {
      const allResults: Array<ParseToken> = [];

      streamParsedReplacementText(token, params, stack, (result, handled) => {
         if (!result) {
            deliverResults(allResults);
         } else {
            allResults.push(result);
         }
         handled();
      });
   }

   it('delivers the external DTD tokens', (done) => {
      params.utils.parseBody = (source, context, cb) => {
         cb(textPToken, () => {
            cb(undefined, noopFunction);
         });
      };

      gatherResults(
         entityDetails.getExternalSubsetReference() as any,
         (results: Array<ParseToken>) => {
            expect(results).toEqual([
               new ExternalSubsetStartToken(),
               textPToken,
               new ExternalSubsetEndToken(),
            ]);
            done();
         },
      );
   });

   it('uses the entityLoc of the external dtd to retrieve it', (done) => {
      spyOn(params.utils, 'resolveEntityId').and.callFake((base: EntityId, entityId: EntityId) => {
         return `[${entityId.systemId}]`;
      });
      const retrieveSpy = spyOn(params.utils, 'retrieveExternalEntity').and.callThrough();
      params.utils.parseBody = (source, context, cb) => {
         cb(undefined, () => {});
      };

      gatherResults(entityDetails.getExternalSubsetReference() as any, () => {
         expect(retrieveSpy).toHaveBeenCalledWith('[theExternalID]');
         done();
      });
   });

   it('does not deliver the external DTD tokens when loadExternalEntities is false', (done) => {
      params.loadExternalEntities = false;
      const input = entityDetails.getExternalSubsetReference() as any;

      gatherResults(input, (results: Array<ParseToken>) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('delivers nothing if the token has not been declared', (done) => {
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge2'),
      });

      gatherResults(geRef, (results: Array<ParseToken>) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('delivers any errors before the end token', (done) => {
      const error1 = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['x']);
      const error2 = new WellFormedError(WFEID.XMLDECL_NO_CLOSE, ['x']);
      params.utils.parseBody = (source, context, cb) => {
         cb(textPToken, () => {
            cb(undefined, noopFunction);
         });
      };
      params.utils.retrieveExternalEntity = (): RetrieveResults => {
         return {
            sTokenSource: new STokenSource(),
            getErrors: (): Array<any> => [error1, error2],
         };
      };

      gatherResults(
         entityDetails.getExternalSubsetReference() as any,
         (results: Array<ParseToken>) => {
            expect(results as any).toEqual([
               new ExternalSubsetStartToken(),
               textPToken,
               error1,
               error2,
               new ExternalSubsetEndToken(),
            ]);
            done();
         },
      );
   });

   it('calls the retrieveExternalEntity utility with the location of the entity', (done) => {
      const retrieveSpy = spyOn(params.utils, 'retrieveExternalEntity').and.callThrough();
      params.utils.parseBody = (source, context, cb) => {
         cb(undefined, noopFunction);
      };
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge'),
      });
      entityDetails.addEntity(geDecl, undefined, 'the location');
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      gatherResults(geRef, () => {
         expect(retrieveSpy).toHaveBeenCalledWith('the location');
         done();
      });
   });

   it('pushes the reference on the context stack and then pops it when done', (done) => {
      let midstreamCount = 0;
      const pushSpy = spyOn(stack, 'pushName').and.callThrough();
      const popSpy = spyOn(stack, 'popName').and.callThrough();
      params.utils.parseBody = (source, context, cb) => {
         midstreamCount = popSpy.calls.count();
         cb(undefined, noopFunction);
      };
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge'),
      });
      entityDetails.addEntity(geDecl, undefined, 'the location');
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      gatherResults(geRef, () => {
         expect(pushSpy).toHaveBeenCalledWith(geRef, 'the location');
         expect(midstreamCount).toEqual(0);
         expect(popSpy).toHaveBeenCalledWith(geRef);
         done();
      });
   });

   it('calls parseBody() with the content from the internal ge declaration and that it is in the content', () => {
      const parseBodySpy = spyOn(params.utils, 'parseBody');
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge'),
      });
      entityDetails.addEntity(geDecl, [textPToken], '');
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      streamParsedReplacementText(geRef, params, stack, (value, cb) => {
         cb();
      });

      const args = parseBodySpy.calls.argsFor(0);
      expect(args[0] instanceof STokenSource).toEqual(true);
      expect(args[0].segments[0].text).toEqual('foo');
      expect(args[1]).toEqual(ParseType.GENERAL_ENTITY);
      expect(typeof args[2]).toEqual('function');
   });

   it('delivers the parsed content of an already prepared entity wrapped in a start and end general entity', (done) => {
      params.utils.parseBody = (source, context, cb) => {
         cb(textPToken, () => {
            cb(undefined, noopFunction);
         });
      };
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge'),
      });
      entityDetails.addEntity(geDecl, [textPToken], '');
      const geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge'),
      });

      gatherResults(geRef, (results: Array<ParseToken>) => {
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

      gatherResults(geRef, (results: Array<ParseToken>) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('calls parseBody() with the content from the external PE declaration and that it is not in the content', () => {
      const parseBodySpy = spyOn(params.utils, 'parseBody');
      const sTokenSource: STokenSource = { fake: true, setConfVer: () => {} } as any;
      const peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe'),
         externalId: {},
      });
      entityDetails.addEntity(peDecl, undefined, '');
      const peRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('pe'),
      });
      const resolveSpy = spyOn(params.utils, 'resolveEntityId');
      const retrieveSpy = spyOn(params.utils, 'retrieveExternalEntity');
      retrieveSpy.and.returnValue({
         sTokenSource,
         getErrors: (): Array<Problem> => [],
      });

      streamParsedReplacementText(peRef, params, stack, (value, cb) => {
         cb();
      });

      const args = parseBodySpy.calls.argsFor(0);
      expect(args[0]).toEqual(sTokenSource);
      expect(args[1]).toEqual(ParseType.PARAMETER_ENTITY);
      expect(typeof args[2]).toEqual('function');
   });

   it('delivers the parsed content of an already prepared entity wrapped in a start and end parameter entity', (done) => {
      params.utils.parseBody = (source, context, cb) => {
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
      entityDetails.addEntity(peDecl, [textPToken], '');
      const peRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('pe'),
      });

      gatherResults(peRef, (results: Array<ParseToken>) => {
         expect(results).toEqual([
            new ParameterEntityStartPToken(peRef),
            textPToken,
            new ParameterEntityEndPToken(peRef),
         ]);
         done();
      });
   });
});
