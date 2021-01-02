/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { InstructionStart } from '../../bridge/instruction';
import {
   XmlDeclarationPToken,
   parseXmlDeclaration,
   isXmlDeclStandalone,
   XMLDECL_PTOKEN,
} from '../xmlDeclaration';

import * as fieldedInstr from '../../common/fieldedInstruction';

jest.mock('../../common/fieldedInstruction');

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

   describe('construction', () => {
      it('copies the base', () => {
         const source = new XmlDeclarationPToken({
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

         const result = new XmlDeclarationPToken(source);

         expect(result).toEqual(source);
      });

      it('copies an instruction start', () => {
         const result = new XmlDeclarationPToken({
            open: toSToken('<?'),
         });

         expect(result).toEqual({
            type: XMLDECL_PTOKEN,
            open: toSToken('<?'),
            fields: [],
            close: undefined,
         });
      });

      it('copies a  degenratefielded instruction', () => {
         const result = new XmlDeclarationPToken({
            open: toSToken('<?'),
            fields: undefined,
            close: toSToken('?>'),
         });

         expect(result).toEqual({
            type: XMLDECL_PTOKEN,
            open: toSToken('<?'),
            fields: [],
            close: toSToken('?>'),
         });
      });

      it('overrides base with other', () => {
         const source = new XmlDeclarationPToken({
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

         const result = new XmlDeclarationPToken(source, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            target: toSToken('3'),
            targetSpace: toSToken('4'),
            fields: undefined,
            close: toSToken('6'),
         });

         expect(result).toEqual(
            new XmlDeclarationPToken({
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

   describe('parseXmlDeclaration()', () => {
      let callback: jest.MockedFunction<(result: XmlDeclarationPToken) => void>;
      let fieldedSpy: jest.MockedFunction<typeof fieldedInstr.parseFieldedInstruction>;

      beforeEach(() => {
         callback = jest.fn();
         fieldedSpy = jest.spyOn(fieldedInstr, 'parseFieldedInstruction') as jest.MockedFunction<
            typeof fieldedInstr.parseFieldedInstruction
         >;
         fieldedSpy.mockImplementation();
      });

      it('calls parseFieldedInstruction()', () => {
         const mockSource = new MockSTokenSource([]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = fieldedSpy.mock.calls[0];
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual(['version', 'encoding', 'standalone']);
         expect(args[3]).toBeInstanceOf(Function);
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

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.mock.calls[0][0];
         expect(result).toEqual(
            new XmlDeclarationPToken({
               open: toSToken('testing'),
               fields: [],
            }),
         );
      });
   });

   describe('isXmlDeclStandalone()', () => {
      it('returns false if there is no standalone property', () => {
         expect(isXmlDeclStandalone(xmlDeclPToken)).toEqual(false);
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

         expect(isXmlDeclStandalone(xmlDeclPToken)).toEqual(true);
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

         expect(isXmlDeclStandalone(xmlDeclPToken)).toEqual(false);
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

         expect(isXmlDeclStandalone(xmlDeclPToken)).toEqual(true);
      });
   });
});
