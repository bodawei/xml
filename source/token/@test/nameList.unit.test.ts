/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from '../../basic';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError, XmlWarning } from '../../error';

import misc from '../common/misc.js';
import nameList from '../common/nameList.js';

describe('nameList (unit)', () => {
   let nlPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      nlPToken = new nameList.PToken({
         open: makeSToken('('),
         postOpenSpace: makeSToken(' '),
         names: [ {
            name: makeSToken('one'),
            postNameSpace: makeSToken(' '),
            or: makeSToken('|'),
            postOrSpace: makeSToken(' '),
         } , {
            name: makeSToken('two'),
            postNameSpace: undefined,
            or: undefined,
            postOrSpace: undefined,
         }],
         close: makeSToken(')'),
      });
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('parses a two name list', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ 'one', 'word', [ '|', ')', '%', '>' ] ],
            [ ' ', 'space' ],
            [ '|', 'match' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ')', '%', '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
         ]);

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a list with two "|"', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ 'one', 'word', [ '|', ')', '%', '>' ] ],
            [ ' ', 'space' ],
            [ '|', 'match' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('|'),
            [ undefined, 'word', [ '|', ')', '%', '>' ] ],
            [ undefined, 'space' ],
            [ '|', 'match' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
         ]);

         const makeSToken = makeSTokenMaker(undefined, 20, 0, 20);
         nlPToken.names[1].name = undefined;
         nlPToken.names[1].postNameSpace = undefined;
         nlPToken.names[1].or = makeSToken('|');
         nlPToken.names[1].postOrSpace = undefined;
         nlPToken.close = makeSToken(')');

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(makeSToken);
      });

      it('parses a name list with two names and no "|"s', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ 'one', 'word', [ '|', ')', '%', '>' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ')', '%', '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
         ]);

         const makeSToken = makeSTokenMaker(undefined, 6, 0, 6);
         nlPToken.names[0].or = undefined;
         nlPToken.names[0].postOrSpace = undefined;
         nlPToken.names[1].name = makeSToken('two');
         nlPToken.names[1].postNameSpace = undefined;
         nlPToken.names[1].or = undefined;
         nlPToken.names[1].postOrSpace = undefined;
         nlPToken.close = makeSToken(')');

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses nothing if it finds end of file', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([[]])
      });

      it('parses nothing if it finds a "%"', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([[]])
      });

      it('survives if no closing ")" found', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ 'one', 'word', [ '|', ')', '%', '>' ] ],
            [ ' ', 'space' ],
            [ '|', 'match' ],
            [ ' ', 'space' ],
            undefined,
            undefined,
            undefined,
         ]);
         nlPToken.names.pop();
         nlPToken.close = undefined;

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('adds no entry if no name or "|" found', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '|', ')', '%', '>' ] ],
            [ undefined, 'space' ],
            [ undefined, 'match' ],
            [ undefined, 'space' ],
            undefined,
            undefined,
         ]);
         nlPToken.names = [];
         nlPToken.close = undefined;

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('stops if ">" found', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ 'one', 'word', [ '|', ')', '%', '>' ] ],
            [ ' ', 'space' ],
            [ '|', 'match' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('>'),
            undefined,
         ]);
         nlPToken.names.pop();
         nlPToken.close = undefined;

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(misc, 'checkName');
      });

      it('reports no errors if no pToken provided', () => {
         nameList.checkWellFormed(undefined, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if no names are present', () => {
         nlPToken.names = [];

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_NAMES,
            params: [ 'xxx' ],
            position: undefined,
            lastPosition: nlPToken.postOpenSpace,
         });
      });

      it('reports an error if a name in an entry is not present', () => {
         nlPToken.names[1].name = undefined;

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_NAME,
            params: [ '1', 'xxx' ],
            position: undefined,
            lastPosition: nlPToken.names[0].postOrSpace,
         });
      });

      it('checks if the name is valid', () => {
         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(misc.checkName).toHaveBeenCalledWith(nlPToken.names[0].name,
            mockErrorCollector, emd, WellFormedError.ID.NAMELIST_NAME_INVALID);
      });

      it('reports an error if a "|" in an entry is not present', () => {
         nlPToken.names[0].or = undefined;

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_OR,
            params: [ '0', 'xxx' ],
            position: undefined,
            lastPosition: nlPToken.names[0].postNameSpace,
         });
      });

      it('reports an error if a "|" is present in the last entry', () => {
         nlPToken.names[1].or = SToken.fromString('|');

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_EXTRA_OR,
            params: [ '1', 'xxx' ],
            position: nlPToken.names[1].or,
         });
      });

      it('reports an error if the close is missing', () => {
         nlPToken.close = undefined;

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_CLOSE,
            params: [ 'xxx' ],
            lastPosition: nlPToken.names[1].name,
         });
      });
   
   });

   describe('makeXTokenCompatible()', () => {

      it('returns the names', () => {
         const xNames = nameList.makeXTokenCompatible(nlPToken);

         expect(xNames).toEqual({
            names: [ 'one', 'two' ],
         });
      });

      it('silently ignored entries without names', () => {
         nlPToken.names[1].name = undefined;

         const xNames = nameList.makeXTokenCompatible(nlPToken);

         expect(xNames).toEqual({
            names: [ 'one' ],
         });
      });

   });

});
