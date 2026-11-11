/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';
import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import * as pi from '../../token/processingInstruction';
import * as textDecl from '../../token/textDeclaration';
import * as xmlDecl from '../../token/xmlDeclaration';
import { parseInstruction } from '../instruction';

describe('parseInstruction (unit)', () => {
   let callback: MockedFunction<
      (
         section:
            | pi.ProcessingInstructionPToken
            | xmlDecl.XmlDeclarationPToken
            | textDecl.TextDeclarationPToken,
      ) => void
   >;
   let open: SToken;

   beforeEach(() => {
      open = toSToken('<?');
      callback = vi.fn();
   });

   // See the integration test for validation that this actually returns something through callback

   it('calls parseProcessingInstruction() when the target is not "xml"', () => {
      const piParse = vi
         .spyOn(pi, 'parseProcessingInstruction')
         .mockImplementation(() => undefined);
      const mockSource = new MockSTokenSource([
         [undefined, 'space'],
         [undefined, 'word', ['?>']],
         [undefined, 'space'],
      ]);

      parseInstruction(mockSource, open, true, callback);
      mockSource.respondInAsyncTime();

      const args = piParse.mock.calls[0];
      expect(args[0]).toEqual(mockSource);
      // @ts-expect-error 2329/matchers
      expect(args[1]).toEqualRangeless({
         open: open,
         openSpace: undefined,
         target: undefined,
         targetSpace: undefined,
      });
      expect(args[2]).toEqual(expect.any(Function));
   });

   it('parses an XnlDeclaration if it finds a target of xml and is not in a document entity', () => {
      const xmlParse = vi.spyOn(xmlDecl, 'parseXmlDeclaration').mockImplementation(() => undefined);
      const mockSource = new MockSTokenSource([
         [undefined, 'space'],
         ['xml', 'word', ['?>']],
         [undefined, 'space'],
      ]);

      parseInstruction(mockSource, open, true, callback);
      mockSource.respondInAsyncTime();

      const args = xmlParse.mock.calls[0];
      expect(args[0]).toEqual(mockSource);
      // @ts-expect-error 2329/matchers
      expect(args[1]).toEqualRangeless({
         open: open,
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: undefined,
      });
      expect(args[2]).toEqual(expect.any(Function));
   });

   it('parses an TextDeclaration if it finds a target of xml and is not in a document entity', () => {
      const textParse = vi
         .spyOn(textDecl, 'parseTextDeclaration')
         .mockImplementation(() => undefined);
      const mockSource = new MockSTokenSource([
         ['\t', 'space'],
         ['xml', 'word', ['?>']],
         [' ', 'space'],
      ]);

      parseInstruction(mockSource, open, false, callback);
      mockSource.respondInAsyncTime();

      const args = textParse.mock.calls[0];
      expect(args[0]).toEqual(mockSource);
      // @ts-expect-error 2329/matchers
      expect(args[1]).toEqualRangeless({
         open: open,
         openSpace: toSToken('\t'),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      });
      expect(args[2]).toEqual(expect.any(Function));
   });
});
