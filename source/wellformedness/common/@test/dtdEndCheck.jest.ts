/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import {
   CharRefPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
} from 'pToken';
import { describe, expect, it } from 'vitest';

import { CheckState } from '../../checkUtils';
import { errorCodes } from '../../error/errorCodes';
import { fatalErrorCodes } from '../../error/fatalErrorCodes';
import { warningCodes } from '../../error/warningCodes';
import { dtdEndCheck } from '../dtdEndCheck';

const EID = errorCodes.id;
const FEID = fatalErrorCodes.id;
const WID = warningCodes.id;

describe('dtdEndCheck()', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let fakeState: CheckState;

   beforeEach(() => {
      collector = new ParamCollector();
      confVer = new ConformanceVersion();
   });

   it('reports no errors when there are are no general or parameter entity declarations', () => {
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {},
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {},
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors when the general and parameter entities have no gerefs', () => {
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &foo'))],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo bar;'))],
            }),
         },
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors when the general and parameter entities have gerefs to unknown entities', () => {
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &bar;'))],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo &bar;'))],
            }),
         },
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors when character references contain ampersands', () => {
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [
                     new TextPToken(toSToken('foo &bar;')),
                     new CharRefPToken({
                        digits: toSToken('38'),
                        open: toSToken('&#'),
                     }),
                  ],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo &bar;'))],
            }),
         },
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error when there is a reference to an unparsed entity in a general entity declaration', () => {
      const text = new TextPToken(toSToken('foo & bar;'));
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {
            bar: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  nDataName: toSToken('booga'),
                  open: toSToken('<!'),
               }),
            },
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [text],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [new TextPToken(toSToken('foo &frog;'))],
            }),
         },
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.REFERENCE_INVALID_UNPARSED,
         params: ['bar'],
         position: text.text,
      });
   });

   it('reports an error when there is a reference to an unparsed entity in a parameter entity declaration', () => {
      const text = new TextPToken(toSToken('foo &bar;'));
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {
            bar: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  nDataName: toSToken('booga'),
                  open: toSToken('<!'),
               }),
            },
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &other;'))],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [text],
            }),
         },
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.REFERENCE_INVALID_UNPARSED,
         params: ['bar'],
         position: text.text,
      });
   });

   it('reports a fatal error when there is a reference to an unparsed entity and the version is 1.0/2', () => {
      const text = new TextPToken(toSToken('foo &bar;'));
      fakeState = {
         atts: {},
         confVer: new ConformanceVersion(1, 2),
         elementDecl: {},
         generalDecls: {
            bar: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  nDataName: toSToken('booga'),
                  open: toSToken('<!'),
               }),
            },
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [new TextPToken(toSToken('foo &other;'))],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {
            bar: new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               value: [text],
            }),
         },
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFFatalError({
         id: FEID.REFERENCE_INVALID_UNPARSED,
         params: ['bar'],
         position: text.text,
      });
   });

   it('reports multiple errors when there are multiple references to unparsed entities', () => {
      const unparsed = {
         declaredInInternalSubset: true,
         token: new GeneralEntityDeclarationPToken({
            nDataName: toSToken('booga'),
            open: toSToken('<!'),
         }),
      };
      const text1 = new TextPToken(toSToken('foo &bar1;&bar2;'));
      const text2 = new TextPToken(toSToken('foo &bar3;'));
      fakeState = {
         atts: {},
         confVer,
         elementDecl: {},
         generalDecls: {
            bar1: unparsed,
            bar2: unparsed,
            bar3: unparsed,
            foo: {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  value: [text1, text2],
               }),
            },
         },
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {},
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.REFERENCE_INVALID_UNPARSED,
         params: ['bar1'],
         position: text1.text,
      });
      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.REFERENCE_INVALID_UNPARSED,
         params: ['bar2'],
         position: text1.text,
      });
      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.REFERENCE_INVALID_UNPARSED,
         params: ['bar3'],
         position: text2.text,
      });
   });

   it('reports a warning when an ATTLIST is declared for an element that was not (§3.3.0)', () => {
      fakeState = {
         atts: {
            el1: {
               att1: true,
            },
         },
         confVer,
         elementDecl: {},
         generalDecls: {},
         hasExternalDTD: false,
         hasNoDTD: false,
         isStandalone: false,
         paramDecls: {},
         peRefCount: 0,
      };

      dtdEndCheck(fakeState, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WID.ATTLISTDECL_NO_ELEMENTDECL,
         params: ['el1'],
         position: undefined,
      });
   });
});
