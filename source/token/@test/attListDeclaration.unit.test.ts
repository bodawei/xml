/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from '../../basic/index';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken/index';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError, XmlWarning } from '../../error/index';

import attListDeclaration, { AttListPToken, AttDefPToken } from '../attListDeclaration.js';
import declaration from '../bridge/declaration';
import entityReference from '../entityReference.js'
import text from '../text';
import unassigned, { UnassignedArray } from '../unassigned';
import literal from '../common/literal.js';
import misc from '../common/misc.js';

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
         elementName: makeSToken('elementName'),
         postElementNameSpace: makeSToken(' '),
         attDefs: [ {
            name: makeSToken('att1'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('CDATA'),
            postTypeSpace: makeSToken(' '),
            defaultType: makeSToken('#REQUIRED'),
            postDefaultTypeSpace: makeSToken(' '),
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
         }], new attListDeclaration.PToken());

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
      let checkForPERefCallback: (values?:UnassignedArray) => void;
      let makeCheckCallbackSpy: jasmine.Spy;
      let literalParseSpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');

         makeCheckCallbackSpy = spyOn(unassigned, 'makeCheckCallback'); // TS
         makeCheckCallbackSpy.and.callFake((_1: any, _2: any, _3: any, other: (x?: UnassignedArray) => void) => {
            checkForPERefCallback = other;
         });

         spyOn(unassigned, 'checkForPERef').and.callFake(() => checkForPERefCallback());
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

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
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

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ new attListDeclaration.PToken({
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

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
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
         });
         aldPToken.close = makeSToken('>');

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
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
         });
         aldPToken.attDefs.push({
            name: makeSToken('att3'),
            postNameSpace: makeSToken(' '),
            type: makeSToken('IDREF'),
            postTypeSpace: makeSToken(' '),
            defaultType: makeSToken('#IMPLICIT'),
            postDefaultTypeSpace: makeSToken(' '),
         });
         aldPToken.close = makeSToken('>');

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('parses an attribute list with a literal even with #REQUIRED', () => {
         literalParseSpy.and.callFake((_1: any, options: LiteralOptions, done: () => void) => {
            options.pToken.value = [ 'dummyValue' ];
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
         aldPToken.attDefs[0].value = [ 'dummyValue' ];

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('parses an attribute list with a literal with no defaultType at all', () => {
         literalParseSpy.and.callFake((_1: any, options: LiteralOptions, done: () => void) => {
            options.pToken.value = [ 'dummyValue' ];
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
         aldPToken.attDefs[0].value = [ 'dummyValue' ];

         attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      describe('parameter entity reference', () => {

         it('returns an unassigned value when finding a PE Ref at the start', () => {
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: any) => {
               foundRef();
            });
            const mockSource = new MockSTokenSource([
               '>',
            ]);
   
            attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
            mockSource.respondInAsyncTime();
   
            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an attr name', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               if (calls > 1) {
                  foundRef();
               } else {
                  other();
               }
            });
            const mockSource = new MockSTokenSource([
               [ 'elName', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
               [ '>', 'match', '>' ],
            ]);
   
            attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
            mockSource.respondInAsyncTime();
   
            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an attr type', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               if (calls > 2) {
                  foundRef();
               } else {
                  other();
               }
            });
            const mockSource = new MockSTokenSource([
               [ 'elName', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
               [ 'attName', 'word', [ '>', '%' ] ],
               [ ' ', 'space' ],
               [ '>', 'match', '>' ],
            ]);
   
            attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
            mockSource.respondInAsyncTime();
   
            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('attName'),
                  postNameSpace: makeSToken(' '),
               }],
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an default type', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               if (calls > 3) {
                  foundRef();
               } else {
                  other();
               }
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
   
            attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
            mockSource.respondInAsyncTime();
   
            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('attName'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
               }],
               close: makeSToken('>'),
            }));
         });

         it('returns an unassigned value when finding a PE Ref instead of an attValue', () => {
            let calls = 0;
            makeCheckCallbackSpy.and.callFake((_1: any, _2: any, foundRef: () => void, other: () => void) => {
               calls ++;
               if (calls > 4) {
                  foundRef();
               } else {
                  other();
               }
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
   
            attListDeclaration.parse(mockSource, new declaration.PToken(), callback);
            mockSource.respondInAsyncTime();
   
            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('attName'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#FIXED'),
                  postDefaultTypeSpace: makeSToken(' '),
               }],
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
         attListDeclaration.assignUnassigned(new attListDeclaration.PToken({}));

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('deletes the unassigned property if it is empty', () => {
         const alPToken = new attListDeclaration.PToken({
            unassigned: [],
            nextPropName: 'elementName',
         });
         
         attListDeclaration.assignUnassigned(alPToken);

         expect(alPToken.unassigned).toBeUndefined();
         expect(alPToken.nextPropName).toBeUndefined();
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         const alPToken = new attListDeclaration.PToken({
            unassigned: [ {
               type: entityReference.PARAM_PTYPE,
            } ],
         });
         
         attListDeclaration.assignUnassigned(alPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      describe('unassigned in elementName', () => {

         it('calls unassigned.assignToProps() when the match is in the el name', () => {
            const unassignedValue = [ 'foo' ];
            const declPToken = new attListDeclaration.PToken({
               unassigned: unassignedValue,
               nextPropName: 'elementName',
            });
            
            attListDeclaration.assignUnassigned(declPToken);
   
            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'elementName', [
                  { name: 'postDeclTypeSpace', type: 'space' },
                  { name: 'elementName', type: 'word' },
                  { name: 'postElementNameSpace', type: 'space' },
               ]);
         });
   
      });

      describe('unassigned in attribute name', () => {

         it('calls unassigned.assignToProps() with "xtra" if missing is name', () => {
            const unassignedValue = [ 'foo' ];
            const declPToken = new attListDeclaration.PToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });
            
            attListDeclaration.assignUnassigned(declPToken);
   
            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue, {}, 'name', [
               { name: 'xtra', type: 'space' },
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#].*/i },
               { name: 'postTypeSpace', type: 'space' },
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
            ]);
         });
   
         it('adds attribute entries for each attribute', () => {
            const unassignedValue = [ 'attName1', 'attName2' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray) => {
               unassigned.pop();
            })
            const declPToken = new attListDeclaration.PToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });
            const expected = new attListDeclaration.PToken({
               attDefs: [ {}, {} ],
            });
            
            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(expected);
         });

         it('adds a space before the first attribute to the postElementNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               postElementNameSpace: SToken.fromString('\t'),
               attDefs: [ {} ],
            }));
         });

         it('appends a space before the first attribute to the postElementNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               postElementNameSpace: SToken.fromString(' '),
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               postElementNameSpace: SToken.fromString(' \t'),
               attDefs: [ {} ],
            }));
         });

         it('adds a space to the previous postNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  postNameSpace: SToken.fromString('\t'),
               }, {} ],
            }));
         });

         it('merges a space into the previous postNameSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  postNameSpace: SToken.fromString(' ')
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  postNameSpace: SToken.fromString(' \t'),
               }, {} ],
            }));
         });

         it('adds a space to the previous postTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  type: SToken.fromString('lala'),
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  type: SToken.fromString('lala'),
                  postTypeSpace: SToken.fromString('\t'),
               }, {} ],
            }));
         });

         it('merges a space into the previous postTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  type: SToken.fromString('lala'),
                  postTypeSpace: SToken.fromString(' ')
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  type: SToken.fromString('lala'),
                  postTypeSpace: SToken.fromString(' \t'),
               }, {} ],
            }));
         });

         it('adds a space to the previous postDefaultTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  defaultType: SToken.fromString('lala'),
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  defaultType: SToken.fromString('lala'),
                  postDefaultTypeSpace: SToken.fromString('\t'),
               }, {} ],
            }));
         });

         it('merges a space into the previous postDefaultTypeSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  defaultType: SToken.fromString('lala'),
                  postDefaultTypeSpace: SToken.fromString(' ')
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  defaultType: SToken.fromString('lala'),
                  postDefaultTypeSpace: SToken.fromString(' \t'),
               }, {} ],
            }));
         });

         it('adds a space to the previous postValueSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  value: {},
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  value: {},
                  postValueSpace: SToken.fromString('\t'),
               }, {} ],
            }));
         });

         it('merges a space into the previous postValueSpace', () => {
            const unassignedValue = [ 'attName1' ];
            assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
               unassigned.pop();
               pToken.xtra = SToken.fromString('\t');
            })
            const declPToken = new attListDeclaration.PToken({
               attDefs: [{
                  value: {},
                  postValueSpace: SToken.fromString(' ')
               }],
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            attListDeclaration.assignUnassigned(declPToken);
   
            expect(declPToken).toEqual(new attListDeclaration.PToken({
               attDefs: [ {
                  value: {},
                  postValueSpace: SToken.fromString(' \t'),
               }, {} ],
            }));
         });

      });

      describe('unassigned in attribute type', () => {

         it('calls unassigned.assignToProps() with no "xtra" if missing is type', () => {
            const unassignedValue = [ 'placeholder unassigned' ];
            const declPToken = new attListDeclaration.PToken({
               unassigned: unassignedValue,
               nextPropName: 'type',
               attDefs: [ {} ],
            });
            
            attListDeclaration.assignUnassigned(declPToken);
   
            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue, {}, 'type', [
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#].*/i },
               { name: 'postTypeSpace', type: 'space' },
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
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

      it('asks the declaration module to look for problems in the declaration part', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(aldPToken, mockErrorCollector, emd);
      });

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
            mockErrorCollector, emd, true, XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
            XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);
      });

      it('reports a warning if the same attribute name is listed multiple times', () => {
         aldPToken.attDefs.push({
            name: SToken.fromString('two'),
         });
         aldPToken.attDefs.push({
            name: new SToken('att1', 'att1', new Range(undefined, 10, 0, 10, 15, 0, 15)),
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
         const textValue = new text.PToken();
         aldPToken.attDefs.push({
            name: SToken.fromString('attr2'),
            type: SToken.fromString('bogus'),
            defaultType: SToken.fromString('#FIXED'),
            openQuote: SToken.fromString('"'),
            value: [ new text.PToken({ text: SToken.fromString('x') }) ],
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
            }, {
               name: 'attr2',
               type: 'bogus',
               defaultType: '#FIXED',
               value: [ text.makeXToken(new text.PToken({ text: SToken.fromString('x') })) ],
            }],
            pToken: aldPToken,
         });
      });

      it('replaces a missing type and defaultType value with a space', () => {
         aldPToken.attDefs.push({
            name: SToken.fromString('attr2'),
         });
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: 'elementName',
            attDefs: [{
               name: 'att1',
               type: 'CDATA',
               defaultType: '#REQUIRED',
            }, {
               name: 'attr2',
               type: '',
               defaultType: '',
            }],
            pToken: aldPToken,
         });
      });

   });

});
