/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'sToken';
import {
   NameListPToken,
   ParameterEntityReferencePToken,
   UnassignedType,
   UnassignedArray,
   wordFromSToken,
} from 'token';

import { assignNameList } from '../assignNameList';
import * as assignToProps from '../assignToProps';

describe('assignNameList() (unit)', () => {
   let assignSpy: jasmine.Spy;

   beforeEach(() => {
      assignSpy = spyOn(assignToProps, 'assignToProps');
   });

   it('does nothing if there is no unassigned array', () => {
      const pToken: NameListPToken = new NameListPToken();

      expect(() => assignNameList(pToken, [])).not.toThrow();
   });

   it('does nothing if there is still an unexpanded parameter entity reference', () => {
      const pToken: NameListPToken = new NameListPToken();

      assignNameList(pToken, [
         {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({ open: SToken.fromString('%') }),
         },
      ]);

      expect(assignSpy).not.toHaveBeenCalled();
   });

   it('calls assignToProps() with the opening of the list open descriptors', () => {
      const pToken: NameListPToken = new NameListPToken();

      assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

      expect(assignSpy).toHaveBeenCalledWith(
         [{ type: UnassignedType.LITERAL, token: { value: [] } }],
         pToken,
         'open',
         [
            { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
            { name: 'postOpenSpace', type: UnassignedType.SPACE },
         ],
      );
   });

   it('calls assignToProps() with the closing of the list open descriptors', () => {
      const pToken: NameListPToken = new NameListPToken();

      assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

      expect(assignSpy).toHaveBeenCalledWith(
         [{ type: UnassignedType.LITERAL, token: { value: [] } }],
         pToken,
         'close',
         [
            { name: 'close', type: UnassignedType.WORD, allowed: /\)/ },
            { name: 'postCloseSpace', type: UnassignedType.SPACE },
            { name: 'repeat', type: UnassignedType.WORD, allowed: /[*+?]/ },
            { name: 'postRepeatSpace', type: UnassignedType.SPACE },
         ],
      );
   });

   it('calls assignToProps() with the name PToken descriptors if a name is found', () => {
      const pToken: NameListPToken = new NameListPToken();
      assignSpy.and.callFake(
         (unValues: UnassignedArray, pToken: NameListPToken, propName: string) => {
            if (propName === 'delimiter') {
               unValues.pop();
            }
         },
      );

      assignNameList(pToken, [wordFromSToken(toSToken('x'))]);

      expect(assignSpy).toHaveBeenCalledWith([], {}, 'name', [
         { name: 'name', type: UnassignedType.WORD, allowed: /[^)|,*+?]/ },
         { name: 'postNameSpace', type: UnassignedType.SPACE },
         { name: 'repeat', type: UnassignedType.WORD, allowed: /[*+?]/ },
         { name: 'postRepeatSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('calls assignToProps() with the delimiter descriptors if a name is found', () => {
      const pToken: NameListPToken = new NameListPToken();
      assignSpy.and.callFake(
         (unValues: UnassignedArray, pToken: NameListPToken, propName: string) => {
            if (propName === 'delimiter') {
               unValues.pop();
            }
         },
      );

      assignNameList(pToken, [wordFromSToken(toSToken('x'))]);

      expect(assignSpy).toHaveBeenCalledWith(
         [], // the value in the jasmine store is modified
         { particle: {} },
         'delimiter',
         [
            { name: 'delimiter', type: UnassignedType.WORD, allowed: /[|,]/ },
            { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
         ],
      );
   });

   it('calls assignToProps() for sub-lists', () => {
      const pToken: NameListPToken = new NameListPToken();
      pToken.open = SToken.fromString('distinguisher');
      assignSpy.and.callFake(
         (unValues: UnassignedArray, pToken: NameListPToken, propName: string) => {
            if (propName === 'open' || propName === 'postOpenSpace') {
               unValues.shift();
            }
         },
      );

      assignNameList(pToken, [wordFromSToken(toSToken('foo')), wordFromSToken(toSToken('('))]);

      expect(assignSpy).toHaveBeenCalledWith([], new NameListPToken(), 'open', [
         { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
         { name: 'postOpenSpace', type: UnassignedType.SPACE },
      ]);
   });

   it('abandons looking for names if the end of the list is found', () => {
      const pToken: NameListPToken = new NameListPToken();

      assignNameList(pToken, [wordFromSToken(toSToken(')'))]);

      expect(assignSpy.calls.count()).toEqual(2);
   });

   describe('partial list', () => {
      it('calls assignToProps() with full opening parameters if "(" was NOT found', () => {
         const pToken: NameListPToken = new NameListPToken();

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(2);
         expect(assignSpy).toHaveBeenCalledWith(
            [{ type: UnassignedType.LITERAL, token: { value: [] } }],
            pToken,
            'open',
            [
               { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
               { name: 'postOpenSpace', type: UnassignedType.SPACE },
            ],
         );
      });

      it('calls assignToProps() with opening parameters if "(" was found, but no names', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(2);
         expect(assignSpy).toHaveBeenCalledWith(
            [{ type: UnassignedType.LITERAL, token: { value: [] } }],
            pToken,
            'postOpenSpace',
            [{ name: 'postOpenSpace', type: UnassignedType.SPACE }],
         );
      });

      it('calls assignToProps() with closing parameters if ")" was NOT found', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({});

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(3);
         expect(assignSpy).toHaveBeenCalledWith(
            [{ type: UnassignedType.LITERAL, token: { value: [] } }],
            pToken,
            'close',
            [
               { name: 'close', type: UnassignedType.WORD, allowed: /\)/ },
               { name: 'postCloseSpace', type: UnassignedType.SPACE },
               { name: 'repeat', type: UnassignedType.WORD, allowed: /[*+?]/ },
               { name: 'postRepeatSpace', type: UnassignedType.SPACE },
            ],
         );
      });

      it('calls assignToProps() with the subset of closing parameters if ")" was found', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({});
         pToken.close = SToken.fromString(')');

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(1);
         expect(assignSpy).toHaveBeenCalledWith(
            [{ type: UnassignedType.LITERAL, token: { value: [] } }],
            pToken,
            'repeat',
            [
               { name: 'postCloseSpace', type: UnassignedType.SPACE },
               { name: 'repeat', type: UnassignedType.WORD, allowed: /[*+?]/ },
               { name: 'postRepeatSpace', type: UnassignedType.SPACE },
            ],
         );
      });

      it('calls assignToProps() with the trailing space, if nothing else', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({});
         pToken.close = SToken.fromString(')');
         pToken.repeat = SToken.fromString('*');

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(1);
         expect(assignSpy).toHaveBeenCalledWith(
            [{ type: UnassignedType.LITERAL, token: { value: [] } }],
            pToken,
            'postRepeatSpace',
            [{ name: 'postRepeatSpace', type: UnassignedType.SPACE }],
         );
      });

      it('calls assignToProps() with delimiter space if there is a delimtier', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({
            delimiter: SToken.fromString('|'),
         });

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(2);
         expect(assignSpy).toHaveBeenCalledWith(
            [{ type: UnassignedType.LITERAL, token: { value: [] } }],
            {
               delimiter: SToken.fromString('|'),
            },
            'postDelimiterSpace',
            [{ name: 'postDelimiterSpace', type: UnassignedType.SPACE }],
         );
      });

      it('calls assignToProps() with both open list and delimiter', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({
            particle: new NameListPToken(),
         });

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(4);
         expect(assignSpy).toHaveBeenCalledWith(
            [
               {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               },
            ],
            new NameListPToken(),
            'open',
            [
               { name: 'open', type: UnassignedType.WORD, allowed: /\(/ },
               { name: 'postOpenSpace', type: UnassignedType.SPACE },
            ],
         );
         expect(assignSpy).toHaveBeenCalledWith(
            [
               {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               },
            ],
            {
               particle: new NameListPToken(),
            },
            'delimiter',
            [
               { name: 'delimiter', type: UnassignedType.WORD, allowed: /[|,]/ },
               { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
            ],
         );
      });

      it('calls assignToProps() with delimiter if the name is otherwise complete', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({
            particle: {
               name: SToken.fromString('name'),
               repeat: SToken.fromString('repeat'),
            },
         });

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(3);
         expect(assignSpy).toHaveBeenCalledWith(
            [
               {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               },
            ],
            {
               particle: {
                  name: SToken.fromString('name'),
                  repeat: SToken.fromString('repeat'),
               },
            },
            'delimiter',
            [
               { name: 'delimiter', type: UnassignedType.WORD, allowed: /[|,]/ },
               { name: 'postDelimiterSpace', type: UnassignedType.SPACE },
            ],
         );
      });

      it('calls assignToProps() with terminal space if name is complete', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({
            particle: {
               name: SToken.fromString('name'),
               repeat: SToken.fromString('repeat'),
            },
         });

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledTimes(3);
         expect(assignSpy).toHaveBeenCalledWith(
            [
               {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               },
            ],
            {
               name: SToken.fromString('name'),
               repeat: SToken.fromString('repeat'),
            },
            'postRepeatSpace',
            [{ name: 'postRepeatSpace', type: UnassignedType.SPACE }],
         );
      });

      it('calls assignToProps() with a particle if none is provided', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({});

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledWith(
            [
               {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               },
            ],
            {},
            'name',
            [
               { name: 'name', type: UnassignedType.WORD, allowed: /[^)|,*+?]/ },
               { name: 'postNameSpace', type: UnassignedType.SPACE },
               { name: 'repeat', type: UnassignedType.WORD, allowed: /[*+?]/ },
               { name: 'postRepeatSpace', type: UnassignedType.SPACE },
            ],
         );
      });

      it('calls assignToProps() with a particle with a name', () => {
         const pToken: NameListPToken = new NameListPToken();

         pToken.open = SToken.fromString('(');
         pToken.names.push({
            particle: {
               name: SToken.fromString('name'),
            },
         });

         assignNameList(pToken, [{ type: UnassignedType.LITERAL, token: { value: [] } }]);

         expect(assignSpy).toHaveBeenCalledWith(
            [
               {
                  type: UnassignedType.LITERAL,
                  token: { value: [] },
               },
            ],
            {
               name: SToken.fromString('name'),
            },
            'repeat',
            [
               { name: 'postNameSpace', type: UnassignedType.SPACE },
               { name: 'repeat', type: UnassignedType.WORD, allowed: /[*+?]/ },
               { name: 'postRepeatSpace', type: UnassignedType.SPACE },
            ],
         );
      });
   });
});
