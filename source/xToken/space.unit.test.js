/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as space from './space.js';

describe('space (unit)', () => {
   let defaultParsed;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      defaultParsed = {
         type: 'SPACE',
         text: expectedLToken(' '),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         const mockSource = new MockLTokenSource([
            [ ' ', 'space', undefined ],
         ]);

         space.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('copes with EOF', () => {
         defaultParsed.text = undefined;
         const mockSource = new MockLTokenSource([
            [ undefined, 'space', undefined ],
         ]);

         space.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
      });

      it('reports no errors (if it can be parsed, it is correct)', () => {
         space.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

   });

   describe('makeToken()', () => {

      it('returns space token with the whitespace', () => {
         const token = space.makeToken(defaultParsed);

         expect(token.text).toEqual(' ');
      });

      it('returns the text as an empty string if nothing was found in the source', () => {
         delete defaultParsed.text;

         const token = space.makeToken(defaultParsed);

         expect(token.text).toEqual('');
      });

      it('returns a space token from a parsed with all the lTokens', () => {
         const token = space.makeToken(defaultParsed);

         expect(token).toEqual(new space.Token(' ', [
            defaultParsed.text,
         ]));
      });

   });

});
