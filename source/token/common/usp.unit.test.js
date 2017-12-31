/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/test';

import entityReference from '../entityReference.js';

import literal from './literal.js';
import * as usp from './usp.js';

describe('usp (unit)', () => {

   function expectDelivery(spy, value) {
      expect(spy.calls.allArgs()).toEqual([ [ value ] ]);
   }

   describe('parse()', () => {
      let mockSource;
      let deliverySpy;
      let makeSToken;

      beforeEach(() => {
         deliverySpy = jasmine.createSpy('callbackSpy');
         spyOn(literal, 'parse');
         spyOn(entityReference, 'paramParse');

         makeSToken = makeSTokenMaker();
      });

      it('returns an empty array if the input is empty', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, []);
      });

      it('returns a space SToken if that is found first', () => {
         mockSource = new MockSTokenSource([
            [ '   ', 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'space',
            space: makeSToken('   '),
         } ]);
      });

      it('returns nothing if a ">" is found', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('>'), 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, []);
      });

      it('returns a literal if a double quote is entcountered', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('"'), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'literal',
            isLiteral: true,
         } ]);
      });

      it('returns a literal if a single quote is entcountered', () => {
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('\''), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'literal',
            isLiteral: true,
         } ]);
      });

      it('returns a parameter entity reference PToken if a "%" is found', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ isPeref: true });
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            isPeref: true,
         } ]);
      });

      it('returns an SToken if some other character encoutnered', () => {
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('x'), 'peekChar' ],
            [ 'xyzzy', 'word', [ '>', '"', '\'', '%' ] ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'word',
            word: makeSToken('xyzzy'),
         } ]);
      });

      it('returns multiple values when presented with all', () => {
         entityReference.paramParse.and.callFake((_1, deliver) => {
            deliver({ peRef: true });
         });
         literal.parse.and.callFake((_1, container, foundOne) => {
            container.pToken.isLiteral = true;
            foundOne(true);
         });
         mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('t'), 'peekChar' ],
            [ 'testWord', 'word' ],
            [ undefined, 'space' ],
            [ MockSTokenSource.PEEK('%'), 'peekChar' ],
            [ ' ', 'space' ],
            [ MockSTokenSource.PEEK('\''), 'peekChar' ],
            [ undefined, 'space' ],
            [ undefined, 'peekChar' ],
         ]);

         usp.parse(mockSource, {}, deliverySpy);
         mockSource.respondInAsyncTime();

         expectDelivery(deliverySpy, [ {
            type: 'word',
            word: makeSToken('testWord'),
         }, {
            peRef: true,
         }, {
            type: 'space',
            space: makeSToken(' '),
         }, {
            type: 'literal',
            isLiteral: true,
         } ]);
      });
   });

   describe('assignToProps()', () => {

      it('does nothing if there is no unassigned items', () => {
         const pToken = {};
         const unassigned = [];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         } ];

         usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

         expect(pToken).toEqual({});
      });

      it('fills in the pToken with the expected properties starting with leftOff', () => {
         const pToken = {};
         const unassigned = [ {
            type: 'word',
            word: SToken.fromString('foo'),
         }, {
            type: 'space',
            space: SToken.fromString('\t'),
         }, {
            type: 'word',
            word: SToken.fromString('bar'),
         } ];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         }, {
            id: 'two',
            type: 'space',
         }, {
            id: 'three',
            type: 'word',
         } ];

         usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: unassigned[0].word,
            two: unassigned[1].space,
            three: unassigned[2].word,
         });
      });

      it('fills in the pToken with the expected properties from the first if no leftOff', () => {
         const pToken = {};
         const unassigned = [ {
            type: 'word',
            word: SToken.fromString('foo'),
         }, {
            type: 'space',
            space: SToken.fromString('\t'),
         }, {
            type: 'word',
            word: SToken.fromString('bar'),
         } ];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         }, {
            id: 'two',
            type: 'space',
         }, {
            id: 'three',
            type: 'word',
         } ];

         usp.assignToProps(unassigned.slice(0), pToken, undefined, descriptors);

         expect(pToken).toEqual({
            one: unassigned[0].word,
            two: unassigned[1].space,
            three: unassigned[2].word,
         });
      });

      it('skips descriptor if there is no matching unassigned item', () => {
         const pToken = {};
         const unassigned = [ {
            type: 'word',
            word: SToken.fromString('foo'),
         }, {
            type: 'word',
            word: SToken.fromString('bar'),
         } ];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         }, {
            id: 'two',
            type: 'space',
         }, {
            id: 'three',
            type: 'word',
         } ];

         usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: unassigned[0].word,
            three: unassigned[1].word,
         });
      });

      it('starts midway through the descriptors if asked to', () => {
         const pToken = {};
         const unassigned = [ {
            type: 'word',
            word: SToken.fromString('firstWord'),
         }, {
            type: 'space',
            space: SToken.fromString('\t'),
         }, {
            type: 'word',
            word: SToken.fromString('secondWord'),
         } ];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         }, {
            id: 'two',
            type: 'space',
         }, {
            id: 'three',
            type: 'word',
         } ];

         usp.assignToProps(unassigned.slice(0), pToken, 'three', descriptors);

         expect(pToken).toEqual({
            three: unassigned[0].word,
         });
      });

      describe('space handling', () => {

         it('does not add an optional space if the described space is not required', () => {
            const pToken = {};
            const unassigned = [ {
               type: 'word',
               word: SToken.fromString('foo'),
            }, {
               type: 'pestart',
            }, {
               type: 'word',
               word: SToken.fromString('bar'),
            }, {
               type: 'peend',
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'word',
            }, {
               id: 'two',
               type: 'space',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: unassigned[0].word,
               three: unassigned[2].word,
            });
         });

         it('adds an optional space if the described space is required', () => {
            const pToken = {};
            const unassigned = [ {
               type: 'word',
               word: SToken.fromString('foo'),
            }, {
               type: 'pestart',
            }, {
               type: 'word',
               word: SToken.fromString('bar'),
            }, {
               type: 'peend',
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'word',
            }, {
               id: 'two',
               type: 'space',
               required: true,
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: unassigned[0].word,
               two: SToken.fromString(' '),
               three: unassigned[2].word,
            });
         });

         it('ignores optional spaces when there is no space to add them', () => {
            const pToken = {};
            const unassigned = [ {
               type: 'word',
               word: SToken.fromString('foo'),
            }, {
               type: 'pestart',
            }, {
               type: 'word',
               word: SToken.fromString('bar'),
            }, {
               type: 'peend',
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'word',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: unassigned[0].word,
               three: unassigned[2].word,
            });
         });

         it('ignores initial space if it is optional and leftOff is not a space', () => {
            const pToken = {};
            const unassigned = [ {
               type: 'pestart',
            }, {
               type: 'word',
               word: SToken.fromString('firstWord'),
            }, {
               type: 'peend',
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'word',
            }, {
               id: 'two',
               type: 'space',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

            expect(pToken).toEqual({
               one: unassigned[1].word,
            });
         });

         it('puts a leading leftover space into the next available space if it is not optional and no previous', () => {
            const pToken = {};
            const unassigned = [ {
               type: 'space',
               space: SToken.fromString(' '),
            }, {
               type: 'word',
               word: SToken.fromString('firstWord'),
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'word',
            }, {
               id: 'two',
               type: 'space',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'one', descriptors);

            expect(pToken).toEqual({
               two: unassigned[0].space,
               three: unassigned[1].word,
            });
         });

         it('puts a leading leftover space into the previous if it is there', () => {
            const pToken = {};
            const unassigned = [ {
               type: 'space',
               space: SToken.fromString(' '),
            }, {
               type: 'word',
               word: SToken.fromString('firstWord'),
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'space',
            }, {
               id: 'two',
               type: 'word',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: unassigned[0].space,
               two: unassigned[1].word,
            });
         });

         it('merges a leading leftover space into the previous if it is there', () => {
            const pToken = {
               one: SToken.fromString('\t'),
            };
            const unassigned = [ {
               type: 'space',
               space: SToken.fromString('\n'),
            }, {
               type: 'word',
               word: SToken.fromString('firstWord'),
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'space',
            }, {
               id: 'two',
               type: 'word',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: SToken.fromString('\t\n'),
               two: unassigned[1].word,
            });
         });

         it('does not merge a leading space into the previous if the leading is optional', () => {
            const pToken = {
               one: SToken.fromString('\t'),
            };
            const unassigned = [ {
               type: 'pestart',
            }, {
               type: 'word',
               word: SToken.fromString('firstWord'),
            } ];
            const descriptors = [ {
               id: 'one',
               type: 'space',
            }, {
               id: 'two',
               type: 'word',
            }, {
               id: 'three',
               type: 'word',
            } ];

            usp.assignToProps(unassigned.slice(0), pToken, 'two', descriptors);

            expect(pToken).toEqual({
               one: SToken.fromString('\t'),
               two: unassigned[1].word,
            });
         });

      });

      it('empties the unassigned array of the consumed values', () => {
         const pToken = {};
         const unassigned = [ {
            type: 'word',
            word: SToken.fromString('foo'),
         }, {
            type: 'space',
            space: SToken.fromString('\t'),
         }, {
            type: 'word',
            word: SToken.fromString('bar'),
         } ];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         }, {
            id: 'two',
            type: 'space',
         }, {
            id: 'three',
            type: 'word',
         } ];

         usp.assignToProps(unassigned, pToken, 'one', descriptors);

         expect(unassigned.length).toEqual(0);
      });

      it('it leaves values in the unassigned array if they are not consumed', () => {
         const pToken = {};
         const unassigned = [ {
            type: 'word',
            word: SToken.fromString('foo'),
         }, {
            type: 'space',
            space: SToken.fromString('\t'),
         }, {
            type: 'word',
            word: SToken.fromString('bar'),
         } ];
         const descriptors = [ {
            id: 'one',
            type: 'word',
         } ];

         usp.assignToProps(unassigned, pToken, 'one', descriptors);

         expect(unassigned.length).toEqual(2);
      });

   });

});
