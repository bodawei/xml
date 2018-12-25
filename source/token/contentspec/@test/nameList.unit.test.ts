/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { XNameList } from '../nameList';
import nameListGraph from '../nameListGraph';
import { WellFormedError, XmlWarning } from '../../../error/index';

import unassigned, { UnassignedType } from '../../common/unassigned';

import misc from '../../common/misc';
import nameList, {
   ContentParticlePToken,
   NameListPToken,
   NamePToken,
} from '../nameList';
import { ParameterEntityReferencePToken } from 'source/token/parameterEntityReference';

describe('nameList (unit)', () => {
   let nlPToken: NameListPToken;

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

   function getAsNamePToken(value: any): NamePToken {
      if (nameList.isNamePToken(value)) {
         return value;
      }

      throw new Error('Passed a parameter that is not a NamePToken.');
   }

   describe('PToken', () => {

      describe('getSTokenArray()', () => {

         it('returns all the STokens', () => {
            const nameParticle: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            const nameListParticle: NameListPToken = new NameListPToken();
            const subParticle: NamePToken = {};
            const subName: ContentParticlePToken = {
               particle: subParticle,
            };
            const noNames = new NameListPToken();
            noNames.open = SToken.fromString('(')
            noNames.close = SToken.fromString(')')
            nlPToken.names[1].particle = nameListParticle;
            nameListParticle.open = SToken.fromString('(');
            nameListParticle.postOpenSpace = SToken.fromString(' ');
            nameListParticle.names.push(subName);
            nameListParticle.names.push({
               particle: noNames,
            });
            subParticle.name = SToken.fromString('one');
            subParticle.repeat = SToken.fromString('+');
            nameListParticle.close = SToken.fromString(')');
            nameListParticle.postCloseSpace = SToken.fromString(' ');
            nameListParticle.repeat = SToken.fromString('*');
            nameListParticle.postRepeatSpace = SToken.fromString(' ');

            const expectedArray = [
               nlPToken.open,
               nlPToken.postOpenSpace,
               nameParticle.name,
               nameParticle.postNameSpace,
               nameParticle.repeat,
               nameParticle.postRepeatSpace,
               nlPToken.names[0].delimiter,
               nlPToken.names[0].postDelimiterSpace,
               nameListParticle.open,
               nameListParticle.postOpenSpace,
               subParticle.name,
               subParticle.repeat,
               noNames.open,
               noNames.close,
               nameListParticle.close,
               nameListParticle.postCloseSpace,
               nameListParticle.repeat,
               nameListParticle.postRepeatSpace,
               nlPToken.close,
            ] as Array<SToken>;

            const result = nlPToken.getSTokenArray();

            expect(result.length).toEqual(expectedArray.length);
            for (let index = 0; index < result.length; index++) {
               expect(result[index]).toEqual(expectedArray[index]);
            }
         });

      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('parses a two name list', () => {
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

         nameList.parse(mockSource, callback);
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

         nameList.parse(mockSource, callback);
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
         nlPToken.names[0].delimiter!.str = ',';
         nlPToken.names[0].delimiter!.originalStr = ',';

         nameList.parse(mockSource, callback);
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

         nameList.parse(mockSource, callback);
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
         nlPToken.names[0].delimiter!.str = ',';
         nlPToken.names[0].delimiter!.originalStr = ',';

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a list with two "|"', () => {
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

         nameList.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(nlPToken);
      });

      it('parses a name list with two names and no "|"s', () => {
         const mockSource = new MockSTokenSource([
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ undefined, 'multi' ],
            [ undefined, 'space' ],
            MockSTokenSource.PEEK('t'),
            [ 'two', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
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
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|', ',' ] ],
            [ ' ', 'space' ],
            undefined,
            undefined,
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
            undefined,
            undefined,
            undefined,
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
            MockSTokenSource.PEEK('o'),
            [ 'one', 'word', [ '|', ',', ')', '%', '>', '?', '*', '+', '(' ] ],
            [ ' ', 'space' ],
            [ '*', 'multi', [ '?', '*', '+' ] ],
            [ ' ', 'space' ],
            [ '|', 'multi', [ '|', ',' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('>'),
            undefined,
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

            nameList.parse(mockSource, callback);
            mockSource.respondInAsyncTime();

            const result = callback.calls.argsFor(0)[0];
            expect(result.names.length).toEqual(3);
            expect(result.names[1].particle.names.length).toEqual(2);
         });

      });

   });

   describe('assignUnassigned()', () => {
      let assignSpy: jasmine.Spy;

      beforeEach(() => {
         assignSpy = spyOn(unassigned, 'assignToProps');
      });

      it('does nothing if there is no unassigned array', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();

         expect(() => nameList.assignUnassigned(pToken, [])).not.toThrow();
      });

      it('does nothing if there is still an unexpanded parameter entity reference', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();

         nameList.assignUnassigned(pToken, [ { type: UnassignedType.REFERENCE, token: new ParameterEntityReferencePToken({ open: SToken.fromString('%'), }) } ]);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls assignToProps() with the opening of the list open descriptors', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();

         nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
            pToken,
            'open', [
               { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
               { name: 'postOpenSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the closing of the list open descriptors', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();

         nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
            pToken,
            'close', [
               { name: 'close', type: UnassignedType.WORD, allowed: /\)/ },
               { name: 'postCloseSpace', type: UnassignedType.SPACE },
               { name: 'repeat', type: UnassignedType.WORD, allowed: /[\*\+\?]/ },
               { name: 'postRepeatSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the name PToken descriptors if a name is found', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();
         assignSpy.and.callFake((unValues: Array<any>, pToken: NameListPToken, propName: string) => {
            if (propName === 'delimiter') {
               unValues.pop();
            }
         });

         nameList.assignUnassigned(pToken, [ {
            type: UnassignedType.WORD,
            token: {
               text: { str: 'x' },
            },
         } as any ]); // typeHack

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ ],
            {},
            'name', [
               { name: 'name', type: UnassignedType.WORD, allowed: /[^\)\|\,\*\+\?]/ },
               { name: 'postNameSpace', type: UnassignedType.SPACE },
               { name: 'repeat', type: UnassignedType.WORD, allowed: /[\*\+\?]/ },
               { name: 'postRepeatSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() with the delimiter descriptors if a name is found', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();
         assignSpy.and.callFake((unValues: Array<any>, pToken: NameListPToken, propName: string) => {
            if (propName === 'delimiter') {
               unValues.pop();
            }
         });

         nameList.assignUnassigned(pToken, [ {
            type: UnassignedType.WORD,
            token: {
               text: SToken.fromString('x'),
            }
         } as any ]); // typeHack

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ ], // the value in the jasmine store is modified
            { particle: {} },
            'delimiter', [
               { name: 'delimiter', type: UnassignedType.WORD, allowed: /[\|\,]/ },
               { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
            ]);
      });

      it('calls assignToProps() for sub-lists', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();
         pToken.open = SToken.fromString('distinguisher');
         assignSpy.and.callFake((unValues: Array<any>, pToken: NameListPToken, propName: string) => {
            if (propName === 'open' || propName === 'postOpenSpace') {
               unValues.shift();
            }
         });

         nameList.assignUnassigned(pToken, [ {
            type: UnassignedType.WORD,
            token: {},
         }, {
            type: UnassignedType.WORD,
            token: {
               text: { str: '(' },
            },
         } ] as any[]); // typeHack

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ ],
            new nameList.NameListPToken(),
            'open', [
               { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
               { name: 'postOpenSpace', type: UnassignedType.SPACE },
            ]);
      });


      it('abandons looking for names if the end of the list is found', () => {
         const pToken: NameListPToken = new nameList.NameListPToken();

         nameList.assignUnassigned(pToken, [ {
            type: UnassignedType.WORD,
            token: {
               text: { str: ')' },
            },
         } as any ]); // typeHack

         expect(assignSpy.calls.count()).toEqual(2);
      });

      describe('partial list', () => {

         it('calls assignToProps() with full opening parameters if "(" was NOT found', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(2);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
               pToken,
               'open', [
                  { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
                  { name: 'postOpenSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with opening parameters if "(" was found, but no names', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(2);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
               pToken,
               'postOpenSpace', [
                  { name: 'postOpenSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with closing parameters if ")" was NOT found', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({});

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(3);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
               pToken,
               'close', [
                  { name: 'close', type: UnassignedType.WORD, allowed: /\)/ },
                  { name: 'postCloseSpace', type: UnassignedType.SPACE },
                  { name: 'repeat', type: UnassignedType.WORD, allowed: /[\*\+\?]/ },
                  { name: 'postRepeatSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with the subset of closing parameters if ")" was found', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({});
            pToken.close = SToken.fromString(')');

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(1);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
               pToken,
               'repeat', [
                  { name: 'postCloseSpace', type: UnassignedType.SPACE },
                  { name: 'repeat', type: UnassignedType.WORD, allowed: /[\*\+\?]/ },
                  { name: 'postRepeatSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with the trailing space, if nothing else', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({});
            pToken.close = SToken.fromString(')');
            pToken.repeat = SToken.fromString('*');

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(1);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
               pToken,
               'postRepeatSpace', [
                  { name: 'postRepeatSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with delimiter space if there is a delimtier', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({
               delimiter: SToken.fromString('|'),
            });

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(2);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ { type: UnassignedType.LITERAL, token: { value: [] } } ],
               {
                  delimiter: SToken.fromString('|'),
               },
               'postDelimiterSpace', [
                  { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with both open list and delimiter', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({
               particle: new nameList.NameListPToken(),
            });

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(4);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               } ],
               new nameList.NameListPToken(),
               'open', [
                  { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
                  { name: 'postOpenSpace', type: UnassignedType.SPACE },
               ]);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               } ],
               {
                  particle: new nameList.NameListPToken(),
               },
               'delimiter', [
                  { name: 'delimiter', type: UnassignedType.WORD, allowed: /[\|\,]/ },
                  { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with delimiter if the name is otherwise complete', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({
               particle: {
                  name: SToken.fromString('name'),
                  repeat: SToken.fromString('repeat'),
               },
            });

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(3);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               } ],
               {
                  particle: {
                     name: SToken.fromString('name'),
                     repeat: SToken.fromString('repeat'),
                  },
               },
               'delimiter', [
                  { name: 'delimiter', type: UnassignedType.WORD, allowed: /[\|\,]/ },
                  { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with terminal space if name is complete', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({
               particle: {
                  name: SToken.fromString('name'),
                  repeat: SToken.fromString('repeat'),
               },
            });

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledTimes(3);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               } ],
               {
                  name: SToken.fromString('name'),
                  repeat: SToken.fromString('repeat'),
               },
               'postRepeatSpace', [
                  { name: 'postRepeatSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with a particle if none is provided', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({
            });

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               } ],
               {},
               'name', [
                  { name: 'name', type: UnassignedType.WORD, allowed: /[^\)\|\,\*\+\?]/ },
                  { name: 'postNameSpace', type: UnassignedType.SPACE },
                  { name: 'repeat', type: UnassignedType.WORD, allowed: /[\*\+\?]/ },
                  { name: 'postRepeatSpace', type: UnassignedType.SPACE },
               ]);
         });

         it('calls assignToProps() with a particle with a name', () => {
            const pToken: NameListPToken = new nameList.NameListPToken();

            pToken.open = SToken.fromString('(');
            pToken.names.push({
               particle: {
                  name: SToken.fromString('name'),
               },
            });

            nameList.assignUnassigned(pToken, [ { type: UnassignedType.LITERAL, token: { value: [] } } ]);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(
               [ {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               } ],
               {
                  name: SToken.fromString('name'),
               },
               'repeat', [
                  { name: 'postNameSpace', type: UnassignedType.SPACE },
                  { name: 'repeat', type: UnassignedType.WORD, allowed: /[\*\+\?]/ },
                  { name: 'postRepeatSpace', type: UnassignedType.SPACE },
               ]);
         });

      });
   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkNMToken');
      });

      describe('universal', () => {

         it('reports an error if no "(" present', () => {
            nlPToken.open = undefined;

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_NO_OPEN,
               params: undefined,
               position: undefined,
               lastPosition: undefined,
            });
         });

         it('reports no errors if no pToken provided', () => {
            nameList.checkWellFormed(undefined, mockErrorCollector, emd);

            expect(mockErrorCollector.errors.length).toEqual(0);
         });

         it('reports an error if no names are present', () => {
            nlPToken.names = [];

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_NO_NAMES,
               params: undefined,
               position: undefined,
               lastPosition: nlPToken.postOpenSpace,
            });
         });

         it('reports an error if a name in an entry is not present', () => {
            nlPToken.names[1].particle = undefined;

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_NO_NAME,
               params: [ '1' ],
               position: undefined,
               lastPosition: nlPToken.names[0].postDelimiterSpace,
            });
         });

         it('reports an error if a delimiter in an entry is not present', () => {
            nlPToken.names[0].delimiter = undefined;

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_NO_DELIM,
               params: [ '0' ],
               position: undefined,
               lastPosition: nlPToken.names[0].particle!.postRepeatSpace
               ,
            });
         });

         it('reports an error if a delimiter is present in the last entry', () => {
            nlPToken.names[1].delimiter = SToken.fromString('|');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_EXTRA_DELIM,
               params: [ '1' ],
               position: nlPToken.names[1].delimiter,
            });
         });

         it('reports an error if the close is missing', () => {
            nlPToken.close = undefined;
            const expected: NamePToken = getAsNamePToken(nlPToken.names[1].particle);

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_NO_CLOSE,
               params: undefined,
               lastPosition: expected.name,
            });
         });
      });

      describe('non-mixed children', () => {

         it('checks if the name is valid', () => {
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);
            const expectedName: NamePToken = getAsNamePToken(nlPToken.names[0].particle);

            expect(misc.checkName).toHaveBeenCalledWith(expectedName.name,
               mockErrorCollector, emd, WellFormedError.ID.NAMELIST_NAME_INVALID);
         });

         it('reports an error if the second separator does not match the first "|"', () => {
            nlPToken.names[1].delimiter = SToken.fromString(',');
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_BAD_CHOICE,
               params: [ '1', ',' ],
               position: nlPToken.names[1].delimiter,
            });
         });

         it('reports an error if the second separator does not match the first ","', () => {
            nlPToken.names[0].delimiter = SToken.fromString(',');
            nlPToken.names[1].delimiter = SToken.fromString('|');
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_BAD_SEQUENCE,
               params: [ '1', '|' ],
               position: nlPToken.names[1].delimiter,
            });
         });

         it('reports an error if there is an extra space between the name and the repeat marker', () => {
            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);
            const expectedName: NamePToken = getAsNamePToken(nlPToken.names[0].particle);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_NAME_EXTRA_SPACE,
               params: [ '0' ],
               position: expectedName.postNameSpace,
            });
         });

         it('reports an error if there is an extra space between the close and the repeat marker', () => {
            nlPToken.postCloseSpace = SToken.fromString(' ');
            nlPToken.repeat = SToken.fromString('*');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_CLOSE_EXTRA_SPACE,
               params: undefined,
               position: nlPToken.postCloseSpace,
            });
         });

         it('reports an error if a sublist has an error', () => {
            const subSubList = new nameList.PToken({
               open: SToken.fromString('('),
               names: [ {
                  particle: {
                     name: SToken.fromString('four'),
                  },
               } ],
               close: SToken.fromString(')'),
               postCloseSpace: SToken.fromString(' '),
               repeat: SToken.fromString('*'),
               postRepeatSpace: undefined,
            });
            nlPToken.names[0].particle = new nameList.PToken({
               open: SToken.fromString('('),
               names: [ {
                  particle: {
                     name: SToken.fromString('three'),
                  },
                  delimiter: SToken.fromString('|'),
               }, {
                  particle: subSubList,
               } ],
               close: SToken.fromString(')'),
               postCloseSpace: undefined,
               repeat: undefined,
               postRepeatSpace: undefined,
            });
            const particle = nlPToken.names[0].particle;
            let expectedNameList: NameListPToken;
            if (!nameList.isNamePToken(particle)) {
               expectedNameList = particle!;
            };
            const subParticle = expectedNameList!.names[1].particle;
            let expectedSubParticleList: NameListPToken;
            if (!nameList.isNamePToken(subParticle)) {
               expectedSubParticleList = subParticle!;
            };

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_CLOSE_EXTRA_SPACE,
               params: undefined,
               position: expectedSubParticleList!.postCloseSpace,
            });
         });

      });

      describe('mixed', () => {

         it('reports an error if #PCDATA is the wrong case', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#pcData');;

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_PCDATA_INVALID_CASE,
               params: [ '#pcData' ],
               position: namePToken.name,
            });
         });

         it('assumes a choice type if it finds #PCDATA', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#PCDATA');
            nlPToken.names[0].delimiter = SToken.fromString(',');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_BAD_CHOICE,
               params: [ '0', ',' ],
               position: nlPToken.names[0].delimiter,
            });
         });

         it('reports an error if a Mixed contains a sublist', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#PCDATA');
            const nameListPToken = new nameList.PToken({
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
            });
            nlPToken.names[1].particle = nameListPToken;

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_INVALID_SUBPARTICLE,
               params: [ '1' ],
               position: nameListPToken.open,
            });
         });

         it('reports an error if there is a repeat indicator after a name', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#PCDATA');
            nlPToken.names[1].particle!.repeat = SToken.fromString('*');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_NAME_EXTRA_REPEAT,
               params: [ '1', '*' ],
               position: nlPToken.names[1].particle!.repeat,
            });
         });

         it('reports an error if there is a repeat indicator on a #PCDATA list of 1 item', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#PCDATA');
            nlPToken.names.pop(); // remove the second
            nlPToken.repeat = SToken.fromString('*');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_EXTRA_REPEAT,
               params: [ '*' ],
               position: nlPToken.repeat,
            });
         });

         it('reports an error if there is any non-* repeat indicator on a #PCDATA list of > 1 item', () => {
            const namePToken: NamePToken = nlPToken.names[0].particle as NamePToken;
            namePToken.name = SToken.fromString('#PCDATA');
            nlPToken.repeat = SToken.fromString('+');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_INVALID_REPEAT,
               params: [ '+' ],
               position: nlPToken.repeat,
            });
         });

         it('reports an error if there is any blank repeat indicator on a #PCDATA list of > 1 item', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#PCDATA');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.NAMELIST_MIXED_INVALID_REPEAT,
               params: [ '' ],
               lastPosition: nlPToken.close,
            });
         });

         it('reports no errors if the list ends with a * properly', () => {
            const namePToken: NamePToken = getAsNamePToken(nlPToken.names[0].particle);
            namePToken.name = SToken.fromString('#PCDATA');
            delete namePToken.postNameSpace;
            delete nlPToken.names[0].particle!.repeat;

            nlPToken.repeat = SToken.fromString('*');

            nameList.checkWellFormed(nlPToken, mockErrorCollector, emd);

            expect(mockErrorCollector.errors.length).toEqual(0);
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
         const namePToken: NamePToken = getAsNamePToken(nlPToken.names[1].particle);
         namePToken.name = undefined;

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

      it('silently ignores entries without particles', () => {
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

   describe('graphFromNameList()', () => {
      let nameListToGraphSpy: jasmine.Spy;
      let collapseAutoTransSpy: jasmine.Spy;
      let pruneNameListGraphSpy: jasmine.Spy;

      beforeEach(() => {
         nameListToGraphSpy = spyOn(nameListGraph, 'nameListToGraph');
         collapseAutoTransSpy = spyOn(nameListGraph, 'collapseAutoTrans');
         pruneNameListGraphSpy = spyOn(nameListGraph, 'pruneNameListGraph');
      });

      it('calls graph construction routines', () => {
         const list: XNameList = {
            names: [],
            listType: 'CHOICE',
            repeat: 'ONE',
         };
         const graph = {
            startId: 1,
            endId: 1,
            states: {
               1: {
                  id: 1,
                  trans: {},
               }
            },
         };
         nameListToGraphSpy.and.returnValues(graph);
         const result = nameList.graphFromNameList(list);

         expect(result).toEqual(graph);
         expect(nameListToGraphSpy).toHaveBeenCalledWith(list);
         expect(collapseAutoTransSpy).toHaveBeenCalledWith(graph);
         expect(pruneNameListGraphSpy).toHaveBeenCalledWith(graph);
      });

   });
});
