/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import lTokenUtil from '../lToken/test';
import { WellFormedError } from '../error';

import entityReference from './entityReference.js';

const NO_PARAMS = [ 'char', 'space', 'peekChar', 'peekSpace' ];

describe('entityReference', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('&'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken(';'),
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_REFERENCE',
            openLToken: lTokenUtil.makeLToken('&'),
            postOpenSpaceLToken: lTokenUtil.makeLToken(' '),
            entityNameLToken: lTokenUtil.makeLToken('entityName'),
            postEntityNameSpaceLToken: lTokenUtil.makeLToken(' '),
            closeLToken: lTokenUtil.makeLToken(';'),
         });
      });

      it('accepts no spaces within reference', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('&'),
            undefined,
            lTokenUtil.makeLToken('entityName'),
            undefined,
            lTokenUtil.makeLToken(';'),
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_REFERENCE',
            openLToken: lTokenUtil.makeLToken('&'),
            postOpenSpaceLToken: undefined,
            entityNameLToken: lTokenUtil.makeLToken('entityName'),
            postEntityNameSpaceLToken: undefined,
            closeLToken: lTokenUtil.makeLToken(';'),
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new lTokenUtil.MockLTokenSource([
               lTokenUtil.makeLToken('&'),
               undefined,
               lTokenUtil.makeLToken('entityName'),
               undefined,
               lTokenUtil.makeLToken(';'),
            ]);

            entityReference.parse(mockSource, callback);
            mockSource.respondInAsyncTime();

            // TODO Generalize this
            const params = mockSource.extractToObject.calls.allArgs().reduce((assembled, args) => {
               if (NO_PARAMS.indexOf(args[0]) === -1) {
                  assembled.push(args[1]);
               }
               return assembled;
            }, []);
            mockSource.extract.calls.allArgs().reduce((assembled, args) => {
               if (NO_PARAMS.indexOf(args[0]) === -1) {
                  assembled.push(args[1]);
               }
               return assembled;
            }, params);

            expect(params).toEqual([
               '&',
               [ ';' ],
               [ ';' ],
            ]);
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            openLToken: lTokenUtil.makeLToken('&'),
            postOpenSpaceLToken: undefined,
            entityNameLToken: lTokenUtil.makeLToken('theName'),
            postEntityNameSpaceLToken: undefined,
            closeLToken: lTokenUtil.makeLToken(';'),
         };
      });

      it('reports an error if there is a space after the opening &', () => {
         parsed.postOpenSpaceLToken = lTokenUtil.makeLToken(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_SPACE,
            params: [ 'theName' ],
            position: parsed.postOpenSpaceLToken,
         });
      });

      it('reports an error if there is no name', () => {
         delete parsed.entityNameLToken;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_NAME,
            params: undefined,
            lastPosition: parsed.openLToken,
         });
      });

      it('reports an error if there is a space after the entity name', () => {
         parsed.postEntityNameSpaceLToken = lTokenUtil.makeLToken(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE,
            params: [ 'theName' ],
            position: parsed.postEntityNameSpaceLToken,
         });
      });

      it('reports an error if there was no closing', () => {
         delete parsed.closeLToken;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_SEMICOLON,
            params: [ 'theName' ],
            lastPosition: parsed.entityNameLToken,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const parsed = {
            nameLToken: lTokenUtil.makeLToken('entityName'),
         };

         const token = entityReference.makeToken(parsed);

         expect(token).toEqual(new entityReference.Token('entityName', []));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         const parsed = {
            nameLToken: undefined,
         };

         const token = entityReference.makeToken(parsed);

         expect(token).toEqual(new entityReference.Token('', []));
      });

   });

});
