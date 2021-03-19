/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { ProcessingInstructionPToken } from 'pToken';
import { toSToken } from 'sToken';

import { charCheck } from '../../common/charCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { nameCheck } from '../../common/nameCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { processingInstructionCheck } from '../processingInstructionCheck';

jest.mock('../../common/charCheck');
jest.mock('../../common/nameXmlCheck');
jest.mock('../../common/nameCheck');

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
   });

   it('calls nameCheck() on the target', () => {
      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         piPToken.target,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.PI_TARGET_NAME_INVALID,
      );
   });

   it('calls charCheck() on the instruction data', () => {
      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(piPToken.instruction, mockErrorCollector, confVer);
   });

   it('calls nameXmlCheck()', () => {
      processingInstructionCheck(piPToken, mockErrorCollector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
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

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).not.toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.PI_NO_CLOSE,
         params: ['target'],
         lastPosition: piPToken.instruction,
      });
   });
});
