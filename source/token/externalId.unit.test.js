/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { Chunk } from '../chunk';
import chunkUtil from '../chunk/test';
import { WellFormedError } from '../error';

import externalId from './externalId.js';

describe('externalId', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            undefined,  // check for ndata
            new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            new Chunk('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         ]);
      });

      it('returns simple values', () => {
         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('accepts no terminators', () => {
         externalId.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('accepts single quotes', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('\'', '\'', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('\'', '\'', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new Chunk('\'', '\'', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            undefined,  // check for ndata
            new Chunk('\'', '\'', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new Chunk('\'', '\'', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            new Chunk('\'', '\'', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('\'', '\'', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: new Chunk('\'', '\'', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemOpenQuoteChunk: new Chunk('\'', '\'', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteChunk: new Chunk('\'', '\'', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('only finds a SystemLiteral if that is all that is offered', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            undefined,  // check forndata
            new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            new Chunk('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
            systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
         });
      });

      it('returns a zero length chunk if there is no value between quotes', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            undefined,  // check forndata
            new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            undefined,
            new Chunk('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
            systemChunk: new Chunk('', '', new Range(new EntityLocation(), 18, 0, 18, 18, 0, 18)),
            systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
         });
      });
      it('returns nothing if it gets nothing back on first call', () => {
         mockSource = new chunkUtil.MockChunkSource([
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('BOGUS!', 'BOGUS!', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('stops if it finds an NDATA after finding the PublicId', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new Chunk('NDATA', 'NDATA', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
         });
      });

      it('does not mind if public or ndata are the wrong case', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('pUbLiC', 'pUbLiC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('pUbLiC', 'pUbLiC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new Chunk('nData', 'nData', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('pUbLiC', 'pUbLiC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
         });
      });

      it('stops if it does not find an open quote', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('x', 'x', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
         });
      });

      it('stops if it does not find the body value', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            undefined,
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('', '', new Range(new EntityLocation(), 8, 0, 8, 8, 0, 8)),
            publicCloseQuoteChunk: undefined,
         });
      });

      it('stops if it does not the closing quote', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            undefined,
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: undefined,
         });
      });

      it('does not mind if, illegally, no space PUBLIC and PublicLiteral', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            undefined,
            new Chunk('"', '"', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 7, 0, 7, 14, 0, 14)),
            new Chunk('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            undefined,  // check for ndata
            new Chunk('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            new Chunk('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: undefined,
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 7, 0, 7, 14, 0, 14)),
            publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
            postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         });
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)), // peek
            new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            undefined,  // space
            undefined,  // check for ndata
            new Chunk('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)), // peek
            new Chunk('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            new Chunk('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
         ]);

         externalId.parse(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'EXTERNAL_ID',
            typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 0, 0, 0, 6, 0, 6)),
            postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 6, 0, 6, 7, 0, 7)),
            publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 7, 0, 7, 8, 0, 8)),
            publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 8, 0, 8, 15, 0, 15)),
            publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 15, 0, 15, 16, 0, 16)),
            postPublicSpaceChunk: undefined,
            systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 16, 0, 16, 17, 0, 17)),
            systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 17, 0, 17, 23, 0, 23)),
            systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 23, 0, 23, 24, 0, 24)),
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
            typeChunk: chunkUtil.makeChunk('PUBLIC'),
            postTypeSpaceChunk: chunkUtil.makeChunk(' '),
            publicOpenQuoteChunk: chunkUtil.makeChunk('"'),
            publicChunk: chunkUtil.makeChunk('pub.xml'),
            publicCloseQuoteChunk: chunkUtil.makeChunk('"'),
            postPublicSpaceChunk: chunkUtil.makeChunk(' '),
            systemOpenQuoteChunk: chunkUtil.makeChunk('"'),
            systemChunk: chunkUtil.makeChunk('sys.xml'),
            systemCloseQuoteChunk: chunkUtil.makeChunk('"'),
         };
      });

      it('reports no errors when no parsed value is passed in', () => {
         externalId.checkWellFormed(undefined, mockErrorCollector);

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if type is the wrong case', () => {
         parsed.typeChunk.text = 'public';

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.EXTERNALID_INVALID_CASE, [ 'PUBLIC', 'public' ]);
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
            params: [ 'PUBLIC', 'public' ],
            position: parsed.typeChunk,
         });
      });

      it('reports an error if there is no PUBLIC value', () => {
         delete parsed.publicChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_PUBLIC,
            params: undefined,
            lastPosition: parsed.publicOpenQuoteChunk,
         });
      });

      it('reports an error if there is no space after the SYSTEM or PUBLIC value', () => {
         delete parsed.postTypeSpaceChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports an error if there is no system chunk when SYSTEM is specified', () => {
         parsed.typeChunk = chunkUtil.makeChunk('SYSTEM');
         delete parsed.systemChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_SYSTEM,
            params: undefined,
            lastPosition: parsed.systemOpenQuoteChunk,
         });
      });

      it('reports an error if there is no space after a public part', () => {
         delete parsed.postPublicSpaceChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: parsed.publicCloseQuoteChunk,
         });
      });

      it('reports an error if there is no space after a public part, and no public part', () => {
         delete parsed.publicChunk;
         delete parsed.postPublicSpaceChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_NO_PUBLIC,
            params: undefined,
            lastPosition: parsed.publicOpenQuoteChunk,
         });
      });

      it('reports an error if there is no quote around the system value', () => {
         delete parsed.systemOpenQuoteChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_QUOTE,
            params: undefined,
            lastPosition: parsed.postPublicSpaceChunk,
         });
      });

      it('reports an error if there is no quote at the end of the system value', () => {
         delete parsed.systemCloseQuoteChunk;

         externalId.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_CLOSE_QUOTE,
            params: undefined,
            lastPosition: parsed.systemChunk,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an EntityLocation with the public and system ids', () => {
         const parsed = {
            type: 'EXTERNAL_ID',
            typeChunk: chunkUtil.makeChunk('PUBLIC'),
            postTypeSpaceChunk: chunkUtil.makeChunk(' '),
            publicOpenQuoteChunk: chunkUtil.makeChunk('"'),
            publicChunk: chunkUtil.makeChunk('pub.xml'),
            publicCloseQuoteChunk: chunkUtil.makeChunk('"'),
            postPublicSpaceChunk: chunkUtil.makeChunk(' '),
            systemOpenQuoteChunk: chunkUtil.makeChunk('"'),
            systemChunk: chunkUtil.makeChunk('sys.xml'),
            systemCloseQuoteChunk: chunkUtil.makeChunk('"'),
         };

         const externalLoc = externalId.makeTokenCompatible(parsed);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
      });

      it('returns an EntityLocation with the system id only if there is no public', () => {
         const parsed = {
            type: 'EXTERNAL_ID',
            typeChunk: chunkUtil.makeChunk('PUBLIC'),
            postTypeSpaceChunk: chunkUtil.makeChunk(' '),
            systemOpenQuoteChunk: chunkUtil.makeChunk('"'),
            systemChunk: chunkUtil.makeChunk('sys.xml'),
            systemCloseQuoteChunk: chunkUtil.makeChunk('"'),
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
