import { ContentModelP } from 'pToken';
import { toSToken } from 'sToken';

import { ContentModelX, CpRepeat, CpType } from '../ContentModelX';

describe('ContentModelX()', () => {
   let contentModelP: ContentModelP;

   beforeEach(() => {
      contentModelP = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         particles: [
            {
               particle: {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  repeat: toSToken('*'),
                  repeatSpace: toSToken(' '),
               },
               delimiter: toSToken('|'),
               delimiterSpace: toSToken(' '),
            },
            {
               particle: {
                  name: toSToken('two'),
                  repeat: undefined,
                  repeatSpace: undefined,
                  nameSpace: undefined,
               },
               delimiter: undefined,
               delimiterSpace: undefined,
            },
         ],
         close: toSToken(')'),
         closeSpace: undefined,
         repeat: undefined,
         repeatSpace: undefined,
      });
   });

   it('returns the particles', () => {
      const contentModel = new ContentModelX(contentModelP);

      expect(contentModel).toEqual({
         particles: [
            {
               name: 'one',
               repeat: CpRepeat.ZEROPLUS,
            },
            {
               name: 'two',
               repeat: CpRepeat.ONE,
            },
         ],
         listType: CpType.CHOICE,
         repeat: CpRepeat.ONE,
      });
   });

   it('returns a result if no entries', () => {
      contentModelP = new ContentModelP({
         particles: [],
      });
      const contentModel = new ContentModelX(contentModelP);

      expect(contentModel).toEqual({
         particles: [],
         listType: CpType.CHOICE,
         repeat: CpRepeat.ONE,
      });
   });

   it('adds an entry with a blank name if no name', () => {
      contentModelP = new ContentModelP({
         particles: [
            {
               particle: {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  repeat: toSToken('*'),
                  repeatSpace: toSToken(' '),
               },
               delimiter: toSToken('|'),
               delimiterSpace: toSToken(' '),
            },
            {
               particle: {
                  name: undefined,
               },
            },
         ],
      });

      const contentModel = new ContentModelX(contentModelP);

      expect(contentModel).toEqual({
         particles: [
            {
               name: 'one',
               repeat: CpRepeat.ZEROPLUS,
            },
            {
               name: '',
               repeat: CpRepeat.ONE,
            },
         ],
         listType: CpType.CHOICE,
         repeat: CpRepeat.ONE,
      });
   });

   it('silently ignores entries without particles', () => {
      contentModelP = new ContentModelP({
         particles: [
            {
               particle: {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  repeat: toSToken('*'),
                  repeatSpace: undefined,
               },
               delimiter: toSToken('|'),
               delimiterSpace: toSToken(' '),
            },
            {
               particle: undefined,
            },
         ],
      });

      const contentModel = new ContentModelX(contentModelP);

      expect(contentModel).toEqual({
         particles: [
            {
               name: 'one',
               repeat: CpRepeat.ZEROPLUS,
            },
         ],
         listType: CpType.CHOICE,
         repeat: CpRepeat.ONE,
      });
   });

   it('silently ignores the absence of delimiters', () => {
      const contentModel = new ContentModelX(contentModelP);

      expect(contentModel).toEqual({
         particles: [
            {
               name: 'one',
               repeat: CpRepeat.ZEROPLUS,
            },
            {
               name: 'two',
               repeat: CpRepeat.ONE,
            },
         ],
         listType: CpType.CHOICE,
         repeat: CpRepeat.ONE,
      });
   });

   describe('listType', () => {
      it('sets a SEQUENCE list type using the first delimiter', () => {
         contentModelP = new ContentModelP({
            particles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: undefined,
                  },
                  delimiter: toSToken(','),
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {
                     name: toSToken('two'),
                  },
               },
            ],
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.SEQUENCE,
            repeat: CpRepeat.ONE,
         });
      });

      it('sets a CHOICE list type using the first delimiter', () => {
         contentModelP = new ContentModelP({
            particles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: undefined,
                  },
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {
                     name: toSToken('two'),
                  },
               },
            ],
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });
      });
   });

   describe('repeat', () => {
      it('sets a repeat type of "ONE" if nothing specified on input', () => {
         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });
      });

      it('sets a repeat type of "ONE" if a junk repeat is found', () => {
         contentModelP = new ContentModelP(contentModelP, {
            repeat: toSToken('x'),
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });
      });

      it('sets a repeat type of "ZEROPLUS" if "*" repeat is found', () => {
         contentModelP = new ContentModelP(contentModelP, {
            repeat: toSToken('*'),
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ZEROPLUS,
         });
      });

      it('sets a repeat type of "ONEPLUS" if "+" repeat is found', () => {
         contentModelP = new ContentModelP(contentModelP, {
            repeat: toSToken('+'),
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONEPLUS,
         });
      });

      it('sets a repeat type of "ZEROONE" if "?" repeat is found', () => {
         contentModelP = new ContentModelP(contentModelP, {
            repeat: toSToken('?'),
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  name: 'one',
                  repeat: CpRepeat.ZEROPLUS,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ZEROONE,
         });
      });
   });

   describe('sublists', () => {
      it('converts embedded lists to embedded particles', () => {
         contentModelP = new ContentModelP({
            open: toSToken('('),
            openSpace: toSToken(' '),
            particles: [
               {
                  particle: new ContentModelP({
                     open: toSToken('('),
                     particles: [
                        {
                           particle: {
                              name: toSToken('one'),
                              repeat: toSToken('*'),
                           },
                           delimiter: toSToken('|'),
                        },
                        {
                           particle: new ContentModelP({
                              open: toSToken('('),
                              particles: [
                                 {
                                    particle: {
                                       name: toSToken('three'),
                                    },
                                    delimiter: toSToken(','),
                                 },
                                 {
                                    particle: {
                                       name: toSToken('four'),
                                       repeat: toSToken('?'),
                                    },
                                 },
                              ],
                              close: toSToken(')'),
                              repeat: toSToken('+'),
                           }),
                        },
                     ],
                     close: toSToken(')'),
                  }),
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {
                     name: toSToken('two'),
                     repeat: undefined,
                     repeatSpace: undefined,
                     nameSpace: undefined,
                  },
                  delimiter: undefined,
                  delimiterSpace: undefined,
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
            repeat: undefined,
            repeatSpace: undefined,
         });

         const contentModel = new ContentModelX(contentModelP);

         expect(contentModel).toEqual({
            particles: [
               {
                  particles: [
                     {
                        name: 'one',
                        repeat: CpRepeat.ZEROPLUS,
                     },
                     {
                        particles: [
                           {
                              name: 'three',
                              repeat: CpRepeat.ONE,
                           },
                           {
                              name: 'four',
                              repeat: CpRepeat.ZEROONE,
                           },
                        ],
                        listType: CpType.SEQUENCE,
                        repeat: CpRepeat.ONEPLUS,
                     },
                  ],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ONE,
               },
               {
                  name: 'two',
                  repeat: CpRepeat.ONE,
               },
            ],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });
      });
   });
});
