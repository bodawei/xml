/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import unassigned, { UnassignedArray, UnassignedValue, UnassignedType } from '../unassigned';

import externalId from '../externalId';
import literal from '../literal';
import { ParameterEntityReferencePToken } from 'source/token/parameterEntityReference';
import { TextPToken } from 'source/token/text';

describe('externalId (unit)', () => {

   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let callback: jasmine.Spy;
      let expectedSToken: STokenMaker;
      let literalParseSpy: jasmine.Spy;
      let unCheck: jasmine.Spy;

      beforeEach(() => {
         expectedSToken = makeSTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
         literalParseSpy = spyOn(literal, 'parse').and.callFake((_1: any, options: any, callback: Function) => { callback(); });
         unCheck = spyOn(unassigned, 'makeCheckCallback').and.callFake((_1: any, _2: any, _3: any, cb: Function) => cb);
         spyOn(unassigned, 'checkForPERef').and.callFake((_1: any, cb: Function) => {
            cb();
         })
      });

      it('returns simple values', () => {
         literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
            [ 'PUBLIC', 'word', [ '"', '\'' ] ],
            [ ' ', 'space' ],
            // literal
            [ ' ', 'space' ],
            [ undefined, 'peekWord' ],
         ]);
         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               value: [],
            },
            postPublicSpace: expectedSToken(' '),
            system: {
               value: [],
            },
         } ] ]);
      });

      it('only finds a SystemLiteral if that is all that is offered', () => {
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('SYSTEM'), 'peekWord', [ '"', '\'' ] ],
            [ 'SYSTEM', 'word', [ '"', '\'' ] ],
            [ ' ', 'space' ],
            // literal
            [ undefined, 'peekWord' ],
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('SYSTEM'),
            postIdTypeSpace: expectedSToken(' '),
         } ] ]);
      });

      it('returns nothing if it gets nothing back on first call', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'peekWord' ],
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('BOGUS!'), 'peekWord', [ '"', '\'' ] ],
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('stops if it finds an NDATA after finding the PublicId', () => {
         literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
            [ 'PUBLIC', 'word', [ '"', '\'' ] ],
            [ ' ', 'space' ],
            // literal
            [ ' ', 'space' ],
            [ 'NDATA', 'peekWord', [ '"', '\'' ] ],
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            public: {
               value: [],
            },
            postIdTypeSpace: expectedSToken(' '),
            postPublicSpace: expectedSToken(' '),
         } ] ]);
      });

      it('does not mind if public or ndata are the wrong case', () => {
         literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('pUbLiC'), 'peekWord', [ '"', '\'' ] ],
            [ 'pUbLiC', 'word', [ '"', '\'' ] ],
            [ ' ', 'space' ],
            // literal
            [ ' ', 'space' ],
            [ 'nData', 'peekWord', [ '"', '\'' ] ],
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('pUbLiC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               value: [],
            },
            postPublicSpace: expectedSToken(' '),
         } ] ]);
      });

      it('stops if it does not find an open quote', () => {
         literalParseSpy.and.callFake((_1: any, _2: any, callback: Function) => { callback(); });
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
            [ 'PUBLIC', 'word', [ '"', '\'' ] ],
            [ ' ', 'space' ],
            // literal
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
         } ] ]);
      });

      it('does not mind if, illegally, no space between PUBLIC and PublicLiteral', () => {
         let didPublic = false;
         literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => {
            if (!didPublic) {
               didPublic = true;
               callback(options.pToken);
            } else {
               callback();
            }
         });
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
            [ 'PUBLIC', 'word', [ '"', '\'' ] ],
            [ undefined, 'space' ],
            // literal
            [ ' ', 'space' ],
            [ undefined, 'peekWord' ],  // check for ndata
            // literal
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: undefined,
            public: {
               value: [],
            },
            postPublicSpace: expectedSToken(' '),
         } ] ]);
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
         mockSource = new MockSTokenSource([
            [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
            [ 'PUBLIC', 'word', [ '"', '\'' ] ],
            [ ' ', 'space' ],
            // literal
            [ undefined, 'space' ],
            [ '"foo"', 'peekWord' ],  // check for ndata
            // literal
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               value: [],
            },
            postPublicSpace: undefined,
            system: {
               value: [],
            },
         } ] ]);
      });

      // White box: Not testing the same cases for missing parts of the system value as this is the same code

      describe('parameter entity reference', () => {

         it('sets up to let unassigned handle checking for a PE Reference', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unCheck.and.returnValue(checkCallbackSpy);
            mockSource = new MockSTokenSource([]);

            externalId.parse(mockSource, [], callback);
            mockSource.respondInAsyncTime();

            expect(unCheck.calls.argsFor(0)[0]).toEqual({
               type: externalId.PTYPE,
            });
            expect(unCheck.calls.argsFor(0)[1]).toEqual('idType');
            expect(unCheck.calls.argsFor(0)[2]).toEqual(callback);
            expect(unCheck.calls.argsFor(0)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

         it('sets up unassigned to check for PERef for the public value', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unCheck.and.callFake((_1: any, type: string, deliver: Function, otherwise: Function) => {
               if (type === 'idType') {
                  return () => otherwise();
               } else {
                  return checkCallbackSpy;
               }
            });
            mockSource = new MockSTokenSource([
               [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
               [ 'PUBLIC', 'word', [ '"', '\'' ] ],
               [ undefined, 'space' ],
            ]);

            externalId.parse(mockSource, [], callback);
            mockSource.respondInAsyncTime();

            expect(unCheck.calls.argsFor(1)[0]).toEqual({
               type: 'EXTERNAL_ID',
               idType: expectedSToken('PUBLIC'),
               postIdTypeSpace: undefined,
            });
            expect(unCheck.calls.argsFor(1)[1]).toEqual('public');
            expect(unCheck.calls.argsFor(1)[2]).toEqual(callback);
            expect(unCheck.calls.argsFor(1)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

         it('sets up unassigned to check for PERef for the system value', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unCheck.and.callFake((_1: any, type: string, deliver: Function, otherwise: Function) => {
               if (type === 'idType' || type === 'public') {
                  return () => otherwise();
               } else {
                  return checkCallbackSpy;
               }
            });
            literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => { callback(options.pToken); });
            mockSource = new MockSTokenSource([
               [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
               [ 'PUBLIC', 'word', [ '"', '\'' ] ],
               [ undefined, 'space' ],
               [ ' ', 'space' ],
            ]);

            externalId.parse(mockSource, [], callback);
            mockSource.respondInAsyncTime();

            expect(unCheck.calls.argsFor(2)[0]).toEqual({
               type: 'EXTERNAL_ID',
               idType: expectedSToken('PUBLIC'),
               postIdTypeSpace: undefined,
               public: {
                  value: [],
               },
               postPublicSpace: expectedSToken(' '),
            });
            expect(unCheck.calls.argsFor(2)[1]).toEqual('system');
            expect(unCheck.calls.argsFor(2)[2]).toEqual(callback);
            expect(unCheck.calls.argsFor(2)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

      });

   });

   describe('assignUnassignedNew()', () => {
      let unProps: jasmine.Spy;

      beforeEach(() => {
         unProps = spyOn(unassigned, 'assignToProps');
      });

      it('undoes the previous externalID if nothing was settable', () => {
         const unassigned: UnassignedValue = {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({ open: SToken.fromString('%'), }),
         };

         const prev: any = {
            externalId: {  },
         };

         externalId.assignUnassignedNew([ unassigned ], prev, 'foo');

         expect(prev.externalId).toEqual({});
      });

   });

   describe('assignUnassigned()', () => {
      let unProps: jasmine.Spy;

      beforeEach(() => {
         unProps = spyOn(unassigned, 'assignToProps');
      });

      it('does nothing if there is no unassigned array', () => {
         const pToken: any = {};

         expect(() => externalId.assignUnassigned(pToken)).not.toThrow();
      });

      it('deletes the unassigned array if it comes in empty', () => {
         const externalIdToken: any = {
            unassigned: [],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(externalIdToken.unassigned).toBeUndefined();
      });

      it('does nothing if there is still an unexpanded parameter entity reference', () => {
         const externalIdToken: any = {
            unassigned: [ {
               type: 'reference',
               token: new ParameterEntityReferencePToken({ open: SToken.fromString('%'), }),
            } ],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls assignToProps()', () => {
         const externalIdToken: any = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'hi' ],
            externalIdToken,
            'postIdTypeSpace', [
               { name: 'idType', type: 'word', allowed: /public|system/i  },
               { name: 'postIdTypeSpace', type: 'space' },
            ]);
      });

      it('calls assignToProps() with the previous space property name, if provided', () => {
         const externalIdToken: any = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'hi' ],
            externalIdToken,
            'postIdTypeSpace', [
               { name: '__bogusWorkaround', type: 'space' },
               { name: 'idType', type: 'word', allowed: /public|system/i  },
               { name: 'postIdTypeSpace', type: 'space' },
            ]);
      });

      it('forces idType to be the start value if none provided', () => {
         const externalIdToken: any = {
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'hi' ],
            externalIdToken,
            'idType', [
               { name: '__bogusWorkaround', type: 'space' },
               { name: 'idType', type: 'word', allowed: /public|system/i  },
               { name: 'postIdTypeSpace', type: 'space' },
            ]);
      });

      it('moves the previous property to the container', () => {
         unProps.and.callFake((_1: any, pToken: any) => {
            pToken.__bogusWorkaround = SToken.fromString('bogus');
            pToken.unassigned = [];
         });
         const container = {};
         const externalIdToken: any = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, container, 'testPropName');

         expect(externalIdToken.__bogusWorkaround).toBeUndefined();
         expect(container).toEqual({
            testPropName: SToken.fromString('bogus'),
         });
      });

      it('merges a space with the previous property', () => {
         unProps.and.callFake((_1: any, pToken: any) => {
            pToken.__bogusWorkaround = SToken.fromString('b');
            pToken.unassigned = [];
         });
         const container = {
            testPropName: SToken.fromString('a'),
         };
         const externalIdToken: any = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, container, 'testPropName');

         expect(container).toEqual({
            testPropName: SToken.fromString('ab'),
         });
      });

      it('removes the unassigned array if it is empty', () => {
         const externalIdToken: any = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [
               new TextPToken({ text: SToken.fromString('hi') }),
            ],
         };
         unProps.and.callFake((unArray: Array<any>) => {
            unArray.forEach(() => unArray.shift());
         });

         externalId.assignUnassigned(externalIdToken);

         expect(externalIdToken.unassigned).toBeUndefined();
      });

      it('moves unused unassigned to .extra', () => {
         const externalIdToken: any = {
            nextPropName: 'idType',
            unassigned: [
               unassigned.wordFromSToken(SToken.fromString('hi')),
            ],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(externalIdToken.extra).toEqual([
            unassigned.wordFromSToken(SToken.fromString('hi')),
         ]);
      });

      it('passes the necessary parameters to unassigned.assignToProps() when type is system', () => {
         const sysVal = {
            type: 'literal',
            token: {
               openQuote: SToken.fromString('"'),
            }
         };
         const externalIdToken: any = {
            unassigned: [
               unassigned.wordFromSToken(SToken.fromString('sYsTeM')), sysVal
            ],
         };
         unProps.and.callFake((values: any, pToken: any, name: any) => {
            if (name === 'idType') {
               pToken.idType = values[0].token.text;
               values.shift();
            }
         });

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(unProps.calls.argsFor(1)).toEqual([
            [ sysVal ], externalIdToken, 'system', [
               { name: 'postIdTypeSpace', type: 'space' }, // test
               { name: 'system', type: 'literal' },
            ] ]);
      });

      it('passes the necessary parameters to unassigned.assignToProps() when type is PUBLIC', () => {
         const sysVal = {
            type: 'literal',
            token: {
               openQuote: SToken.fromString('"'),
            }
         };
         const pubVal = {
            type: 'literal',
            token: {
               openQuote: SToken.fromString('\''),
            }
         };
         const externalIdToken: any = {
            unassigned: [
               unassigned.wordFromSToken(SToken.fromString('puBlic')), pubVal, sysVal
            ],
         };
         unProps.and.callFake((values: any, pToken: any, name: any) => {
            if (name === 'idType') {
               pToken.idType = values[0].token.text;
               values.shift();
            }
         });

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(unProps.calls.argsFor(1)).toEqual([
            [ pubVal, sysVal ], externalIdToken, 'public', [
               { name: 'postIdTypeSpace', type: 'space' },
               { name: 'public', type: 'literal' },
               { name: 'postPublicSpace', type: 'space' },
               { name: 'system', type: 'literal' },
            ] ]);
      });

      it('ignores a trailing literal if this is of type system', () => {
         const externalIdToken: any = {
            unassigned: [
               unassigned.wordFromSToken(SToken.fromString('sYsTeM')), {
                  type: 'literal',
                  token: {
                     openQuote: SToken.fromString('"'),
                  },
               }, {
                  type: 'literal',
                  token: {
                     openQuote: SToken.fromString('\''),
                  }
               },
            ],
         };
         unProps.and.callFake((values: any, pToken: any, name: any, descriptors: any) => {
            if (name === 'idType') {
               pToken.idType = values[0].token.text;
               values.shift();
            } else {
               pToken.system = values.shift();
            }
         });

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(externalIdToken.extra).toEqual([ {
            type: 'literal',
            token: {
               openQuote: SToken.fromString('\''),
            }
         } ]);
      });


   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let pTokenPart: any;
      let litWell: jasmine.Spy;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         const expectedSToken = makeSTokenMaker();
         pTokenPart = {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('pub.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
            postPublicSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('sys.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };
         litWell = spyOn(literal, 'checkWellFormed');
      });

      it('calls literal.checkWellFormed() to check the PUBLIC value', () => {
         const emd = new EntityMetaData();
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, emd);

         expect(litWell.calls.argsFor(0)[0]).toEqual(pTokenPart.public);
         expect(litWell.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(litWell.calls.argsFor(0)[2]).toEqual(emd);
         expect(litWell.calls.argsFor(0)[3]).toEqual(undefined);
         expect(litWell.calls.argsFor(0)[4] instanceof Function).toEqual(true);
      });

      it('calls literal.checkWellFormed() to check the SYSTEM value', () => {
         const emd = new EntityMetaData();
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, emd);

         expect(litWell.calls.argsFor(1)[0]).toEqual(pTokenPart.system);
         expect(litWell.calls.argsFor(1)[1]).toEqual(mockErrorCollector);
         expect(litWell.calls.argsFor(1)[2]).toEqual(emd);
         expect(litWell.calls.argsFor(1)[3]).toEqual(WellFormedError.ID.NOUN_EXTERNALID_SYSTEM);
         expect(litWell.calls.argsFor(1)[4]).toEqual(undefined);
      });

      it('reports an error if the PUBLIC value has illegal characters', () => {
         pTokenPart.public.value[0].str = 'bad&chars';
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         // invoke the callback function
         litWell.calls.argsFor(0)[4]();

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            params: [ '&' ],
            position: pTokenPart.postPublicSpace,   // This is only because we call the callback after
         });
      });

      it('reports no errors the pToken is passed in with unassigned values', () => {
         pTokenPart.idType = SToken.fromString('bad'),
         pTokenPart.unassigned = [];
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports no errors when no PToken part is passed in', () => {
         externalId.checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports no errors if the public value is undefined (this can not happen naturally)', () => {
         litWell.and.callFake((_1: any, _2: any, _3: any, _4: any, callback: Function) => {
            return callback ? callback() : undefined;
         });
         delete pTokenPart.public.value;
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if the public value contains invalid characters', () => {
         litWell.and.callFake((_1: any, _2: any, _3: any, _4: any, callback: Function) => {
            return callback ? callback() : undefined;
         });
         pTokenPart.public.value[0].str = '{}{}{}{}';

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            params: [ '{' ],
            position: pTokenPart.postIdTypeSpace,   // wrong due to mocking
         });
      });

      it('reports an error if type is neither PUBLIC or SYSTEM', () => {
         pTokenPart.idType.str = 'Bogus';

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_UNKNOWN,
            params: [ 'Bogus' ],
            position: pTokenPart.idType,
         });
      });

      it('reports an error if type is the wrong case', () => {
         pTokenPart.idType.str = 'public';

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
            params: [ 'PUBLIC', 'public' ],
            position: pTokenPart.idType,
         });
      });

      it('reports an error if there is no space after the id type', () => {
         delete pTokenPart.postIdTypeSpace;

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_IDTYPE_NO_SPACE,
            params: undefined,
            lastPosition: pTokenPart.idType,
         });
      });

      it('reports an error if there is no space after a PUBLIC part', () => {
         delete pTokenPart.postPublicSpace;

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: pTokenPart.postIdTypeSpace, // beccause we are mocking out the quotes call
         });
      });

      it('reports no error if there is no system part', () => {
         delete pTokenPart.system;

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('throws no errors if there is no public part', () => {
         litWell.and.callFake((publicOrSystem: any, _2: any, _3: any, _4: any, callback: Function) => {
            if (!publicOrSystem) {
               callback();
            }
         });
         delete pTokenPart.public;

         expect(() => {
            externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());
         }).not.toThrow();
      });

      it('calls unassigned.checkExtra() with extras', () => {
         spyOn(unassigned, 'checkExtra');
         const startSToken = new SToken('one', 'one', new Range(new EntityLocation(), 0, 0, 0, 0, 0, 0));
         pTokenPart.extra = [
            unassigned.wordFromSToken(startSToken),
         ];

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(unassigned.checkExtra).toHaveBeenCalledWith(pTokenPart.extra,
            mockErrorCollector,
            WellFormedError.ID.EXTERNALID_EXTRA_TEXT);
      });

      it('reports no errors if extra is empty', () => {
         const startSToken = SToken.fromString('one');
         startSToken.ranges.push(new Range(new EntityLocation(), 0, 0, 0, 0, 0, 0));
         pTokenPart.extra = [];

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

   });

   describe('makeEntityLocation()', () => {

      it('returns nothing if the pToken part has an unassigned', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            unassigned: [],
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('sys.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = externalId.makeEntityLocation(pTokenPart);

         expect(externalLoc).toBeUndefined();
      });

      it('returns an EntityLocation with the public and system ids', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('pub.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
            postPublicSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('sys.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = externalId.makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
      });

      it('returns an EntityLocation with the system id only if there is no public', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('sys.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = externalId.makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml'));
      });

      it('returns an EntityLocation with the public only if there is no system', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [ new TextPToken({ text: expectedSToken('pub.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = externalId.makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation(undefined, 'pub.xml'));
      });

      it('returns nothing if no PTokenPart value provided', () => {
         const externalLoc = externalId.makeEntityLocation(undefined);

         expect(externalLoc).toBeUndefined();
      });

   });

   describe('getSTokens()', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
      });

      it('calls literal.getSTokens() for the PUBLIC value', () => {
         const pTokenPart: any = {};

         externalId.getSTokens(pTokenPart);

         expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.public);
      });

      it('calls literal.getSTokens() for the SYSTEM value', () => {
         const pTokenPart: any = {};

         externalId.getSTokens(pTokenPart);

         expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.system);
      });

      it('returns the STokens that made up the external ID', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            postPublicSpace: expectedSToken(' '),
         };

         const results = externalId.getSTokens(pTokenPart);

         expect(results).toEqual([
            pTokenPart.idType,
            pTokenPart.postIdTypeSpace,
            pTokenPart.postPublicSpace,
         ]);
      });

      it('returns an empty array if given nothing', () => {
         const results = externalId.getSTokens();

         expect(results).toEqual([]);
      });

   });

});
