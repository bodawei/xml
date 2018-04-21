/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError, XmlWarning } from '../../error';
import { MockErrorCollector } from '../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import * as instruction from './instruction.js';
import misc from '../common/misc.js';

describe('instruction (unit)', () => {
   let instructionPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      instructionPToken = new instruction.PToken(undefined, {
         open: expectedSToken('<?'),
         postOpenSpace: undefined,
         target: expectedSToken('instructionTarget'),
         postTargetSpace: expectedSToken(' '),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(instructionPToken.getSTokenArray()).toEqual([
               instructionPToken.open,
               instructionPToken.target,
               instructionPToken.postTargetSpace,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic instruction parse', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            'instructionTarget',
            ' ',
         ], 2, 0, 2);

         instruction.parse(mockSource, instructionPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(instructionPToken);
      });

      it('returns all undefined if input ends immediately', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
         ], 2, 0, 2);

         instruction.parse(mockSource, instructionPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            type: instruction.PTYPE,
            open: instructionPToken.open,
            postOpenSpace: undefined,
            target: undefined,
            postTargetSpace: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let expectedSToken;

      beforeEach(() => {
         expectedSToken = makeSTokenMaker();
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkWellFormedText');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('calls misc.checkWellFormedText()', () => {
         const emd = new EntityMetaData();

         instruction.checkWellFormed(instructionPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(instructionPToken.target, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedNameRecommendation()', () => {
         const emd = new EntityMetaData();

         instruction.checkWellFormed(instructionPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation)
            .toHaveBeenCalledWith(instructionPToken.target, mockErrorCollector, emd, false,
               XmlWarning.ID.PI_TARGET_XMLDASH_RESERVED, XmlWarning.ID.PI_TARGET_XML_RESERVED);
      });

      it('does not call checkWellFormedNameR... if fourth param is true (for xmldecl)', () => {
         const emd = new EntityMetaData();

         instruction.checkWellFormed(instructionPToken, mockErrorCollector, emd, true);

         expect(misc.checkWellFormedNameRecommendation).not.toHaveBeenCalled();
      });

      it('reports an error if there is a space after the "<?"', () => {
         instructionPToken.postOpenSpace = expectedSToken(' ');

         instruction.checkWellFormed(instructionPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_SPACE_AFTER_OPEN,
            params: [ 'instructionTarget' ],
            position: instructionPToken.postOpenSpace,
         });
      });

      it('reports an error if there is no target', () => {
         delete instructionPToken.target;

         instruction.checkWellFormed(instructionPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_TARGET,
            params: undefined,
            lastPosition: instructionPToken.open,
         });
      });

      it('reports an error if there is no space after the target', () => {
         delete instructionPToken.postTargetSpace;

         instruction.checkWellFormed(instructionPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_SPACE_AFTER_TARGET,
            params: [ 'instructionTarget' ],
            lastPosition: instructionPToken.target,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns an Xoken with the SToken found in the PToken', () => {
         const token = instruction.pTokenToXToken(instructionPToken);

         expect(token).toEqual(new instruction.XToken('instructionTarget', instructionPToken));
      });

      it('returns a token with a blank name if there was no name in the parse', () => {
         delete instructionPToken.target;

         const token = instruction.pTokenToXToken(instructionPToken);

         expect(token).toEqual(new instruction.XToken('', instructionPToken));
      });

   });

});
