/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../../basic';
import { WellFormedError, XmlWarning } from '../../../error';
import { MockErrorCollector } from '../../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from '../../../sToken/@test/helper';

import * as instruction from '../instruction';
import { InstructionStart } from '../instruction';
import misc from '../../common/misc';
import { SToken } from 'sToken';

describe('instruction (unit)', () => {
   let instructionPToken: InstructionStart;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      instructionPToken = {
         open: expectedSToken('<?'),
         openSpace: undefined,
         target: expectedSToken('instructionTarget'),
         targetSpace: expectedSToken(' '),
      };
   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      // it('does a basic instruction parse', () => {
      //    const mockSource = new MockSTokenSource([
      //       undefined,
      //       'instructionTarget',
      //       ' ',
      //    ], 2, 0, 2);

      //    instruction.parse(mockSource, instructionPToken.open, callback);
      //    mockSource.respondInAsyncTime();

      //    expect(callback).toContainPTokenProps(instructionPToken);
      // });

      // it('returns all undefined if input ends immediately', () => {
      //    const mockSource = new MockSTokenSource([
      //       undefined,
      //       undefined,
      //       undefined,
      //    ], 2, 0, 2);

      //    instruction.parse(mockSource, instructionPToken.open, callback);
      //    mockSource.respondInAsyncTime();

      //    expect(callback).toContainPTokenProps({
      //       type: instruction.PTYPE,
      //       open: instructionPToken.open,
      //       postOpenSpace: undefined,
      //       target: undefined,
      //       postTargetSpace: undefined,
      //    });
      // });

   });

});

   // it('calls parseProcessingInstruction()', (done) => {
   //    const parseSpy = spyOn(processingInstruction, 'parseProcessingInstruction').and.callThrough();
   //    pTokenStream.addText('<?something foo?>');
   //    pTokenStream.endText();

   //    gatherPTokens(pTokenStream, () => {
   //       expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
   //       expect(parseSpy.calls.argsFor(0)[1].target.str).toEqual('something');
   //       expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   //       done();
   //    });
   // });

   // it('calls processingInstruction.parse() when there is no target name', (done) => {
   //    const parseSpy = spyOn(processingInstruction, 'parseProcessingInstruction').and.callThrough();
   //    pTokenStream.addText('<??>');
   //    pTokenStream.endText();

   //    gatherPTokens(pTokenStream, () => {
   //       expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
   //       expect(parseSpy.calls.argsFor(0)[1].target).toBeUndefined();
   //       expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   //       done();
   //    });
   // });


