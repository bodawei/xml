/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';
import { WellFormedError, XmlWarning } from 'error';

import declaration from '../bridge/baseDeclaration';
import { parseEntityDeclaration } from '../entityDeclaration';
import { GeneralEntityDeclarationPToken, GeneralEntityDeclarationXToken } from '../generalEntityDeclaration';
import { ParameterEntityDeclarationPToken, ParameterEntityDeclarationXToken } from '../parameterEntityDeclaration';
import unassigned from '../common/unassigned';
import externalId from '../common/externalId';
import misc from '../common/misc';
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

   describe('PToken', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
         spyOn(externalId, 'getSTokens');
      });

      describe('getSTokenStream()', () => {

         // it('returns all the STokens', () => {
         //    expect(genEntityDeclarationPToken.getSTokenArray()).toEqual([
         //       SToken.fromString(''),
         //       genEntityDeclarationPToken.name,
         //       genEntityDeclarationPToken.nameSpace,
         //       genEntityDeclarationPToken.externalIdSpace,
         //       genEntityDeclarationPToken.close,
         //    ]);
         // });

      });

   });

   describe('ParamPToken', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
         spyOn(externalId, 'getSTokens');
      });

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            // expect(paramGeneralEntityDeclarationPToken.getSTokenArray()).toEqual([
            //    SToken.fromString(''),
            //    paramGeneralEntityDeclarationPToken.parameter,
            //    paramGeneralEntityDeclarationPToken.parameterSpace,
            //    paramGeneralEntityDeclarationPToken.name,
            //    paramGeneralEntityDeclarationPToken.nameSpace,
            //    paramGeneralEntityDeclarationPToken.close,
            // ]);
         });

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

         externalIdSpy = spyOn(externalId, 'parse').and.callFake((_1: any, _2: any, cb: Function) => {
            cb({ externalId: true });
         });

         literalSpy = spyOn(literal, 'parse');

         unCheck = spyOn(unassigned, 'makeCheckCallback').and.callFake((_1: any, _2: any, _3: any, other: Function) => {
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
         expect(externalIdSpy.calls.argsFor(0)[2] instanceof Function).toEqual(true);
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
            [ undefined, 'peekWord', [ '>' ] ],
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
            [ undefined, 'peekWord', [ '>' ] ],
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
         externalIdSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(undefined); });
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
         externalIdSpy.and.callFake((_1: any, _2: any, cb: Function) => {
            cb(undefined);
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
            externalId: {
               externalId: true,
            },
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
            externalIdSpy.and.callFake((_1: any, _2: any, cb: Function) => {
               cb({
                  externalId: true,
                  unassigned: [ { type: 'literal' } ],
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
            expect(pToken.externalId.unassigned).toEqual([ { type: 'literal' } ])
            expect(pToken.unassigned).toBe(pToken.externalId.unassigned)
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

   // describe('assignUnassigned()', () => {
   //    let extUnass: jasmine.Spy;
   //    let unAssign: jasmine.Spy;

   //    beforeEach(() => {
   //       unAssign = spyOn(unassigned, 'assignToProps');
   //       extUnass = spyOn(externalId, 'assignUnassigned');
   //    });

   //    it('does not call assignToProps() if there is no unassigned', () => {
   //       entityDeclaration.assignUnassigned({} as any);

   //       expect(unassigned.assignToProps).not.toHaveBeenCalled();
   //    });

   //    it('deletes the unassigned property if it is empty', () => {
   //       const declPToken = {
   //          unassigned: [],
   //          nextPropName: 'name',
   //       };

   //       entityDeclaration.assignUnassigned(declPToken as any);

   //       expect(declPToken.unassigned).toBeUndefined();
   //       expect(declPToken.nextPropName).toBeUndefined();
   //    });

   //    it('does not call assignToProps() if there is still an unexpanded param ref', () => {
   //       const declPToken = {
   //          unassigned: [ {
   //             type: 'reference',
   //          } ],
   //       };

   //       entityDeclaration.assignUnassigned(declPToken as any);

   //       expect(unassigned.assignToProps).not.toHaveBeenCalled();
   //    });

   //    describe('unassigned in prolog', () => {

   //       it('calls unassigned.assignToProps() when the match is in the prolog', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'name',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'name', [
   //                { name: 'declTypeSpace', type: 'space' },
   //                { name: 'parameter', type: 'word', allowed: /%/ },
   //                { name: 'parameterSpace', type: 'space' },
   //                { name: 'name', type: 'word' },
   //                { name: 'nameSpace', type: 'space' },
   //             ]);
   //       });

   //       it('calls externalId.assignUnassigned() if externalId in PERef', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'name',
   //          });
   //          let propName: string;
   //          extUnass.and.callFake((externalId: any, pToken: any, name: string) => {
   //             // check externalId now, before it is modified
   //             expect(externalId).toEqual({
   //                unassigned: unassignedValue
   //             });
   //             expect(pToken).toEqual(declPToken);
   //             propName = name;
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(propName!).toEqual('nameSpace'); // make sure we've evaluated above
   //       });

   //       it('calls unassigned.assignToProps() with the epilog', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'name',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'externalIdSpace', [
   //                { name: 'externalIdSpace', type: 'space' },
   //                { name: 'nData', type: 'word' },
   //                { name: 'nDataSpace', type: 'space' },
   //                { name: 'nDataName', type: 'word' },
   //                { name: 'nDataNameSpace', type: 'space' },
   //             ]);
   //       });

   //       it('moves any unused unassigned values into an .extra property', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'name',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(declPToken.extra).toEqual(unassignedValue as any);
   //       });

   //    });

   //    describe('unassigned is the ExternalId or the EntityValue', () => {

   //       it('does not unassigned.assignToProps() with the prolog', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'entityValueOrId',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).not.toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'name', [
   //                { name: 'declTypeSpace', type: 'space' },
   //                { name: 'parameter', type: 'word', allowed: /%/ },
   //                { name: 'parameterSpace', type: 'space' },
   //                { name: 'name', type: 'word' },
   //                { name: 'nameSpace', type: 'space' },
   //             ]);
   //       });

   //       it('calls externalId.assignUnassigned() if externalId IS the peref', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'entityValueOrId',
   //          });
   //          let propName: string;
   //          extUnass.and.callFake((externalId: any, pToken: any, name: string) => {
   //             // check externalId now, before it is modified
   //             expect(externalId).toEqual({
   //                unassigned: unassignedValue
   //             });
   //             expect(pToken).toEqual(declPToken);
   //             propName = name;
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(propName!).toEqual('nameSpace'); // make sure we've evaluated above
   //       });

   //       it('calls unassigned.assignToProps() with the epilog if we found an externalId', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'entityValueOrId',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'externalIdSpace', [
   //                { name: 'externalIdSpace', type: 'space' },
   //                { name: 'nData', type: 'word' },
   //                { name: 'nDataSpace', type: 'space' },
   //                { name: 'nDataName', type: 'word' },
   //                { name: 'nDataNameSpace', type: 'space' },
   //             ]);
   //       });

   //       it('calls unassigned.assignToProps() if EntityValue IS the peref', () => {
   //          const unassignedValue = [ {
   //             type: 'literal',
   //          } ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'entityValueOrId',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'EntityValue', [
   //                { name: 'nameSpace', type: 'space' },
   //                { name: 'EntityValue', type: 'literal', flatten: true },
   //                { name: 'entityValueSpace', type: 'space' },
   //             ]);
   //       });

   //       it('calls unassigned.assignToProps() if EntityValue IS the peref, and preceeded by space', () => {
   //          const unassignedValue = [ {
   //             type: 'space',
   //             token: {}
   //          }, {
   //             type: 'literal',
   //          } ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'entityValueOrId',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'EntityValue', [
   //                { name: 'nameSpace', type: 'space' },
   //                { name: 'EntityValue', type: 'literal', flatten: true },
   //                { name: 'entityValueSpace', type: 'space' },
   //             ]);
   //       });

   //       it('does not unassigned.assignToProps() with the epilog if we found an EntityValue', () => {
   //          const unassignedValue = [ {
   //             type: 'literal',
   //          } ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'entityValueOrId',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).not.toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'externalIdSpace', [
   //                { name: 'externalIdSpace', type: 'space' },
   //                { name: 'nData', type: 'word' },
   //                { name: 'nDataSpace', type: 'space' },
   //                { name: 'nDataName', type: 'word' },
   //                { name: 'nDataNameSpace', type: 'space' },
   //             ]);
   //       });

   //    });

   //    describe('unassigned inside externalId', () => {

   //       it('calls externalId.assignUnassigned() if externalId has an unassigned value', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             externalId: {
   //                unassigned: unassignedValue,
   //                nextPropName: 'name',
   //             },
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(externalId.assignUnassigned).toHaveBeenCalledWith(
   //             declPToken.externalId, declPToken, 'nameSpace');
   //       });

   //       it('calls unassigned.assignToProps() if externalId has an unassigned value', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             externalId: {
   //                unassigned: unassignedValue,
   //                nextPropName: 'name',
   //             },
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'externalIdSpace', [
   //                { name: 'externalIdSpace', type: 'space' },
   //                { name: 'nData', type: 'word' },
   //                { name: 'nDataSpace', type: 'space' },
   //                { name: 'nDataName', type: 'word' },
   //                { name: 'nDataNameSpace', type: 'space' },
   //             ]);
   //       });

   //       it('removes any unassigned values in the externalId', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             externalId: {
   //                unassigned: unassignedValue,
   //                nextPropName: 'name',
   //             },
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(declPToken!.externalId!.unassigned).toBeUndefined();
   //          expect(declPToken!.externalId!.extra).toBeUndefined();
   //          expect(declPToken!.externalId!.nextPropName).toBeUndefined();
   //       });

   //    });

   //    describe('unassigned inside epilog', () => {

   //       it('does not call externalId.assignUnassigned()', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             nextPropName: 'nData',
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(externalId.assignUnassigned).not.toHaveBeenCalled();
   //       });

   //       it('calls unassigned.assignToProps() only with the epilog values', () => {
   //          const unassignedValue = [ 'foo' ];
   //          const declPToken = new GeneralEntityDeclarationPToken({
   //             unassigned: unassignedValue,
   //             externalId: {
   //                unassigned: unassignedValue,
   //                nextPropName: 'nData',
   //             },
   //          });

   //          entityDeclaration.assignUnassigned(declPToken);

   //          expect(unAssign.calls.count()).toEqual(1);
   //          expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
   //             declPToken, 'externalIdSpace', [
   //                { name: 'externalIdSpace', type: 'space' },
   //                { name: 'nData', type: 'word' },
   //                { name: 'nDataSpace', type: 'space' },
   //                { name: 'nDataName', type: 'word' },
   //                { name: 'nDataNameSpace', type: 'space' },
   //             ]);
   //       });

   //    });

   // });

   // describe('checkWellFormed()', () => {
   //    let mockErrorCollector: MockErrorCollector;
   //    let pToken: any;
   //    let expectedSToken: STokenMaker;
   //    let emd: EntityMetaData;

   //    beforeEach(() => {
   //       emd = new EntityMetaData();
   //       mockErrorCollector = new MockErrorCollector();
   //       expectedSToken = makeSTokenMaker();
   //       pToken = {
   //          open: expectedSToken('<!'),
   //          declType: expectedSToken('ENTITY'),
   //          declTypeSpace: expectedSToken('\t'),
   //          name: expectedSToken('entityName'),
   //          nameSpace: expectedSToken(' '),
   //          openQuote: expectedSToken('"'),
   //          value: expectedSToken('entityValue'),
   //          closeQuote: expectedSToken('"'),
   //          entityValueSpace: undefined,
   //          close: expectedSToken('>'),
   //       };
   //       spyOn(declaration, 'checkWellFormed');
   //       spyOn(misc, 'checkName');
   //       spyOn(misc, 'checkWellFormedNameRecommendation');
   //       spyOn(misc, 'checkCharWellFormed');
   //       spyOn(externalId, 'checkWellFormed');
   //       spyOn(literal, 'checkWellFormed');
   //    });

   //    it('reports no errors if the entity declaration PToken is undefined', () => {
   //       entityDeclaration.checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector.errors.length).toEqual(0);
   //    });

   //    it('reports no errors if there are unassigned values', () => {
   //       delete pToken.name;
   //       pToken.unassigned = [];

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector.errors.length).toEqual(0);
   //    });

   //    // it('asks the declaration module to look for problems in the declaration part', () => {
   //    //    const emd = new EntityMetaData();

   //    //    entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

   //    //    expect(declaration.checkWellFormed).toHaveBeenCalledWith(pToken, mockErrorCollector, emd);
   //    // });

   //    it('asks the literal module to look for problems in the declaration part', () => {
   //       const emd = new EntityMetaData();

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

   //       expect(literal.checkWellFormed).toHaveBeenCalledWith(pToken, mockErrorCollector, emd,
   //          WellFormedError.ID.NOUN_ENTITYVALUE);
   //    });

   //    it('reports an error if % is not followed by a space', () => {
   //       pToken.parameter = expectedSToken('%');

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector.report)
   //          .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ 'entityName' ]);
   //    });

   //    it('reports an error if there is no name', () => {
   //       delete pToken.name;

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.ENTITYDECL_NO_NAME,
   //          params: undefined,
   //          position: undefined,
   //          lastPosition: undefined,   // normally would be the space after ENTITY, but it is mocked out
   //       });
   //    });

   //    it('calls misc.checkName() to report on name validity', () => {
   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

   //       expect(misc.checkName).toHaveBeenCalledWith(pToken.name,
   //          mockErrorCollector, emd, WellFormedError.ID.ENTITYDECL_NAME_INVALID);
   //    });

   //    it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

   //       expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(pToken.name,
   //          mockErrorCollector, emd, 'ENTITY', XmlWarning.ID.ENTITYDECL_NAME_XMLDASH_RESERVED,
   //          XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
   //    });

   //    it('reports an error if there is no space after the name', () => {
   //       delete pToken.nameSpace;

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
   //          params: [ 'entityName' ],
   //          position: undefined,
   //          lastPosition: pToken.name,
   //       });
   //    });

   //    it('calls externalId.checkWellFormed() to check on the externalId', () => {
   //       delete pToken.openQuote;
   //       delete pToken.value;
   //       delete pToken.closeQuote;
   //       pToken.externalId = { externalId: true };
   //       const emd = new EntityMetaData();

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

   //       expect(externalId.checkWellFormed).toHaveBeenCalledWith(pToken.externalId,
   //          mockErrorCollector, emd);
   //    });

   //    it('reports an error if NDATA is the wrong case', () => {
   //       pToken.externalId = { externalId: true };
   //       pToken.nData = expectedSToken('nData');
   //       pToken.nDataName = expectedSToken('foo');

   //       entityDeclaration.checkWellFormed(new GeneralEntityDeclarationPToken(pToken), mockErrorCollector, emd);

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.ENTITYDECL_NDATA_INVALID_CASE,
   //          params: [ 'entityName', 'nData' ],
   //          position: pToken.nData,
   //       });
   //    });

   //    it('reports an error if there is no NDATA value', () => {
   //       pToken.externalId = { externalId: true };
   //       pToken.nData = expectedSToken('nData');

   //       entityDeclaration.checkWellFormed(new GeneralEntityDeclarationPToken(pToken), mockErrorCollector, emd);

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
   //          params: [ 'entityName' ],
   //          lastPosition: pToken.nData,
   //       });
   //    });

   //    it('calls checkCharWellFormed() to check on the ndata value', () => {
   //       pToken.externalId = { externalId: true };
   //       pToken.nData = expectedSToken('NDATA');
   //       pToken.nDataName = expectedSToken('foo');
   //       const emd = new EntityMetaData();

   //       entityDeclaration.checkWellFormed(new GeneralEntityDeclarationPToken(pToken), mockErrorCollector, emd);

   //       expect(misc.checkCharWellFormed).toHaveBeenCalledWith(pToken.nDataName,
   //          mockErrorCollector, emd);
   //    });

   //    it('reports an error if there is no EnitytValue or ExternalID', () => {
   //       delete pToken.openQuote;
   //       delete pToken.value;
   //       delete pToken.closeQuote;

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.ENTITYDECL_NO_VALUE,
   //          params: [ 'entityName' ],
   //          lastPosition: pToken.nameSpace,
   //       });
   //    });

   //    it('reports an error if there was no closing', () => {
   //       delete pToken.close;

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.ENTITYDECL_NO_CLOSE,
   //          params: [ 'entityName' ],
   //          position: undefined,
   //          lastPosition: pToken.nameSpace,
   //       });
   //    });

   //    it('calls unassigned.checkExtra() with extras', () => {
   //       spyOn(unassigned, 'checkExtra');
   //       const startSToken = new SToken('one', 'one', new Range(undefined, 0, 0, 0, 0, 0, 0));
   //       pToken.extra = [
   //          unassigned.wordFromSToken(startSToken),
   //       ];

   //       entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

   //       expect(unassigned.checkExtra).toHaveBeenCalledWith(pToken.extra,
   //          mockErrorCollector,
   //          WellFormedError.ID.ENTITYDECL_EXTRA_TEXT);
   //    });

   // });

   // describe('pTokenToXToken()', () => {
   //    let pToken: any;

   //    beforeEach(() => {
   //       const expectedSToken = makeSTokenMaker();
   //       spyOn(externalId, 'makeEntityLocation');
   //       pToken = {
   //          parameter: expectedSToken('%'),
   //          name: expectedSToken('entityName'),
   //          value: [ expectedSToken('value') ],
   //       };
   //    });

   //    it('calls externalId.makeEntityLocation()', () => {
   //       delete pToken.parameter;
   //       delete pToken.value;
   //       pToken.externalId = { externalId: true };

   //       entityDeclaration.pTokenToXToken(pToken);

   //       expect(externalId.makeEntityLocation).toHaveBeenCalledWith(pToken.externalId);
   //    });

   //    it('returns an entity declaration token with the name and value found in the parsing', () => {
   //       delete pToken.parameter;

   //       const token = entityDeclaration.pTokenToXToken(pToken);

   //       expect(token).toEqual(new GeneralEntityDeclarationXToken('entityName', pToken.value,
   //          undefined, '', pToken));
   //    });

   //    it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
   //       const xToken = entityDeclaration.pTokenToXToken(pToken);

   //       expect(xToken).toEqual(new ParameterEntityDeclarationXToken('entityName', pToken.value,
   //          undefined, pToken));
   //    });

   //    it('returns a entity declaration with a blank name if there is no name', () => {
   //       delete pToken.parameter;
   //       delete pToken.name;

   //       const xToken = entityDeclaration.pTokenToXToken(pToken);

   //       expect(xToken).toEqual(new GeneralEntityDeclarationXToken('', pToken.value, undefined, '', pToken));
   //    });

   //    it('returns a entity declaration with an undefined value if there is no value', () => {
   //       delete pToken.parameter;
   //       pToken.value = [];

   //       const xToken = entityDeclaration.pTokenToXToken(pToken);

   //       expect(xToken).toEqual(new GeneralEntityDeclarationXToken('entityName', [], undefined, '', pToken));
   //    });

   // });

});
