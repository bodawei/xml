/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import entityEnd from '../entityEnd.js';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart.js';
import text from '../text';
import literal from '../common/literal.js';
import unassigned from '../unassigned';

import helper from './helper.js';

describe('unassigned (unit)', () => {

   function expectDelivery(spy, value) {
      expect(spy.calls.allArgs()).toEqual([ [ value ] ]);
   }

   describe('checkForPERef()', () => {
      let mockSource;
      let deliverySpy;
      let makeSToken;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         spyOn(unassigned, 'parseNextValue');
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
         unassigned.parseNextValue.and.callFake((_1, _2, deliver) => {
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
      let mockSource;
      let deliverySpy;
      let makeSToken;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         spyOn(literal, 'parse');
         spyOn(entityReference, 'paramParse');

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
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('"'), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith({
            type: 'literal',
            isLiteral: true,
         });
      });

      it('delivers a literal if a single quote is found', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('\''), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith({
            type: 'literal',
            isLiteral: true,
         });
      });

      it('delivers a parameter entity reference PToken if a "%" is found', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ isPeref: true });
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
         ]);

         unassigned.parseNextValue(mockSource, false, deliverySpy);
         mockSource.respondInAsyncTime();

         expect(deliverySpy).toHaveBeenCalledWith({
            isPeref: true,
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
      let mockSource;
      let deliverySpy;
      let makeSToken;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         spyOn(literal, 'parse');
         spyOn(entityReference, 'paramParse');

         makeSToken = makeSTokenMaker();
      });

      it('delivers all multiple values', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
            foundOne(true);
         });
         entityReference.paramParse.and.callFake((_1, deliver) => {
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
               type: 'literal',
               isLiteral: true,
            }, {
               isPeref: true
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
         const unassVals = [];
         const descriptors = [ {
            name: 'one',
            type: 'word',
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
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            two: space.text,
            three: word2.text,
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
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            two: space.text,
            three: word2.text,
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
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
            allowed: /one/,
         }, {
            name: 'four',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            two: space.text,
            four: word2.text,
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
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
            allowed: /one|bar/,
         }, {
            name: 'four',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            two: space.text,
            three: word2.text,
         });
      });

      it('allows for an SToken having no text when the value is "allowed"', () => {
         const pToken = {};
         const space = unassigned.spaceFromSToken(SToken.fromString('\t'));
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('BAR'));
         delete word2.text;
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
            allowed: /one|bar/,
         }, {
            name: 'four',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            two: space.text,
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
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            three: word2.text,
         });
      });

      it('adds literal values at the PToken top level if flatten is true', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const literal = {
            type: 'literal',
            openQuote: SToken.fromString('"'),
            value: [],
            closeQuote: SToken.fromString('"'),
         };
         const unVals = [ word1, literal, word2 ];
         const descriptors = [ {
            name: 'one',
            type: 'word',
         }, {
            name: 'two',
            type: 'literal',
            flatten: true,
         }, {
            name: 'three',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            three: word2.text,
            openQuote: literal.openQuote,
            value: literal.value,
            closeQuote: literal.closeQuote,
         });
      });

      it('adds literal values at the PToken in a sub-object flatten is not true', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
         const literal = {
            type: 'literal',
            openQuote: SToken.fromString('"'),
            value: [],
            closeQuote: SToken.fromString('"'),
         };
         const unVals = [ word1, literal, word2 ];
         const descriptors = [ {
            name: 'one',
            type: 'word',
         }, {
            name: 'two',
            type: 'literal',
         }, {
            name: 'three',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.text,
            two: {
               openQuote: literal.openQuote,
               value: literal.value,
               closeQuote: literal.closeQuote,
            },
            three: word2.text,
         });
      });

      it('starts midway through the descriptors if asked to', () => {
         const pToken = {};
         const word1 = unassigned.wordFromSToken(SToken.fromString('firstWord'));
         const word2 = unassigned.wordFromSToken(SToken.fromString('secondWord'));
         const space = unassigned.wordFromSToken(SToken.fromString('\t'));
         const expectedSpace = SToken.fromString('\t');
         expectedSpace.subType = 'space';
         const unVals = [ word1, space, word2 ];
         const descriptors = [ {
            name: 'one',
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, 'three', descriptors);

         expect(pToken).toEqual({
            three: word1.text,
         });
      });

      describe('space handling', () => {

         it('adds a 4.4.8 introduced space in a property with a descriptor', () => {
            const pToken = {};
            const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
            const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
            const unVals = [ word1, {
               type: entityStart.PARAM_PTYPE
            }, word2, {
               type: entityEnd.PARAM_PTYPE
            } ];
            const descriptors = [ {
               name: 'one',
               type: 'word',
            }, {
               name: 'two',
               type: 'space',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word1.text,
               two: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               three: word2.text,
            });
         });

         it('skips over a space if it is not provided', () => {
            const pToken = {};
            const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
            const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
            const unVals = [ word1, word2 ];
            const descriptors = [ {
               name: 'one',
               type: 'word',
            }, {
               name: 'two',
               type: 'space',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word1.text,
               three: word2.text,
            });
         });

         it('skips non-space descriptors when encountering an introduced space', () => {
            const pToken = {};
            const word1 = unassigned.wordFromSToken(SToken.fromString('foo'));
            const word2 = unassigned.wordFromSToken(SToken.fromString('bar'));
            const unVals = [ word1, {
               type: entityStart.PARAM_PTYPE
            }, word2, {
               type: entityEnd.PARAM_PTYPE
            } ];
            const descriptors = [ {
               name: 'one',
               type: 'word',
            }, {
               name: 'three',
               type: 'word',
            }, {
               name: 'four',
               type: 'space',
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word1.text,
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
               type: 'word',
            }, {
               name: 'two',
               type: 'space',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               two: space.text,
               three: word.text,
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
               type: 'space',
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               two: SToken.fromString(' ').merge(space.text),
            });
         });

         it('merges the combination of several introduced spaces into one space', () => {
            const pToken = {};
            const space = unassigned.spaceFromSToken(SToken.fromString(' '));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ word, {
               type: entityStart.PARAM_PTYPE
            }, {
               type: entityStart.PARAM_PTYPE
            }, {
               type: entityStart.PARAM_PTYPE
            }, {
               type: entityStart.PARAM_PTYPE
            }, space ];
            const descriptors = [ {
               name: 'one',
               type: 'word',
            }, {
               name: 'two',
               type: 'space',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: word.text,
               two: new SToken('     ', '     ', [
                  helper.makeInsertedRange(),
                  helper.makeInsertedRange(),
                  helper.makeInsertedRange(),
                  helper.makeInsertedRange()
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
               type: 'space',
            }, {
               name: 'two',
               type: 'word',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: space.text,
               two: word.text,
            });
         });

         it('merges a leading space into the previous', () => {
            const pToken = {
               one: SToken.fromString('\t'),
            };
            const space = unassigned.spaceFromSToken(SToken.fromString('\n'));
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ space, word ];
            const descriptors = [ {
               name: 'one',
               type: 'space',
            }, {
               name: 'two',
               type: 'word',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: SToken.fromString('\t\n'),
               two: word.text,
            });
         });

         it('merges a 4.4.8 introduced space into the previous', () => {
            const pToken = {
               one: SToken.fromString('\t'),
            };
            const word = unassigned.wordFromSToken(SToken.fromString('firstWord'));
            const unVals = [ {
               type: entityStart.PARAM_PTYPE
            }, word ];
            const descriptors = [ {
               name: 'one',
               type: 'space',
            }, {
               name: 'two',
               type: 'word',
            }, {
               name: 'three',
               type: 'word',
            } ];

            unassigned.assignToProps(unVals, pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: new SToken('\t ', '\t ', [ helper.makeInsertedRange() ]),
               two: word.text,
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
            type: 'word',
         }, {
            name: 'two',
            type: 'space',
         }, {
            name: 'three',
            type: 'word',
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
            type: 'word',
         } ];

         unassigned.assignToProps(unVals, pToken, 'one', descriptors);

         expect(unVals.length).toEqual(2);
      });

   });

   describe('spaceFromSToken()', () => {

      it('makes an annotated text PToken with whatever it was given', () => {
         const expected = new text.PToken({ text: 'hi' });
         expected.subType = 'space';
         const result = unassigned.spaceFromSToken('hi');

         expect(result).toEqual(expected);
      });

   });

   describe('wordFromSToken()', () => {

      it('makes an annotated text PToken with whatever it was given', () => {
         const expected = new text.PToken({ text: 'hi' });
         expected.subType = 'word';
         const result = unassigned.wordFromSToken('hi');

         expect(result).toEqual(expected);
      });

   });

   describe('makeCheckCallback()', () => {
      let otherwiseSpy;
      let foundSpy;

      beforeEach(() => {
         otherwiseSpy = jasmine.createSpy('otherwise spy');
         foundSpy = jasmine.createSpy('found spy');
      });

      it('returns a function', () => {
         const result = unassigned.makeCheckCallback({}, 'foo', () => {}, () => {});

         expect(result).toBeInstanceOf(Function);
      });

      it('function calls otherwise() when no value passed to it', () => {
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback({}, 'foo', foundSpy, otherwiseSpy);

         func();

         expect(otherwiseSpy).toHaveBeenCalledWith();
      });

      it('function does not call found() when no value passed to it', () => {
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback({}, 'foo', foundSpy, otherwiseSpy);

         func();

         expect(foundSpy).not.toHaveBeenCalled();
      });

      it('function calls found() with the annotated pToken when it is called with a value', () => {
         let pToken = {};
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback(pToken, 'foo', foundSpy, otherwiseSpy);

         func('unassigned array');

         expect(foundSpy).toHaveBeenCalledWith({
            unassigned: 'unassigned array',
            nextPropName: 'foo',
         });
      });

      it('function does not call otherwise() when a value is passed', () => {
         const otherwise = jasmine.createSpy('otherwise');
         const func = unassigned.makeCheckCallback({}, 'foo', foundSpy, otherwiseSpy);

         func('unassigned array');

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

      it('returns STokens for a space', () => {
         const result = unassigned.getSTokens([
            unassigned.spaceFromSToken(SToken.fromString(' ')),
         ]);

         expect(result).toEqual([
            SToken.fromString(' '),
         ]);
      });

      it('returns STokens for an entity reference', () => {
         const result = unassigned.getSTokens([
            new entityReference.ParamPToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('froo'),
               close: SToken.fromString(';'),
            }),
         ]);

         expect(result).toEqual([
            SToken.fromString('&'),
            SToken.fromString('froo'),
            SToken.fromString(';'),
         ]);
      });

      it('returns STokens for an literal', () => {
         const result = unassigned.getSTokens([{
            type: 'literal',
            openQuote: SToken.fromString('"'),
            value: [ new text.PToken({ text: SToken.fromString('froo') }) ],
            closeQuote: SToken.fromString('"'),
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
         const extra = [
            unassigned.wordFromSToken(startSToken),
            unassigned.spaceFromSToken(SToken.fromString(' ')),
            {
               type: 'literal',
               openQuote: SToken.fromString('"'),
               closeQuote: SToken.fromString('"'),
            },
            new entityReference.ParamPToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('fred'),
               close: SToken.fromString(';'),
            }), 
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
