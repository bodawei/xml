/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError } from '../../error';

import entityReference from '../entityReference.js';
import text from '../text.js';
import unassigned from '../unassigned.js';

import externalId from './externalId.js';
import literal from './literal.js';

describe('externalId (unit)', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedSToken;

      beforeEach(() => {
         expectedSToken = makeSTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
         spyOn(literal, 'parse').and.callFake((_1, _2, callback) => { callback(false); });
         spyOn(unassigned, 'makeCheckCallback').and.callFake((_1, _2, _3, cb) => cb);
         spyOn(unassigned, 'checkForPERef').and.callFake((_1, cb) => {
            cb();
         })
      });

      it('returns simple values', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
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
            public: {},
            postPublicSpace: expectedSToken(' '),
            system: {},
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
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
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
            public: {},
            postIdTypeSpace: expectedSToken(' '),
            postPublicSpace: expectedSToken(' '),
         } ] ]);
      });

      it('does not mind if public or ndata are the wrong case', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
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
            public: {},
            postPublicSpace: expectedSToken(' '),
         } ] ]);
      });

      it('stops if it does not find an open quote', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
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
         literal.parse.and.callFake((_1, _2, callback) => {
            if (!didPublic) {
               didPublic = true;
               callback(true);
            } else {
               callback(false);
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
            public: {},
            postPublicSpace: expectedSToken(' '),
         } ] ]);
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
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
            public: {},
            postPublicSpace: undefined,
            system: {},
         } ] ]);
      });

      // White box: Not testing the same cases for missing parts of the system value as this is the same code

      describe('parameter entity reference', () => {

         it('sets up to let unassigned handle checking for a PE Reference', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unassigned.makeCheckCallback.and.returnValue(checkCallbackSpy);
            mockSource = new MockSTokenSource([]);

            externalId.parse(mockSource, [], callback);
            mockSource.respondInAsyncTime();

            expect(unassigned.makeCheckCallback.calls.argsFor(0)[0]).toEqual({
               type: externalId.PTYPE,
            });
            expect(unassigned.makeCheckCallback.calls.argsFor(0)[1]).toEqual('idType');
            expect(unassigned.makeCheckCallback.calls.argsFor(0)[2]).toEqual(callback);
            expect(unassigned.makeCheckCallback.calls.argsFor(0)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

         it('sets up unassigned to check for PERef for the public value', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unassigned.makeCheckCallback.and.callFake((_1, type, deliver, otherwise) => {
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

            expect(unassigned.makeCheckCallback.calls.argsFor(1)[0]).toEqual({
               type: 'EXTERNAL_ID',
               idType: expectedSToken('PUBLIC'),
               postIdTypeSpace: undefined,
            });
            expect(unassigned.makeCheckCallback.calls.argsFor(1)[1]).toEqual('public');
            expect(unassigned.makeCheckCallback.calls.argsFor(1)[2]).toEqual(callback);
            expect(unassigned.makeCheckCallback.calls.argsFor(1)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

         it('sets up unassigned to check for PERef for the system value', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unassigned.makeCheckCallback.and.callFake((_1, type, deliver, otherwise) => {
               if (type === 'idType' || type === 'public') {
                  return () => otherwise();
               } else {
                  return checkCallbackSpy;
               }
            });
            literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
            mockSource = new MockSTokenSource([
               [ MockSTokenSource.PEEK('PUBLIC'), 'peekWord', [ '"', '\'' ] ],
               [ 'PUBLIC', 'word', [ '"', '\'' ] ],
               [ undefined, 'space' ],
               [ ' ', 'space' ],
            ]);

            externalId.parse(mockSource, [], callback);
            mockSource.respondInAsyncTime();

            expect(unassigned.makeCheckCallback.calls.argsFor(2)[0]).toEqual({
               type: 'EXTERNAL_ID',
               idType: expectedSToken('PUBLIC'),
               postIdTypeSpace: undefined,
               public: {},
               postPublicSpace: expectedSToken(' '),
            });
            expect(unassigned.makeCheckCallback.calls.argsFor(2)[1]).toEqual('system');
            expect(unassigned.makeCheckCallback.calls.argsFor(2)[2]).toEqual(callback);
            expect(unassigned.makeCheckCallback.calls.argsFor(2)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

      });

   });

   describe('assignUnassigned()', () => {

      beforeEach(() => {
         spyOn(unassigned, 'assignToProps');
      });

      it('does nothing if there is no unassigned array', () => {
         const pToken = {};

         expect(() => externalId.assignUnassigned(pToken)).not.toThrow();
      });

      it('deletes the unassigned array if it comes in empty', () => {
         const externalIdToken = {
            unassigned: [],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(externalIdToken.unassigned).toBeUndefined();
      });

      it('does nothing if there is still an unexpanded parameter entity reference', () => {
         const externalIdToken = {
            unassigned: [
               new entityReference.ParamPToken(),
            ],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls assignToProps()', () => {
         const externalIdToken = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'hi' ],
            externalIdToken,
            'postIdTypeSpace', [
               { name: 'idType', type: 'word', allowed: [ 'public', 'system' ]  },
               { name: 'postIdTypeSpace', type: 'space' },
               { name: 'public', type: 'literal' },
               { name: 'postPublicSpace', type: 'space' },
               { name: 'system', type: 'literal' },
            ]);
      });

      it('calls assignToProps() with the previous space property name, if provided', () => {
         const externalIdToken = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'hi' ],
            externalIdToken,
            'postIdTypeSpace', [
               { name: '__bogusWorkaround', type: 'space' },
               { name: 'idType', type: 'word', allowed: [ 'public', 'system' ]  },
               { name: 'postIdTypeSpace', type: 'space' },
               { name: 'public', type: 'literal' },
               { name: 'postPublicSpace', type: 'space' },
               { name: 'system', type: 'literal' },
            ]);
      });

      it('forces idType to be the start value if none provided', () => {
         const externalIdToken = {
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, {}, 'testPropName');

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'hi' ],
            externalIdToken,
            'idType', [
               { name: '__bogusWorkaround', type: 'space' },
               { name: 'idType', type: 'word', allowed: [ 'public', 'system' ]  },
               { name: 'postIdTypeSpace', type: 'space' },
               { name: 'public', type: 'literal' },
               { name: 'postPublicSpace', type: 'space' },
               { name: 'system', type: 'literal' },
            ]);
      });

      it('moves the previous property to the container', () => {
         unassigned.assignToProps.and.callFake((_1, pToken) => {
            pToken.__bogusWorkaround = SToken.fromString('bogus');
            pToken.unassigned = [];
         });
         const container = {};
         const externalIdToken = {
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
         unassigned.assignToProps.and.callFake((_1, pToken) => {
            pToken.__bogusWorkaround = SToken.fromString('b');
            pToken.unassigned = [];
         });
         const container = {
            testPropName: SToken.fromString('a'),
         };
         const externalIdToken = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [ 'hi' ],
         };

         externalId.assignUnassigned(externalIdToken, container, 'testPropName');

         expect(container).toEqual({
            testPropName: SToken.fromString('ab'),
         });
      });

      it('removes the unassigned array if it is empty', () => {
         const externalIdToken = {
            nextPropName: 'postIdTypeSpace',
            unassigned: [
               new text.PToken({ text: SToken.fromString('hi') }),
            ],
         };
         unassigned.assignToProps.and.callFake((unArray) => {
            unArray.forEach(() => unArray.shift());
         });

         externalId.assignUnassigned(externalIdToken);

         expect(externalIdToken.unassigned).toBeUndefined();
      });

      it('moves unused unassigned to .extra', () => {
         const externalIdToken = {
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

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let pTokenPart;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         const expectedSToken = makeSTokenMaker();
         pTokenPart = {
            type: 'EXTERNAL_ID',
            idType: expectedSToken('PUBLIC'),
            postIdTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [ new text.PToken({ text: expectedSToken('pub.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
            postPublicSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [ new text.PToken({ text: expectedSToken('sys.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };
         spyOn(literal, 'checkWellFormed');
      });

      it('calls literal.checkWellFormed() to check the PUBLIC value', () => {
         const emd = new EntityMetaData();
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, emd);

         expect(literal.checkWellFormed.calls.argsFor(0)[0]).toEqual(pTokenPart.public);
         expect(literal.checkWellFormed.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(literal.checkWellFormed.calls.argsFor(0)[2]).toEqual(emd);
         expect(literal.checkWellFormed.calls.argsFor(0)[3]).toEqual(undefined);
         expect(literal.checkWellFormed.calls.argsFor(0)[4] instanceof Function).toEqual(true);
      });

      it('calls literal.checkWellFormed() to check the SYSTEM value', () => {
         const emd = new EntityMetaData();
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, emd);

         expect(literal.checkWellFormed.calls.argsFor(1)[0]).toEqual(pTokenPart.system);
         expect(literal.checkWellFormed.calls.argsFor(1)[1]).toEqual(mockErrorCollector);
         expect(literal.checkWellFormed.calls.argsFor(1)[2]).toEqual(emd);
         expect(literal.checkWellFormed.calls.argsFor(1)[3]).toEqual(WellFormedError.ID.NOUN_EXTERNALID_SYSTEM);
         expect(literal.checkWellFormed.calls.argsFor(1)[4]).toEqual(undefined);
      });

      it('reports an error if the PUBLIC value has illegal characters', () => {
         pTokenPart.public.value[0].str = 'bad&chars';
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         // invoke the callback function
         literal.checkWellFormed.calls.argsFor(0)[4]();

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            params: [ '&' ],
            position: pTokenPart.postPublicSpace,   // This is only because we call the callback after
         });
      });

      it('reports no errors the pToken is passed in with unassigned values', () => {
         pTokenPart.idType = new SToken('bad'),
         pTokenPart.unassigned = [];
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports no errors when no PToken part is passed in', () => {
         externalId.checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports no errors if the public value is undefined (this can not happen naturally)', () => {
         literal.checkWellFormed.and.callFake((_1, _2, _3, _4, callback) => {
            return callback ? callback() : undefined;
         });
         delete pTokenPart.public.value;
         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if the public value contains invalid characters', () => {
         literal.checkWellFormed.and.callFake((_1, _2, _3, _4, callback) => {
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
         literal.checkWellFormed.and.callFake((publicOrSystem, _2, _3, _4, callback) => {
            if (!publicOrSystem) {
               callback();
            }
         });
         delete pTokenPart.public;

         expect(() => {
            externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());
         }).not.toThrow();
      });

      it('reports an error if there are extra unassigned values', () => {
         const startSToken = SToken.fromString('one');
         startSToken.ranges.push(new Range(undefined, 0, 0, 0, 0, 0, 0));
         pTokenPart.extra = [
            unassigned.wordFromSToken(startSToken),
            unassigned.spaceFromSToken(SToken.fromString(' ')), {
               type: 'literal',
               openQuote: SToken.fromString('"'),
               closeQuote: SToken.fromString('"'),
            }, new entityReference.ParamPToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('fred'),
               close: SToken.fromString(';'),
            }),
         ];

         externalId.checkWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_EXTRA_TEXT,
            params: [ 'one ""&fred;' ],
            position: startSToken,
         });
      });

      it('reports no errors if extra is empty', () => {
         const startSToken = SToken.fromString('one');
         startSToken.ranges.push(new Range(undefined, 0, 0, 0, 0, 0, 0));
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
               value: [ new text.PToken({ text: expectedSToken('sys.xml') }) ],
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
               value: [ new text.PToken({ text: expectedSToken('pub.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
            postPublicSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [ new text.PToken({ text: expectedSToken('sys.xml') }) ],
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
               value: [ new text.PToken({ text: expectedSToken('sys.xml') }) ],
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
               value: [ new text.PToken({ text: expectedSToken('pub.xml') }) ],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = externalId.makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation(undefined, 'pub.xml'));
      });

      it('returns nothing if no PTokenPart value provided', () => {
         const externalLoc = externalId.makeEntityLocation();

         expect(externalLoc).toBeUndefined();
      });

   });

   describe('getSTokens()', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
      });

      it('calls literal.getSTokens() for the PUBLIC value', () => {
         const pTokenPart = {};

         externalId.getSTokens(pTokenPart);

         expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.public);
      });

      it('calls literal.getSTokens() for the SYSTEM value', () => {
         const pTokenPart = {};

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
