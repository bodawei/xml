/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import { parseEntityDeclaration } from '../entityDeclaration';
import { GeneralEntityDeclarationPToken } from '../generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../parameterEntityDeclaration';
import unassigned from '../common/unassigned';
import externalId, { EXTERNAL_ID } from '../common/externalId';
import literal from '../common/literal';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';

describe('entityDeclaration (unit)', () => {
   let genEntityDeclarationPToken: GeneralEntityDeclarationPToken;
   let paramGeneralEntityDeclarationPToken: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      genEntityDeclarationPToken = new GeneralEntityDeclarationPToken({
         name: makeSToken('anEntity'),
         nameSpace: makeSToken(' '),
         externalIdSpace: makeSToken(' '),
         close: makeSToken('>'),
      });

      const makeToken = makeSTokenMaker();
      paramGeneralEntityDeclarationPToken = new ParameterEntityDeclarationPToken({
         parameter: makeToken('%'),
         parameterSpace: makeToken(' '),
         name: makeToken('anEntity'),
         nameSpace: makeToken(' '),
         close: makeToken('>'),
      });
   });

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let checkForPERefCallback: Function;
      let literalSpy: jasmine.Spy;
      let externalIdSpy: jasmine.Spy;
      let unCheck: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');

         externalIdSpy = spyOn(externalId, 'parse').and.callFake((sTokenSource: STokenSource, terminators: any, allowPERefs: boolean, cb: Function) => {
            cb({ externalId: { type: EXTERNAL_ID }, peRefPlus: [], });
         });

         literalSpy = spyOn(literal, 'parse');

         unCheck = spyOn(unassigned as any, 'makeCheckCallback').and.callFake((_1: any, _2: any, _3: any, other: () => void) => { // typeHack
            checkForPERefCallback = other;
         });

         spyOn(unassigned, 'checkForPERef').and.callFake(() => checkForPERefCallback());
      });

      it('calls literal.parse()', () => {
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('a'),
            [ 'anEntity', 'word', [ '>', '"', '\'', ';' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match' ],
            [ '>', 'match', '>' ],
         ]);
         delete (genEntityDeclarationPToken as any).externalIdSpace;
         delete (genEntityDeclarationPToken as any).close;
         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(literalSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(literalSpy.calls.argsFor(0)[1]).toEqual({
            pToken: genEntityDeclarationPToken,
            peRef: true,
            charRef: true,
         });
         expect(literalSpy.calls.argsFor(0)[2] instanceof Function).toEqual(true);
      });

      it('calls externalId.parse()', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            [ 'entityName', 'word', [ '>', '"', '\'', ';' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match', ';' ],
            // externalId or literal would have been here
            [ ' ', 'space' ],
            [ undefined, 'peekWord', [ '>' ] ],
            [ '>', 'match', '>' ],
         ]);
         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(externalIdSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalIdSpy.calls.argsFor(0)[1]).toEqual([ '>' ]);
         expect(externalIdSpy.calls.argsFor(0)[2]).toEqual(true);
         expect(externalIdSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
      });

      it('does a parse of a general entity with a literal value', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            [ 'anEntity', 'word', [ '>', '"', '\'', ';' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match', ';' ],
            // externalId or literal would have been here
            [ ' ', 'space' ],
            [ undefined, 'peekWord', [ '>' ] ],
            [ '>', 'match', '>' ],
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(genEntityDeclarationPToken);
      });

      it('returns nothing if at EOF. That is: <!ENTITY', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         parseEntityDeclaration(mockSource, { open: SToken.fromString('<!'), } as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ new GeneralEntityDeclarationPToken({ open: SToken.fromString('<!'), }) ] ]);
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('%'),
            [ '%', 'char' ],
            [ ' ', 'space' ],
            [ 'anEntity', 'word', ['>', '"', '\'', ';'] ],
            [ ' ', 'space' ],
            [ undefined, 'match', ';' ],
            // externalId or literal would have been here
            [ undefined, 'space' ],
            [ '>', 'match', '>' ],
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(paramGeneralEntityDeclarationPToken);
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         const expectedSToken = makeSTokenMaker();
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('%'),
            '%',
            [ undefined, 'space' ],
            'entityName',
            [ ' ', 'space' ],
            [ undefined, 'match', ';' ],
            // externalId or literal would have been here
            [ undefined, 'space' ],
            [ '>', 'match', '>' ],
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            parameter: expectedSToken('%'),
            parameterSpace: undefined,
            name: expectedSToken('entityName'),
         });
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         const expectedSToken = makeSTokenMaker();
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         externalIdSpy.and.callFake((_1: any, _2: any, allowPERefs: boolean, callback: Function) => { callback({ }); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('%'),
            [ '%', 'char' ],
            [ undefined, 'space' ],
            [ undefined, 'word', ['>', '"', '\'', ';'] ],
            [ undefined, 'space' ],
            [ undefined, 'match', ';' ],
            // externalId or literal would have been here
            [ undefined, 'match', '>' ],
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            parameter: expectedSToken('%'),
            parameterSpace: undefined,
            name: undefined,
            nameSpace: undefined,
         });
      });

      it('returns no space between entity name and value: <!ENTITY entityName"foo" >', () => {
         const expectedSToken = makeSTokenMaker();
         literalSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            undefined,
            undefined,
            undefined,
            '>',
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            name: expectedSToken('entityName'),
            nameSpace: undefined,
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         literalSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            [ undefined, 'match', ';' ],
            ' ',
            '>',
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            entityValueSpace: expectedSToken(' '),
            close: expectedSToken('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         const expectedSToken = makeSTokenMaker();
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            '>',
            '>',
         ]);
         externalIdSpy.and.callFake((_1: any, _2: any, allowPERef: boolean, cb: Function) => {
            cb({});
         });

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            name: expectedSToken('entityName'),
            nameSpace: expectedSToken(' '),
            externalId: undefined,
         });
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            [ undefined, 'match', ';' ],
            ' ',
            undefined, // peekWord
            '>',
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            externalId: { type: EXTERNAL_ID },
            externalIdSpace: expectedSToken(' '),
            close: expectedSToken('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            [ undefined, 'match', ';' ],
            // externalId
            ' ',
            MockSTokenSource.PEEK('NDATA'),
            'NDATA',
            ' ',
            'testNData',
            ' ',
            '>',
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            externalIdSpace: expectedSToken(' '),
            nData: expectedSToken('NDATA'),
            nDataSpace: expectedSToken(' '),
            nDataName: expectedSToken('testNData'),
            nDataNameSpace: expectedSToken(' '),
            close: expectedSToken('>'),
         });
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            [ undefined, 'match', ';' ],
               // externalId
            ' ',
            MockSTokenSource.PEEK('ndaTa'),
            'ndaTa',
            ' ',
            'testNData',
            ' ',
            '>',
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainPTokenProps({
            nData: expectedSToken('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            [ undefined, 'match', ';' ],
               // externalId
            ' ',
            MockSTokenSource.PEEK('ndaTa'),
            'ndaTa',
            ' ',
            'testNData',
            undefined,
            '>',
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainPTokenProps({
            nData: expectedSToken('ndaTa'),
            nDataSpace: expectedSToken(' '),
            nDataName: expectedSToken('testNData'),
            nDataNameSpace: undefined,
            close: expectedSToken('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            [ undefined, 'match', ';' ],
               // externalId
            ' ',
            MockSTokenSource.PEEK('NDATA'),
            'NDATA',
            undefined,
            [ undefined, 'word', [ '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match' ],
         ]);

         parseEntityDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            externalIdSpace: expectedSToken(' '),
            nData: expectedSToken('NDATA'),
            nDataSpace: undefined,
            nDataName: undefined,
            nDataNameSpace: undefined,
            close: undefined,
         });
      });

      describe('parameter entity reference', () => {

         it('returns an unassigned value when finding a PE Ref at the starting position', () => {
            let count = 0;
            unCheck.and.callFake((_1: any, _2: any, _3: any, other: any) => {
               checkForPERefCallback = other;
            });
            spyOn(unassigned, 'parseNextValue').and.callFake((_1: any, _2: any, handler: Function) => {
               if (count === 0) {
                  count ++;
                  handler({ one: 1 });
               } else {
                  handler();
               }
            });
            const mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('%'),
               '%',
               ' ',
               'entityName',
               ' ',
               [ ';', 'match', ';' ],
               '>',
            ]);

            parseEntityDeclaration(mockSource, {} as any, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken.unassigned).toEqual([ {
               type: 'reference',
               token: new ParameterEntityReferencePToken({
                  open: makeSToken('%'),
                  openSpace: makeSToken(' '),
                  name: makeSToken('entityName'),
                  nameSpace: makeSToken(' '),
                  close: makeSToken(';'),
               })
            }, {
               one: 1
            } ]);
         });

         it('returns an unassigned value when finding a PE Ref at the EntityValue position', () => {
            unCheck.and.callFake((pToken: any, prop: string, foundRef: Function, other: any) => {
               checkForPERefCallback = other;

               if (prop === 'entityValueOrId') {
                  checkForPERefCallback = () => {
                     pToken.unassigned = [ { name: prop } ],
                     foundRef(pToken);
                  };
               }
            });
            const mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('e'),
               'entityName',
               ' ',
               [ undefined, 'match', ';' ],
               '>',
            ]);

            parseEntityDeclaration(mockSource, {} as any, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            expect(pToken.unassigned).toEqual([ { name: 'entityValueOrId' } ])
         });

         it('returns an unassigned value when finding a PE Ref in external ID', () => {
            literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
            externalIdSpy.and.callFake((_1: any, _2: any, allowPEref: boolean, cb: Function) => {
               cb({
                  externalId: { type: EXTERNAL_ID, },
                  peRefPlus: [ { type: 'literal' } ],
                  nextPropName: 'system',
               });
            });

            unCheck.and.callFake((_1: any, _2: any, _3: any, other: any) => {
               checkForPERefCallback = other;
            });
            const mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('e'),
               'entityName',
               ' ',
               [ undefined, 'match', ';' ],
               '>',
            ]);

            parseEntityDeclaration(mockSource, {} as any, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            expect(pToken.unassigned).toEqual([ { type: 'literal' } ])
         });

         it('returns an unassigned value with a PE Ref in the NDATA name position', () => {
            literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
            unCheck.and.callFake((pToken: any, prop: string, foundRef: Function, other: any) => {
               checkForPERefCallback = other;

               if (prop === 'nDataName') {
                  checkForPERefCallback = () => {
                     pToken.unassigned = [ { name: prop } ],
                     foundRef(pToken);
                  };
               }
            });
            const mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('e'),
               'entityName',
               ' ',
               [ undefined, 'match', ';' ],
               // externalId
               ' ',
               MockSTokenSource.PEEK('NDATA'),
               'NDATA',
               undefined,
               '>',
            ]);

            parseEntityDeclaration(mockSource, {} as any, callback);
            mockSource.respondInAsyncTime();

            expect(callback.calls.argsFor(0)[0].unassigned).toEqual([ { name: 'nDataName' } ])
         });

         it('returns an unassigned value with a PE Ref in the NDATA position', () => {
            literalSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
            unCheck.and.callFake((pToken: any, prop: string, foundRef: Function, other: any) => {
               checkForPERefCallback = other;

               if (prop === 'nData') {
                  checkForPERefCallback = () => {
                     pToken.unassigned = [ { name: prop } ],
                     foundRef(pToken);
                  };
               }
            });
            const mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('e'),
               'entityName',
               ' ',
               [ undefined, 'match', ';' ],
               // externalId
               ' ',
               '>',
            ]);

            parseEntityDeclaration(mockSource, {} as any, callback);
            mockSource.respondInAsyncTime();

            expect(callback.calls.argsFor(0)[0].unassigned).toEqual([ { name: 'nData' } ])
         });

      });

   });

});
