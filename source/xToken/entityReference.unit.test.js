/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as entityReference from './entityReference.js';

const NO_PARAMS = [ 'char', 'space', 'peekChar', 'peekSpace' ];

describe('entityReference', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         expectedLToken = makeLTokenMaker();
      });

      it('does a simple parse', () => {
         mockSource = new MockLTokenSource([
            '&',
            ' ',
            'entityName',
            ' ',
            ';',
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITYREF',
            open: expectedLToken('&'),
            postOpenSpace: expectedLToken(' '),
            name: expectedLToken('entityName'),
            postEntityNameSpace: expectedLToken(' '),
            close: expectedLToken(';'),
         });
      });

      it('accepts no spaces within reference', () => {
         mockSource = new MockLTokenSource([
            '&',
            undefined,
            'entityName',
            undefined,
            ';',
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITYREF',
            open: expectedLToken('&'),
            postOpenSpace: undefined,
            name: expectedLToken('entityName'),
            postEntityNameSpace: undefined,
            close: expectedLToken(';'),
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new MockLTokenSource([
               '&',
               undefined,
               'entityName',
               undefined,
               ';',
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
               ';',
            ]);
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;
      let expectedLToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         expectedLToken = makeLTokenMaker();

         parsed = {
            open: expectedLToken('&'),
            postOpenSpace: undefined,
            name: expectedLToken('theName'),
            postEntityNameSpace: undefined,
            close: expectedLToken(';'),
         };
      });

      it('reports an error if there is a space after the opening &', () => {
         parsed.postOpenSpace = expectedLToken(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_SPACE,
            params: [ 'theName' ],
            position: parsed.postOpenSpace,
         });
      });

      it('reports an error if there is no name', () => {
         delete parsed.name;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_NAME,
            params: undefined,
            lastPosition: parsed.open,
         });
      });

      it('reports an error if there is a space after the entity name', () => {
         parsed.postEntityNameSpace = expectedLToken(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE,
            params: [ 'theName' ],
            position: parsed.postEntityNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete parsed.close;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_SEMICOLON,
            params: [ 'theName' ],
            lastPosition: parsed.name,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            name: expectedLToken('entityName'),
         };

         const token = entityReference.makeToken(parsed);

         expect(token).toEqual(new entityReference.Token('entityName', [
            parsed.name,
         ]));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         const parsed = {
            name: undefined,
         };

         const token = entityReference.makeToken(parsed);

         expect(token).toEqual(new entityReference.Token('', []));
      });

   });

});
