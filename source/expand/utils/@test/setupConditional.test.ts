/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { toSToken, STokenSource } from 'sToken';
import {
   TextPToken,
   ParameterEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   CharRefPToken,
   EntityValuePToken,
} from 'token';

import { ExpandParams } from '../../types';
import * as addProtoReplacementText from '../addProtoReplacementText';
import { setupConditional } from '../setupConditional';
import { EntityDetails } from '../EntityDetails';
import { EntityNameStack } from '../EntityNameStack';

describe('setupConditional() (unit)', () => {
   let deliverSpy: jasmine.Spy;
   let addProtoReplacementTextSpy: jasmine.Spy;
   let testStack: EntityNameStack;
   let params: ExpandParams;
   let testIgnore: TextPToken;
   let testInclude: TextPToken;
   let pieceMealInclude: EntityValuePToken;
   let testDecl: ParameterEntityDeclarationPToken;
   let testRef: ParameterEntityReferencePToken;

   beforeEach(() => {
      testDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('test'),
      });
      testRef = new ParameterEntityReferencePToken({ open: toSToken('%'), name: toSToken('test') });
      testStack = new EntityNameStack();
      params = {
         entityDetails: new EntityDetails(),
         emd: new EntityMetaData(),
         loadExternalEntities: true,
         conditionalStack: [],
         utils: {
            parseBody: jasmine.createSpy(),
            parseEntityValue: jasmine.createSpy(),
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
      setupConditional(testRef, params, testStack, true, deliverSpy, () => {
         const args = addProtoReplacementTextSpy.calls.argsFor(0);

         expect(args[0]).toEqual(testRef);
         expect(args[1]).toEqual(params);
         expect(args[2]).toEqual(testStack);
         expect(args[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('returns an empty result when there are no details for the specified reference', (done) => {
      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result).toEqual({});
         done();
      });
   });

   it('returns an empty result when there is no proto replacement text for the details', (done) => {
      params.entityDetails.addEntity(testDecl);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result).toEqual({});
         done();
      });
   });

   it('returns an empty result when the reference value is ignore', (done) => {
      params.entityDetails.addEntity(testDecl, [testIgnore]);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result).toEqual({
            sectionType: toSToken('IGNORE'),
         });
         done();
      });
   });

   it('returns an empty result when the reference is in the stack', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);
      testStack.pushPEName('test');

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result).toEqual({
            sectionType: testInclude.text,
         });
         done();
      });
   });

   it('returns an STokenSource when the ref is INCLUDE', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result.source).toBeInstanceOf(STokenSource);
         done();
      });
   });

   it('returns an sToken of INCLUDE when the peref is to include', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result.sectionType).toEqual(testInclude.text);
         done();
      });
   });

   it('returns an STokenSource when the ref is INCLUDE across text and charref', (done) => {
      params.entityDetails.addEntity(testDecl, pieceMealInclude);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         expect(result.source).toBeInstanceOf(STokenSource);
         done();
      });
   });

   it('calls parseBody() with three parameters when it finds INCLUDE', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);

            expect(args[0]).toEqual(result.source);
            expect(args[1]).toEqual(true);
            expect(args[2]).toBeInstanceOf(Function);
            done();
         }, 0);
      });
   });

   it('passes a token through when it is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, () => {
         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
            const callback = args[2];
            // eslint-disable-next-line func-style
            const handled = (): void => {};

            callback(testInclude, handled);

            expect(deliverSpy).toHaveBeenCalledWith(testInclude, handled);
            done();
         }, 0);
      });
   });

   it('does not pass the entity metadata through when it is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, () => {
         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
            const callback = args[2];

            callback(new EntityMetaData(), (): void => {});

            expect(deliverSpy).not.toHaveBeenCalled();
            done();
         }, 0);
      });
   });

   it('calls handled when the entity metadata is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, () => {
         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
            const callback = args[2];
            const handled = jasmine.createSpy();

            callback(new EntityMetaData(), handled);

            expect(handled).toHaveBeenCalled();
            done();
         }, 0);
      });
   });

   it('calls handled when no value is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, () => {
         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
            const callback = args[2];
            const handled = jasmine.createSpy();

            callback(undefined, handled);

            expect(handled).toHaveBeenCalled();
            done();
         }, 0);
      });
   });

   it('clears the source when no value is passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
            const callback = args[2];

            callback(undefined, () => {});

            expect(result.source).toBeUndefined();
            done();
         }, 0);
      });
   });

   it('will call the callback if it is set on the result passed to the callback to parseBody()', (done) => {
      params.entityDetails.addEntity(testDecl, [testInclude]);

      setupConditional(testRef, params, testStack, true, deliverSpy, (result) => {
         result.textIsFinished = jasmine.createSpy();

         setTimeout(() => {
            const args = (params.utils.parseBody as jasmine.Spy).calls.argsFor(0);
            const callback = args[2];
            const handled = jasmine.createSpy();

            callback(undefined, handled);

            expect(result.textIsFinished).toHaveBeenCalled();
            done();
         }, 0);
      });
   });
});
