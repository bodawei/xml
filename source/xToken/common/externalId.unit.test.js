/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../../basic';
import { MockErrorCollector } from '../../basic/test';
import { makeLTokenMaker, MockLTokenSource } from '../../lToken/test';
import { WellFormedError } from '../../error';

import * as externalId from './externalId.js';
import * as quotedValue from './quotedValue.js';

describe('externalId (unit)', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
         spyOn(quotedValue, 'parse');
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
      });

      it('returns simple values', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('PUBLIC'),
            'PUBLIC',
            ' ',
            // quotedValue
            ' ',
            undefined,
            // quotedValue
         ]);
         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            postPublicSpace: expectedLToken(' '),
         } ] ]);
      });

      it('only finds a SystemLiteral if that is all that is offered', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('SYSTEM'),
            'SYSTEM',
            ' ',
            undefined,  // check forndata
            // quotedValue
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('SYSTEM'),
            postIdTypeSpace: expectedLToken(' '),
         } ] ]);
      });

      it('returns nothing if it gets nothing back on first call', () => {
         mockSource = new MockLTokenSource([
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
         mockSource = new MockLTokenSource([
            'BOGUS!',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('stops if it finds an NDATA after finding the PublicId', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('PUBLIC'),
            'PUBLIC',
            ' ',
            // quotedValue
            ' ',
            'NDATA',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            postPublicSpace: expectedLToken(' '),
         } ] ]);
      });

      it('does not mind if public or ndata are the wrong case', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('pUbLiC'),
            'pUbLiC',
            ' ',
            // quotedValue
            ' ',
            'nData',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('pUbLiC'),
            postIdTypeSpace: expectedLToken(' '),
            postPublicSpace: expectedLToken(' '),
         } ] ]);
      });

      it('stops if it does not find an open quote', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('PUBLIC'),
            'PUBLIC',
            ' ',
            'x',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
         } ] ]);
      });

      it('does not mind if, illegally, no space PUBLIC and PublicLiteral', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('PUBLIC'),
            'PUBLIC',
            undefined,
            // quotedValue
            ' ',
            undefined,  // check for ndata
            // quotedValue
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: undefined,
            postPublicSpace: expectedLToken(' '),
         } ] ]);
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('PUBLIC'),
            'PUBLIC',
            ' ',
            // quotedValue
            undefined,  // space
            undefined,  // check for ndata
            // quotedValue
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            postPublicSpace: undefined,
         } ] ]);
      });

      // White box: Not testing the same cases for missing parts of the system value as this is the same code

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         const expectedLToken = makeLTokenMaker();
         parsed = {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         };
         spyOn(quotedValue, 'checkWellFormed');
      });

      it('calls quotedValue.checkWellFormed() to check the PUBLIC value', () => {
         const emd = new EntityMetaData();
         externalId.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(quotedValue.checkWellFormed.calls.argsFor(0)[0]).toEqual('public');
         expect(quotedValue.checkWellFormed.calls.argsFor(0)[1]).toEqual(parsed);
         expect(quotedValue.checkWellFormed.calls.argsFor(0)[2]).toEqual(mockErrorCollector);
         expect(quotedValue.checkWellFormed.calls.argsFor(0)[3]).toEqual(emd);
         expect(quotedValue.checkWellFormed.calls.argsFor(0)[4]).toEqual(undefined);
         expect(quotedValue.checkWellFormed.calls.argsFor(0)[5] instanceof Function).toEqual(true);
      });

      it('calls quotedValue.checkWellFormed() to check the SYSTEM value', () => {
         const emd = new EntityMetaData();
         externalId.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(quotedValue.checkWellFormed.calls.argsFor(1)[0]).toEqual('system');
         expect(quotedValue.checkWellFormed.calls.argsFor(1)[1]).toEqual(parsed);
         expect(quotedValue.checkWellFormed.calls.argsFor(1)[2]).toEqual(mockErrorCollector);
         expect(quotedValue.checkWellFormed.calls.argsFor(1)[3]).toEqual(emd);
         expect(quotedValue.checkWellFormed.calls.argsFor(1)[4]).toEqual(WellFormedError.ID.NOUN_EXTERNALID_SYSTEM);
         expect(quotedValue.checkWellFormed.calls.argsFor(1)[5]).toEqual(undefined);
      });

      it('reports an error if the PUBLIC value has illegal characters', () => {
         parsed.publicValue.text = 'bad&chars';
         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         // invoke the callback function
         quotedValue.checkWellFormed.calls.argsFor(0)[5]();

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            params: [ '&' ],
            position: parsed.postPublicSpace,   // This is only because we call the callback after
         });
      });

      it('reports no errors when no parsed value is passed in', () => {
         externalId.checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if type is neither PUBLIC or SYSTEM', () => {
         parsed.idType.text = 'Bogus';

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_UNKNOWN,
            params: [ 'Bogus' ],
            position: parsed.idType,
         });
      });

      it('reports an error if type is the wrong case', () => {
         parsed.idType.text = 'public';

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
            params: [ 'PUBLIC', 'public' ],
            position: parsed.idType,
         });
      });

      it('reports an error if there is no space after the id type', () => {
         delete parsed.postIdTypeSpace;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_IDTYPE_NO_SPACE,
            params: undefined,
            lastPosition: parsed.idType,
         });
      });

      it('reports an error if there is no space after a PUBLIC part', () => {
         delete parsed.postPublicSpace;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: parsed.postIdTypeSpace, // beccause we are mocking out the quotes call
         });
      });

   });

   describe('makeTokenCompatible()', () => {

      it('returns an EntityLocation with the public and system ids', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         };

         const externalLoc = externalId.makeTokenCompatible(parsed);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
      });

      it('returns an EntityLocation with the system id only if there is no public', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         };

         const externalLoc = externalId.makeTokenCompatible(parsed);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml'));
      });

      it('returns nothing if no parsed value provided', () => {
         const externalLoc = externalId.makeTokenCompatible();

         expect(externalLoc).toBeUndefined();
      });

   });

   describe('appendLTokens', () => {

      beforeEach(() => {
         spyOn(quotedValue, 'appendLTokens');
      });

      it('calls quotedValue.appendLTokens() for the PUBLIC value', () => {
         const parsed = {};
         const results = [];

         externalId.appendLTokens(results, parsed);

         expect(quotedValue.appendLTokens).toHaveBeenCalledWith('public', results, parsed);
      });

      it('calls quotedValue.appendLTokens() for the SYSTEM value', () => {
         const parsed = {};
         const results = [];

         externalId.appendLTokens(results, parsed);

         expect(quotedValue.appendLTokens).toHaveBeenCalledWith('system', results, parsed);
      });

      it('returns the LTokens that made up the external ID', () => {
         const results = [];
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postIdTypeSpace: expectedLToken(' '),
            postPublicSpace: expectedLToken(' '),
         };

         externalId.appendLTokens(results, parsed);

         expect(results).toEqual([
            parsed.idType,
            parsed.postIdTypeSpace,
            parsed.postPublicSpace,
         ]);
      });

   });

});
