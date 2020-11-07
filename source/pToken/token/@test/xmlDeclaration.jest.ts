/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { InstructionStart } from '../../bridge/instruction';
import { XmlDeclarationPToken, parseXmlDeclaration, xmlDeclIsStandalone } from '../xmlDeclaration';

import * as fieldedInstr from '../../common/fieldedInstruction';

describe('xmlDeclaration (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
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
         open: xmlDeclPToken.open,
         openSpace: undefined,
         target: xmlDeclPToken.target,
         targetSpace: xmlDeclPToken.targetSpace,
      };
   });

   describe('parseXmlDeclaration()', () => {
      let callback: jasmine.Spy;
      let entitySpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         entitySpy = spyOn(fieldedInstr, 'parseFieldedInstruction');
      });

      it('calls parseFieldedInstruction()', () => {
         const mockSource = new MockSTokenSource([]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = entitySpy.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual(['version', 'encoding', 'standalone']);
         expect(args[3]).toBeInstanceOf(Function);
      });

      it('returns an XmlDeclaration', () => {
         entitySpy.and.callFake((_1: any, _2: any, _params: any, cb: (result?: any) => void) => {
            cb({
               open: toSToken('testing'),
               fields: [],
            });
         });
         const mockSource = new MockSTokenSource([]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.calls.argsFor(0)[0];
         expect(result).toEqual(
            new XmlDeclarationPToken({
               open: toSToken('testing'),
               fields: [],
            }),
         );
      });
   });

   describe('xmlDeclIsStandalone()', () => {
      it('returns false if there is no standalone property', () => {
         expect(xmlDeclIsStandalone(xmlDeclPToken)).toEqual(false);
      });

      it('returns true if there is a standalone property set to yes', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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

         expect(xmlDeclIsStandalone(xmlDeclPToken)).toEqual(true);
      });

      it('returns false if there is a standalone property set to no', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            fields: [
               {
                  name: toSToken('standalone'),
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
                  value: toSToken('no'),
               },
            ],
            close: toSToken('?>'),
         });

         expect(xmlDeclIsStandalone(xmlDeclPToken)).toEqual(false);
      });

      it('returns true if there is a standalone property and value are all the wrong case', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            fields: [
               {
                  name: toSToken('StAndAlOne'),
                  nameSpace: undefined,
                  equal: toSToken('='),
                  equalSpace: undefined,
                  value: toSToken('YeS'),
               },
            ],
            close: toSToken('?>'),
         });

         expect(xmlDeclIsStandalone(xmlDeclPToken)).toEqual(true);
      });
   });
});
