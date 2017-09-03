/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as externalId from './externalId.js';
import * as misc from './misc.js';

describe('externalId', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            MockLTokenSource.PEEK,
            '"',
            'pub.xml',
            '"',
            ' ',
            undefined,
            MockLTokenSource.PEEK,
            '"',
            'sys.xml',
            '"',
         ]);
         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         } ] ]);
      });

      it('accepts single quotes', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            MockLTokenSource.PEEK,
            '\'',
            'pub.xml',
            '\'',
            ' ',
            undefined,  // check for ndata
            MockLTokenSource.PEEK,
            '\'',
            'sys.xml',
            '\'',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('\''),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('\''),
            postPublicSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('\''),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('\''),
         } ] ]);
      });

      it('only finds a SystemLiteral if that is all that is offered', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'SYSTEM',
            ' ',
            undefined,  // check forndata
            MockLTokenSource.PEEK,
            '"',
            'sys.xml',
            '"',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('SYSTEM'),
            postTypeSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         } ] ]);
      });

      it('returns a zero length lToken if there is no value between quotes', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'SYSTEM',
            ' ',
            undefined,  // check forndata
            MockLTokenSource.PEEK,
            '"',
            undefined,
            '"',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('SYSTEM'),
            postTypeSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken(''),
            systemCloseQuote: expectedLToken('"'),
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
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            MockLTokenSource.PEEK,
            '"',
            'pub.xml',
            '"',
            ' ',
            'NDATA',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
         } ] ]);
      });

      it('does not mind if public or ndata are the wrong case', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'pUbLiC',
            ' ',
            MockLTokenSource.PEEK,
            '"',
            'pub.xml',
            '"',
            ' ',
            'nData',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('pUbLiC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
         } ] ]);
      });

      it('stops if it does not find an open quote', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            'x',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
         } ] ]);
      });

      it('stops if it does not find the body value', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            MockLTokenSource.PEEK,
            '"',
            undefined,
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken(''),
            publicCloseQuote: undefined,
         } ] ]);
      });

      it('stops if it does not the closing quote', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            MockLTokenSource.PEEK,
            '"',
            'pub.xml',
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: undefined,
         } ] ]);
      });

      it('does not mind if, illegally, no space PUBLIC and PublicLiteral', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            undefined,
            MockLTokenSource.PEEK,
            '"',
            'pub.xml',
            '"',
            ' ',
            undefined,  // check for ndata
            MockLTokenSource.PEEK,
            '"',
            'sys.xml',
            '"',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: undefined,
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         } ] ]);
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK,
            'PUBLIC',
            ' ',
            MockLTokenSource.PEEK,
            '"',
            'pub.xml',
            '"',
            undefined,  // space
            undefined,  // check for ndata
            MockLTokenSource.PEEK,
            '"',
            'sys.xml',
            '"',
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: undefined,
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
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
            postTypeSpace: expectedLToken(' '),
            publicOpenQuote: expectedLToken('"'),
            publicValue: expectedLToken('pub.xml'),
            publicCloseQuote: expectedLToken('"'),
            postPublicSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: expectedLToken('sys.xml'),
            systemCloseQuote: expectedLToken('"'),
         };
      });

      it('reports no errors when no parsed value is passed in', () => {
         externalId.checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if type is the wrong case', () => {
         parsed.idType.text = 'public';

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.EXTERNALID_INVALID_CASE, [ 'PUBLIC', 'public' ]);
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
            params: [ 'PUBLIC', 'public' ],
            position: parsed.idType,
         });
      });

      it('reports an error if there is no PUBLIC value', () => {
         delete parsed.publicValue;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_PUBLIC,
            params: undefined,
            lastPosition: parsed.publicOpenQuote,
         });
      });

      it('reports an error if there is no space after the SYSTEM or PUBLIC value', () => {
         delete parsed.postTypeSpace;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports an error if there is no system lToken when SYSTEM is specified', () => {
         const expectedLToken = makeLTokenMaker();
         parsed.idType = expectedLToken('SYSTEM');
         delete parsed.systemValue;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_SYSTEM,
            params: undefined,
            lastPosition: parsed.systemOpenQuote,
         });
      });

      it('reports an error if there is no space after a public part', () => {
         delete parsed.postPublicSpace;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: parsed.publicCloseQuote,
         });
      });

      it('reports an error if there is no space after a public part, and no public part', () => {
         delete parsed.publicValue;
         delete parsed.postPublicSpace;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_PUBLIC,
            params: undefined,
            lastPosition: parsed.publicOpenQuote,
         });
      });

      it('reports an error if there is no quote around the system value', () => {
         delete parsed.systemOpenQuote;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_QUOTE,
            params: undefined,
            lastPosition: parsed.postPublicSpace,
         });
      });

      it('reports an error if there is no quote at the end of the system value', () => {
         delete parsed.systemCloseQuote;

         externalId.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_CLOSE_QUOTE,
            params: undefined,
            lastPosition: parsed.systemValue,
         });
      });

      it('calls on misc.checkWellFormedText() to validate system value', () => {
         spyOn(misc, 'checkWellFormedText');
         const emd = new EntityMetaData();

         externalId.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsed.systemValue, mockErrorCollector, emd);
      });

   });

   describe('makeToken()', () => {

      it('returns an EntityLocation with the public and system ids', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('PUBLIC'),
            postTypeSpace: expectedLToken(' '),
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
            postTypeSpace: expectedLToken(' '),
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

});
