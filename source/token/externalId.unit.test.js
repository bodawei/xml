/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { LToken } from '../lToken';
import lTokenUtil from '../lToken/test';
import { WellFormedError } from '../error';

import externalId from './externalId.js';

describe('externalId', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            undefined,  // check for ndata
            new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            new LToken('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         ]);
      });

      it('returns simple values', () => {
         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('accepts no terminators', () => {
         externalId.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('accepts single quotes', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('\'', '\'', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('\'', '\'', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new LToken('\'', '\'', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            undefined,  // check for ndata
            new LToken('\'', '\'', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new LToken('\'', '\'', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            new LToken('\'', '\'', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('\'', '\'', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: new LToken('\'', '\'', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemOpenQuoteLToken: new LToken('\'', '\'', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteLToken: new LToken('\'', '\'', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('only finds a SystemLiteral if that is all that is offered', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            undefined,  // check forndata
            new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            new LToken('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('returns a zero length lToken if there is no value between quotes', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            undefined,  // check forndata
            new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            undefined,
            new LToken('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemLToken: new LToken('', '', new Range(new EntityLocation(), 18, 0, 18, 18, 0, 18)),
            systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
         });
      });
      it('returns nothing if it gets nothing back on first call', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('BOGUS!', 'BOGUS!', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('stops if it finds an NDATA after finding the PublicId', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new LToken('NDATA', 'NDATA', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
         });
      });

      it('does not mind if public or ndata are the wrong case', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('pUbLiC', 'pUbLiC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('pUbLiC', 'pUbLiC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new LToken('nData', 'nData', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('pUbLiC', 'pUbLiC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
         });
      });

      it('stops if it does not find an open quote', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('x', 'x', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
         });
      });

      it('stops if it does not find the body value', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            undefined,
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('', '', new Range(new EntityLocation(), 8, 0, 8, 8, 0, 8)),
            publicCloseQuoteLToken: undefined,
         });
      });

      it('stops if it does not the closing quote', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: undefined,
         });
      });

      it('does not mind if, illegally, no space PUBLIC and PublicLiteral', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            undefined,
            new LToken('"', '"', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 7, 0, 7, 14, 0, 14)),
            new LToken('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            undefined,  // check for ndata
            new LToken('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            new LToken('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: undefined,
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 7, 0, 7, 14, 0, 14)),
            publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
            postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         });
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            undefined,  // space
            undefined,  // check for ndata
            new LToken('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)), // peek
            new LToken('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            new LToken('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceLToken: undefined,
            systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         });
      });

      // White box: Not testing the same cases for missing parts of the system value as this is the same code

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            type: 'EXTERNAL_ID',
            typeLToken: lTokenUtil.makeLToken('PUBLIC'),
            postTypeSpaceLToken: lTokenUtil.makeLToken(' '),
            publicOpenQuoteLToken: lTokenUtil.makeLToken('"'),
            publicLToken: lTokenUtil.makeLToken('pub.xml'),
            publicCloseQuoteLToken: lTokenUtil.makeLToken('"'),
            postPublicSpaceLToken: lTokenUtil.makeLToken(' '),
            systemOpenQuoteLToken: lTokenUtil.makeLToken('"'),
            systemLToken: lTokenUtil.makeLToken('sys.xml'),
            systemCloseQuoteLToken: lTokenUtil.makeLToken('"'),
         };
      });

      it('reports no errors when no parsed value is passed in', () => {
         externalId.checkWellFormed(undefined, mockErrorCollector);

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if type is the wrong case', () => {
         parsed.typeLToken.text = 'public';

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.EXTERNALID_INVALID_CASE, [ 'PUBLIC', 'public' ]);
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
            params: [ 'PUBLIC', 'public' ],
            position: parsed.typeLToken,
         });
      });

      it('reports an error if there is no PUBLIC value', () => {
         delete parsed.publicLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_PUBLIC,
            params: undefined,
            lastPosition: parsed.publicOpenQuoteLToken,
         });
      });

      it('reports an error if there is no space after the SYSTEM or PUBLIC value', () => {
         delete parsed.postTypeSpaceLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports an error if there is no system lToken when SYSTEM is specified', () => {
         parsed.typeLToken = lTokenUtil.makeLToken('SYSTEM');
         delete parsed.systemLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_SYSTEM,
            params: undefined,
            lastPosition: parsed.systemOpenQuoteLToken,
         });
      });

      it('reports an error if there is no space after a public part', () => {
         delete parsed.postPublicSpaceLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: parsed.publicCloseQuoteLToken,
         });
      });

      it('reports an error if there is no space after a public part, and no public part', () => {
         delete parsed.publicLToken;
         delete parsed.postPublicSpaceLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_PUBLIC,
            params: undefined,
            lastPosition: parsed.publicOpenQuoteLToken,
         });
      });

      it('reports an error if there is no quote around the system value', () => {
         delete parsed.systemOpenQuoteLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_QUOTE,
            params: undefined,
            lastPosition: parsed.postPublicSpaceLToken,
         });
      });

      it('reports an error if there is no quote at the end of the system value', () => {
         delete parsed.systemCloseQuoteLToken;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_CLOSE_QUOTE,
            params: undefined,
            lastPosition: parsed.systemLToken,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an EntityLocation with the public and system ids', () => {
         const parsed = {
            type: 'EXTERNAL_ID',
            typeLToken: lTokenUtil.makeLToken('PUBLIC'),
            postTypeSpaceLToken: lTokenUtil.makeLToken(' '),
            publicOpenQuoteLToken: lTokenUtil.makeLToken('"'),
            publicLToken: lTokenUtil.makeLToken('pub.xml'),
            publicCloseQuoteLToken: lTokenUtil.makeLToken('"'),
            postPublicSpaceLToken: lTokenUtil.makeLToken(' '),
            systemOpenQuoteLToken: lTokenUtil.makeLToken('"'),
            systemLToken: lTokenUtil.makeLToken('sys.xml'),
            systemCloseQuoteLToken: lTokenUtil.makeLToken('"'),
         };

         const externalLoc = externalId.makeTokenCompatible(parsed);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
      });

      it('returns an EntityLocation with the system id only if there is no public', () => {
         const parsed = {
            type: 'EXTERNAL_ID',
            typeLToken: lTokenUtil.makeLToken('PUBLIC'),
            postTypeSpaceLToken: lTokenUtil.makeLToken(' '),
            systemOpenQuoteLToken: lTokenUtil.makeLToken('"'),
            systemLToken: lTokenUtil.makeLToken('sys.xml'),
            systemCloseQuoteLToken: lTokenUtil.makeLToken('"'),
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
