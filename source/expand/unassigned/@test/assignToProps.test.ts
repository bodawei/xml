import {
   ParameterEntityReferencePToken,
   UnassignedArray,
   UnassignedType,
   spaceFromSToken,
   wordFromSToken,
} from 'token';

import { assignToProps } from '../assignToProps';
import { toSToken, SToken } from 'sToken';
import { EntityLocation, Range } from 'basic';

import helper from '../../../token/@test/helper';

describe('assignToProps()', () => {
   it('does nothing if there is no unassigned items', () => {
      const pToken = {};
      const unassVals: UnassignedArray = [];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unassVals.slice(0), pToken, 'one', descriptors);

      expect(pToken).toEqual({});
   });

   it('fills in the pToken with the expected properties starting with leftOff', () => {
      const pToken = {};
      const space = spaceFromSToken(toSToken('\t'));
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'one', descriptors);

      expect(pToken).toEqual({
         one: word1.token.text,
         two: space.token.text,
         three: word2.token.text,
      });
   });

   it('fills in the pToken with the expected properties from the first if no leftOff', () => {
      const pToken = {};
      const space = spaceFromSToken(toSToken('\t'));
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, undefined, descriptors);

      expect(pToken).toEqual({
         one: word1.token.text,
         two: space.token.text,
         three: word2.token.text,
      });
   });

   it('skips a descriptor if a value does not match the "allowed" values', () => {
      const pToken = {};
      const space = spaceFromSToken(toSToken('\t'));
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
            allowed: /one/,
         },
         {
            name: 'four',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, undefined, descriptors);

      expect(pToken).toEqual({
         one: word1.token.text,
         two: space.token.text,
         four: word2.token.text,
      });
   });

   it('allows a descriptor if a value case-insensitively matches one of the "allowed"', () => {
      const pToken = {};
      const space = spaceFromSToken(toSToken('\t'));
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('BAR'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
            allowed: /one|bar/,
         },
         {
            name: 'four',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, undefined, descriptors);

      expect(pToken).toEqual({
         one: word1.token.text,
         two: space.token.text,
         three: word2.token.text,
      });
   });

   it('skips descriptor if there is no matching unassigned item', () => {
      const pToken = {};
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const unVals = [word1, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'one', descriptors);

      expect(pToken).toEqual({
         one: word1.token.text,
         three: word2.token.text,
      });
   });

   it('adds literal values at the PToken top level if flatten is true', () => {
      const pToken = {};
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const literal: any = {
         type: UnassignedType.LITERAL,
         token: {
            openQuote: toSToken('"'),
            value: [],
            closeQuote: toSToken('"'),
         },
      };
      const unVals: UnassignedArray = [word1, literal, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.LITERAL,
            flatten: true,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'one', descriptors);

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
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const literal: any = {
         type: UnassignedType.LITERAL,
         token: {
            openQuote: toSToken('"'),
            value: [],
            closeQuote: toSToken('"'),
         },
      };
      const unVals: UnassignedArray = [word1, literal, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.LITERAL,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'one', descriptors);

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
      const word1 = wordFromSToken(toSToken('firstWord'));
      const word2 = wordFromSToken(toSToken('secondWord'));
      const space = wordFromSToken(toSToken('\t'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'three', descriptors);

      expect(pToken).toEqual({
         three: word1.token.text,
      });
   });

   describe('space handling', () => {
      it('adds a 4.4.8 introduced space in a property with a descriptor', () => {
         const pToken = {};
         const word1 = wordFromSToken(toSToken('foo'));
         const word2 = wordFromSToken(toSToken('bar'));
         const unVals: UnassignedArray = [
            word1,
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            word2,
            {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
         ];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.WORD,
            },
            {
               name: 'two',
               type: UnassignedType.SPACE,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            two: new SToken(' ', ' ', [helper.makeInsertedRange()]),
            three: word2.token.text,
         });
      });

      it('skips over a space if it is not provided', () => {
         const pToken = {};
         const word1 = wordFromSToken(toSToken('foo'));
         const word2 = wordFromSToken(toSToken('bar'));
         const unVals = [word1, word2];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.WORD,
            },
            {
               name: 'two',
               type: UnassignedType.SPACE,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            three: word2.token.text,
         });
      });

      it('skips non-space descriptors when encountering an introduced space', () => {
         const pToken = {};
         const word1 = wordFromSToken(toSToken('foo'));
         const word2 = wordFromSToken(toSToken('bar'));
         const unVals: UnassignedArray = [
            word1,
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            word2,
            {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
         ];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.WORD,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
            {
               name: 'four',
               type: UnassignedType.SPACE,
            },
         ];

         assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            one: word1.token.text,
            four: new SToken(' ', ' ', [helper.makeInsertedRange()]),
         });
      });

      it('puts a leading space into the next available space', () => {
         const pToken = {};
         const space = spaceFromSToken(toSToken(' '));
         const word = wordFromSToken(toSToken('firstWord'));
         const unVals = [space, word];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.WORD,
            },
            {
               name: 'two',
               type: UnassignedType.SPACE,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'one', descriptors);

         expect(pToken).toEqual({
            two: space.token.text,
            three: word.token.text,
         });
      });

      it('merges a leading space into the next available space, if it matches the left off property', () => {
         const pToken = {
            two: toSToken(' '),
         };
         const space = spaceFromSToken(toSToken(' '));
         const word = wordFromSToken(toSToken('firstWord'));
         const unVals = [space, word];
         const descriptors = [
            {
               name: 'two',
               type: UnassignedType.SPACE,
            },
         ];

         assignToProps(unVals, pToken, 'two', descriptors);

         expect(pToken).toEqual({
            two: toSToken(' ').merge(space.token.text as SToken),
         });
      });

      it('merges the combination of several introduced spaces into one space', () => {
         const pToken = {};
         const space = spaceFromSToken(new SToken(' ', ' ', [new Range(new EntityLocation())]));
         const word = wordFromSToken(toSToken('firstWord'));
         const unVals: UnassignedArray = [
            word,
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            space,
         ];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.WORD,
            },
            {
               name: 'two',
               type: UnassignedType.SPACE,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'one', descriptors);

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
         const space = spaceFromSToken(toSToken('\n'));
         const word = wordFromSToken(toSToken('firstWord'));
         const unVals = [space, word];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.SPACE,
            },
            {
               name: 'two',
               type: UnassignedType.WORD,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'two', descriptors);

         expect(pToken).toEqual({
            one: space.token.text,
            two: word.token.text,
         });
      });

      it('merges a leading space into the previous', () => {
         const pToken: any = {
            one: toSToken('\t'),
         };
         const space = spaceFromSToken(toSToken('\n'));
         const word = wordFromSToken(toSToken('firstWord'));
         const unVals = [space, word];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.SPACE,
            },
            {
               name: 'two',
               type: UnassignedType.WORD,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'two', descriptors);

         expect(pToken).toEqual({
            one: toSToken('\t\n'),
            two: word.token.text,
         });
      });

      it('merges a 4.4.8 introduced space into the previous', () => {
         const pToken: any = {
            one: new SToken('\t', '\t', new Range(new EntityLocation())),
         };
         const word = wordFromSToken(toSToken('firstWord'));
         const unVals: UnassignedArray = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
            word,
         ];
         const descriptors = [
            {
               name: 'one',
               type: UnassignedType.SPACE,
            },
            {
               name: 'two',
               type: UnassignedType.WORD,
            },
            {
               name: 'three',
               type: UnassignedType.WORD,
            },
         ];

         assignToProps(unVals, pToken, 'two', descriptors);

         expect(pToken).toEqual({
            one: new SToken('\t ', '\t ', [
               new Range(new EntityLocation()),
               helper.makeInsertedRange(),
            ]),
            two: word.token.text,
         });
      });
   });

   it('empties the unassigned array of the consumed values', () => {
      const pToken = {};
      const space = spaceFromSToken(toSToken(' '));
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
         {
            name: 'two',
            type: UnassignedType.SPACE,
         },
         {
            name: 'three',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'one', descriptors);

      expect(unVals.length).toEqual(0);
   });

   it('it leaves values in the unassigned array if they are not consumed', () => {
      const pToken = {};
      const space = spaceFromSToken(toSToken('\t'));
      const word1 = wordFromSToken(toSToken('foo'));
      const word2 = wordFromSToken(toSToken('bar'));
      const unVals = [word1, space, word2];
      const descriptors = [
         {
            name: 'one',
            type: UnassignedType.WORD,
         },
      ];

      assignToProps(unVals, pToken, 'one', descriptors);

      expect(unVals.length).toEqual(2);
   });
});
