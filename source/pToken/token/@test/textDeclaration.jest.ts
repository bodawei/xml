/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';
import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import { InstructionStart } from '../../bridge/instruction';
import * as fieldedInstr from '../../common/fieldedInstruction';
import { TEXTDECL_PTOKEN, parseTextDeclaration, TextDeclarationPToken } from '../textDeclaration';

vi.mock('../../common/fieldedInstruction');

describe('textDeclaration (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
            },
         ],
         close: toSToken('?>'),
      });

      start = {
         open: textDeclPToken.open,
         openSpace: undefined,
         target: textDeclPToken.target,
         targetSpace: textDeclPToken.targetSpace,
      };
   });

   describe('construction', () => {
      it('copies the base', () => {
         const source = new TextDeclarationPToken({
            open: toSToken('<?'),
            fields: [
               {
                  name: toSToken('standalone'),
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
                  value: toSToken('yes'),
               },
            ],
            close: toSToken('?>'),
         });

         const result = new TextDeclarationPToken(source);

         expect(result).toEqual(source);
      });

      it('copies an instruction start', () => {
         const result = new TextDeclarationPToken({
            open: toSToken('<?'),
         });

         expect(result).toEqual({
            type: TEXTDECL_PTOKEN,
            open: toSToken('<?'),
            fields: [],
            close: undefined,
         });
      });

      it('copies a  degenratefielded instruction', () => {
         const result = new TextDeclarationPToken({
            open: toSToken('<?'),
            fields: undefined,
            close: toSToken('?>'),
         });

         expect(result).toEqual({
            type: TEXTDECL_PTOKEN,
            open: toSToken('<?'),
            fields: [],
            close: toSToken('?>'),
         });
      });

      it('overrides base with other', () => {
         const source = new TextDeclarationPToken({
            open: toSToken('<?'),
            fields: [
               {
                  name: toSToken('standalone'),
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
                  value: toSToken('yes'),
               },
            ],
            close: toSToken('?>'),
         });

         const result = new TextDeclarationPToken(source, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            target: toSToken('3'),
            targetSpace: toSToken('4'),
            fields: undefined,
            close: toSToken('6'),
         });

         expect(result).toEqual(
            new TextDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               target: toSToken('3'),
               targetSpace: toSToken('4'),
               fields: [],
               close: toSToken('6'),
            }),
         );
      });
   });

   describe('parseTextDeclaration()', () => {
      let callback: MockedFunction<(result: TextDeclarationPToken) => void>;
      let fieldedSpy: MockedFunction<typeof fieldedInstr.parseFieldedInstruction>;

      beforeEach(() => {
         callback = vi.fn();
         fieldedSpy = vi.spyOn(fieldedInstr, 'parseFieldedInstruction');
         fieldedSpy.mockImplementation(() => undefined);
      });

      it('calls parseInstructionCommon()', () => {
         const mockSource = new MockSTokenSource([]);

         parseTextDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = fieldedSpy.mock.calls[0];
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual(['version', 'encoding']);
         expect(args[3]).toEqual(expect.any(Function));
      });

      it('returns an XmlDeclaration', () => {
         fieldedSpy.mockImplementation(
            (_1: any, _2: any, _params: any, cb: (result?: any) => void) => {
               cb({
                  open: toSToken('testing'),
                  fields: [],
               });
            },
         );
         const mockSource = new MockSTokenSource([]);

         parseTextDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.mock.calls[0][0];
         expect(result).toEqual(
            new TextDeclarationPToken({
               open: toSToken('testing'),
               fields: [],
            }),
         );
      });
   });
});
