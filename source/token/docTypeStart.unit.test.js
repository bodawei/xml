/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { LToken } from '../lToken';
import lTokenUtil from '../lToken/test';
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
         mockSource = new lTokenUtil.MockLTokenSource([
            new LToken('a', 'a', new Range(1, 0, 0, 0, 1, 0, 1)),
            new LToken(' ', ' ', new Range(1, 0, 0, 0, 1, 0, 1)),
            undefined,
            undefined,
         ]);
         sourceRm = new lTokenUtil.RangeMaker(new EntityLocation());
         spyOn(externalId, 'parse').and.callFake((ignored1, ignored2, cb) => {
            cb({ externalId: true });
         });
      });

      it('returns simple values', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('a', sourceRm),
            lTokenUtil.makeLToken(' ', sourceRm),
            undefined,
            undefined,
         ]);

         docTypeStart.parse(mockSource, {}, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            nameLToken: new LToken('a', 'a', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
            externalId: { externalId: true },
            postExternalIdSpaceLToken: undefined,
            startInternalSubsetLToken: undefined,
         });
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         docTypeStart.parse(mockSource, {
            openLToken: 'a',
            postOpenSpaceLToken: 'b',
            declTypeLToken: 'c',
            postDeclTypeSpaceLToken: 'd',
         }, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            openLToken: 'a',
            postOpenSpaceLToken: 'b',
            declTypeLToken: 'c',
            postDeclTypeSpaceLToken: 'd',
         });
      });

      it('returns all values', () => {
         const expectedRm = new lTokenUtil.RangeMaker(new EntityLocation());
         const declStart = {
            openLToken: lTokenUtil.makeLToken('<!', sourceRm),
            postOpenSpaceLToken: lTokenUtil.makeLToken(' ', sourceRm),
            declTypeLToken: lTokenUtil.makeLToken('DOCTYPE', sourceRm),
            postDeclTypeSpaceLToken: lTokenUtil.makeLToken('\t', sourceRm),
         };

         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('elemType', sourceRm),
            lTokenUtil.makeLToken('  ', sourceRm),
            lTokenUtil.makeLToken('\t', sourceRm),
            lTokenUtil.makeLToken('[', sourceRm),
         ]);

         docTypeStart.parse(mockSource, declStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            openLToken: lTokenUtil.makeLToken('<!', expectedRm),
            postOpenSpaceLToken: lTokenUtil.makeLToken(' ', expectedRm),
            declTypeLToken: lTokenUtil.makeLToken('DOCTYPE', expectedRm),
            postDeclTypeSpaceLToken: lTokenUtil.makeLToken('\t', expectedRm),
            nameLToken: lTokenUtil.makeLToken('elemType', expectedRm),
            postNameSpaceLToken: lTokenUtil.makeLToken('  ', expectedRm),
            postExternalIdSpaceLToken: lTokenUtil.makeLToken('\t', expectedRm),
            externalId: { externalId: true },
            startInternalSubsetLToken: lTokenUtil.makeLToken('[', expectedRm),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let expectedRm;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         expectedRm = new lTokenUtil.RangeMaker(new EntityLocation());
         parsed = {
            openLToken: lTokenUtil.makeLToken('<!', expectedRm),
            declTypeLToken: lTokenUtil.makeLToken('DOCTYPE', expectedRm),
            postDeclTypeSpaceLToken: lTokenUtil.makeLToken('\t', expectedRm),
            nameLToken: lTokenUtil.makeLToken('elmentName', expectedRm),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if there is no elment name', () => {
         parsed.nameLToken = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
         });
      });

      it('reports no error if there is an elment name', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
         });
      });

      it('checks whether the name is valid', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector, true, 1, 2);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NAME_INVALID,
            params: [ 'elmentName' ],
            position: parsed.nameLToken,
         });
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
            nameLToken: lTokenUtil.makeLToken('elementName', new lTokenUtil.RangeMaker(new EntityLocation())),
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('elementName');
      });

      it('returns a token with an empty string if no name was found', () => {
         const parsed = {
            nameLToken: undefined,
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('');
      });

      it('asks externalId to provide an entity location', () => {
         const parsed = {
            nameLToken: undefined,
            externalId: { externalId: true },
         };
         spyOn(externalId, 'makeTokenCompatible');

         docTypeStart.makeToken(parsed);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(parsed.externalId);
      });

   });

});
