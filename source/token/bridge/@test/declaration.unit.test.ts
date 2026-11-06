/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import * as pToken from '../../../pToken/bridge/entityDeclaration';
import { parseDeclaration } from '../declaration';

describe('declaration (unit)', () => {
   let open: SToken;

   beforeEach(() => {
      open = toSToken('<?');
   });

   describe('parseDeclaration()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      describe('ENTITY', () => {

         it('seeks to parse an entity when the decl type is ENTITY', () => {
            const parse = spyOn(pToken, 'parseEntityDeclaration');
            const mockSource = new MockSTokenSource([
               [ undefined, 'space' ],
               [ 'ENTITY', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
            ]);

            parseDeclaration(mockSource, open, callback);
            mockSource.respondInAsyncTime();

            const args = parse.calls.argsFor(0);
            expect(args[0]).toEqual(mockSource);
            expect(args[1]).toEqualRangeless({
               open,
               openSpace: undefined,
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken(' '),
            });
            expect(typeof args[2]).toEqual('function');
         });

         it('seeks to parse an entity when the decl type is Entity (wrong case)', () => {
            const parse = spyOn(pToken, 'parseEntityDeclaration');
            const mockSource = new MockSTokenSource([
               [ ' ', 'space' ],
               [ 'eNtiTy', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
            ]);

            parseDeclaration(mockSource, open, callback);
            mockSource.respondInAsyncTime();

            const args = parse.calls.argsFor(0);
            expect(args[0]).toEqual(mockSource);
            expect(args[1]).toEqualRangeless({
               open,
               openSpace: toSToken(' '),
               declType: toSToken('eNtiTy'),
               declTypeSpace: toSToken(' '),
            });
            expect(typeof args[2]).toEqual('function');
         });

      });

   });

});
