/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, EntityLocation, Range } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import * as token from '../../index';
import { parseDeclaration, DeclarationStart } from '../declaration';

describe('declaration (unit)', () => {
   let open: SToken;

   beforeEach(() => {
      open = SToken.fromString('<?');
   });

   describe('parseDeclaration()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      describe('ENTITY', () => {

         it('seeks to parse an entity when the decl type is ENTITY', () => {
            const parse = spyOn(token, 'parseEntityDeclaration');
            const mockSource = new MockSTokenSource([
               [ undefined, 'space' ],
               [ 'ENTITY', 'word', [ '>' ] ],
               [ ' ', 'space' ],
            ]);

            parseDeclaration(mockSource, open, new EntityMetaData(), callback);
            mockSource.respondInAsyncTime();

            const args = parse.calls.argsFor(0);
            expect(args[0]).toEqual(mockSource);
            expect(args[1]).toEqualRangeless({
               open,
               openSpace: undefined,
               declType: SToken.fromString('ENTITY'),
               declTypeSpace: SToken.fromString(' '),
            });
            expect(args[2]).toBeInstanceOf(Function);
         });

         it('seeks to parse an entity when the decl type is Entity (wrong case)', () => {
            const parse = spyOn(token, 'parseEntityDeclaration');
            const mockSource = new MockSTokenSource([
               [ ' ', 'space' ],
               [ 'eNtiTy', 'word', [ '>' ] ],
               [ ' ', 'space' ],
            ]);

            parseDeclaration(mockSource, open, new EntityMetaData(), callback);
            mockSource.respondInAsyncTime();

            const args = parse.calls.argsFor(0);
            expect(args[0]).toEqual(mockSource);
            expect(args[1]).toEqualRangeless({
               open,
               openSpace: SToken.fromString(' '),
               declType: SToken.fromString('eNtiTy'),
               declTypeSpace: SToken.fromString(' '),
            });
            expect(args[2]).toBeInstanceOf(Function);
         });

      });

   });

});
