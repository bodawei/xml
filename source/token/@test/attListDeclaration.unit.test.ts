/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range, EntityLocation } from 'basic';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { WellFormedError, XmlWarning } from 'error';

import attListDeclaration, { AttListPToken, AttDefPToken } from '../attListDeclaration';
import declaration from '../bridge/baseDeclaration';
import unassigned, { UnassignedArray } from '../common/unassigned';
import literal from '../common/literal';
import * as wordList from '../common/wordList';
import misc from '../common/misc';
import { TextPToken, TextXToken } from '../text';

const toSToken = SToken.fromString;

const { WordListPToken, WordListType } = wordList;
type LiteralOptions = {
   pToken: {
      value: Array<any>,
   },
};

describe('attListDeclaration (unit)', () => {
   let aldPToken: AttListPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      aldPToken = new attListDeclaration.PToken({
         open: toSToken('<!'),
         elementName: makeSToken('elementName'),
         postElementNameSpace: makeSToken(' '),
         attDefs: [ {
            name: makeSToken('att1'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('CDATA'),
            postTypeSpace: makeSToken(' '),
            defaultType: makeSToken('#REQUIRED'),
            postDefaultTypeSpace: makeSToken(' '),
            value: [],
         } ],
         close: makeSToken('>'),
      });
   });

   describe('AttListXToken()', () => {

      it('is defined', () => {
         expect(attListDeclaration.XToken).toBeInstanceOf(Function);
      });

      it('constructs an instance', () => {
         const xToken = new attListDeclaration.XToken('foo', [{
            name: 'attName',
            type: 'CDATA',
            defaultType: '#REQUIRED',
            value: [],
         }], new attListDeclaration.PToken({
            open: toSToken('<!'),
         }));

         expect(xToken.elementName).toEqual('foo');
         expect(xToken.attDefs[0].name).toEqual('attName');
         expect(xToken.attDefs[0].type).toEqual('CDATA');
         expect(xToken.attDefs[0].defaultType).toEqual('#REQUIRED');
      });

   });

   describe('XTYPE', () => {

      it('is defined', () => {
         expect(attListDeclaration.XTYPE).toEqual('ATTLIST_XTOKEN_TYPE');
      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let makeCheckCallbackSpy: jasmine.Spy;
      let literalParseSpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');

         // nameListParseSpy = spyOn(nameList, 'parse');
         makeCheckCallbackSpy = spyOn(unassigned, 'makeCheckCallback'); // TS
         makeCheckCallbackSpy.and.callFake((_1: any, _2: any, _3: any, other: (x?: UnassignedArray) => void) => {
            return other;
         });

         spyOn(unassigned, 'checkForPERef').and.callFake((junk: any, cb: () => void) => {
            cb();
         });
         literalParseSpy = spyOn(literal, 'parse').and.callFake((_1: any, _2: any, done: () => void) => done());
      });

      it('does a parse of a basic attribute list declaration', () => {
         const makeSToken = makeSTokenMaker(undefined, 12, 0, 12);
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         aldPToken.attDefs = [];
         aldPToken.close = makeSToken('>');

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('returns nothing if at EOF. That is: <!ATTLIST', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ new attListDeclaration.PToken({
            open: toSToken('<!'),
            elementName: undefined,
            postElementNameSpace: undefined,
            close: undefined,
         }) ] ]);
      });

      it('parses an attribute list with a single attribute', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('#'),
            [ '#REQUIRED', 'word', [ '>', '%', '"', '\'' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         const makeSToken = makeSTokenMaker(undefined, 33, 0, 33);
         aldPToken.close = makeSToken('>');

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('skips parsing a default type if there is no # character', () => {
         const makeSToken = makeSTokenMaker(undefined, 23, 0, 23);
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('a'),
            [ 'att2', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'ID', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('>'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         delete aldPToken.attDefs[0].defaultType;
         delete aldPToken.attDefs[0].postDefaultTypeSpace;
         aldPToken.attDefs.push({
            name: makeSToken('att2'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('ID'),
            postTypeSpace: makeSToken(' '),
            value: [],
         });
         aldPToken.close = makeSToken('>');

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('parses an attribute list with a multiple named attributes', () => {
         const makeSToken = makeSTokenMaker(undefined, 33, 0, 33);
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('#'),
            [ '#REQUIRED', 'word', [ '>', '%', '"', '\'' ] ],
            [ ' ', 'space' ],
            [ 'att2', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'ID', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('a'),
            [ 'att3', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'IDREF', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('#'),
            [ '#IMPLICIT', 'word', [ '>', '%', '"', '\'' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         aldPToken.attDefs.push({
            name: makeSToken('att2'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('ID'),
            postTypeSpace: makeSToken(' '),
            value: [],
         });
         aldPToken.attDefs.push({
            name: makeSToken('att3'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('IDREF'),
            postTypeSpace: makeSToken(' '),
            defaultType: makeSToken('#IMPLICIT'),
            postDefaultTypeSpace: makeSToken(' '),
            value: [],
         });
         aldPToken.close = makeSToken('>');

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('parses an attribute list with a literal even with #REQUIRED', () => {
         literalParseSpy.and.callFake((_1: any, options: LiteralOptions, done: () => void) => {
            options.pToken.value = [ new TextPToken({ text: SToken.fromString('dummyValue') }) ];
            done();
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('#'),
            [ '#REQUIRED', 'word', [ '>', '%', '"', '\'' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         const makeSToken = makeSTokenMaker(undefined, 33, 0, 33);
         aldPToken.close = makeSToken('>');
         aldPToken.attDefs[0].value = [ new TextPToken({ text: SToken.fromString('dummyValue') }) ];

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('parses an attribute list with a literal with no defaultType at all', () => {
         literalParseSpy.and.callFake((_1: any, options: LiteralOptions, done: () => void) => {
            options.pToken.value = [ new TextPToken({ text: SToken.fromString('dummyValue') }) ];
            done();
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         const makeSToken = makeSTokenMaker(undefined, 23, 0, 23);
         aldPToken.close = makeSToken('>');
         delete aldPToken.attDefs[0].defaultType;
         delete aldPToken.attDefs[0].postDefaultTypeSpace;
         aldPToken.attDefs[0].value = [ new TextPToken({ text: SToken.fromString('dummyValue') }) ];

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });


      it('parses multiple attributes definitions with default values with space between them', () => {
         const DUMMY_VALUE = [ new TextPToken({ text: SToken.fromString('dummyValue') }) ];
         literalParseSpy.and.callFake((_1: any, options: LiteralOptions, done: () => void) => {
            options.pToken.value = DUMMY_VALUE;
            done();
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('"'),
            [ '   ', 'space' ],
            [ 'att2', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('"'),
            [ undefined, 'space' ],
            [ undefined, 'word', [ '>', '%' ] ],
            [ '>', 'match', '>' ],
         ]);
         const makeSToken = makeSTokenMaker(undefined); //, 23, 0, 23);
         let aldPToken1: AttListPToken = new attListDeclaration.PToken({
            open: toSToken('<!'),
            elementName: makeSToken('elementName'),
            postElementNameSpace: makeSToken(' '),
            attDefs: [ {
               name: makeSToken('att1'),
               postNameSpace: makeSToken(' '),
               type: makeSToken('CDATA'),
               postTypeSpace: makeSToken(' '),
               value: DUMMY_VALUE,
               postValueSpace: makeSToken('   '),
            }, {
               name: makeSToken('att2'),
               postNameSpace: makeSToken(' '),
               type: makeSToken('CDATA'),
               postTypeSpace: makeSToken(' '),
               value: DUMMY_VALUE,
            } ],
            close: makeSToken('>'),
         });

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         const params = callback.calls.argsFor(0)[0];
         expect((params as any).attDefs).toEqual(aldPToken1.attDefs);
      });

      it('parses a wordList for a NOTATION type', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'NOTATION', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            // wordList parsing
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ undefined, 'match', '>' ],
         ]);
         spyOn(wordList, 'parseWordList').and.callFake((_1: any, _2: any, done: (pToken?: any) => void) => {
            done(new WordListPToken(WordListType.NOTATION, { open: SToken.fromString('(') }));
         });
         const makeSToken = makeSTokenMaker(undefined, 12, 0, 12);
         aldPToken.attDefs = [ {
            name: makeSToken('att1'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('NOTATION'),
            postTypeSpace: makeSToken(' '),
            enumeration: new WordListPToken(WordListType.NOTATION, { open: SToken.fromString('(') }),
            value: [],
         } ];
         delete aldPToken.close;

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('calls parseWordList() with the expected arguments when parsing a NOTATION', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'NOTATION', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            // namelist parsing
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ undefined, 'match', '>' ],
         ]);
         const parseSpy = spyOn(wordList, 'parseWordList');
         parseSpy.and.callFake((_1: any, _2: any, done: (pToken?: any) => void) => {
            done();
         });

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         const expectedArgs = parseSpy.calls.argsFor(0);
         expect(expectedArgs[0]).toEqual(mockSource);
         expect(expectedArgs[1]).toEqual('NOTATION');
         expect(expectedArgs[2]).toBeInstanceOf(Function);
      });

      it('parses the word NOTATION but with no subsequent enumeration', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'NOTATION', 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            [ ' ', 'space' ],
            // wordList parsing
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ undefined, 'match', '>' ],
         ]);
         const parseSpy = spyOn(wordList, 'parseWordList');
         parseSpy.and.callFake((_1: any, _2: any, done: (pToken?: any) => void) => {
            done();
         });
         const makeSToken = makeSTokenMaker(undefined, 12, 0, 12);
         aldPToken.attDefs = [ {
            name: makeSToken('att1'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('NOTATION'),
            postTypeSpace: makeSToken(' '),
            value: [],
         } ];
         delete aldPToken.close;

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('parses a nameList for an ENUMERATION type', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            MockSTokenSource.PEEK('('),
            // wordList parsing
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ undefined, 'match', '>' ],
         ]);
         spyOn(wordList, 'parseWordList').and.callFake((_1: any, _2: any, done: (pToken?: any) => void) => {
            done(new WordListPToken(WordListType.ENUMERATION, { open: SToken.fromString('(') }));
         });
         const makeSToken = makeSTokenMaker(undefined, 12, 0, 12);
         aldPToken.attDefs = [ {
            name: makeSToken('att1'),
            postNameSpace: makeSToken(' '),
            enumeration: new WordListPToken(WordListType.ENUMERATION, { open: SToken.fromString('(') }),
            value: [],
         } ];
         delete aldPToken.close;

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('calls wordList.parse() with the expected arguments when parsing an ENUMERATION', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            MockSTokenSource.PEEK('('),
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ undefined, 'match', '>' ],
         ]);
         const parseSpy = spyOn(wordList, 'parseWordList');
         parseSpy.and.callFake((_1: any, _2: any, done: (pToken?: any) => void) => {
            done();
         });

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         const expectedArgs = parseSpy.calls.argsFor(0);
         expect(expectedArgs[0]).toEqual(mockSource);
         expect(expectedArgs[1]).toEqual(WordListType.ENUMERATION);
         expect(expectedArgs[2]).toBeInstanceOf(Function);
      });

      it('parses a malformed type if there is no type', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ 'att1', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ undefined, 'word', [ '>', '%', '(', '#', '"', '\'' ] ],
            MockSTokenSource.PEEK('"'),
            MockSTokenSource.PEEK('"'),
            [ undefined, 'word', [ '>', '%' ] ],
            [ undefined, 'match', '>' ],
         ]);
         const parseSpy = spyOn(wordList, 'parseWordList');
         parseSpy.and.callFake((_1: any, _2: any, done: (pToken?: any) => void) => {
            done();
         });
         const makeSToken = makeSTokenMaker(undefined, 12, 0, 12);
         aldPToken.attDefs = [ {
            name: makeSToken('att1'),
            postNameSpace: makeSToken(' '),
            value: [],
         } ];
         delete aldPToken.close;

         attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      describe('parameter entity reference', () => {

         it('returns an unassigned value when finding a PE Ref at the start', () => {
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: any) => {
               return foundRef;
            });
            const mockSource = new MockSTokenSource([
               '>',
            ]);

            attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an attr name', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               return  (calls > 1) ? foundRef : other;
            });
            const mockSource = new MockSTokenSource([
               [ 'elName', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
               [ '>', 'match', '>' ],
            ]);

            attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an attr type', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               return (calls > 2) ? foundRef : other;
            });
            const mockSource = new MockSTokenSource([
               [ 'elName', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
               [ 'attName', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
               [ '>', 'match', '>' ],
            ]);

            attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('attName'),
                  postNameSpace: makeSToken(' '),
                  value: []
               }] as any,
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an default type', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               return (calls > 3) ? foundRef : other;
            });
            const mockSource = new MockSTokenSource([
               'elName',
               ' ',
               'attName',
               ' ',
               'CDATA',
               ' ',
               [ '>', 'match', '>' ],
            ]);

            attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('attName'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  value: [],
               }] as any,
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an attValue', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               return (calls > 4) ? foundRef : other;
            });
            const mockSource = new MockSTokenSource([
               'elName',
               ' ',
               'attName',
               ' ',
               'CDATA',
               ' ',
               MockSTokenSource.PEEK('#'),
               [ '#FIXED', 'word', [ '>', '%', '"', '\'' ] ],
               ' ',
               [ '>', 'match', '>' ],
            ]);

            attListDeclaration.parse(mockSource, { open: SToken.fromString('<!') }, callback);
            mockSource.respondInAsyncTime();

            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('attName'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#FIXED'),
                  postDefaultTypeSpace: makeSToken(' '),
                  value: [],
               }] as any,
               close: makeSToken('>'),
            }));
         });

      });

   });

   describe('assignUnassigned()', () => {
      let assignToPropsSpy: jasmine.Spy;

      beforeEach(() => {
         assignToPropsSpy = spyOn(unassigned, 'assignToProps');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         attListDeclaration.assignUnassigned(new attListDeclaration.PToken({
            open: toSToken('<!'),
         }));

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('deletes the unassigned property if it is empty', () => {
         const alPToken = new attListDeclaration.PToken({
            open: toSToken('<!'),
            unassigned: [],
            nextPropName: 'elementName',
         });

         attListDeclaration.assignUnassigned(alPToken);

         expect(alPToken.unassigned).toBeUndefined();
         expect(alPToken.nextPropName).toBeUndefined();
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         const alPToken = new attListDeclaration.PToken({
            open: toSToken('<!'),
            unassigned: [ {
               type: 'reference',
            } ],
         });

         attListDeclaration.assignUnassigned(alPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      describe('unassigned in elementName', () => {

         it('calls unassigned.assignToProps() when the match is in the el name', () => {
            const unassignedValue = [ 'foo' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'elementName',
            });
            spyOn(wordList, 'newWordListFromUndefined');

            attListDeclaration.assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'elementName', [
                  { name: 'declTypeSpace', type: 'space' },
                  { name: 'elementName', type: 'word' },
                  { name: 'postElementNameSpace', type: 'space' },
               ]);
         });

      });

      describe('unassigned in attribute name', () => {

         beforeEach(() => {
            spyOn(wordList, 'newWordListFromUndefined');
         });

         it('calls unassigned.assignToProps() with "xtra" if missing is name', () => {
            const unassignedValue = [ 'foo' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue, {}, 'name', [
               { name: 'xtra', type: 'space' },
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#(].*/i },
               { name: 'postTypeSpace', type: 'space' },
            ]);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue, {}, 'defaultType', [
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
            ]);
         });

         it('adds a space before the first attribute to the postElementNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               postElementNameSpace: SToken.fromString('\t'),
               attDefs: [ {} ] as any,
            }));
         });

         it('appends a space before the first attribute to the postElementNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               postElementNameSpace: SToken.fromString(' '),
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               postElementNameSpace: SToken.fromString(' \t'),
               attDefs: [ {} ] as any,
            }));
         });

         it('adds a space to the previous postNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  postNameSpace: SToken.fromString('\t'),
               }, {} ] as any,
            }));
         });

         it('merges a space into the previous postNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  postNameSpace: SToken.fromString(' ')
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  postNameSpace: SToken.fromString(' \t'),
               }, {} ] as any,
            }));
         });

         it('adds a space to the previous postTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  type: SToken.fromString('lala'),
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  type: SToken.fromString('lala'),
                  postTypeSpace: SToken.fromString('\t'),
               }, {} ] as any,
            }));
         });

         it('merges a space into the previous postTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  type: SToken.fromString('lala'),
                  postTypeSpace: SToken.fromString(' ')
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  type: SToken.fromString('lala'),
                  postTypeSpace: SToken.fromString(' \t'),
               }, {} ] as any,
            }));
         });

         it('adds a space to the previous postDefaultTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  defaultType: SToken.fromString('lala'),
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  defaultType: SToken.fromString('lala'),
                  postDefaultTypeSpace: SToken.fromString('\t'),
               }, {} ] as any,
            }));
         });

         it('merges a space into the previous postDefaultTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  defaultType: SToken.fromString('lala'),
                  postDefaultTypeSpace: SToken.fromString(' ')
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  defaultType: SToken.fromString('lala'),
                  postDefaultTypeSpace: SToken.fromString(' \t'),
               }, {} ] as any,
            }));
         });

         it('adds a space to the previous postValueSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: {},
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  value: {},
                  postValueSpace: SToken.fromString('\t'),
               }, {} ] as any,
            }));
         });

         it('merges a space into the previous postValueSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: {},
                  postValueSpace: SToken.fromString(' ')
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  value: {},
                  postValueSpace: SToken.fromString(' \t'),
               }, {} ] as any,
            }));
         });

         it('copes with attribute definitions not having xtra spaces', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               // pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: {},
                  postValueSpace: SToken.fromString(' ')
               }] as any,
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken).toEqual(new attListDeclaration.PToken({
               open: toSToken('<!'),
               attDefs: [ {
                  value: {},
                  postValueSpace: SToken.fromString(' '),
               }, {} ] as any,
            }));
         });

      });

      describe('unassigned in attribute type', () => {
         let spy: jasmine.Spy;

         beforeEach(() => {
            spy = spyOn(wordList, 'newWordListFromUndefined');
         });

         it('calls unassigned.assignToProps() with no "xtra" if missing is type', () => {
            const unassignedValue = [ 'placeholder unassigned' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'type',
               attDefs: [ {} ] as any,
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(assignToPropsSpy.calls.argsFor(0)).toEqual([unassignedValue, {}, 'type', [
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#(].*/i },
               { name: 'postTypeSpace', type: 'space' },
            ]]);

            expect(assignToPropsSpy.calls.argsFor(1)).toEqual([unassignedValue, {}, 'defaultType', [
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
            ]]);
         });

         it('assigns a enumeration if there is no type', () => {
            const unassignedValue = [ '(' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'type',
               attDefs: [ {} ] as any,
            });
            // consume one unassigned value, so the system thinks we got a nameList
            spy.and.callFake((list: any, unassignedVals: Array<any>) => unassignedVals.pop());

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken.attDefs[0].enumeration).not.toBeUndefined();
         });

         it('assigns a nameList if type is ""', () => {
            const unassignedValue = [ '(' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'defaultType',
               attDefs: [ {
                  type: SToken.fromString(''),
               } ] as any,
            });
            // consume one unassigned value, so the system thinks we got an enumeration
            spy.and.callFake((list: any, unassignedVals: Array<any>) => unassignedVals.pop());

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken.attDefs[0].enumeration).not.toBeUndefined();
         });

         it('assigns a nameList if type is NOTATION', () => {
            const unassignedValue = [ '(' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'defaultType',
               attDefs: [ {
                  type: SToken.fromString('NOTATION'),
               } ] as any,
            });
            // consume one unassigned value, so the system thinks we got an enumeration
            spy.and.callFake((list: any, unassignedVals: Array<any>) => unassignedVals.pop());

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken.attDefs[0].enumeration).not.toBeUndefined();
         });

         it('assigns no enumeration if enumeration.assignUnassigned consumes no tokens', () => {
            const unassignedValue = [ 'foo' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'type',
               attDefs: [ {} ] as any,
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken.attDefs[0].enumeration).toBeUndefined();
         });

         it('calls unassigned.assignToProps() with a postTypeSpace descriptor if this left off on a defaultType', () => {
            const unassignedValue = [ 'placeholder unassigned' ];
            const attDef = {
               type: SToken.fromString('CDATA'),
            };
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'defaultType',
               attDefs: [ attDef ] as any,
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(assignToPropsSpy.calls.argsFor(0)).toEqual([unassignedValue, attDef, 'defaultType', [
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#(].*/i },
               { name: 'postTypeSpace', type: 'space' },
            ]]);

            expect(assignToPropsSpy.calls.argsFor(1)).toEqual([unassignedValue, attDef, 'defaultType', [
               { name: 'postTypeSpace', type: 'space' },
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
            ]]);
         });

      });

      describe('unassigned in enumeration', () => {

         it('builds on the attribute definitions enumeration if that is already in play', () => {
            const unassignedValue = [ 'placeholder unassigned' ];
            const enumeration = new WordListPToken(WordListType.ENUMERATION, {
               open: SToken.fromString('('),
            });
            const expectedEnumeration = new WordListPToken(WordListType.ENUMERATION, {
               open: SToken.fromString('('),
               close: SToken.fromString(')'),
            });
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'defaultType',
               attDefs: [ {
                  name: SToken.fromString('name'),
                  enumeration,
                  value: []
               } ],
            });
            const expected: AttDefPToken = {
               name: SToken.fromString('name'),
               enumeration: expectedEnumeration,
               value: []
            };
            // consume one unassigned value, so the system thinks we got a nameList
            (enumeration as any).newWithUnassigned = (unassignedVals: Array<any>): any => {
               unassignedVals.pop();
               return expectedEnumeration;
            };

            attListDeclaration.assignUnassigned(declPToken);

            expect(declPToken.attDefs[0]).toEqual(expected);
         });
      });

      describe('unassigned in value', () => {
         let spy: jasmine.Spy;

         beforeEach(() => {
            spy = spyOn(wordList, 'newWordListFromUndefined');
         });

         it('does not call nameList.assignUnassigned() if the next property is value', () => {
            const unassignedValue = [ 'placeholder unassigned' ];
            const declPToken = new attListDeclaration.PToken({
               open: toSToken('<!'),
               unassigned: unassignedValue,
               nextPropName: 'value',
               attDefs: [ {} ] as any,
            });

            attListDeclaration.assignUnassigned(declPToken);

            expect(spy).not.toHaveBeenCalled();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(declaration, 'checkWellFormed');
         spyOn(literal, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('reports no errors if no pToken provided', () => {
         attListDeclaration.checkWellFormed(undefined, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no errors if there are unassigned values', () => {
         delete aldPToken.elementName;
         aldPToken.unassigned = [];

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      // it('asks the declaration module to look for problems in the declaration part', () => {
      //    attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

      //    expect(declaration.checkWellFormed).toHaveBeenCalledWith(aldPToken, mockErrorCollector, emd);
      // });

      it('reports an error if there is no element name', () => {
         delete aldPToken.elementName;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_NO_ELEMENT_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // space after ATTLIST was mocked out
         });
      });

      it('reports an error if there is no space after the element name', () => {
         delete aldPToken.postElementNameSpace;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE,
            params: undefined,
            position: undefined,
            lastPosition: aldPToken.elementName,
         });
      });

      it('reports an error if there are no attribute definitions', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs = [];

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_NO_ATTRIBUTES,
            params: [ elName ],
            position: undefined,
            lastPosition: aldPToken.postElementNameSpace,
         });
      });

      it('calls misc.checkName() to report on name validity', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(aldPToken.elementName,
            mockErrorCollector, emd, WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_INVALID);
      });

      it('calls misc.checkName() to report on attribute name validity', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(aldPToken.attDefs[0].name,
            mockErrorCollector, emd, WellFormedError.ID.ATTLISTDECL_ATTR_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on attribute name conformance', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(aldPToken.attDefs[0].name,
            mockErrorCollector, emd, 'ATTRIBUTE', XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
            XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);
      });

      it('reports a warning if the same attribute name is listed multiple times', () => {
         aldPToken.attDefs.push({
            name: SToken.fromString('two'),
            value: [],
         });
         aldPToken.attDefs.push({
            name: new SToken('att1', 'att1', new Range(new EntityLocation(), 10, 0, 10, 15, 0, 15)),
            value: [],
         });

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.ATTLISTDECL_ATTR_NAME_DUPLICATE,
            params: [ 'att1' ],
            position: aldPToken.attDefs[2].name,
         });
      });

      it('reports an error if there is no space after the attribute name', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         delete aldPToken.attDefs[0].postNameSpace;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_NAME_NO_SPACE,
            params: [ aldPToken.attDefs[0].name.str, elName ],
            position: undefined,
            lastPosition: aldPToken.attDefs[0].name,
         });
      });

      it('reports an error if an unknown type is provided', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].type = SToken.fromString('bogus');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_TYPE_UNKNOWN,
            params: [ aldPToken.attDefs[0].name.str, elName, 'bogus' ],
            position: aldPToken.attDefs[0].type,
         });
      });

      it('reports no error if the type is CDATA', () => {
         aldPToken.attDefs[0].type = SToken.fromString('CDATA');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is ID', () => {
         aldPToken.attDefs[0].type = SToken.fromString('ID');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is IDREF', () => {
         aldPToken.attDefs[0].type = SToken.fromString('IDREF');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is IDREFS', () => {
         aldPToken.attDefs[0].type = SToken.fromString('IDREFS');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is ENTITY', () => {
         aldPToken.attDefs[0].type = SToken.fromString('ENTITY');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is ENTITIES', () => {
         aldPToken.attDefs[0].type = SToken.fromString('ENTITIES');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is NMTOKEN', () => {
         aldPToken.attDefs[0].type = SToken.fromString('NMTOKEN');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is NMTOKENS', () => {
         aldPToken.attDefs[0].type = SToken.fromString('NMTOKENS');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is NOTATION', () => {
         aldPToken.attDefs[0].type = SToken.fromString('NOTATION');
         aldPToken.attDefs[0].enumeration = new WordListPToken(WordListType.NOTATION, {
            open: SToken.fromString('('),
            words: [{
               word: SToken.fromString('x'),
            }],
            close: SToken.fromString(')'),
            closeSpace: SToken.fromString(' '),
         });

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if an the type is miscased', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].type = SToken.fromString('cdata');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_TYPE_INVALID,
            params: [ aldPToken.attDefs[0].name.str, elName, 'cdata' ],
            position: aldPToken.attDefs[0].type,
         });
      });

      it('reports an error this an enumerated type but it has no name list', () => {
         delete aldPToken.attDefs[0].type;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_ENUMERATION,
            params: [ aldPToken.attDefs[0].name.str, aldPToken.elementName!.str ],
            lastPosition: aldPToken.attDefs[0].postNameSpace,
         });
      });

      it('calls nameList.checkWellFormed() if this is an enumerated type', () => {
         const cwfSpy = jasmine.createSpy();
         delete aldPToken.attDefs[0].type;
         aldPToken.attDefs[0].enumeration = new WordListPToken(WordListType.ENUMERATION, { open: SToken.fromString(' ') });
         (aldPToken.attDefs[0].enumeration as any).checkWellFormed = cwfSpy;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(cwfSpy).toHaveBeenCalledWith(mockErrorCollector, emd);
      });

      it('reports an error the enumeration does not end with a space', () => {
         delete aldPToken.attDefs[0].type; // make it an enumeration
         aldPToken.attDefs[0].enumeration = new WordListPToken(WordListType.ENUMERATION, { open: SToken.fromString(' ') });
         (aldPToken.attDefs[0].enumeration as any).checkWellFormed = () => {};

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE,
            params: [ aldPToken.attDefs[0].name.str, aldPToken.elementName!.str ],
            lastPosition: aldPToken.attDefs[0].postNameSpace,
         });
      });

      it('reports an error this an NOTATION type but it has no name list', () => {
         aldPToken.attDefs[0].type = SToken.fromString('NOTATION');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_NOTATION,
            params: [ aldPToken.attDefs[0].name.str, aldPToken.elementName!.str ],
            position: aldPToken.attDefs[0].postTypeSpace,
         });
      });

      it('calls nameList.checkWellFormed() if this is an NOTATION type', () => {
         const cwfSpy = jasmine.createSpy();
         aldPToken.attDefs[0].type = SToken.fromString('NOTATION');
         aldPToken.attDefs[0].enumeration = new WordListPToken(WordListType.NOTATION, { open: SToken.fromString(' ') });
         (aldPToken.attDefs[0].enumeration as any).checkWellFormed = cwfSpy;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(cwfSpy).toHaveBeenCalledWith(mockErrorCollector, emd);
      });

      it('reports an error the NOTATION list does not end with a space', () => {
         aldPToken.attDefs[0].type = SToken.fromString('NOTATION');
         aldPToken.attDefs[0].enumeration = new WordListPToken(WordListType.NOTATION, { open: SToken.fromString(' ') });
         (aldPToken.attDefs[0].enumeration as any).checkWellFormed = () => {};

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE,
            params: [ aldPToken.attDefs[0].name.str, aldPToken.elementName!.str ],
            position: aldPToken.attDefs[0].postTypeSpace, // Should be the end of the name list, but mocked out
         });
      });

      it('reports an error if there is no space after the attribute type', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         delete aldPToken.attDefs[0].postTypeSpace;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_TYPE_NO_SPACE,
            params: [ aldPToken.attDefs[0].name.str, elName ],
            position: undefined,
            lastPosition: aldPToken.attDefs[0].type,
         });
      });

      it('reports an error if an unknown defaultType is provided', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].defaultType = SToken.fromString('#IMPLICIT');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN,
            params: [ aldPToken.attDefs[0].name.str, elName, '#IMPLICIT' ],
            position: aldPToken.attDefs[0].defaultType,
         });
      });

      it('reports no error if the type is #REQUIRED', () => {
         aldPToken.attDefs[0].defaultType = SToken.fromString('#REQUIRED');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is #IMPLIED', () => {
         aldPToken.attDefs[0].defaultType = SToken.fromString('#IMPLIED');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no error if the type is #FIXED', () => {
         aldPToken.attDefs[0].defaultType = SToken.fromString('#FIXED');
         aldPToken.attDefs[0].postDefaultTypeSpace = SToken.fromString(' ');
         aldPToken.attDefs[0].openQuote = SToken.fromString('"');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if an the default type is miscased', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].defaultType = SToken.fromString('#required');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_DEFAULT_INVALID,
            params: [ aldPToken.attDefs[0].name.str, elName, '#required' ],
            position: aldPToken.attDefs[0].defaultType,
         });
      });

      it('reports an error if there is no space after a fixed type', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].defaultType = SToken.fromString('#FIXED');
         delete aldPToken.attDefs[0].postDefaultTypeSpace;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_FIXED_NO_SPACE,
            params: [ aldPToken.attDefs[0].name.str, elName ],
            position: undefined,
            lastPosition: aldPToken.attDefs[0].defaultType,
         });
      });

      it('reports an error if there is no value and no defaultType', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         delete aldPToken.attDefs[0].defaultType;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_VALUE,
            params: [ aldPToken.attDefs[0].name.str, elName ],
            position: undefined,
            lastPosition: aldPToken.attDefs[0].postTypeSpace,
         });
      });

      it('reports an error if there is no value after a #FIXED', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].defaultType = SToken.fromString('#FIXED');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
            params: [ aldPToken.attDefs[0].name.str, elName ],
            position: undefined,
            lastPosition: aldPToken.attDefs[0].postDefaultTypeSpace,
         });
      });

      it('calls literal.checkWellFormed() with the attribute data', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(literal.checkWellFormed)
            .toHaveBeenCalledWith(aldPToken.attDefs[0], mockErrorCollector, emd, WellFormedError.ID.NOUN_ATTRIBUTE);
      });

      it('reports an error if there is a value after a #REQUIRED', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         aldPToken.attDefs[0].defaultType = SToken.fromString('#REQUIRED');
         aldPToken.attDefs[0].openQuote = SToken.fromString('"');

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_ATTR_EXTRA_VALUE,
            params: [ aldPToken.attDefs[0].name.str, elName ],
            position: aldPToken.attDefs[0].openQuote,
         });
      });

      it('reports an error if there is no close', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         delete aldPToken.close;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_NO_CLOSE,
            params: [ elName ],
            position: undefined,
            lastPosition: aldPToken.attDefs[0].postDefaultTypeSpace,
         });
      });

      it('reports an error if there is extra text after unassigned', () => {
         spyOn(unassigned, 'checkExtra');
         const startSToken = new SToken('one', 'one', new Range(new EntityLocation(), 0, 0, 0, 0, 0, 0));
         aldPToken.extra = [
            unassigned.wordFromSToken(startSToken),
         ];

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(unassigned.checkExtra).toHaveBeenCalledWith(aldPToken.extra,
            mockErrorCollector,
            WellFormedError.ID.ATTLISTDECL_EXTRA_TEXT);
      });

   });

   describe('pTokenToXToken()', () => {

      it('creates an XToken', () => {
         const elName = aldPToken.elementName ? aldPToken.elementName.str : 'BUG';
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: elName,
            pToken: aldPToken,
         });
      });

      it('creates an XToken with a blank name when pToken has no name', () => {
         delete aldPToken.elementName;
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: '',
            pToken: aldPToken,
         });
      });

      it('creates an XToken with the provided attributes', () => {
         aldPToken.attDefs.push({
            name: SToken.fromString('attr2'),
            type: SToken.fromString('bogus'),
            defaultType: SToken.fromString('#FIXED'),
            openQuote: SToken.fromString('"'),
            value: [ new TextPToken({ text: SToken.fromString('x') }) ],
            closeQuote: SToken.fromString('"'),
         });
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: 'elementName',
            attDefs: [{
               name: 'att1',
               type: 'CDATA',
               defaultType: '#REQUIRED',
               value: [],
            }, {
               name: 'attr2',
               type: 'bogus',
               defaultType: '#FIXED',
               value: [ new TextXToken('x', new TextPToken({ text: SToken.fromString('x') })) ],
            }],
            pToken: aldPToken,
         });
      });

      it('hands off to nameList if there is an enumerated value', () => {
         aldPToken.attDefs[0].enumeration =
            new WordListPToken(WordListType.NOTATION, { open: SToken.fromString('(') });
         aldPToken.attDefs[0].enumeration!.toXToken = () => [];

         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: 'elementName',
            attDefs: [{
               name: 'att1',
               type: 'CDATA',
               enumeration: [],
               defaultType: '#REQUIRED',
               value: [],
            }],
            pToken: aldPToken,
         });
      });

      it('adds an ENUMERATION type value if there is no type already specified', () => {
         delete aldPToken.attDefs[0].type;
         aldPToken.attDefs[0].enumeration =
            new WordListPToken(WordListType.NOTATION, { open: SToken.fromString('(') });
         aldPToken.attDefs[0].enumeration!.toXToken = () => [];

         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: 'elementName',
            attDefs: [{
               name: 'att1',
               type: 'ENUMERATION',
               enumeration: [],
               defaultType: '#REQUIRED',
               value: [],
            }],
            pToken: aldPToken,
         });
      });

      it('replaces a missing type and defaultType value with a space', () => {
         aldPToken.attDefs.push({
            name: SToken.fromString('attr2'),
            value: [],
         });
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: 'elementName',
            attDefs: [{
               name: 'att1',
               type: 'CDATA',
               defaultType: '#REQUIRED',
               value: [],
            }, {
               name: 'attr2',
               type: '',
               defaultType: '',
               value: [],
            }],
            pToken: aldPToken,
         });
      });

   });

});
