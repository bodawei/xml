/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { InstructionStart } from '../../bridge/instruction';
import { parseTextDeclaration, TextDeclarationPToken } from '../textDeclaration';

import * as fieldedInstr from '../../common/fieldedInstruction';

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

   describe('parseTextDeclaration()', () => {
      let callback: jasmine.Spy;
      let entitySpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         entitySpy = spyOn(fieldedInstr, 'parseFieldedInstruction');
      });

      it('calls parseInstructionCommon()', () => {
         const mockSource = new MockSTokenSource([]);

         parseTextDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = entitySpy.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual(['version', 'encoding']);
         expect(args[3]).toBeInstanceOf(Function);
      });

      it('returns an XmlDeclaration', () => {
         entitySpy.and.callFake((_1: any, _2: any, _params: any, cb: (result?: any) => void) => {
            cb({
               open: SToken.fromString('testing'),
               fields: [],
            });
         });
         const mockSource = new MockSTokenSource([]);

         parseTextDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.calls.argsFor(0)[0];
         expect(result).toEqual(
            new TextDeclarationPToken({
               open: SToken.fromString('testing'),
               fields: [],
            }),
         );
      });
   });
});
