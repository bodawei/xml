/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { LToken } from '../lToken';
import lTokenUtil from '../lToken/test';
import { WellFormedError } from '../error';

import docTypeEnd from './docTypeEnd.js';

describe('docTypeEnd', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let sourceRm;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         sourceRm = new lTokenUtil.RangeMaker(new EntityLocation());
      });

      it('returns after parsing a mundane "]>"', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken(']', sourceRm),
            undefined,
            lTokenUtil.makeLToken('>', sourceRm),
         ]);

         docTypeEnd.parse(mockSource, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubsetLToken: new LToken(']', ']', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postCloseInternalSubsetSpaceLToken: undefined,
            closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
         });
      });

      it('returns after parsing a "]\\t>"', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken(']', sourceRm),
            lTokenUtil.makeLToken('\t', sourceRm),
            lTokenUtil.makeLToken('>', sourceRm),
         ]);

         docTypeEnd.parse(mockSource, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubsetLToken: new LToken(']', ']', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postCloseInternalSubsetSpaceLToken: new LToken('\t', '\t', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
            closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 2, 0, 2, 3, 0, 3)),
         });
      });

      it('returns after parsing an incomplete input', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            undefined,
            undefined,
            undefined,
         ]);

         docTypeEnd.parse(mockSource, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubsetLToken: undefined,
            postCloseInternalSubsetSpaceLToken: undefined,
            closeLToken: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let sourceRm;
      let parsed;
      let startParsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         sourceRm = new lTokenUtil.RangeMaker(new EntityLocation());
         startParsed = {
            startInternalSubsetLToken: lTokenUtil.makeLToken('[', sourceRm),
         };
         parsed = {
            closeInternalSubsetLToken: lTokenUtil.makeLToken(']', sourceRm),
            postCloseInternalSubsetSpaceLToken: lTokenUtil.makeLToken(' ', sourceRm),
            closeLToken: lTokenUtil.makeLToken('>', sourceRm),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('returns no errors if no problems ', () => {
         const errors = docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(errors.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no close', () => {
         parsed.closeLToken = undefined;

         docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_CLOSE,
            params: undefined,
            position: parsed.postCloseInternalSubsetSpaceLToken,
         });
      });

      it('reports an error if there is a "]", but there was no opening "["', () => {
         delete startParsed.startInternalSubsetLToken;

         docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
            params: undefined,
            position: parsed.postCloseInternalSubsetSpaceLToken,
         });
      });

   });

   describe('makeToken()', () => {
      let sourceRm;

      beforeEach(() => {
         sourceRm = new lTokenUtil.RangeMaker(new EntityLocation());
      });

      it('returns a token given a good parsing', () => {
         const parsed = {
            closeInternalSubsetLToken: lTokenUtil.makeLToken(']', sourceRm),
            postCloseInternalSubsetSpaceLToken: lTokenUtil.makeLToken(' ', sourceRm),
            closeLToken: lTokenUtil.makeLToken('>', sourceRm),
         };

         const token = docTypeEnd.makeToken(parsed);

         expect(token instanceof docTypeEnd.Token).toEqual(true);
      });

      it('returns a token given an empty parsing', () => {
         const parsed = {
            closeInternalSubsetLToken: undefined,
            postCloseInternalSubsetSpaceLToken: undefined,
            closeLToken: undefined,
         };
         const token = docTypeEnd.makeToken(parsed);

         expect(token instanceof docTypeEnd.Token).toEqual(true);
      });

   });

});
