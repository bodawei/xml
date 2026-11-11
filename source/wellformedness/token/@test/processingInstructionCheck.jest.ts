/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ProcessingInstructionPToken } from 'pToken';

import { charCheck } from '../../common/charCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { processingInstructionCheck } from '../processingInstructionCheck';

jest.mock('../../common/charCheck');
jest.mock('../../common/nameXmlCheck');
jest.mock('../../common/nameCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('processingInstructionCheck() (unit)', () => {
   let piPToken: ProcessingInstructionPToken;
   let collector: ParamCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      const protoPToken = {
         close: toSToken('?>'),
         instruction: toSToken('blah'),
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('target'),
         targetSpace: toSToken(' '),
      };
      piPToken = new ProcessingInstructionPToken(protoPToken);

      collector = new ParamCollector();
      confVer = new ConformanceVersion();
      piPToken = new ProcessingInstructionPToken(protoPToken);
   });

   it('calls nameCheck() on the target', () => {
      processingInstructionCheck(piPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         piPToken.target,
         collector,
         confVer,
         WFEID.PI_TARGET_NAME_INVALID,
      );
   });

   it('calls charCheck() on the instruction data', () => {
      processingInstructionCheck(piPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(piPToken.instruction, collector, confVer, false);
   });

   it('calls nameXmlCheck()', () => {
      processingInstructionCheck(piPToken, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         piPToken.target,
         collector,
         confVer,
         'PI',
         WID.PI_TARGET_XMLDASH_RESERVED,
         WID.PI_TARGET_XML_RESERVED,
      );
   });

   it('reports an error if there is a space after the "<?"', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         openSpace: toSToken(' '),
      });

      processingInstructionCheck(piPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PI_SPACE_AFTER_OPEN,
         params: ['target'],
         position: piPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         target: undefined,
      });

      processingInstructionCheck(piPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PI_NO_TARGET,
         lastPosition: piPToken.open,
         params: [],
      });
   });

   it('reports an error if xml in any form shows up in the name', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         target: toSToken('fofoXmLTarget'),
      });

      processingInstructionCheck(piPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PI_TARGET_HAS_XML,
         params: ['fofoXmLTarget'],
         position: piPToken.target,
      });
   });

   it('reports an error if there is no space after the target', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         targetSpace: undefined,
      });

      processingInstructionCheck(piPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PI_NO_SPACE_AFTER_TARGET,
         lastPosition: piPToken.target,
         params: ['target'],
      });
   });

   it('reports no error if there is no space after the target but there is no instruction', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         instruction: undefined,
         targetSpace: undefined,
      });

      processingInstructionCheck(piPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveWellFormedError({
         id: WFEID.PI_NO_SPACE_AFTER_TARGET,
         lastPosition: piPToken.target,
         params: ['target'],
      });
   });

   it('reports an error if there is no close', () => {
      piPToken = new ProcessingInstructionPToken(piPToken, {
         close: undefined,
      });

      processingInstructionCheck(piPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PI_NO_CLOSE,
         lastPosition: piPToken.instruction,
         params: ['target'],
      });
   });
});
