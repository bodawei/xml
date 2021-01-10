/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { WellFormedError } from 'error';
import { ContentModelP, ContentNameP } from 'pToken';
import { toSToken } from 'sToken';

import misc from '../../../token/common/misc';
import { contentModelCheck } from '../contentModelCheck';
import { nameCheck } from '../../token/util/nameCheck';

jest.mock('../../token/util/nameCheck');

describe('contentModelCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let cmToken: ContentModelP;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();

      cmToken = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
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

      jest.spyOn(misc, 'checkName').mockImplementation();
      jest.spyOn(misc, 'checkNMToken').mockImplementation();
   });

   describe('universal', () => {
      it('reports an error if no "(" present', () => {
         cmToken = new ContentModelP(cmToken, { open: undefined });

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_NO_OPEN,
            params: undefined,
            position: undefined,
            lastPosition: undefined,
         });
      });

      it('reports an error if no delimitedParticles are present', () => {
         cmToken = new ContentModelP(cmToken, { delimitedParticles: [] });

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_NO_NAMES,
            params: undefined,
            position: undefined,
            lastPosition: cmToken.openSpace,
         });
      });

      it('reports an error if a name in an entry is not present', () => {
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
                  delimiterSpace: toSToken(' '),
               },
               {
                  particle: {},
               },
            ],
         });

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_NO_NAME,
            params: ['1'],
            position: undefined,
            lastPosition: cmToken.delimitedParticles[0].delimiterSpace,
         });
      });

      it('reports an error if a delimiter in an entry is not present', () => {
         cmToken = new ContentModelP(cmToken, {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     repeat: toSToken('*'),
                     repeatSpace: toSToken(' '),
                  },
                  delimiter: undefined,
               },
               {
                  particle: undefined,
               },
            ],
         });

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_NO_DELIM,
            params: ['0'],
            position: undefined,
            lastPosition: cmToken.delimitedParticles[0].particle!.repeatSpace,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_EXTRA_DELIM,
            params: ['1'],
            position: cmToken.delimitedParticles[1].delimiter,
         });
      });

      it('reports an error if the close is missing', () => {
         cmToken = new ContentModelP(cmToken, {
            close: undefined,
         });
         const particle: ContentNameP = cmToken.delimitedParticles[1].particle as ContentNameP;

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_NO_CLOSE,
            params: undefined,
            lastPosition: particle.name,
         });
      });
   });

   describe('non-mixed children', () => {
      it('checks if the name is valid', () => {
         contentModelCheck(cmToken, mockErrorCollector, confVer);
         const particle: ContentNameP = cmToken.delimitedParticles[0].particle as ContentNameP;

         expect(nameCheck).toHaveBeenCalledWith(
            particle.name,
            mockErrorCollector,
            confVer,
            WellFormedError.ID.CONTENTMODEL_NAME_INVALID,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_BAD_CHOICE,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_BAD_SEQUENCE,
            params: ['1', '|'],
            position: cmToken.delimitedParticles[1].delimiter,
         });
      });

      it('reports an error if there is an extra space between the name and the repeat marker', () => {
         const particle: ContentNameP = cmToken.delimitedParticles[0].particle as ContentNameP;

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_NAME_EXTRA_SPACE,
            params: ['0'],
            position: particle.nameSpace,
         });
      });

      it('reports an error if there is an extra space between the close and the repeat marker', () => {
         cmToken = new ContentModelP(cmToken, {
            closeSpace: toSToken(' '),
            repeat: toSToken('*'),
         });

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_CLOSE_EXTRA_SPACE,
            params: undefined,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_CLOSE_EXTRA_SPACE,
            params: undefined,
            position: ((cmToken.delimitedParticles[0].particle as ContentModelP)
               .delimitedParticles[1].particle as ContentModelP).closeSpace,
         });
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_PCDATA_INVALID_CASE,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_BAD_CHOICE,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_MIXED_INVALID_SUBPARTICLE,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_MIXED_NAME_EXTRA_REPEAT,
            params: ['1', '*'],
            position: (cmToken.delimitedParticles[1].particle as ContentModelP).repeat,
         });
      });

      it('reports no error if there is a repeat indicator on a #PCDATA list of 1 item', () => {
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         expect(mockErrorCollector.errors.length).toEqual(0);
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_MIXED_INVALID_REPEAT,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONTENTMODEL_MIXED_INVALID_REPEAT,
            params: [''],
            lastPosition: cmToken.close,
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

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no errors when encountering "(#PCDATA)"', () => {
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
            repeat: undefined,
            repeatSpace: undefined,
         });

         contentModelCheck(cmToken, mockErrorCollector, confVer);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });
   });
});
