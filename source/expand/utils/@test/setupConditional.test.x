/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { ENTITY_ID, ConformanceVersion } from 'basic';
import {
   CharRefPToken,
   ParseType,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken, STokenSource } from 'sToken';
import { ConditionalStartPToken, EntityValuePToken } from 'token';

import { ExpandParams } from '../../types';
import * as addProtoReplacementText from '../addProtoReplacementText';
import { setupConditional } from '../setupConditional';
import { EntityDetails } from '../EntityDetails';
import { EntityContextStack } from '../EntityContextStack';

describe('setupConditional() (unit)', () => {
   let deliverSpy: jasmine.Spy;
   let addProtoReplacementTextSpy: jasmine.Spy;
   let testStack: EntityContextStack;
   let params: ExpandParams;
   let testIgnore: TextPToken;
   let testInclude: TextPToken;
   let pieceMealInclude: EntityValuePToken;
   let testDecl: ParameterEntityDeclarationPToken;
   let testRef: ParameterEntityReferencePToken;
   let conditionalStart: ConditionalStartPToken;

   beforeEach(() => {
      testDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('test'),
      });
      testRef = new ParameterEntityReferencePToken({ open: toSToken('%'), name: toSToken('test') });
      conditionalStart = new ConditionalStartPToken({
         open: toSToken('<!['),
         peRef: testRef,
      });
      testStack = new EntityContextStack();
      params = {
         entityDetails: new EntityDetails(),
         confVer: new ConformanceVersion(),
         entityId: {
            type: ENTITY_ID,
            systemId: '',
         },
         loadExternalEntities: true,
         conditionalStack: [],
         utils: {
            parseBody: jasmine.createSpy(),
            parseEntityValue: jasmine.createSpy(),
            resolveEntityId: jasmine.createSpy(),
            retrieveExternalEntity: jasmine.createSpy(),
            parseAttributeValue: jasmine.createSpy(),
         },
      };
      testInclude = new TextPToken({ text: toSToken('INCLUDE') });
      pieceMealInclude = [
         new TextPToken({ text: toSToken('INCLUD') }),
         new CharRefPToken({
            open: toSToken('&#'),
            digits: toSToken('101'),
         }),
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      ];
      testIgnore = new TextPToken({ text: toSToken('IGNORE') });

      deliverSpy = jasmine.createSpy();
      addProtoReplacementTextSpy = spyOn(addProtoReplacementText, 'addProtoReplacementText');

      addProtoReplacementTextSpy.and.callFake((ref, expand, stack, callback) => {
         callback();
      });
   });

   it('calls addProtoReplacementText() with rqeuired parameters', (done) => {
      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         () => {
            const args = addProtoReplacementTextSpy.calls.argsFor(0);

            expect(args[0]).toEqual(testRef);
            expect(args[1]).toEqual(params);
            expect(args[2]).toEqual(testStack);
            expect(args[3]).toBeInstanceOf(Function);
            done();
         },
      );
   });

   it('returns an empty result when there are no details for the specified reference', (done) => {
      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result).toEqual({});
            done();
         },
      );
   });

   it('returns an empty result when there is no proto replacement text for the details', (done) => {
      params.entityDetails.addEntity(testDecl, undefined, '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result).toEqual({});
            done();
         },
      );
   });

   it('returns an empty result when the reference value is ignore', (done) => {
      params.entityDetails.addEntity(testDecl, [testIgnore], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result).toEqual({
               newStart: new ConditionalStartPToken(conditionalStart, {
                  sectionType: toSToken('IGNORE'),
               }),
            });
            done();
         },
      );
   });

   it('returns an empty result when the reference is in the stack', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');
      testStack.pushName(testRef, '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result).toEqual({
               newStart: new ConditionalStartPToken(conditionalStart, {
                  sectionType: testInclude.text,
               }),
            });
            done();
         },
      );
   });

   it('returns an STokenSource when the ref is INCLUDE', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result.source).toBeInstanceOf(STokenSource);
            done();
         },
      );
   });

   it('returns an sToken of INCLUDE when the peref is to include', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result.newStart?.sectionType).toEqual(testInclude.text);
            done();
         },
      );
   });

   it('returns an STokenSource when the ref is INCLUDE across text and charref', (done) => {
      params.entityDetails.addEntity(testDecl, pieceMealInclude, '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            expect(result.source).toBeInstanceOf(STokenSource);
            done();
         },
      );
   });

   it('calls parseBody() with three parameters when it finds INCLUDE', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            setTimeout(() => {
               const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);

               expect(args[0]).toEqual(result.source);
               expect(args[1]).toEqual(ParseType.PARAMETER_ENTITY);
               expect(args[2]).toBeInstanceOf(Function);
               done();
            }, 0);
         },
      );
   });

   it('passes a token through when it is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         () => {
            setTimeout(() => {
               const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
               const callback = args[2];
               // eslint-disable-next-line func-style
               const handled = (): void => {};

               callback(testInclude, handled);

               expect(deliverSpy).toHaveBeenCalledWith(testInclude, handled);
               done();
            }, 0);
         },
      );
   });

   it('calls handled when no value is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         () => {
            setTimeout(() => {
               const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
               const callback = args[2];
               const handled = jasmine.createSpy();

               callback(undefined, handled);

               expect(handled).toHaveBeenCalled();
               done();
            }, 0);
         },
      );
   });

   it('clears the source when no value is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            setTimeout(() => {
               const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
               const callback = args[2];

               callback(undefined, () => {});

               expect(result.source).toBeUndefined();
               done();
            }, 0);
         },
      );
   });

   it('will call the callback if it is set on the result passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude], '');

      setupConditional(
         conditionalStart,
         params,
         testStack,
         ParseType.PARAMETER_ENTITY,
         deliverSpy,
         (result) => {
            result.textIsFinished = jasmine.createSpy();

            setTimeout(() => {
               const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
               const callback = args[2];
               const handled = jasmine.createSpy();

               callback(undefined, handled);

               expect(result.textIsFinished).toHaveBeenCalled();
               done();
            }, 0);
         },
      );
   });
});
