/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { parseInstruction } from '../instruction';

import * as pTokenThings from 'pToken';
import * as pi from '../../token/processingInstruction';

describe('parseInstruction (unit)', () => {
   let callback: jasmine.Spy;
   let open: SToken;

   beforeEach(() => {
      open = toSToken('<?');
      callback = jasmine.createSpy('callbackSpy');
   });

   // See the integration test for validation that this actually returns something through callback

   it('calls parseProcessingInstruction() when the target is not "xml"', () => {
      const piParse = spyOn(pi, 'parseProcessingInstruction');
      const mockSource = new MockSTokenSource([
         [undefined, 'space'],
         [undefined, 'word', ['?>']],
         [undefined, 'space'],
      ]);

      parseInstruction(mockSource, open, true, callback);
      mockSource.respondInAsyncTime();

      const args = piParse.calls.argsFor(0);
      expect(args[0]).toEqual(mockSource);
      expect(args[1]).toEqualRangeless({
         open: open,
         openSpace: undefined,
         target: undefined,
         targetSpace: undefined,
      });
      expect(args[2]).toBeInstanceOf(Function);
   });

   it('parses an XnlDeclaration if it finds a target of xml and is not in a document entity', () => {
      const xmlParse = spyOn(pTokenThings, 'parseXmlDeclaration');
      const mockSource = new MockSTokenSource([
         [undefined, 'space'],
         ['xml', 'word', ['?>']],
         [undefined, 'space'],
      ]);

      parseInstruction(mockSource, open, true, callback);
      mockSource.respondInAsyncTime();

      const args = xmlParse.calls.argsFor(0);
      expect(args[0]).toEqual(mockSource);
      expect(args[1]).toEqualRangeless({
         open: open,
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: undefined,
      });
      expect(args[2]).toBeInstanceOf(Function);
   });

   it('parses an TextDeclaration if it finds a target of xml and is not in a document entity', () => {
      const textParse = spyOn(pTokenThings, 'parseTextDeclaration');
      const mockSource = new MockSTokenSource([
         ['\t', 'space'],
         ['xml', 'word', ['?>']],
         [' ', 'space'],
      ]);

      parseInstruction(mockSource, open, false, callback);
      mockSource.respondInAsyncTime();

      const args = textParse.calls.argsFor(0);
      expect(args[0]).toEqual(mockSource);
      expect(args[1]).toEqualRangeless({
         open: open,
         openSpace: toSToken('\t'),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      });
      expect(args[2]).toBeInstanceOf(Function);
   });
});
