/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ContentModelP, ContentNameP } from 'pToken';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { contentModelCheck } from '../contentModelCheck';
import { nameCheck } from '../nameCheck';

jest.mock('../nameCheck');

const WFEID = wellFormedErrorCodes.id;

describe('contentModelCheck()', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let cmToken: ContentModelP;

   beforeEach(() => {
      collector = new ParamCollector();
      confVer = new ConformanceVersion();

      cmToken = new ContentModelP({
         close: toSToken(')'),
         closeSpace: undefined,
         delimitedParticles: [
            {
               delimiter: toSToken('|'),
               delimiterSpace: toSToken(' '),
               particle: {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  repeat: toSToken('*'),
                  repeatSpace: toSToken(' '),
               },
            },
            {
               delimiter: undefined,
               delimiterSpace: undefined,
               particle: {
                  name: toSToken('two'),
                  nameSpace: undefined,
                  repeat: undefined,
                  repeatSpace: undefined,
               },
            },
         ],
         open: toSToken('('),
         openSpace: toSToken(' '),
         repeat: undefined,
         repeatSpace: undefined,
      });
   });

   describe('universal', () => {
      it('reports an error if no "(" present', () => {
         cmToken = new ContentModelP(cmToken, { open: undefined });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_NO_OPEN,
            lastPosition: undefined,
            params: [],
            position: undefined,
         });
      });

      it('reports an error if no delimitedParticles are present', () => {
         cmToken = new ContentModelP(cmToken, { delimitedParticles: [] });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_NO_NAMES,
            lastPosition: cmToken.openSpace,
            params: [],
            position: undefined,
         });
      });

      it('reports an error if a name in an entry is not present', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  delimiterSpace: toSToken(' '),
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
               },
               {
                  particle: {},
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_NO_NAME,
            lastPosition: cmToken.delimitedParticles[0].delimiterSpace,
            params: ['1'],
            position: undefined,
         });
      });

      it('reports an error if a delimiter in an entry is not present', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  delimiter: undefined,
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
               },
               {
                  particle: undefined,
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_NO_DELIM,
            lastPosition: cmToken.delimitedParticles[0].particle!.repeatSpace,
            params: ['0'],
            position: undefined,
         });
      });

      it('reports an error if a delimiter is present in the last entry', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('two'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_EXTRA_DELIM,
            params: ['1'],
            position: cmToken.delimitedParticles[1].delimiter,
         });
      });

      it('reports an error if the close is missing', () => {
         cmToken = new ContentModelP(cmToken, {
            close: undefined,
         });
         const particle: ContentNameP = cmToken.delimitedParticles[1].particle as ContentNameP;

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_NO_CLOSE,
            lastPosition: particle.name,
            params: [],
         });
      });
   });

   describe('element content', () => {
      it('checks if the name is valid', () => {
         contentModelCheck(cmToken, collector, confVer, true);
         const particle: ContentNameP = cmToken.delimitedParticles[0].particle as ContentNameP;

         expect(nameCheck).toHaveBeenCalledWith(
            particle.name,
            collector,
            confVer,
            WFEID.CONTENTMODEL_NAME_INVALID,
         );
      });

      it('reports an error if the second separator does not match the first "|"', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('two'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken(','),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_BAD_CHOICE,
            params: ['1', ','],
            position: cmToken.delimitedParticles[1].delimiter,
         });
      });

      it('reports an error if the second separator does not match the first ","', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken(','),
               },
               {
                  particle: {
                     name: toSToken('two'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: toSToken('|'),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_BAD_SEQUENCE,
            params: ['1', '|'],
            position: cmToken.delimitedParticles[1].delimiter,
         });
      });

      it('reports an error if there is an extra space between the name and the repeat marker', () => {
         const particle: ContentNameP = cmToken.delimitedParticles[0].particle as ContentNameP;

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_NAME_EXTRA_SPACE,
            params: ['0'],
            position: particle.nameSpace,
         });
      });

      it('reports an error if there is an extra space between the close and the repeat marker', () => {
         cmToken = new ContentModelP(cmToken, {
            closeSpace: toSToken(' '),
            repeat: toSToken('*'),
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_CLOSE_EXTRA_SPACE,
            params: [],
            position: cmToken.closeSpace,
         });
      });

      it('reports an error if a sublist has an error', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: new ContentModelP({
                     open: toSToken('('),
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('three'),
                           },
                           delimiter: toSToken('|'),
                        },
                        {
                           particle: new ContentModelP({
                              open: toSToken('('),
                              delimitedParticles: [
                                 {
                                    particle: {
                                       name: toSToken('four'),
                                    },
                                 },
                              ],
                              close: toSToken(')'),
                              closeSpace: toSToken(' '),
                              repeat: toSToken('*'),
                              repeatSpace: undefined,
                           }),
                        },
                     ],
                     close: toSToken(')'),
                     closeSpace: undefined,
                     repeat: undefined,
                     repeatSpace: undefined,
                  }),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_CLOSE_EXTRA_SPACE,
            params: [],
            position: (
               (cmToken.delimitedParticles[0].particle as ContentModelP).delimitedParticles[1]
                  .particle as ContentModelP
            ).closeSpace,
         });
      });

      it('reports an error if a #PCDATA is found in a sub-seq', () => {
         const name = toSToken('#PCDATA');
         cmToken = new ContentModelP(cmToken, {
            open: toSToken('('),
            delimitedParticles: [
               {
                  particle: {
                     open: toSToken('('),
                     delimitedParticles: [
                        {
                           particle: {
                              name,
                           },
                        },
                     ],
                  },
                  delimiter: toSToken(','),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         expect(nameCheck).toHaveBeenCalledWith(
            name,
            collector,
            confVer,
            WFEID.CONTENTMODEL_NAME_INVALID,
         );
      });
   });

   describe('mixed', () => {
      it('reports an error if #PCDATA is the wrong case', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#pcData'),
                  },
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_PCDATA_INVALID_CASE,
            params: ['#pcData'],
            position: (cmToken.delimitedParticles[0].particle as ContentNameP).name,
         });
      });

      it('assumes a choice type if it finds #PCDATA', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
                  delimiter: toSToken(','),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_BAD_CHOICE,
            params: ['0', ','],
            position: cmToken.delimitedParticles[0].delimiter,
         });
      });

      it('reports an error if a Mixed contains a sublist', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
                  delimiter: toSToken('|'),
               },
               {
                  particle: new ContentModelP({
                     open: toSToken('('),
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('one'),
                           },
                           delimiter: toSToken('|'),
                        },
                     ],
                     close: toSToken(')'),
                     closeSpace: undefined,
                     repeat: undefined,
                     repeatSpace: undefined,
                  }),
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_MIXED_INVALID_SUBPARTICLE,
            params: ['1'],
            position: (cmToken.delimitedParticles[1].particle as ContentModelP).open,
         });
      });

      it('reports an error if there is a repeat indicator after a name', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
               {
                  particle: {
                     name: toSToken('fred'),
                     repeat: toSToken('*'),
                  },
               },
            ],
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_MIXED_NAME_EXTRA_REPEAT,
            params: ['1', '*'],
            position: (cmToken.delimitedParticles[1].particle as ContentModelP).repeat,
         });
      });

      it('reports no error if there is a * repeat indicator on a #PCDATA list of 1 item', () => {
         cmToken = new ContentModelP({
            open: toSToken('('),
            openSpace: undefined,
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                     nameSpace: undefined,
                     repeat: undefined,
                     repeatSpace: undefined,
                  },
                  delimiter: undefined,
                  delimiterSpace: undefined,
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
            repeat: toSToken('*'),
            repeatSpace: undefined,
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error if there is no repeat indicator on a #PCDATA list of 1 item', () => {
         cmToken = new ContentModelP({
            close: toSToken(')'),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
            ],
            open: toSToken('('),
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if there is a ? repeat indicator on a #PCDATA list of 1 item', () => {
         cmToken = new ContentModelP({
            close: toSToken(')'),
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
            ],
            open: toSToken('('),
            repeat: toSToken('?'),
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_MIXED_INVALID_REPEAT,
            params: ['?'],
            position: cmToken.repeat,
         });
      });

      it('reports an error if there is any non-* repeat indicator on a #PCDATA list of > 1 item', () => {
         cmToken = new ContentModelP({
            open: toSToken('('),
            openSpace: undefined,
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('foo'),
                  },
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
            repeat: toSToken('+'),
            repeatSpace: undefined,
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_MIXED_INVALID_REPEAT,
            params: ['+'],
            position: cmToken.repeat,
         });
      });

      it('reports an error if there is any blank repeat indicator on a #PCDATA list of > 1 item', () => {
         cmToken = new ContentModelP({
            open: toSToken('('),
            openSpace: undefined,
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('foo'),
                  },
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
            repeat: undefined,
            repeatSpace: undefined,
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENTMODEL_MIXED_INVALID_REPEAT,
            lastPosition: cmToken.close,
            params: [''],
         });
      });

      it('reports no errors when encountering "(#PCDATA)*"', () => {
         cmToken = new ContentModelP({
            open: toSToken('('),
            openSpace: undefined,
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
            ],
            close: toSToken(')'),
            closeSpace: undefined,
            repeat: toSToken('*'),
            repeatSpace: undefined,
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no errors when encountering "(#PCDATA)"', () => {
         cmToken = new ContentModelP({
            close: toSToken(')'),
            closeSpace: undefined,
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
            ],
            open: toSToken('('),
            openSpace: undefined,
            repeat: undefined,
            repeatSpace: undefined,
         });

         contentModelCheck(cmToken, collector, confVer, true);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
