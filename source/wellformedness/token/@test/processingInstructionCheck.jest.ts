/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { WellFormedError } from 'error';
import { ProcessingInstructionPToken } from 'pToken';
import { toSToken } from 'sToken';

import * as misc from '../../../token/common/misc';

import { processingInstructionCheck } from '../processingInstructionCheck';

describe('processingInstructionCheck() (unit)', () => {
   let piPToken: ProcessingInstructionPToken;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      const protoPToken = {
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('target'),
         targetSpace: toSToken(' '),
         instruction: toSToken('blah'),
         close: toSToken('?>'),
      };
      piPToken = new ProcessingInstructionPToken(protoPToken);

      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
      piPToken = new ProcessingInstructionPToken(protoPToken);

      jest.spyOn(misc, 'checkCharWellFormed').mockImplementation();
      jest.spyOn(misc, 'checkWellFormedNameRecommendation').mockImplementation();
   });

   it('calls misc.checkName() on the target', () => {
      jest.spyOn(misc, 'checkName').mockImplementation();
      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(misc.checkName).toHaveBeenCalledWith(
         piPToken.target,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.PI_TARGET_NAME_INVALID,
      );
   });

   it('calls misc.checkCharWellFormed() on the instruction data', () => {
      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
         piPToken.instruction,
         mockErrorCollector,
         confVer,
      );
   });

   it('calls misc.checkWellFormedNameRecommendation()', () => {
      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(
         piPToken.target,
         mockErrorCollector,
         confVer,
         'PI',
         XmlWarning.ID.PI_TARGET_XMLDASH_RESERVED,
         XmlWarning.ID.PI_TARGET_XML_RESERVED,
      );
   });

   it('reports an error if there is a space after the "<?"', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         openSpace: toSToken(' '),
      });

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_SPACE_AFTER_OPEN,
         params: ['target'],
         position: piPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         target: undefined,
      });

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_NO_TARGET,
         params: undefined,
         lastPosition: piPToken.open,
      });
   });

   it('reports an error if xml in any form shows up in the name', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         target: toSToken('fofoXmLTarget'),
      });

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_TARGET_HAS_XML,
         params: ['fofoXmLTarget'],
         position: piPToken.target,
      });
   });

   it('reports an error if there is no space after the target', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         targetSpace: undefined,
      });

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_NO_SPACE_AFTER_TARGET,
         params: ['target'],
         lastPosition: piPToken.target,
      });
   });

   it('reports no error if there is no space after the target but there is no instruction', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         targetSpace: undefined,
         instruction: undefined,
      });

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).not.toReportError({
         id: WellFormedError.ID.PI_NO_SPACE_AFTER_TARGET,
         params: ['target'],
         lastPosition: piPToken.target,
      });
   });

   it('reports an error if there is no close', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         close: undefined,
      });

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_NO_CLOSE,
         params: ['target'],
         lastPosition: piPToken.instruction,
      });
   });
});
