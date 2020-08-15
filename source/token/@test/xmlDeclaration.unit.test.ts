/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as misc from '../common/misc';
import { parseXmlDeclaration, XmlDeclarationPToken } from '../xmlDeclaration';
import { InstructionStart } from '../bridge/instruction';
import * as entityInstr from '../common/entityInstruction';

describe('xmlDeclaration (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         params: [{
            name: SToken.fromString('version'),
            nameSpace: undefined,
            equal: SToken.fromString('='),
            equalSpace: undefined,
         }],
         close: SToken.fromString('?>'),
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
         entitySpy = spyOn(entityInstr, 'parseEntityInstruction');
      });

      it('calls parseEntityInstruction()', () => {
         const mockSource = new MockSTokenSource([]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = entitySpy.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual([ 'version', 'encoding', 'standalone' ]);
         expect(args[3]).toBeInstanceOf(Function);
      });

      it('returns an XmlDeclaration', () => {
         entitySpy.and.callFake((_1: any, _2: any, _params: any, cb:(result?: any) => void) => {
            cb({
               open: SToken.fromString('testing'),
               params: [],
            });
         });
         const mockSource = new MockSTokenSource([]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.calls.argsFor(0)[0];
         expect(result).toEqual(new XmlDeclarationPToken({
            open: SToken.fromString('testing'),
            params: [],
         }));
      });

   });

   describe('pToken.toSTokenArray()', () => {

      it('calls entityInstruction.sTokensFromPToken', () => {
         const entitySpy = spyOn(entityInstr, 'sTokensFromPToken');
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
         });

         xmlDeclPToken.toSTokenArray();

         expect(entitySpy).toHaveBeenCalledWith(xmlDeclPToken);

      });

   });

   describe('pToken.isStandalone()', () => {

      it('returns false if there is no standalone property', () => {
         expect(xmlDeclPToken.isStandalone()).toEqual(false);
      });

      it('returns true if there is a standalone property set to yes', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            params: [{
               name: SToken.fromString('standalone'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
               value: SToken.fromString('yes'),
            }],
            close: SToken.fromString('?>'),
         });

         expect(xmlDeclPToken.isStandalone()).toEqual(true);
      });

      it('returns false if there is a standalone property set to no', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            params: [{
               name: SToken.fromString('standalone'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
               value: SToken.fromString('no'),
            }],
            close: SToken.fromString('?>'),
         });

         expect(xmlDeclPToken.isStandalone()).toEqual(false);
      });

      it('returns true if there is a standalone property and value are all the wrong case', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            params: [{
               name: SToken.fromString('StAndAlOne'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
               value: SToken.fromString('YeS'),
            }],
            close: SToken.fromString('?>'),
         });

         expect(xmlDeclPToken.isStandalone()).toEqual(true);
      });

   });

});
