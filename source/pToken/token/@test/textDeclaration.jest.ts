/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { SToken, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { InstructionStart } from '../../bridge/instruction';
import { TEXTDECL_PTOKEN, parseTextDeclaration, TextDeclarationPToken } from '../textDeclaration';

import * as fieldedInstr from '../../common/fieldedInstruction';

jest.mock('../../common/fieldedInstruction');

describe('textDeclaration (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         fields: [
            {
               name: SToken.fromString('version'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
            },
         ],
         close: SToken.fromString('?>'),
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
      let callback: jest.MockedFunction<(result: TextDeclarationPToken) => void>;
      let fieldedSpy: jest.MockedFunction<typeof fieldedInstr.parseFieldedInstruction>;

      beforeEach(() => {
         callback = jest.fn();
         fieldedSpy = jest.spyOn(fieldedInstr, 'parseFieldedInstruction') as jest.MockedFunction<
            typeof fieldedInstr.parseFieldedInstruction
         >;
         fieldedSpy.mockImplementation();
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
                  open: SToken.fromString('testing'),
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
               open: SToken.fromString('testing'),
               fields: [],
            }),
         );
      });
   });
});
