/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { TextDeclarationPToken, InstructionStart } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { charCheck } from '../../common/charCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { textDeclarationCheck } from '../textDeclarationCheck';

jest.mock('../../common/charCheck');

describe('textDeclaration (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         fields: [
            {
               name: SToken.fromString('version'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
            },
         ],
         close: SToken.fromString('?>'),
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
               name: SToken.fromString('version'),
               equal: SToken.fromString('='),
               value: SToken.fromString('\u0001'),
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
               name: SToken.fromString('encoding'),
               equal: SToken.fromString('='),
               value: SToken.fromString('\u0001'),
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
         id: WellFormedError.ID.TEXTDECL_SPACE_AFTER_OPEN,
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
         id: WellFormedError.ID.TEXTDECL_NO_TARGET,
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
         id: WellFormedError.ID.TEXTDECL_NO_SPACE_AFTER_TARGET,
         params: undefined,
         lastPosition: textDeclPToken.target,
      });
   });

   it('reports no errors with ordinary parameters', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         fields: [
            {
               name: SToken.fromString('encoding'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('usascii'),
            },
         ],
         close: SToken.fromString('?>'),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors if there are no parameters in the declaration', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         fields: [],
         close: SToken.fromString('?>'),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports an error if a parameter is in the wrong case', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: SToken.fromString(' '),
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         fields: [
            {
               name: SToken.fromString('VERSION'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.0'),
            },
         ],
         close: SToken.fromString('?>'),
      });

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.TEXTDECL_PARAM_INVALID_CASE,
         params: ['version', 'VERSION'],
         position: textDeclPToken.fields[0].name,
      });
   });

   it('reports an error if there is no close', () => {
      textDeclPToken = new TextDeclarationPToken(start);

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.TEXTDECL_NO_CLOSE,
         params: undefined,
         lastPosition: textDeclPToken.targetSpace,
      });
   });

   describe('version parameter', () => {
      it('reports an error if a version is in the wrong order', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            fields: [
               {
                  name: SToken.fromString('encoding'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('ASCII'),
               },
               {
                  name: SToken.fromString('version'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('1.0'),
               },
            ],
            close: SToken.fromString('?>'),
         });

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.TEXTDECL_VERSION_INVALID_ORDER,
            params: undefined,
            position: textDeclPToken.fields[1].name,
         });
      });
      const cases: Array<[ConformanceVersion, string, boolean, string?]> = [
         [new ConformanceVersion(1, 1), '1.0', false],
         [new ConformanceVersion(1, 2), '1.0', false],
         [new ConformanceVersion(1, 3), '1.0', false],
         [new ConformanceVersion(1, 4), '1.0', false],
         [new ConformanceVersion(1, 5), '1.0', false],
         [new ConformanceVersion(1, 6), '1.0', false],
         [new ConformanceVersion(1.1, 1), '1.0', false],
         [new ConformanceVersion(1.1, 2), '1.0', false],
         [new ConformanceVersion(1.1, 3), '1.0', false],
         [new ConformanceVersion(1, 1), '1.1', false],
         [new ConformanceVersion(1, 2), '1.1', false],
         [new ConformanceVersion(1, 3), '1.1', true, '1.0'],
         [new ConformanceVersion(1, 4), '1.1', true, '1.0'],
         [new ConformanceVersion(1, 5), '1.1', true, '1.0'],
         [new ConformanceVersion(1, 6), '1.1', true, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.1', false],
         [new ConformanceVersion(1.1, 2), '1.1', false],
         [new ConformanceVersion(1.1, 3), '1.1', false],
         [new ConformanceVersion(1, 1), '1.3', false],
         [new ConformanceVersion(1, 2), '1.3', false],
         [new ConformanceVersion(1, 3), '1.3', true, '1.0'],
         [new ConformanceVersion(1, 4), '1.3', true, '1.0'],
         [new ConformanceVersion(1, 5), '1.3', true, '1.0'],
         [new ConformanceVersion(1, 6), '1.3', true, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.3', true, '1.0/1.1'],
         [new ConformanceVersion(1.1, 2), '1.3', true, '1.0/1.1'],
         [new ConformanceVersion(1.1, 3), '1.3', true, '1.0/1.1'],
         [new ConformanceVersion(1, 1), '^bad^', true, "([a-zA-Z0-9_.:] | '-')+"],
         [new ConformanceVersion(1, 2), '^bad^', true, "([a-zA-Z0-9_.:] | '-')+"],
         [new ConformanceVersion(1, 3), '^bad^', true, '1.0'],
         [new ConformanceVersion(1, 4), '^bad^', true, '1.0'],
         [new ConformanceVersion(1, 5), '^bad^', true, '1.0'],
         [new ConformanceVersion(1, 6), '^bad^', true, '1.0'],
         [new ConformanceVersion(1.1, 1), '^bad^', true, '1.0/1.1'],
         [new ConformanceVersion(1.1, 2), '^bad^', true, '1.0/1.1'],
         [new ConformanceVersion(1.1, 3), '^bad^', true, '1.0/1.1'],
      ];
      cases.forEach((details) => {
         const [confVer, version, isError, expected] = details;
         it(`reports ${
            isError ? 'an' : 'no'
         } error when the value is ${version} and the conf version is ${
            confVer.version === 1.0 ? '1.0' : 1.1
         }/${confVer.revision} (§2.8.0 and §4.3.4)`, () => {
            textDeclPToken = new TextDeclarationPToken({
               open: SToken.fromString('<?'),
               target: SToken.fromString('xml'),
               targetSpace: SToken.fromString(' '),
               fields: [
                  {
                     name: SToken.fromString('version'),
                     equal: SToken.fromString('='),
                     value: SToken.fromString(version),
                  },
               ],
               close: SToken.fromString('?>'),
            });

            textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

            if (isError) {
               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportWFError({
                  id: WellFormedError.ID.TEXTDECL_VERSION_INVALD,
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
            open: SToken.fromString('<?'),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            fields: [
               {
                  name: SToken.fromString('version'),
                  equal: SToken.fromString('='),
                  value: SToken.fromString('1.0'),
               },
               {
                  name: SToken.fromString('version'),
                  equal: SToken.fromString('='),
                  value: SToken.fromString('1.0'),
               },
            ],
            close: SToken.fromString('?>'),
         });

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.TEXTDECL_DUPLICATE_VERSION,
            params: undefined,
            position: textDeclPToken.fields[1].name,
         });
      });
   });

   describe('encoding parameter', () => {
      it('reports an error if the encoding is not a legal value', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            fields: [
               {
                  name: SToken.fromString('version'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('1.0'),
               },
               {
                  name: SToken.fromString('encoding'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('$$BAD_ENCODING$$'),
               },
            ],
            close: SToken.fromString('?>'),
         });

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.TEXTDECL_ENCODING_INVALID,
            params: ['$$BAD_ENCODING$$'],
            position: textDeclPToken.fields[1].value,
         });
      });

      it('reports an error if a there are two encoding paramters', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            fields: [
               {
                  name: SToken.fromString('encoding'),
                  equal: SToken.fromString('='),
                  value: SToken.fromString('ascii'),
               },
               {
                  name: SToken.fromString('encoding'),
                  equal: SToken.fromString('='),
                  value: SToken.fromString('ascii'),
               },
            ],
            close: SToken.fromString('?>'),
         });

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.TEXTDECL_DUPLICATE_ENCODING,
            params: undefined,
            position: textDeclPToken.fields[1].name,
         });
      });
   });
});
