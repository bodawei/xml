/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError, XmlWarning } from '../../error/index';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { MockSTokenSource } from '../../sToken/@test/helper';

import * as instruction from '../bridge/instruction';
import * as misc from '../common/misc';
import {
   parseProcessingInstruction,
   ProcessingInstructionPToken,
   ProcessingInstructionXToken,
} from '../processingInstruction.js';

describe('processingInstruction (unit)', () => {
   let piPToken: any;

   beforeEach(() => {
      const protoPToken = {
         open: SToken.fromString('open'),
         instruction: SToken.fromString('blah'),
         close: SToken.fromString('?>'),
      };
      piPToken = new ProcessingInstructionPToken(protoPToken);
   });

   describe('parseProcessingInstruction()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         const mockSource = new MockSTokenSource([
            [ 'blah', 'all', [ '?>' ] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseProcessingInstruction(mockSource, { open: SToken.fromString('open') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(piPToken);
      });

      it('returns a value with no values if we are at end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
         ]);

         parseProcessingInstruction(mockSource, { open: SToken.fromString('') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({ open: SToken.fromString('') });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         const protoPToken = {
            open: SToken.fromString('<?'),
            openSpace: undefined,
            target: SToken.fromString('target'),
            targetSpace: SToken.fromString(' '),
            instruction: SToken.fromString('blah'),
            close: SToken.fromString('?>'),
         };

         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         piPToken = new ProcessingInstructionPToken(protoPToken);

         spyOn(misc, 'checkWellFormedText');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('calls misc.checkWellFormedText()', () => {
         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(piPToken.target, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedNameRecommendation()', () => {
         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation)
            .toHaveBeenCalledWith(piPToken.target, mockErrorCollector, emd, 'PI',
               XmlWarning.ID.PI_TARGET_XMLDASH_RESERVED, XmlWarning.ID.PI_TARGET_XML_RESERVED);
      });

      it('reports an error if there is a space after the "<?"', () => {
         piPToken.openSpace = SToken.fromString(' ');

         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_SPACE_AFTER_OPEN,
            params: [ 'target' ],
            position: piPToken.openSpace,
         });
      });

      it('reports an error if there is no target', () => {
         delete piPToken.target;

         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_TARGET,
            params: undefined,
            lastPosition: piPToken.open,
         });
      });

      it('reports an error if xml in any form shows up in the name', () => {
         piPToken.target = SToken.fromString('fofoXmLTarget');

         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_TARGET_HAS_XML,
            params: [ 'fofoXmLTarget' ],
            position: piPToken.target,
         });
      });

      it('reports an error if there is no space after the target', () => {
         delete piPToken.targetSpace;

         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_SPACE_AFTER_TARGET,
            params: [ 'target' ],
            lastPosition: piPToken.target,
         });
      });

      it('reports an error if there is no close', () => {
         delete piPToken.close;

         piPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_CLOSE,
            params: [ 'target' ],
            lastPosition: piPToken.instruction,
         });
      });

   });

   describe('pToken.toXToken()', () => {

      it('creates a processing instruction token', () => {
         const xToken = piPToken.toXToken();

         expect(xToken).toEqual(new ProcessingInstructionXToken('', 'blah', piPToken));
      });

   });

   describe('pToken.toSTokenArray()', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            (piPToken as any).openSpace = SToken.fromString(' ');

            expect(piPToken.toSTokenArray()).toEqual([
               piPToken.open,
               piPToken.openSpace,
               piPToken.instruction,
               piPToken.close,
            ]);
         });

      });

   });

});
