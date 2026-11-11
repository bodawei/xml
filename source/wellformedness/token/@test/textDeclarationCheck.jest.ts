/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { SToken, toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { TextDeclarationPToken, InstructionStart } from 'pToken';

import { charCheck } from '../../common/charCheck';
import { errorCodes } from '../../error/errorCodes';
import { fatalErrorCodes } from '../../error/fatalErrorCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { textDeclarationCheck } from '../textDeclarationCheck';

jest.mock('../../common/charCheck');

const EID = errorCodes.id;
const FEID = fatalErrorCodes.id;
const WFEID = wellFormedErrorCodes.id;

describe('textDeclaration (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;
   let collector: ParamCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
            },
         ],
         close: toSToken('?>'),
      });

      start = {
         open: textDeclPToken.open,
         openSpace: undefined,
         target: textDeclPToken.target,
         targetSpace: textDeclPToken.targetSpace,
      };
      collector = new ParamCollector();
      confVer = new ConformanceVersion();
   });

   it('calls charCheck() on the target value', () => {
      textDeclarationCheck(textDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(textDeclPToken.target, collector, confVer, false);
   });

   it('calls charCheck() on the version value', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         fields: [
            {
               name: toSToken('version'),
               equal: toSToken('='),
               value: toSToken('\u0001'),
            },
         ],
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         textDeclPToken.fields[0].value,
         collector,
         confVer,
         false,
      );
   });

   it('calls charCheck() on the encoding value', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         fields: [
            {
               name: toSToken('encoding'),
               equal: toSToken('='),
               value: toSToken('\u0001'),
            },
         ],
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         textDeclPToken.fields[0].value,
         collector,
         confVer,
         false,
      );
   });

   it('reports an error if there is a space after the "<?"', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         openSpace: toSToken(' '),
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.TEXTDECL_SPACE_AFTER_OPEN,
         params: [],
         position: textDeclPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         target: undefined,
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.TEXTDECL_NO_TARGET,
         lastPosition: textDeclPToken.open,
         params: [],
      });
   });

   it('reports an error if there is no space after the target', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         targetSpace: undefined,
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET,
         lastPosition: textDeclPToken.target,
         params: [],
      });
   });

   it('reports no errors with ordinary parameters', () => {
      textDeclPToken = new TextDeclarationPToken({
         close: toSToken('?>'),
         fields: [
            {
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               name: toSToken('encoding'),
               nameSpace: toSToken(' '),
               value: toSToken('usascii'),
            },
         ],
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if there is no "encoding"', () => {
      textDeclPToken = new TextDeclarationPToken({
         close: toSToken('?>'),
         fields: [],
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.TEXTDECL_ENCODING_MISSING,
         params: [],
         position: textDeclPToken.targetSpace,
      });
   });

   it('reports an error if a parameter is in the wrong case', () => {
      textDeclPToken = new TextDeclarationPToken({
         close: toSToken('?>'),
         fields: [
            {
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               name: toSToken('VERSION'),
               nameSpace: toSToken(' '),
               value: toSToken('1.0'),
            },
         ],
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      });

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.TEXTDECL_PARAM_INVALID_CASE,
         params: ['version', 'VERSION'],
         position: textDeclPToken.fields[0].name,
      });
   });

   it('reports an error if there is no close', () => {
      textDeclPToken = new TextDeclarationPToken(start);

      textDeclarationCheck(textDeclPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.TEXTDECL_NO_CLOSE,
         lastPosition: textDeclPToken.targetSpace,
         params: [],
      });
   });

   const data: Array<[boolean, 1.0 | 1.1]> = [
      [true, 1.0],
      [false, 1.1],
   ];
   data.forEach(([pass, version]) => {
      it(`does${
         pass ? '' : ' not'
      } report a fatal error in a version ${version} document if there are 0x85 or 0x2028 characters in any of the spaces in a text declaration`, () => {
         const x85 = new SToken('\n', '\u0085', []);
         const x2028 = new SToken('\n', '\u2028', []);
         textDeclPToken = new TextDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: x2028,
            fields: [
               {
                  name: toSToken('version'),
                  nameSpace: x85,
                  equal: toSToken('='),
                  equalSpace: x2028,
                  value: toSToken(version === 1.1 ? '1.1' : '1.0'),
                  valueSpace: x85,
               },
               {
                  name: toSToken('encoding'),
                  nameSpace: x85,
                  equal: toSToken('='),
                  equalSpace: x2028,
                  value: toSToken('usascii'),
                  valueSpace: x85,
               },
            ],
            close: toSToken('?>'),
         });

         textDeclarationCheck(textDeclPToken, collector, new ConformanceVersion(version));

         if (pass) {
            expect(collector.getParams().length).toEqual(0);
            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveProblem(FEID.TEXTDECL_INVALID_SPACE);
         } else {
            expect(collector.getParams().length).toEqual(7);
            // @ts-expect-error 2329/matchers
            expect(collector).toHaveProblem(FEID.TEXTDECL_INVALID_SPACE);
         }
      });
   });

   describe('version parameter', () => {
      it('reports an error if a version is in the wrong order', () => {
         textDeclPToken = new TextDeclarationPToken({
            close: toSToken('?>'),
            fields: [
               {
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  name: toSToken('encoding'),
                  nameSpace: toSToken(' '),
                  value: toSToken('ASCII'),
               },
               {
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  name: toSToken('version'),
                  nameSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
         });

         textDeclarationCheck(textDeclPToken, collector, confVer);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.TEXTDECL_VERSION_INVALID_ORDER,
            params: [],
            position: textDeclPToken.fields[1].name,
         });
      });

      const cases: Array<[ConformanceVersion, string, boolean, string?, string?]> = [
         [new ConformanceVersion(1, 1), '1.0', false],
         [new ConformanceVersion(1, 2), '1.0', false],
         [new ConformanceVersion(1, 3), '1.0', false],
         [new ConformanceVersion(1, 4), '1.0', false],
         [new ConformanceVersion(1, 5), '1.0', false],
         [new ConformanceVersion(1, 6), '1.0', false],
         [new ConformanceVersion(1.1, 1), '1.0', false],
         [new ConformanceVersion(1.1, 2), '1.0', false],
         [new ConformanceVersion(1.1, 3), '1.0', false],
         [new ConformanceVersion(1, 1), '1.1', true, EID.TEXTDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 2), '1.1', true, EID.TEXTDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 3), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 6), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.1', false],
         [new ConformanceVersion(1.1, 2), '1.1', false],
         [new ConformanceVersion(1.1, 3), '1.1', false],
         [new ConformanceVersion(1, 1), '1.3', true, EID.TEXTDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 2), '1.3', true, EID.TEXTDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 3), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 6), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0/1.1'],
         [new ConformanceVersion(1.1, 2), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0/1.1'],
         [new ConformanceVersion(1.1, 3), '1.3', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0/1.1'],
         [
            new ConformanceVersion(1, 1),
            '^bad^',
            true,
            WFEID.TEXTDECL_VERSION_INVALD,
            "([a-zA-Z0-9_.:] | '-')+",
         ],
         [
            new ConformanceVersion(1, 2),
            '^bad^',
            true,
            WFEID.TEXTDECL_VERSION_INVALD,
            "([a-zA-Z0-9_.:] | '-')+",
         ],
         [new ConformanceVersion(1, 3), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.[0-9]+'],
         [new ConformanceVersion(1, 6), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.[0-9]+'],
         [new ConformanceVersion(1.1, 1), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0/1.1'],
         [new ConformanceVersion(1.1, 2), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0/1.1'],
         [new ConformanceVersion(1.1, 3), '^bad^', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0/1.1'],
      ];
      cases.forEach((details) => {
         const [confVer, version, isError, code, expected] = details;
         it(`reports ${
            isError ? 'an' : 'no'
         } error when the value is ${version} and the conf version is ${
            confVer.version === 1.0 ? '1.0' : 1.1
         }/${confVer.edition} (§2.8.0 and §4.3.4)`, () => {
            textDeclPToken = new TextDeclarationPToken({
               close: toSToken('?>'),
               fields: [
                  {
                     equal: toSToken('='),
                     name: toSToken('version'),
                     value: toSToken(version),
                  },
                  {
                     equal: toSToken('='),
                     name: toSToken('encoding'),
                     value: toSToken('usascii'),
                  },
               ],
               open: toSToken('<?'),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
            });

            textDeclarationCheck(textDeclPToken, collector, confVer);

            if (isError && code === WFEID.TEXTDECL_VERSION_INVALD) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveWellFormedError({
                  id: code,
                  params: [expected, version],
                  position: textDeclPToken.fields[0].value,
               });
            } else if (isError && code === EID.TEXTDECL_VERSION_INVALID) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveWFError({
                  id: code,
                  params: [expected, version],
                  position: textDeclPToken.fields[0].value,
               });
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            }
         });
      });

      it('reports an error if a there are two version paramters', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  value: toSToken('1.0'),
               },
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         textDeclarationCheck(textDeclPToken, collector, confVer);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.TEXTDECL_DUPLICATE_VERSION,
            params: [],
            position: textDeclPToken.fields[1].name,
         });
      });
   });

   describe('encoding parameter', () => {
      it('reports an error if the encoding is not a legal value', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('version'),
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
               {
                  name: toSToken('encoding'),
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('$$BAD_ENCODING$$'),
               },
            ],
            close: toSToken('?>'),
         });

         textDeclarationCheck(textDeclPToken, collector, confVer);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.TEXTDECL_ENCODING_INVALID,
            params: ['$$BAD_ENCODING$$'],
            position: textDeclPToken.fields[1].value,
         });
      });

      it('reports an error if a there are two encoding paramters', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('encoding'),
                  equal: toSToken('='),
                  value: toSToken('ascii'),
               },
               {
                  name: toSToken('encoding'),
                  equal: toSToken('='),
                  value: toSToken('ascii'),
               },
            ],
            close: toSToken('?>'),
         });

         textDeclarationCheck(textDeclPToken, collector, confVer);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.TEXTDECL_DUPLICATE_ENCODING,
            params: [],
            position: textDeclPToken.fields[1].name,
         });
      });
   });
});
