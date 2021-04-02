/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, XmlError, XmlFatalError } from 'basic';
import { MockErrorCollector } from 'basic-test';
import {
   CharRefPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
} from 'pToken';
import { toSToken } from 'sToken';

import { CheckState } from '../../checkUtils';
import { dtdEndCheck } from '../dtdEndCheck';

describe('dtdEndCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let fakeState: CheckState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
   });

   it('reports no errors when there are are no general or parameter entity declarations', () => {
      fakeState = {
         confVer,
         generalDecls: {},
         paramDecls: {},
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors when the general and parameter entities have no gerefs', () => {
      fakeState = {
         confVer,
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &foo'))],
               }),
               declaredInInternalSubset: true,
            },
         },
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo bar;'))],
            }),
         },
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors when the general and parameter entities have gerefs to unknown entities', () => {
      fakeState = {
         confVer,
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &bar;'))],
               }),
               declaredInInternalSubset: true,
            },
         },
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo &bar;'))],
            }),
         },
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors when character references contain ampersands', () => {
      fakeState = {
         confVer,
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [
                     new TextPToken(toSToken('foo &bar;')),
                     new CharRefPToken({
                        open: toSToken('&#'),
                        digits: toSToken('38'),
                     }),
                  ],
               }),
               declaredInInternalSubset: true,
            },
         },
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo &bar;'))],
            }),
         },
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when there is a reference to an unparsed entity in a general entity declaration', () => {
      const text = new TextPToken(toSToken('foo & bar;'));
      fakeState = {
         confVer,
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [text],
               }),
               declaredInInternalSubset: true,
            },
            bar: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  nDataName: toSToken('booga'),
               }),
               declaredInInternalSubset: true,
            },
         },
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo &frog;'))],
            }),
         },
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportXmlError({
         id: XmlError.ID.REFERENCE_NO_UNPARSED,
         params: ['bar'],
         position: text.text,
      });
   });

   it('reports an error when there is a reference to an unparsed entity in a parameter entity declaration', () => {
      const text = new TextPToken(toSToken('foo &bar;'));
      fakeState = {
         confVer,
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &other;'))],
               }),
               declaredInInternalSubset: true,
            },
            bar: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  nDataName: toSToken('booga'),
               }),
               declaredInInternalSubset: true,
            },
         },
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [text],
            }),
         },
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportXmlError({
         id: XmlError.ID.REFERENCE_NO_UNPARSED,
         params: ['bar'],
         position: text.text,
      });
   });

   it('reports a fatal error when there is a reference to an unparsed entity and the version is 1.0/2', () => {
      const text = new TextPToken(toSToken('foo &bar;'));
      fakeState = {
         confVer: new ConformanceVersion(1, 2),
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &other;'))],
               }),
               declaredInInternalSubset: true,
            },
            bar: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  nDataName: toSToken('booga'),
               }),
               declaredInInternalSubset: true,
            },
         },
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [text],
            }),
         },
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportXmlFatalError({
         id: XmlFatalError.ID.REFERENCE_NO_UNPARSED,
         params: ['bar'],
         position: text.text,
      });
   });

   it('reports multiple errors when there are multiple references to unparsed entities', () => {
      const unparsed = {
         token: new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            nDataName: toSToken('booga'),
         }),
         declaredInInternalSubset: true,
      };
      const text1 = new TextPToken(toSToken('foo &bar1;&bar2;'));
      const text2 = new TextPToken(toSToken('foo &bar3;'));
      fakeState = {
         confVer,
         generalDecls: {
            foo: {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [text1, text2],
               }),
               declaredInInternalSubset: true,
            },
            bar1: unparsed,
            bar2: unparsed,
            bar3: unparsed,
         },
         paramDecls: {},
         peRefCount: 0,
         isStandalone: false,
         hasNoDTD: false,
         hasExternalDTD: false,
      };

      dtdEndCheck(fakeState, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportXmlError({
         id: XmlError.ID.REFERENCE_NO_UNPARSED,
         params: ['bar1'],
         position: text1.text,
      });
      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportXmlError({
         id: XmlError.ID.REFERENCE_NO_UNPARSED,
         params: ['bar2'],
         position: text1.text,
      });
      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportXmlError({
         id: XmlError.ID.REFERENCE_NO_UNPARSED,
         params: ['bar3'],
         position: text2.text,
      });
   });
});
