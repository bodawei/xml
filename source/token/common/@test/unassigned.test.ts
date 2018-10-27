/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../../basic';
import { WellFormedError } from '../../../error';
import { MockErrorCollector } from '../../../error/@test/helper';
import { SToken } from '../../../sToken';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from '../../../sToken/@test/helper';

import entityReference, { ParameterEntityReferencePToken } from '../../entityReference.js';
import entityStart from '../../entityStart.js';
import text from '../../text';
import literal from '../literal';
import unassigned, { UnassignedType, UnassignedValue, UnassignedArray } from '../unassigned';

import helper from '../../@test/helper.js';

describe('unassigned (unit)', () => {

   function expectDelivery(spy: jasmine.Spy, value: any) {
      expect(spy.calls.allArgs()).toEqual([ [ value ] ]);
   }

   describe('checkForPERef()', () => {
      let mockSource: MockSTokenSource;
      let deliverySpy: jasmine.Spy;
      let unParse: jasmine.Spy;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         unParse = spyOn(unassigned, 'parseNextValue');
      });

      it('passes nothing back in the callback if at the end of source', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'peekChar' ],
         ]);

         unassigned.checkForPERef(mockSource, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith();
      });

      it('passes nothing back in the next thing is not a PE Reference', () => {
         mockSource = new MockSTokenSource([
            [ 'x', 'peekChar' ],
         ]);

         unassigned.checkForPERef(mockSource, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith();
      });

      it('gathers the next set of unassigned values until there are none left', () => {
         let callCount = 0;
         mockSource = new MockSTokenSource([
            [ '%', 'peekChar' ],
         ]);
         unParse.and.callFake((_1: any, _2: any, deliver: Function) => {
            if (callCount === 3) {
               deliver();
            } else {
               callCount ++;
               deliver({ count: callCount });
            }
         })

         unassigned.checkForPERef(mockSource, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith([
            { count: 1 },
            { count: 2 },
            { count: 3 }
         ]);
      });

   });

   describe('parseNextValue()', () => {
      let mockSource: MockSTokenSource;
      let deliverySpy: jasmine.Spy;
      let makeSToken: STokenMaker;
      let litParse: jasmine.Spy;
      let entRefParse: jasmine.Spy;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         litParse = spyOn(literal, 'parse');
         entRefParse = spyOn(entityReference, 'paramParse');

         makeSToken = makeSTokenMaker();
      });

      it('delivers nothing if at end of stream', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith();
      });

      it('delivers the next a space value', () => {
         mockSource = new MockSTokenSource([
            [ '   ', 'space' ],
         ]);
         const pToken = unassigned.spaceFromSToken(makeSToken('   '));

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith(pToken);
      });

      it('delivers nothing if the next character is ">"', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('>'), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith();
      });

      it('delivers a literal if a double quote is found', () => {
         litParse.and.callFake((_1: any, container: any, foundOne: Function) => {
            container.pToken.isLiteral = true;
            foundOne(container.pToken);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('"'), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith({
            type: UnassignedType.LITERAL,
            token: {
               isLiteral: true,
            }
         });
      });

      it('delivers a literal if a single quote is found', () => {
         litParse.and.callFake((_1: any, container: any, foundOne: Function) => {
            container.pToken.isLiteral = true;
            foundOne(container.pToken);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('\''), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith({
            type: UnassignedType.LITERAL,
            token: {
               isLiteral: true,
            }
         });
      });

      it('delivers a parameter entity reference PToken if a "%" is found', () => {
         entRefParse.and.callFake((_1: any, deliver: Function) => {
            deliver({ isPeref: true });
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith({
            type: UnassignedType.REFERENCE,
            token: {
               isPeref: true,
            },
         });
      });

      it('delivers a word value if other characters are found', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('x'), 'peekChar' ],
            [ 'xyzzy', 'word', [ '>', '"', '\'', '%' ] ],
         ]);
         const pToken = unassigned.wordFromSToken(makeSToken('xyzzy'));

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith(pToken);
      });

      it('delivers a "(" as a word if nameListChars is true', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('('), 'peekChar' ],
            [ '(', 'match', '(' ],
         ]);
         const pToken = unassigned.wordFromSToken(makeSToken('('));

         unassigned.parseNextValue(mockSource, true, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith(pToken);
      });

      it('delivers a "," as a word if nameListChars is true', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK(','), 'peekChar' ],
            [ ',', 'match', ',' ],
         ]);
         const pToken = unassigned.wordFromSToken(makeSToken(','));

         unassigned.parseNextValue(mockSource, true, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith(pToken);
      });

      it('delivers a "|" as a word if nameListChars is true', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('|'), 'peekChar' ],
            [ '|', 'match', '|' ],
         ]);
         const pToken = unassigned.wordFromSToken(makeSToken('|'));

         unassigned.parseNextValue(mockSource, true, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith(pToken);
      });

      it('delivers a ")" as a word if nameListChars is true', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK(')'), 'peekChar' ],
            [ ')', 'match', ')' ],
         ]);
         const pToken = unassigned.wordFromSToken(makeSToken(')'));

         unassigned.parseNextValue(mockSource, true, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith(pToken);
      });

   });

   describe('parseAllValues()', () => {
      let mockSource: MockSTokenSource;
      let deliverySpy: jasmine.Spy;
      let makeSToken: STokenMaker;
      let litParse: jasmine.Spy;
      let entRefParse: jasmine.Spy;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         litParse = spyOn(literal, 'parse');
         entRefParse = spyOn(entityReference, 'paramParse');

         makeSToken = makeSTokenMaker();
      });

      it('delivers all multiple values', () => {
         litParse.and.callFake((_1: any, container: any, foundOne: Function) => {
            container.pToken.isLiteral = true;
            foundOne(container.pToken);
         });
         entRefParse.and.callFake((_1: any, deliver: Function) => {
            deliver({ isPeref: true });
         });
         mockSource = new MockSTokenSource([
            [ '   ', 'space' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('x'), 'peekChar' ],
            [ 'xyzzy', 'word', [ '>', '"', '\'', '%' ] ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('"'), 'peekChar' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('>'), 'peekChar' ],
         ]);

         unassigned.parseAllValues(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith([
            unassigned.spaceFromSToken(makeSToken('   ')),
            unassigned.wordFromSToken(makeSToken('xyzzy')), {
               type: UnassignedType.LITERAL,
               token: {
                  isLiteral: true,
               },
            }, {
               type: UnassignedType.REFERENCE,
               token: {
                  isPeref: true
               },
            },
         ]);
      });

      it('parses nameList separators when asked to', () => {
         mockSource = new MockSTokenSource([
            [ '   ', 'space' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('('), 'peekChar' ],
            [ '(', 'match', '(' ],
            [ ' ', 'space' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('|'), 'peekChar' ],
            [ '|', 'match', '|' ],
            [ ' ', 'space' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK(','), 'peekChar' ],
            [ ',', 'match', ',' ],
            [ ' ', 'space' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK(')'), 'peekChar' ],
            [ ')', 'match', ')' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         unassigned.parseAllValues(mockSource, true, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith([
            unassigned.spaceFromSToken(makeSToken('   ')),
            unassigned.wordFromSToken(makeSToken('(')),
            unassigned.spaceFromSToken(makeSToken(' ')),
            unassigned.wordFromSToken(makeSToken('|')),
            unassigned.spaceFromSToken(makeSToken(' ')),
            unassigned.wordFromSToken(makeSToken(',')),
            unassigned.spaceFromSToken(makeSToken(' ')),
            unassigned.wordFromSToken(makeSToken(')')),
         ]);
      });

   });

   describe('assignToProps()', () => {

      it('does nothing if there is no unassigned items', () => {
         const pToken = {};
         const unassVals: UnassignedArray = [];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unassVals.slice(0), pToken, 'one', descriptors);

         expect(pToken).toEqual({});
      });

      it('fills in the pToken with the expected properties starting with leftOff', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: space.token.text,
            three: word2.token.text,
         });
      });

      it('fills in the pToken with the expected properties from the first if no leftOff', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: space.token.text,
            three: word2.token.text,
         });
      });

      it('skips a descriptor if a value does not match the "allowed" values', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
            allowed: /one/,
         }, {
            name: 'four',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: space.token.text,
            four: word2.token.text,
         });
      });

      it('allows a descriptor if a value case-insensitively matches one of the "allowed"', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('BAR'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
            allowed: /one|bar/,
         }, {
            name: 'four',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: space.token.text,
            three: word2.token.text,
         });
      });

      it('allows for an SToken having no text when the value is "allowed"', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('BAR'));
         delete word2.token.text;
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
            allowed: /one|bar/,
         }, {
            name: 'four',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: space.token.text,
            four: undefined,
         });
      });

      it('skips descriptor if there is no matching unassigned item', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const unVals = [ word1, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            three: word2.token.text,
         });
      });

      it('adds literal values at the PToken top level if flatten is true', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const literal: any = {
            type: UnassignedType.LITERAL,
            token: {
               openQuote: SToken.fromString('"'),
               value: [],
               closeQuote: SToken.fromString('"'),
            }
         };
         const unVals: UnassignedArray = [ word1, literal, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.LITERAL,
            flatten: true,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            three: word2.token.text,
            openQuote: literal.token.openQuote,
            value: literal.token.value,
            closeQuote: literal.token.closeQuote,
         });
      });

      it('adds literal values at the PToken in a sub-object flatten is not true', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const literal: any = {
            type: UnassignedType.LITERAL,
            token: {
               openQuote: SToken.fromString('"'),
               value: [],
               closeQuote: SToken.fromString('"'),
            }
         };
         const unVals: UnassignedArray = [ word1, literal, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.LITERAL,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: {
               openQuote: literal.token.openQuote,
               value: literal.token.value,
               closeQuote: literal.token.closeQuote,
            },
            three: word2.token.text,
         });
      });

      it('starts midway through the descriptors if asked to', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('firstWord'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('secondWord'));
         const space = unassigned.wordFromSToken(SToken.fromString('\t'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'three', descriptors);

         expect(pToken).toEqual({
            three: word1.token.text,
         });
      });

      describe('space handling', () => {

         it('adds a 4.4.8 introduced space in a property with a descriptor', () => {
            const pToken = {};
            const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
            const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
            const unVals: UnassignedArray = [ word1, {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, word2, {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityReferencePToken(),
            } ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.WORD,
            }, {
               name: 'two',
               type: UnassignedType.SPACE,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word1.token.text,
               two: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               three: word2.token.text,
            });
         });

         it('skips over a space if it is not provided', () => {
            const pToken = {};
            const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
            const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
            const unVals = [ word1, word2 ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.WORD,
            }, {
               name: 'two',
               type: UnassignedType.SPACE,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word1.token.text,
               three: word2.token.text,
            });
         });

         it('skips non-space descriptors when encountering an introduced space', () => {
            const pToken = {};
            const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
            const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
            const unVals: UnassignedArray = [ word1, {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, word2, {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityReferencePToken(),
            } ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.WORD,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            }, {
               name: 'four',
               type: UnassignedType.SPACE,
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word1.token.text,
               four: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
            });
         });

         it('puts a leading space into the next available space', () => {
            const pToken = {};
            const space = unassigned.spaceFromSToken(SToken.fromString(' '));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ space, word ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.WORD,
            }, {
               name: 'two',
               type: UnassignedType.SPACE,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               two: space.token.text,
               three: word.token.text,
            });
         });

         it('merges a leading space into the next available space, if it matches the left off property', () => {
            const pToken = {
               two: SToken.fromString(' '),
            };
            const space = unassigned.spaceFromSToken(SToken.fromString(' '));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ space, word ];
            const descriptors = [ {
               name: 'two',
               type: UnassignedType.SPACE,
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               two: SToken.fromString(' ').merge(space.token.text),
            });
         });

         it('merges the combination of several introduced spaces into one space', () => {
            const pToken = {};
            const space = unassigned.spaceFromSToken(new SToken(' ', ' ', [ new Range(new EntityLocation()) ]));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals: UnassignedArray = [ word, {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, space ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.WORD,
            }, {
               name: 'two',
               type: UnassignedType.SPACE,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word.token.text,
               two: new SToken('     ', '     ', [
                  helper.makeInsertedRange(),
                  helper.makeInsertedRange(),
                  helper.makeInsertedRange(),
                  helper.makeInsertedRange(),
                  new Range(new EntityLocation()),
               ]),
            });
         });

         it('puts a leading space into the previous property', () => {
            const pToken = {};
            const space = unassigned.spaceFromSToken(SToken.fromString('\n'));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ space, word ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.SPACE,
            }, {
               name: 'two',
               type: UnassignedType.WORD,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: space.token.text,
               two: word.token.text,
            });
         });

         it('merges a leading space into the previous', () => {
            const pToken: any = {
               one: SToken.fromString('\t'),
            };
            const space = unassigned.spaceFromSToken(SToken.fromString('\n'));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ space, word ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.SPACE,
            }, {
               name: 'two',
               type: UnassignedType.WORD,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: SToken.fromString('\t\n'),
               two: word.token.text,
            });
         });

         it('merges a 4.4.8 introduced space into the previous', () => {
            const pToken: any = {
               one: new SToken('\t', '\t', new Range(new EntityLocation())),
            };
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals: UnassignedArray = [ {
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            }, word ];
            const descriptors = [ {
               name: 'one',
               type: UnassignedType.SPACE,
            }, {
               name: 'two',
               type: UnassignedType.WORD,
            }, {
               name: 'three',
               type: UnassignedType.WORD,
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: new SToken('\t ', '\t ', [ new Range(new EntityLocation()), helper.makeInsertedRange() ]),
               two: word.token.text,
            });
         });

      });

      it('empties the unassigned array of the consumed values', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString(' '));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(unVals.length).toEqual(0);
      });

      it('it leaves values in the unassigned array if they are not consumed', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(unVals.length).toEqual(2);
      });

      it('copes with tokens missing actual text', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         delete space.token.text;
         delete word1.token.text;
         delete word2.token.text;
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: UnassignedType.WORD,
         }, {
            name: 'two',
            type: UnassignedType.SPACE,
         }, {
            name: 'three',
            type: UnassignedType.WORD,
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: undefined,
            two: undefined,
            three: undefined,
         });
      });

   });

   describe('spaceFromSToken()', () => {

      it('makes an annotated text PToken with whatever it was given', () => {
         const expected: any = {
            type: UnassignedType.SPACE,
            token: new text.PToken({ text: SToken.fromString('hi') } as any),
         };

         const result = unassigned.spaceFromSToken(SToken.fromString('hi'));

         expect(result).toEqual(expected);
      });

   });

   describe('wordFromSToken()', () => {

      it('makes an annotated text PToken with whatever it was given', () => {
         const expected: any = {
            type: UnassignedType.WORD,
            token: new text.PToken({ text: SToken.fromString('hi') } as any),
         };

         const result = unassigned.wordFromSToken(SToken.fromString('hi'));

         expect(result).toEqual(expected);
      });

   });

   describe('makeCheckCallback()', () => {
      let otherwiseSpy: jasmine.Spy;
      let foundSpy: jasmine.Spy;

      beforeEach(() => {
         otherwiseSpy = jasmine.createSpy('otherwise spy');
         foundSpy = jasmine.createSpy('found spy');
      });

      it('returns a function', () => {
         const result = unassigned.makeCheckCallback({} as any, 'foo', () => {}, () => {});

         expect(result).toBeInstanceOf(Function);
      });

      it('function calls otherwise() when no value passed to it', () => {
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback({} as any, 'foo', foundSpy, otherwiseSpy);

         func();

         expect(otherwiseSpy).toHaveBeenCalledWith();
      });

      it('function does not call found() when no value passed to it', () => {
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback({} as any, 'foo', foundSpy, otherwiseSpy);

         func();

         expect(foundSpy).not.toHaveBeenCalled();
      });

      it('function calls found() with the annotated pToken when it is called with a value', () => {
         let pToken = {};
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback(pToken as any, 'foo', foundSpy, otherwiseSpy);

         func('unassigned array' as any);

         expect(foundSpy).toHaveBeenCalledWith({
            unassigned: 'unassigned array',
            nextPropName: 'foo',
         });
      });

      it('function does not call otherwise() when a value is passed', () => {
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback({} as any, 'foo', foundSpy, otherwiseSpy);

         func('unassigned array' as any);

         expect(otherwiseSpy).not.toHaveBeenCalled();
      });

   });

   describe('getSTokens()', () => {

      it('returns STokens for a word', () => {
         const result = unassigned.getSTokens([
            unassigned.wordFromSToken(SToken.fromString('foo')),
         ]);

         expect(result).toEqual([
            SToken.fromString('foo'),
         ]);
      });

      it('skips a word with no actual text in it (type workaround)', () => {
         const badWord = unassigned.wordFromSToken(SToken.fromString('foo'));
         delete badWord.token.text;
         const result = unassigned.getSTokens([
            badWord,
         ]);

         expect(result).toEqual([]);
      });

      it('returns STokens for a space', () => {
         const result = unassigned.getSTokens([
            unassigned.spaceFromSToken(SToken.fromString(' ')),
         ]);

         expect(result).toEqual([
            SToken.fromString(' '),
         ]);
      });

      it('returns STokens for an entity reference', () => {
         const result = unassigned.getSTokens([{
            type: UnassignedType.REFERENCE,
            token: new entityReference.ParamPToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('froo'),
               close: SToken.fromString(';'),
            }),
         }]);

         expect(result).toEqual([
            SToken.fromString('&'),
            SToken.fromString('froo'),
            SToken.fromString(';'),
         ]);
      });

      it('returns STokens for an literal', () => {
         const result = unassigned.getSTokens([{
            type: UnassignedType.LITERAL,
            token: {
               openQuote: SToken.fromString('"'),
               value: [ new text.PToken({ text: SToken.fromString('froo') }) ],
               closeQuote: SToken.fromString('"'),
            },
         }]);

         expect(result).toEqual([
            SToken.fromString('"'),
            SToken.fromString('froo'),
            SToken.fromString('"'),
         ]);
      });


   });

   describe('checkExtra()', () => {

      it('adds an error with the text of all the tokens in the provided array', () => {
         const mockErrorCollector = new MockErrorCollector();
         const startSToken = SToken.fromString('one');
         startSToken.ranges.push(new Range(undefined, 0, 0, 0, 0, 0, 0));
         const extra: any = [
            unassigned.wordFromSToken(startSToken),
            unassigned.spaceFromSToken(SToken.fromString(' ')),
            {
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: SToken.fromString('"'),
                  closeQuote: SToken.fromString('"'),
               }
            },
            {
               type: UnassignedType.REFERENCE,
               token: new entityReference.ParamPToken({
                  open: SToken.fromString('%'),
                  name: SToken.fromString('fred'),
                  close: SToken.fromString(';'),
               }),
            },
         ];

         unassigned.checkExtra(extra, mockErrorCollector, WellFormedError.ID.EXTERNALID_EXTRA_TEXT);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_EXTRA_TEXT,
            params: [ 'one ""%fred;' ],
            position: startSToken,
         });
      });

   });

});
