/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, XmlError, XmlFatalError } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { TextDeclarationPToken, InstructionStart } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { charCheck } from '../../common/charCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { textDeclarationCheck } from '../textDeclarationCheck';

jest.mock('../../common/charCheck');

const WFEID = WellFormedError.ID;
const XEID = XmlError.ID;

fdescribe('textDeclaration (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;
   let mockErrorCollector: MockErrorCollector;
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
      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
   });

   it('calls charCheck() on the target value', () => {
      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(textDeclPToken.target, mockErrorCollector, confVer);
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

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         textDeclPToken.fields[0].value,
         mockErrorCollector,
         confVer,
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

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         textDeclPToken.fields[0].value,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is a space after the "<?"', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         openSpace: toSToken(' '),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WFEID.TEXTDECL_SPACE_AFTER_OPEN,
         params: undefined,
         position: textDeclPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         target: undefined,
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WFEID.TEXTDECL_NO_TARGET,
         params: undefined,
         lastPosition: textDeclPToken.open,
      });
   });

   it('reports an error if there is no space after the target', () => {
      textDeclPToken = new TextDeclarationPToken(textDeclPToken, {
         targetSpace: undefined,
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET,
         params: undefined,
         lastPosition: textDeclPToken.target,
      });
   });

   it('reports no errors with ordinary parameters', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('encoding'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('usascii'),
            },
         ],
         close: toSToken('?>'),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if there is no "encoding"', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [],
         close: toSToken('?>'),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WFEID.TEXTDECL_ENCODING_MISSING,
         params: undefined,
         position: textDeclPToken.targetSpace,
      });
   });

   it('reports an error if a parameter is in the wrong case', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('VERSION'),
               nameSpace: toSToken(' '),
               equal: toSToken('='),
               equalSpace: toSToken(' '),
               value: toSToken('1.0'),
            },
         ],
         close: toSToken('?>'),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WFEID.TEXTDECL_PARAM_INVALID_CASE,
         params: ['version', 'VERSION'],
         position: textDeclPToken.fields[0].name,
      });
   });

   it('reports an error if there is no close', () => {
      textDeclPToken = new TextDeclarationPToken(start);

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WFEID.TEXTDECL_NO_CLOSE,
         params: undefined,
         lastPosition: textDeclPToken.targetSpace,
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

         textDeclarationCheck(textDeclPToken, mockErrorCollector, new ConformanceVersion(version));

         const expected = pass ? 0 : 7;
         const nonSpaceError = mockErrorCollector.errors.reduce((prev, error) => {
            return prev || error.id !== XmlFatalError.ID.TEXTDECL_INVALID_SPACE;
         }, false);

         expect(mockErrorCollector.errors.length).toEqual(expected);
         expect(nonSpaceError).toEqual(false);
      });
   });

   describe('version parameter', () => {
      it('reports an error if a version is in the wrong order', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('encoding'),
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('ASCII'),
               },
               {
                  name: toSToken('version'),
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WFEID.TEXTDECL_VERSION_INVALID_ORDER,
            params: undefined,
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
         [new ConformanceVersion(1, 1), '1.1', true, XEID.DECL_VERSION_PROBLEM, '1.0'],
         [new ConformanceVersion(1, 2), '1.1', true, XEID.DECL_VERSION_PROBLEM, '1.0'],
         [new ConformanceVersion(1, 3), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 6), '1.1', true, WFEID.TEXTDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.1', false],
         [new ConformanceVersion(1.1, 2), '1.1', false],
         [new ConformanceVersion(1.1, 3), '1.1', false],
         [new ConformanceVersion(1, 1), '1.3', true, XEID.DECL_VERSION_PROBLEM, '1.0'],
         [new ConformanceVersion(1, 2), '1.3', true, XEID.DECL_VERSION_PROBLEM, '1.0'],
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
         }/${confVer.revision} (§2.8.0 and §4.3.4)`, () => {
            textDeclPToken = new TextDeclarationPToken({
               open: toSToken('<?'),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               fields: [
                  {
                     name: toSToken('version'),
                     equal: toSToken('='),
                     value: toSToken(version),
                  },
                  {
                     name: toSToken('encoding'),
                     equal: toSToken('='),
                     value: toSToken('usascii'),
                  },
               ],
               close: toSToken('?>'),
            });

            textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

            if (isError && code === WFEID.TEXTDECL_VERSION_INVALD) {
               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportWFError({
                  id: code,
                  params: [expected, version],
                  position: textDeclPToken.fields[0].value,
               });
            } else if (isError && code === XEID.DECL_VERSION_PROBLEM) {
               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportXmlError({
                  id: code,
                  params: [expected, version],
                  position: textDeclPToken.fields[0].value,
               });
            } else {
               expect(mockErrorCollector.errors).toEqual([]);
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

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WFEID.TEXTDECL_DUPLICATE_VERSION,
            params: undefined,
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

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
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

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WFEID.TEXTDECL_DUPLICATE_ENCODING,
            params: undefined,
            position: textDeclPToken.fields[1].name,
         });
      });
   });
});
