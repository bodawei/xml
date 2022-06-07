/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { XmlDeclarationPToken, InstructionStart } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { charCheck } from '../../common/charCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { fatalErrorCodes } from '../../error/fatalErrorCodes';
import { warningCodes } from '../../error/warningCodes';
import { errorCodes } from '../../error/errorCodes';

import { xmlDeclarationCheck } from '../xmlDeclarationCheck';

jest.mock('../../common/charCheck');

const FEID = fatalErrorCodes.id;
const EID = errorCodes.id;
const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('xmlDeclarationCheck() (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;
   let start: InstructionStart;
   let collector: ParamCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
         close: toSToken('?>'),
         fields: [
            {
               equal: toSToken('='),
               equalSpace: undefined,
               name: toSToken('version'),
               nameSpace: undefined,
            },
         ],
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
      });

      start = {
         open: xmlDeclPToken.open,
         openSpace: undefined,
         target: xmlDeclPToken.target,
         targetSpace: xmlDeclPToken.targetSpace,
      };
      collector = new ParamCollector();
      confVer = new ConformanceVersion();
   });

   it('calls charCheck() on the target value', () => {
      xmlDeclarationCheck(xmlDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(xmlDeclPToken.target, collector, confVer, false);
   });

   it('calls charCheck() on the version value', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         fields: [
            {
               equal: toSToken('='),
               name: toSToken('version'),
               value: toSToken('\u0001'),
            },
         ],
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         xmlDeclPToken.fields[0].value,
         collector,
         confVer,
         false,
      );
   });

   it('calls charCheck() on the encoding value', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         fields: [
            {
               equal: toSToken('='),
               name: toSToken('encoding'),
               value: toSToken('\u0001'),
            },
         ],
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         xmlDeclPToken.fields[0].value,
         collector,
         confVer,
         false,
      );
   });

   it('calls charCheck() on the standalone value', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         fields: [
            {
               equal: toSToken('='),
               name: toSToken('standalone'),
               value: toSToken('\u0001'),
            },
         ],
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(
         xmlDeclPToken.fields[0].value,
         collector,
         confVer,
         false,
      );
   });

   it('reports an error if there is a space after the "<?"', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         openSpace: toSToken(' '),
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_SPACE_AFTER_OPEN,
         params: [],
         position: xmlDeclPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         target: undefined,
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_NO_TARGET,
         lastPosition: xmlDeclPToken.open,
         params: [],
      });
   });

   it('reports an error if xml is the wrong case', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         target: toSToken('XmL'),
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_TARGET_INVALID_CASE,
         params: ['XmL'],
         position: xmlDeclPToken.target,
      });
   });

   it('reports an error if there is no space after the target', () => {
      xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
         targetSpace: undefined,
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_NO_SPACE_AFTER_TARGET,
         lastPosition: xmlDeclPToken.target,
         params: [],
      });
   });

   it('reports no errors with ordinary parameters', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               equal: toSToken('='),
               nameSpace: toSToken(' '),
               equalSpace: toSToken(' '),
               value: toSToken('1.0'),
            },
         ],
         close: toSToken('?>'),
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if there are no parameters in the base document entity', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [],
         close: toSToken('?>'),
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_NO_PARAMS,
         params: [],
         position: xmlDeclPToken.targetSpace,
      });
   });

   it('reports an error if a parameter is in the wrong case', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('VERSION'),
               equal: toSToken('='),
               nameSpace: toSToken(' '),
               equalSpace: toSToken(' '),
               value: toSToken('1.0'),
            },
         ],
         close: toSToken('?>'),
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_PARAM_INVALID_CASE,
         params: ['version', 'VERSION'],
         position: xmlDeclPToken.fields[0].name,
      });
   });

   it('reports an error if there is no close', () => {
      xmlDeclPToken = new XmlDeclarationPToken(start);

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_NO_CLOSE,
         lastPosition: xmlDeclPToken.targetSpace,
         params: [],
      });
   });

   it('reports an error if a there is no space between parameters', () => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: toSToken(' '),
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         fields: [
            {
               name: toSToken('version'),
               equal: toSToken('='),
               nameSpace: toSToken(' '),
               equalSpace: toSToken(' '),
               value: toSToken('1.0'),
            },
            {
               name: toSToken('standalone'),
               equal: toSToken('='),
               nameSpace: toSToken(' '),
               equalSpace: toSToken(' '),
               value: toSToken('yes'),
            },
         ],
         close: toSToken('?>'),
      });

      xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.XMLDECL_NO_SPACE_BETWEEN_PARAMS,
         params: ['standalone'],
         position: xmlDeclPToken.fields[1].name,
      });
   });

   const data: Array<[boolean, 1.0 | 1.1]> = [
      [true, 1.0],
      [false, 1.1],
   ];
   data.forEach(([pass, version]) => {
      it(`does${
         pass ? '' : ' not'
      } report a fatal error in a version ${version} document if there are 0x85 or 0x2028 characters in any of the spaces in an xml declaration`, () => {
         const x85 = new SToken('\n', '\u0085 ', []);
         const x2028 = new SToken('\n', '\n \u2028', []);
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: x2028,
            fields: [
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  nameSpace: x85,
                  equalSpace: x2028,
                  value: toSToken(version == 1 ? '1.0' : '1.1'),
                  valueSpace: x85,
               },
               {
                  name: toSToken('encoding'),
                  equal: toSToken('='),
                  nameSpace: x85,
                  equalSpace: x2028,
                  value: toSToken('usascii'),
                  valueSpace: x85,
               },
               {
                  name: toSToken('standalone'),
                  equal: toSToken('='),
                  nameSpace: x85,
                  equalSpace: x2028,
                  value: toSToken('yes'),
                  valueSpace: x85,
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion(version));

         if (pass) {
            expect(collector.getParams().length).toEqual(0);
            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveProblem(FEID.XMLDECL_INVALID_SPACE);
         } else {
            expect(collector.getParams().length).toEqual(10);
            // @ts-expect-error 2329/matchers
            expect(collector).toHaveProblem(FEID.XMLDECL_INVALID_SPACE);
         }
      });
   });

   describe('version parameter', () => {
      it('reports an error if a version is in the wrong order', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_VERSION_INVALID_ORDER,
            params: [],
            position: xmlDeclPToken.fields[1].name,
         });
      });

      const cases: Array<[ConformanceVersion, string, boolean, string?, string?]> = [
         [new ConformanceVersion(1, 1), '1.0', false],
         [new ConformanceVersion(1, 2), '1.0', false],
         [new ConformanceVersion(1, 3), '1.0', false],
         [new ConformanceVersion(1, 4), '1.0', false],
         [new ConformanceVersion(1, 5), '1.0', false],
         [new ConformanceVersion(1, 6), '1.0', false],
         [new ConformanceVersion(1.1, 1), '1.0', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1.1, 2), '1.0', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1.1, 3), '1.0', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1, 1), '1.1', true, EID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 2), '1.1', true, EID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 3), '1.1', true, WFEID.XMLDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '1.1', true, WFEID.XMLDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '1.1', true, WID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 6), '1.1', true, WID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.1', false],
         [new ConformanceVersion(1.1, 2), '1.1', false],
         [new ConformanceVersion(1.1, 3), '1.1', false],
         [new ConformanceVersion(1, 1), '1.3', true, EID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 2), '1.3', true, EID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 3), '1.3', true, WFEID.XMLDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '1.3', true, WFEID.XMLDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '1.3', true, WID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1, 6), '1.3', true, WID.XMLDECL_VERSION_INVALID, '1.0'],
         [new ConformanceVersion(1.1, 1), '1.3', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1.1, 2), '1.3', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1.1, 3), '1.3', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [
            new ConformanceVersion(1, 1),
            '^bad^',
            true,
            WFEID.XMLDECL_VERSION_INVALD,
            "([a-zA-Z0-9_.:] | '-')+",
         ],
         [
            new ConformanceVersion(1, 2),
            '^bad^',
            true,
            WFEID.XMLDECL_VERSION_INVALD,
            "([a-zA-Z0-9_.:] | '-')+",
         ],
         [new ConformanceVersion(1, 3), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 4), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.0'],
         [new ConformanceVersion(1, 5), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.[0-9]+'],
         [new ConformanceVersion(1, 6), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.[0-9]+'],
         [new ConformanceVersion(1.1, 1), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1.1, 2), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
         [new ConformanceVersion(1.1, 3), '^bad^', true, WFEID.XMLDECL_VERSION_INVALD, '1.1'],
      ];
      cases.forEach((details) => {
         const [confVer, version, isError, code, expected] = details;
         it(`reports ${
            isError ? 'an' : 'no'
         } error when the value is ${version} and the conf version is ${
            confVer.version === 1.0 ? '1.0' : 1.1
         }/${confVer.edition} (§2.8.0 and §4.3.4)`, () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               close: toSToken('?>'),
               fields: [
                  {
                     equal: toSToken('='),
                     name: toSToken('version'),
                     value: toSToken(version),
                  },
               ],
               open: toSToken('<?'),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
            });

            xmlDeclarationCheck(xmlDeclPToken, collector, confVer);

            if (isError && code === WFEID.XMLDECL_VERSION_INVALD) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveWellFormedError({
                  id: code,
                  params: [expected, version],
                  position: xmlDeclPToken.fields[0].value,
               });
            } else if (isError && code === WID.XMLDECL_VERSION_INVALID) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveWFWarning({
                  id: code,
                  params: [expected, version],
                  position: xmlDeclPToken.fields[0].value,
               });
            } else if (isError && code === EID.XMLDECL_VERSION_INVALID) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveWellFormedError({
                  id: code,
                  params: [expected, version],
                  position: xmlDeclPToken.fields[0].value,
               });
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            }
         });
      });

      it('reports no error when provided with a crazy version number and the processing version 1.0/1', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            close: toSToken('?>'),
            fields: [
               {
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  name: toSToken('version'),
                  nameSpace: toSToken(' '),
                  value: toSToken('What-have:123.AAA_zowie'),
               },
            ],
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion(1.0, 1));

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.XMLDECL_VERSION_INVALD);
      });

      it('reports no error when provided 1.1 with a processing version of 1.1/1', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            close: toSToken('?>'),
            fields: [
               {
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  name: toSToken('version'),
                  nameSpace: toSToken(' '),
                  value: toSToken('1.1'),
               },
            ],
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion(1.1, 1));

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.XMLDECL_VERSION_INVALD);
      });

      it('reports an error if the encoding is duplicated', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  equal: toSToken('='),
                  name: toSToken('version'),
                  value: toSToken('1.0'),
               },
               {
                  equal: toSToken('='),
                  name: toSToken('version'),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_DUPLICATE_VERSION,
            params: [],
            position: xmlDeclPToken.fields[1].name,
         });
      });
   });

   describe('encoding parameter', () => {
      it('reports an error if a encoding is in the wrong order', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('encoding'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('ASCII'),
               },
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_ENCODING_INVALID_ORDER,
            params: [],
            position: xmlDeclPToken.fields[0].name,
         });
      });

      it('reports an error if the encoding is not a legal value', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
               {
                  name: toSToken('encoding'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('$$BAD_ENCODING$$'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_ENCODING_INVALID,
            params: ['$$BAD_ENCODING$$'],
            position: xmlDeclPToken.fields[1].value,
         });
      });

      it('reports an error if the encoding is duplicated', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  equal: toSToken('='),
                  name: toSToken('version'),
                  value: toSToken('1.0'),
               },
               {
                  equal: toSToken('='),
                  name: toSToken('encoding'),
                  value: toSToken('usascii'),
               },
               {
                  equal: toSToken('='),
                  name: toSToken('encoding'),
                  value: toSToken('usascii'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_DUPLICATE_ENCODING,
            params: [],
            position: xmlDeclPToken.fields[2].name,
         });
      });
   });

   describe('standalone parameter', () => {
      it('reports an error if a standalone is in the wrong order', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('standalone'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('yes'),
               },
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_STANDALONE_INVALID_ORDER,
            params: [],
            position: xmlDeclPToken.fields[0].name,
         });
      });

      it('reports an error if the standalone is neither "yes" or "no"', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
               {
                  name: toSToken('standalone'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('Maybe'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_STANDALONE_INVALID,
            params: ['Maybe'],
            position: xmlDeclPToken.fields[1].value,
         });
      });

      it('reports an error if the standalone is the wrong case', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
               {
                  name: toSToken('standalone'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('YES'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_STANDALONE_INVALID_CASE,
            params: ['yes', 'YES'],
            position: xmlDeclPToken.fields[1].value,
         });
      });

      it('reports an error if the standalone is duplicated', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  equal: toSToken('='),
                  name: toSToken('version'),
                  value: toSToken('1.0'),
               },
               {
                  equal: toSToken('='),
                  name: toSToken('standalone'),
                  value: toSToken('yes'),
               },
               {
                  equal: toSToken('='),
                  name: toSToken('standalone'),
                  value: toSToken('yes'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_DUPLICATE_STANDALONE,
            params: [],
            position: xmlDeclPToken.fields[2].name,
         });
      });
   });

   describe('other parameter', () => {
      it('reports an error if a an unknown parameter is found (parsing wont actually allow this)', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [
               {
                  name: toSToken('bogus'),
                  equal: toSToken('='),
                  nameSpace: toSToken(' '),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.XMLDECL_PARAM_UNKNOWN,
            params: ['bogus'],
            position: xmlDeclPToken.fields[0].name,
         });
      });
   });
});
