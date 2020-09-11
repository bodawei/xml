/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';

import * as misc from '../../../token/common/misc';

import { processingInstructionCheck } from '../processingInstructionCheck';
import { ProcessingInstructionPToken } from 'token';

describe('processingInstructionCheck (unit)', () => {
   let piPToken: any;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      const protoPToken = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('target'),
         targetSpace: SToken.fromString(' '),
         instruction: SToken.fromString('blah'),
         close: SToken.fromString('?>'),
      };
      piPToken = new ProcessingInstructionPToken(protoPToken);

      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
      piPToken = new ProcessingInstructionPToken(protoPToken);

      spyOn(misc, 'checkCharWellFormed');
      spyOn(misc, 'checkWellFormedNameRecommendation');
   });

   it('calls misc.checkName() on the target', () => {
      spyOn(misc, 'checkName');
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
      piPToken.openSpace = SToken.fromString(' ');

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_SPACE_AFTER_OPEN,
         params: ['target'],
         position: piPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      delete piPToken.target;

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_NO_TARGET,
         params: undefined,
         lastPosition: piPToken.open,
      });
   });

   it('reports an error if xml in any form shows up in the name', () => {
      piPToken.target = SToken.fromString('fofoXmLTarget');

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_TARGET_HAS_XML,
         params: ['fofoXmLTarget'],
         position: piPToken.target,
      });
   });

   it('reports an error if there is no space after the target', () => {
      delete piPToken.targetSpace;

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_NO_SPACE_AFTER_TARGET,
         params: ['target'],
         lastPosition: piPToken.target,
      });
   });

   it('reports an error if there is no close', () => {
      delete piPToken.close;

      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PI_NO_CLOSE,
         params: ['target'],
         lastPosition: piPToken.instruction,
      });
   });
});
