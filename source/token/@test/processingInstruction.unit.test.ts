/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as misc from '../common/misc';
import {
   parseProcessingInstruction,
   ProcessingInstructionPToken,
} from '../processingInstruction';

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

         parseProcessingInstruction(mockSource, { open: SToken.fromString('open') } as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(piPToken);
      });

      it('returns a value with no values if we are at end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
         ]);

         parseProcessingInstruction(mockSource, { open: SToken.fromString('') } as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({ open: SToken.fromString('') });
      });

   });

});
