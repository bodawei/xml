/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { Chunk } from '../chunk';
import chunkUtil from '../chunk/test';
import { WellFormedError } from '../error';

import docTypeStart from './docTypeStart.js';
import externalId from './externalId.js';

describe('docTypeStart', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let sourceRm;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         mockSource = new chunkUtil.MockChunkSource([
            new Chunk('a', 'a', new Range(1, 0, 0, 0, 1, 0, 1)),
            new Chunk(' ', ' ', new Range(1, 0, 0, 0, 1, 0, 1)),
            undefined,
            undefined,
         ]);
         sourceRm = new chunkUtil.RangeMaker(new EntityLocation());
         spyOn(externalId, 'parse').and.callFake((ignored1, ignored2, cb) => {
            cb({ externalId: true });
         });
      });

      it('returns simple values', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('a', sourceRm),
            chunkUtil.makeChunk(' ', sourceRm),
            undefined,
            undefined,
         ]);

         docTypeStart.parse(mockSource, {}, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            nameChunk: new Chunk('a', 'a', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
            externalId: { externalId: true },
            postExternalIdSpaceChunk: undefined,
            startInternalSubsetChunk: undefined,
         });
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         docTypeStart.parse(mockSource, {
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         }, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         });
      });

      it('returns all values', () => {
         const expectedRm = new chunkUtil.RangeMaker(new EntityLocation());
         const declStart = {
            openChunk: chunkUtil.makeChunk('<!', sourceRm),
            postOpenSpaceChunk: chunkUtil.makeChunk(' ', sourceRm),
            declTypeChunk: chunkUtil.makeChunk('DOCTYPE', sourceRm),
            postDeclTypeSpaceChunk: chunkUtil.makeChunk('\t', sourceRm),
         };

         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('elemType', sourceRm),
            chunkUtil.makeChunk('  ', sourceRm),
            chunkUtil.makeChunk('\t', sourceRm),
            chunkUtil.makeChunk('[', sourceRm),
         ]);

         docTypeStart.parse(mockSource, declStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            openChunk: chunkUtil.makeChunk('<!', expectedRm),
            postOpenSpaceChunk: chunkUtil.makeChunk(' ', expectedRm),
            declTypeChunk: chunkUtil.makeChunk('DOCTYPE', expectedRm),
            postDeclTypeSpaceChunk: chunkUtil.makeChunk('\t', expectedRm),
            nameChunk: chunkUtil.makeChunk('elemType', expectedRm),
            postNameSpaceChunk: chunkUtil.makeChunk('  ', expectedRm),
            postExternalIdSpaceChunk: chunkUtil.makeChunk('\t', expectedRm),
            externalId: { externalId: true },
            startInternalSubsetChunk: chunkUtil.makeChunk('[', expectedRm),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let expectedRm;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         expectedRm = new chunkUtil.RangeMaker(new EntityLocation());
         parsed = {
            openChunk: chunkUtil.makeChunk('<!', expectedRm),
            declTypeChunk: chunkUtil.makeChunk('DOCTYPE', expectedRm),
            postDeclTypeSpaceChunk: chunkUtil.makeChunk('\t', expectedRm),
            nameChunk: chunkUtil.makeChunk('elmentName', expectedRm),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('sets the position before checking the name', () => {
         parsed.nameChunk = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.setPos).toHaveBeenCalledWith(parsed.nameChunk);
         expect(mockErrorCollector.setPos).toHaveBeenCalledBefore(mockErrorCollector.report);
         expect(mockErrorCollector.setPos).toHaveBeenCalledTimes(1);
      });

      it('reports an error if there is no elment name', () => {
         parsed.nameChunk = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.DOCTYPE_NO_NAME);
      });

      it('reports no error if there is an elment name', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).not.toHaveBeenCalledWith(WellFormedError.ID.DOCTYPE_NO_NAME);
      });

      it('does not reset the position before checking the name validity', () => {
         parsed.nameChunk = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.setPos).toHaveBeenCalledTimes(1);
      });

      it('checks whether the name is valid', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector, true, 1, 2);

         expect(mockErrorCollector.checkName)
            .toHaveBeenCalledWith(parsed.nameChunk, WellFormedError.ID.DOCTYPE_NAME_INVALID, 1, 2);
      });

      it('checks whether externalId is valid', () => {
         parsed.externalId = {};
         spyOn(externalId, 'checkWellFormed');

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(parsed.externalId, mockErrorCollector);
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the name found in the parsing', () => {
         const parsed = {
            nameChunk: chunkUtil.makeChunk('elementName', new chunkUtil.RangeMaker(new EntityLocation())),
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('elementName');
      });

      it('returns a token with an empty string if no name was found', () => {
         const parsed = {
            nameChunk: undefined,
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('');
      });

      it('asks externalId to provide an entity location', () => {
         const parsed = {
            nameChunk: undefined,
            externalId: { externalId: true },
         };
         spyOn(externalId, 'makeTokenCompatible');

         docTypeStart.makeToken(parsed);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(parsed.externalId);
      });

   });

});
