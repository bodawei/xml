/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { toSToken } from 'sToken';
import {
   UnassignedArray,
   WordListPToken,
   WordListType,
   ParameterEntityReferencePToken,
   UnassignedType,
   TextPToken,
} from 'token';

import * as assignToProps from '../assignToProps';
import { assignWordList } from '../assignWordList';

describe('assignWordList() (unit)', () => {
   let assignSpy: jasmine.Spy;
   let wlPToken: WordListPToken;
   let unValues: UnassignedArray;

   beforeEach(() => {
      assignSpy = spyOn(assignToProps, 'assignToProps');
      assignSpy.and.callFake((unValues: Array<any>) => {
         unValues.pop();
      });
      unValues = [
         {
            type: UnassignedType.WORD,
            token: new TextPToken({ text: toSToken('foo') }),
         },
      ];

      wlPToken = new WordListPToken(WordListType.NOTATION, {
         open: toSToken('('),
         openSpace: toSToken(' '),
         words: [
            {
               word: toSToken('one'),
               wordSpace: toSToken(' '),
               connector: toSToken('|'),
               connectorSpace: toSToken(' '),
            },
            {
               word: toSToken('two'),
               wordSpace: undefined,
               connector: undefined,
               connectorSpace: undefined,
            },
         ],
         close: toSToken(')'),
         closeSpace: undefined,
      });
   });

   it('does nothing if there is no unassigned array', () => {
      expect(() => assignWordList([], wlPToken)).not.toThrow();
   });

   it('does nothing if there is still an unexpanded parameter entity reference', () => {
      assignWordList(
         [
            {
               type: UnassignedType.REFERENCE,
               token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            },
         ],
         wlPToken,
      );

      expect(assignSpy).not.toHaveBeenCalled();
   });

   it('calls assignToProps() with the opening of the list open descriptors', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         openSpace: undefined,
         words: [],
         close: undefined,
      });
      (wlPToken as any).open = undefined;

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken, 'open', [
         { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
         { name: 'openSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('does no assignment if the first unassigned value is a literal', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });
      unValues[0].type = UnassignedType.LITERAL;

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'wordSpace', [
         { name: 'wordSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('does no assignment of words if the first unassigned value is a ")"', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });
      (unValues[0].token as any).text = '(';

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'wordSpace', [
         { name: 'wordSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() without the opening of the list open descriptors', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         openSpace: undefined,
         words: [],
         close: undefined,
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken, 'openSpace', [
         { name: 'openSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() without the closing of the list open descriptors', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [],
         close: undefined,
         closeSpace: undefined,
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken, 'close', [
         { name: 'close', type: UnassignedType.WORD, allowed: /\)/ },
         { name: 'closeSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the closing of the list open descriptors', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [],
         closeSpace: undefined,
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken, 'closeSpace', [
         { name: 'closeSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the previous space position when no words', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [],
         close: undefined,
         closeSpace: undefined,
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken, 'openSpace', [
         { name: 'openSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the space in the previous word when doing a new word', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });
      // insert a second item which, in this mocked case, will loop around to a default new word
      unValues.push({
         type: UnassignedType.WORD,
         token: new TextPToken({ text: toSToken('foo') }),
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'wordSpace', [
         { name: 'wordSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the connector in the previous word when doing a new word', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });
      (wlPToken.words[1] as any).connector = toSToken('|');
      // insert a second item which, in this mocked case, will loop around to a default new word
      unValues.push({
         type: UnassignedType.WORD,
         token: new TextPToken({ text: toSToken('foo') }),
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'connectorSpace', [
         { name: 'connectorSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the properties to fill a word when no words present', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         words: [],
         close: undefined,
         closeSpace: undefined,
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(
         unValues,
         {
            word: undefined,
            wordSpace: undefined,
            connector: undefined,
            connectorSpace: undefined,
         },
         'word',
         [
            { name: 'word', type: UnassignedType.WORD, allowed: /[^)|]/ },
            { name: 'wordSpace', type: UnassignedType.SPACE },
            { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
            { name: 'connectorSpace', type: UnassignedType.SPACE },
         ],
      );
   });

   it('calls assignToProps() with the properties to fill a word when the previous word has all but a space', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });
      (wlPToken as any).words[1].wordSpace = toSToken(' ');
      (wlPToken as any).words[1].connector = toSToken('|');

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'connectorSpace', [
         // { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
         // { name: 'wordSpace', type: UnassignedType.SPACE },
         // { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
         { name: 'connectorSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the properties to fill a word when the previous word has no connector', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });
      (wlPToken as any).words[1].wordSpace = toSToken(' ');

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'connector', [
         // { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
         // { name: 'wordSpace', type: UnassignedType.SPACE },
         { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
         { name: 'connectorSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the properties to fill a word when the previous has only the word', () => {
      wlPToken = new WordListPToken(WordListType.NOTATION, wlPToken, {
         close: undefined,
         closeSpace: undefined,
      });

      assignWordList(unValues, wlPToken);

      expect(assignSpy).toHaveBeenCalledWith(unValues, wlPToken.words[1], 'wordSpace', [
         // { name: 'word', type: UnassignedType.WORD, allowed: /[^\)\|]/ },
         { name: 'wordSpace', type: UnassignedType.SPACE },
         { name: 'connector', type: UnassignedType.WORD, allowed: /\|/ },
         { name: 'connectorSpace', type: UnassignedType.SPACE },
      ]);
   });
});
