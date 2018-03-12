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
            particle: {
               name: makeSToken('one'),
               postNameSpace: makeSToken(' '),
               repeat: makeSToken('*'),
               postRepeatSpace: makeSToken(' '),
            },
            delimiter: makeSToken('|'),
            postDelimiterSpace: makeSToken(' '),
         } , {
            particle: {
               name:  makeSToken('two'),
               repeat: undefined,
               postRepeatSpace: undefined,
               postNameSpace: undefined,
            },
            delimiter: undefined,
            postDelimiterSpace: undefined,
         }],
         close: makeSToken(')'),
         postCloseSpace: undefined,
         repeat: undefined,
         postRepeatSpace: undefined,
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
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
         ]);

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a list with a space-padded repeat indicator', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|', ',' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ ' ', 'space' ],
            [ '+', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
         ]);
         const makeSToken = makeSTokenMaker(undefined, 14, 0, 14);
         nlPToken.postCloseSpace = makeSToken(' ');
         nlPToken.repeat = makeSToken('+');
         nlPToken.postRepeatSpace = makeSToken(' ');

         nameList.parse(mockSource, 'ANY', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a sequence list when ANY passed', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ ',', 'multi', [ '|', ',' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
         ]);
         nlPToken.names[0].delimiter.str = ',';
         nlPToken.names[0].delimiter.originalStr = ',';

         nameList.parse(mockSource, 'ANY', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('chooses a choice list based on the content when an ANY option passed', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|', ',' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
         ]);

         nameList.parse(mockSource, 'ANY', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('chooses a sequnce list based on the content when an ANY option passed', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ ',', 'multi', [ '|', ',' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
         ]);
         nlPToken.names[0].delimiter.str = ',';
         nlPToken.names[0].delimiter.originalStr = ',';

         nameList.parse(mockSource, 'ANY', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a list with two "|"', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('|'),
            [ undefined, 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ '|', 'multi', [ '|' ] ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
         ]);

         const makeSToken = makeSTokenMaker(undefined, 10, 0, 10);
         nlPToken.names[1].particle = {
            name: undefined,
            postNameSpace: undefined,
            repeat: undefined,
            postRepeatSpace: undefined,
         };
         nlPToken.names[1].delimiter = makeSToken('|');
         nlPToken.names[1].postDelimiterSpace = undefined;
         nlPToken.close = makeSToken(')');

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a name list with two names and no "|"s', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK(')'),
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'multi', [ '?', '*', '+' ] ],
            [ undefined, 'space' ],
         ]);

         const makeSToken = makeSTokenMaker(undefined, 8, 0, 8);
         nlPToken.names[0].delimiter = undefined;
         nlPToken.names[0].postDelimiterSpace = undefined;
         nlPToken.names[1].particle = {
            name: makeSToken('two'),
            postNameSpace: undefined,
            repeat: undefined,
            postRepeatSpace: undefined,
         };
         nlPToken.names[1].delimiter = undefined;
         nlPToken.names[1].postDelimiterSpace = undefined;
         nlPToken.close = makeSToken(')');

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses nothing if it finds end of file', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([[]])
      });

      it('parses nothing if it finds a "%"', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([[]])
      });

      it('survives if no closing ")" found', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|' ] ],
            [ ' ', 'space' ],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         nlPToken.names.pop();
         nlPToken.close = undefined;

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('adds no entry if no name or "|" found', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         nlPToken.names = [];
         nlPToken.close = undefined;

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('stops if ">" found', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('>'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         nlPToken.names.pop();
         nlPToken.close = undefined;

         nameList.parse(mockSource, 'ENUMERATION', callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      describe('nested', () => {

         it('parses a sequence list', () => {
            const mockSource = new MockSTokenSource([
               [ '(', 'match', '(' ],
               [ ' ', 'space' ],
               MockSTokenSource.PEEK('o'),
               [ 'one', 'word', [ '|', ',',  ')', '%', '>', '?', '*', '+', '(' ] ],
               [ ' ', 'space' ],
               [ '?', 'multi', [ '?', '*', '+' ] ],
               [ ' ', 'space' ],
               [ ',', 'multi', [ '|', ',' ] ],
               [ ' ', 'space' ],
               MockSTokenSource.PEEK('('),
                  [ '(', 'match', '(' ],
                  [ ' ', 'space' ],
                  MockSTokenSource.PEEK('t'),
                  [ 'two', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
                  [ ' ', 'space' ],
                  [ '+', 'multi', [ '?', '*', '+' ] ],
                  [ ' ', 'space' ],
                  [ '|', 'multi', [ '|', ',' ] ],
                  [ ' ', 'space' ],
                  MockSTokenSource.PEEK('t'),
                  [ 'three', 'word', [ '|',  ')', '%', '>', '?', '*', '+', '(' ] ],
                  [ ' ', 'space' ],
                  [ '*', 'multi', [ '?', '*', '+' ] ],
                  [ ' ', 'space' ],
                  [ '|', 'multi', [ '|' ] ],
                  [ ' ', 'space' ],
                  MockSTokenSource.PEEK(')'),
                  [ ')', 'match', ')' ],
                  undefined,
                  undefined,
                  undefined,
               [ ',', 'multi', [ ',' ] ],
               [ ' ', 'space' ],
               MockSTokenSource.PEEK('f'),
               [ 'four', 'word', [ ',',  ')', '%', '>', '?', '*', '+', '(' ] ],
               [ undefined, 'space' ],
               [ undefined, 'multi', [ '?', '*', '+' ] ],
               [ undefined, 'space' ],
               [ undefined, 'multi' ],
               [ undefined, 'space' ],
               MockSTokenSource.PEEK(')'),
               [ ')', 'match', ')' ],
               undefined,
               undefined,
               undefined,
            ]);
   
            nameList.parse(mockSource, 'ANY', callback);
            mockSource.respondInAsyncTime();
   
            const result = callback.calls.argsFor(0)[0];
            expect(result.names.length).toEqual(3);
            expect(result.names[1].particle.names.length).toEqual(2);
         });
   
   
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkNMToken');
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
         nlPToken.names[1].particle = undefined;

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_NAME,
            params: [ '1', 'xxx' ],
            position: undefined,
            lastPosition: nlPToken.names[0].postDelimiterSpace,
         });
      });

      it('checks if the name is valid', () => {
         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(misc.checkName).toHaveBeenCalledWith(nlPToken.names[0].particle.name,
            mockErrorCollector, emd, WellFormedError.ID.NAMELIST_NAME_INVALID);
      });

      it('checks if the nmtoken is valid', () => {
         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx', 'ENUMERATION');

         expect(misc.checkNMToken).toHaveBeenCalledWith(nlPToken.names[0].particle.name,
            mockErrorCollector, emd, WellFormedError.ID.NAMELIST_NAME_INVALID);
      });

      it('reports an error if a "," is found but "|" is expected', () => {
         nlPToken.names[0].delimiter = SToken.fromString(',');

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx', 'NOTATION');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_BAD_CHOICE,
            params: [ '0', 'xxx', ',' ],
            position: nlPToken.names[0].delimiter,
         });
      });

      it('reports an error if the second separator does not match the first "|"', () => {
         nlPToken.names[1].delimiter = SToken.fromString(',');
         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_BAD_CHOICE,
            params: [ '1', 'xxx', ',' ],
            position: nlPToken.names[1].delimiter,
         });
      });

      it('reports an error if the second separator does not match the first ","', () => {
         nlPToken.names[0].delimiter = SToken.fromString(',');
         nlPToken.names[1].delimiter = SToken.fromString('|');
         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_BAD_SEQUENCE,
            params: [ '1', 'xxx', '|' ],
            position: nlPToken.names[1].delimiter,
         });
      });

      it('reports an error if a "|" in an entry is not present', () => {
         nlPToken.names[0].delimiter = undefined;

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_DELIM,
            params: [ '0', 'xxx' ],
            position: undefined,
            lastPosition: nlPToken.names[0].particle.postNameSpace,
         });
      });

      it('reports an error if a "|" is present in the last entry', () => {
         nlPToken.names[1].delimiter = SToken.fromString('|');

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_EXTRA_DELIM,
            params: [ '1', 'xxx' ],
            position: nlPToken.names[1].delimiter,
         });
      });

      it('reports an error if the close is missing', () => {
         nlPToken.close = undefined;

         nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NAMELIST_NO_CLOSE,
            params: [ 'xxx' ],
            lastPosition: nlPToken.names[1].particle.name,
         });
      });
   
      describe('mixed', () => {

         it('reports an error if #PCDATA is the wrong case', () => {
            nlPToken.names[0].particle.name = SToken.fromString('#pcData');;
   
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_PCDATA_INVALID_CASE,
               params: [ '#pcData' ],
               position: nlPToken.names[0].particle.name,
            });
         });

         it('assumes a choice type if it finds #PCDATA', () => {
            nlPToken.names[0].particle.name = SToken.fromString('#PCDATA');
            nlPToken.names[0].delimiter = SToken.fromString(',');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_BAD_CHOICE,
               params: [ '0', 'xxx', ',' ],
               position: nlPToken.names[0].delimiter,
            });
         });

         it('reports an error if a Mixed contains a sublist', () => {
            nlPToken.names[0].particle.name = SToken.fromString('#PCDATA');
            nlPToken.names[1].particle = new nameList.PToken({
               open: SToken.fromString('('),
               names: [ {
                  particle: {
                     name: SToken.fromString('one'),
                  },
                  delimiter: SToken.fromString('|'),
               }],
               close: SToken.fromString(')'),
               postCloseSpace: undefined,
               repeat: undefined,
               postRepeatSpace: undefined,
            })

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_INVALID_SUBPARTICLE,
               params: [ '1' ],
               position: nlPToken.names[1].particle.open,
            });
         });

         it('reports an error if there is a repeat indicator on a #PCDATA list of 1 item', () => {
            nlPToken.names[0].particle.name = SToken.fromString('#PCDATA');
            nlPToken.names.pop(); // remove the second
            nlPToken.repeat = SToken.fromString('*');
   
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_EXTRA_REPEAT,
               params: [ '*' ],
               position: nlPToken.repeat,
            });
         });

         it('reports an error if there is any non-* repeat indicator on a #PCDATA list of > 1 item', () => {
            nlPToken.names[0].particle.name = SToken.fromString('#PCDATA');
            nlPToken.repeat = SToken.fromString('+');
   
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_INVALID_REPEAT,
               params: [ '+' ],
               position: nlPToken.repeat,
            });
         });

         it('reports an error if there is any blank repeat indicator on a #PCDATA list of > 1 item', () => {
            nlPToken.names[0].particle.name = SToken.fromString('#PCDATA');
   
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd, 'xxx');
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_INVALID_REPEAT,
               params: [ '' ],
               lastPosition: nlPToken.close,
            });
         });
      });

   });

   describe('makeXTokenCompatible()', () => {

      it('returns the names', () => {
         const xNames = nameList.makeXTokenCompatible(nlPToken);

         expect(xNames).toEqual({
            names: [ {
               name: 'one',
               repeat: 'ZEROPLUS',
            }, {
               name: 'two',
               repeat: 'ONE',
            } ],
            listType: 'CHOICE',
            repeat: 'ONE',
         });
      });

      it('returns a result if no entries', () => {
         nlPToken.names = [];
         const xNames = nameList.makeXTokenCompatible(nlPToken);

         expect(xNames).toEqual({
            names: [ ],
            listType: 'CHOICE',
            repeat: 'ONE',
         });
      });

      it('silently ignores entries without names', () => {
         nlPToken.names[1].particle = undefined;

         const xNames = nameList.makeXTokenCompatible(nlPToken);

         expect(xNames).toEqual({
            names: [ {
               name: 'one',
               repeat: 'ZEROPLUS',
            } ],
            listType: 'CHOICE',
            repeat: 'ONE',
         });
      });

      it('silently ignores the absence of delimiters', () => {
         nlPToken.names[1].delimiter = undefined;

         const xNames = nameList.makeXTokenCompatible(nlPToken);

         expect(xNames).toEqual({
            names: [ {
               name: 'one',
               repeat: 'ZEROPLUS',
            }, {
               name: 'two',
               repeat: 'ONE',
            } ],
            listType: 'CHOICE',
            repeat: 'ONE',
         });
      });

      describe ('listType', () => {

         it('sets a SEQUENCE list type using the first delimiter', () => {
            nlPToken.names[0].delimiter = SToken.fromString(',');

            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'SEQUENCE',
               repeat: 'ONE',
            });
         });

         it('sets a CHOICE list type using the first delimiter', () => {
            nlPToken.names[0].delimiter = SToken.fromString('|');

            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ONE',
            });
         });

         it('allows ENUMERATION type to force a list type', () => {
            const xNames = nameList.makeXTokenCompatible(nlPToken, 'ENUMERATION');
            nlPToken.names[0].delimiter = SToken.fromString(',');

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ONE',
            });
         });

         it('allows NOTATION type to force a list type', () => {
            const xNames = nameList.makeXTokenCompatible(nlPToken, 'NOTATION');
            nlPToken.names[0].delimiter = SToken.fromString(',');

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ONE',
            });
         });

      });

      describe ('repeat', () => {

         it('sets a repeat type of "ONE" if nothing specified on input', () => {
            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ONE',
            });
         });

         it('sets a repeat type of "ONE" if a junk repeat is found', () => {
            nlPToken.repeat = SToken.fromString('x');
            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ONE',
            });
         });

         it('sets a repeat type of "ZEROPLUS" if "*" repeat is found', () => {
            nlPToken.repeat = SToken.fromString('*');
            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ZEROPLUS',
            });
         });

         it('sets a repeat type of "ONEPLUS" if "+" repeat is found', () => {
            nlPToken.repeat = SToken.fromString('+');
            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ONEPLUS',
            });
         });

         it('sets a repeat type of "ZEROONE" if "?" repeat is found', () => {
            nlPToken.repeat = SToken.fromString('?');
            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  name: 'one',
                  repeat: 'ZEROPLUS',
               }, {
                  name: 'two',
                  repeat: 'ONE',
               } ],
                  listType: 'CHOICE',
               repeat: 'ZEROONE',
            });
         });

      });

      describe ('sublists', () => {

         it('converts embedded lists to embedded names', () => {
            const innerInnerList = new nameList.PToken({
               open: SToken.fromString('('),
               names: [ {
                  particle: {
                     name: SToken.fromString('three'),
                  },
                  delimiter: SToken.fromString(','),
               } , {
                  particle: {
                     name: SToken.fromString('four'),
                     repeat: SToken.fromString('?'),
                  },
               }],
               close: SToken.fromString(')'),
               repeat: SToken.fromString('+'),
            });
            const innerList = new nameList.PToken({
               open: SToken.fromString('('),
               names: [ {
                  particle: {
                     name: SToken.fromString('one'),
                     repeat: SToken.fromString('*'),
                  },
                  delimiter: SToken.fromString('|'),
               } , {
                  particle: innerInnerList,
               }],
               close: SToken.fromString(')'),
            });
      
            nlPToken.names[0].particle = innerList;

            const xNames = nameList.makeXTokenCompatible(nlPToken);

            expect(xNames).toEqual({
               names: [ {
                  names: [ {
                     name: 'one',
                     repeat: 'ZEROPLUS',
                   }, {
                     names: [ {
                       name: 'three',
                       repeat: 'ONE',
                     }, {
                       name: 'four',
                       repeat: 'ZEROONE',
                     } ],
                     listType: 'SEQUENCE',
                     repeat: 'ONEPLUS',
                  } ],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               }, {
                 name: 'two',
                 repeat: 'ONE',
               } ],
               listType: 'CHOICE',
               repeat: 'ONE',
            });
         });

      });

   });

});
