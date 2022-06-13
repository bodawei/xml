/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { SToken, toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import { parseInstruction } from '../instruction';

import * as pi from '../../token/processingInstruction';
import * as textDecl from '../../token/textDeclaration';
import * as xmlDecl from '../../token/xmlDeclaration';

describe('parseInstruction (unit)', () => {
   let callback: jest.MockedFunction<
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
      callback = jest.fn();
   });

   // See the integration test for validation that this actually returns something through callback

   it('calls parseProcessingInstruction() when the target is not "xml"', () => {
      const piParse = jest.spyOn(pi, 'parseProcessingInstruction').mockImplementation();
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
      const xmlParse = jest.spyOn(xmlDecl, 'parseXmlDeclaration').mockImplementation();
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
      const textParse = jest.spyOn(textDecl, 'parseTextDeclaration').mockImplementation();
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
