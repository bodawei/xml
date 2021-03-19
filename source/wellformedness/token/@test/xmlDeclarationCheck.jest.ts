/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { XmlDeclarationPToken, InstructionStart } from 'pToken';
import { toSToken } from 'sToken';

import { charCheck } from '../../common/charCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { xmlDeclarationCheck } from '../xmlDeclarationCheck';

jest.mock('../../common/charCheck');

describe('xmlDeclarationCheck() (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
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
         open: xmlDeclPToken.open,
         openSpace: undefined,
         target: xmlDeclPToken.target,
         targetSpace: xmlDeclPToken.targetSpace,
      };
   });

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let confVer: ConformanceVersion;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         confVer = new ConformanceVersion();
      });

      it('calls charCheck() on the target value', () => {
         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(charCheck).toHaveBeenCalledWith(xmlDeclPToken.target, mockErrorCollector, confVer);
      });

      it('calls charCheck() on the version value', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            fields: [
               {
                  name: toSToken('version'),
                  equal: toSToken('='),
                  value: toSToken('\u0001'),
               },
            ],
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(charCheck).toHaveBeenCalledWith(
            xmlDeclPToken.fields[0].value,
            mockErrorCollector,
            confVer,
         );
      });

      it('calls charCheck() on the encoding value', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            fields: [
               {
                  name: toSToken('encoding'),
                  equal: toSToken('='),
                  value: toSToken('\u0001'),
               },
            ],
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(charCheck).toHaveBeenCalledWith(
            xmlDeclPToken.fields[0].value,
            mockErrorCollector,
            confVer,
         );
      });

      it('calls charCheck() on the standalone value', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            fields: [
               {
                  name: toSToken('standalone'),
                  equal: toSToken('='),
                  value: toSToken('\u0001'),
               },
            ],
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(charCheck).toHaveBeenCalledWith(
            xmlDeclPToken.fields[0].value,
            mockErrorCollector,
            confVer,
         );
      });

      it('reports an error if there is a space after the "<?"', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            openSpace: toSToken(' '),
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_SPACE_AFTER_OPEN,
            params: undefined,
            position: xmlDeclPToken.openSpace,
         });
      });

      it('reports an error if there is no target', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            target: undefined,
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_NO_TARGET,
            params: undefined,
            lastPosition: xmlDeclPToken.open,
         });
      });

      it('reports an error if xml is the wrong case', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            target: toSToken('XmL'),
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_TARGET_INVALID_CASE,
            params: ['XmL'],
            position: xmlDeclPToken.target,
         });
      });

      it('reports an error if there is no space after the target', () => {
         xmlDeclPToken = new XmlDeclarationPToken(xmlDeclPToken, {
            targetSpace: undefined,
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_NO_SPACE_AFTER_TARGET,
            params: undefined,
            lastPosition: xmlDeclPToken.target,
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
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector.errors).toEqual([]);
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

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_NO_PARAMS,
            params: undefined,
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
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_PARAM_INVALID_CASE,
            params: ['version', 'VERSION'],
            position: xmlDeclPToken.fields[0].name,
         });
      });

      it('reports an error if there is no close', () => {
         xmlDeclPToken = new XmlDeclarationPToken(start);

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_NO_CLOSE,
            params: undefined,
            lastPosition: xmlDeclPToken.targetSpace,
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
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('1.0'),
               },
               {
                  name: toSToken('standalone'),
                  nameSpace: toSToken(' '),
                  equal: toSToken('='),
                  equalSpace: toSToken(' '),
                  value: toSToken('yes'),
               },
            ],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.XMLDECL_NO_SPACE_BETWEEN_PARAMS,
            params: ['standalone'],
            position: xmlDeclPToken.fields[1].name,
         });
      });

      describe('version parameter', () => {
         it('reports an error if a version is in the wrong order', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               open: toSToken('<?'),
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

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_VERSION_INVALID_ORDER,
               params: undefined,
               position: xmlDeclPToken.fields[1].name,
            });
         });

         const cases: Array<[ConformanceVersion, string, boolean, string?]> = [
            [new ConformanceVersion(1, 1), '1.0', false],
            [new ConformanceVersion(1, 2), '1.0', false],
            [new ConformanceVersion(1, 3), '1.0', false],
            [new ConformanceVersion(1, 4), '1.0', false],
            [new ConformanceVersion(1, 5), '1.0', false],
            [new ConformanceVersion(1, 6), '1.0', false],
            [new ConformanceVersion(1.1, 1), '1.0', true, '1.1'],
            [new ConformanceVersion(1.1, 2), '1.0', true, '1.1'],
            [new ConformanceVersion(1.1, 3), '1.0', true, '1.1'],
            [new ConformanceVersion(1, 1), '1.1', false],
            [new ConformanceVersion(1, 2), '1.1', false],
            [new ConformanceVersion(1, 3), '1.1', true, '1.0'],
            [new ConformanceVersion(1, 4), '1.1', true, '1.0'],
            [new ConformanceVersion(1, 5), '1.1', false],
            [new ConformanceVersion(1, 6), '1.1', false],
            [new ConformanceVersion(1.1, 1), '1.1', false],
            [new ConformanceVersion(1.1, 2), '1.1', false],
            [new ConformanceVersion(1.1, 3), '1.1', false],
            [new ConformanceVersion(1, 1), '1.3', false],
            [new ConformanceVersion(1, 2), '1.3', false],
            [new ConformanceVersion(1, 3), '1.3', true, '1.0'],
            [new ConformanceVersion(1, 4), '1.3', true, '1.0'],
            [new ConformanceVersion(1, 5), '1.3', false],
            [new ConformanceVersion(1, 6), '1.3', false],
            [new ConformanceVersion(1.1, 1), '1.3', true, '1.1'],
            [new ConformanceVersion(1.1, 2), '1.3', true, '1.1'],
            [new ConformanceVersion(1.1, 3), '1.3', true, '1.1'],
            [new ConformanceVersion(1, 1), '^bad^', true, "([a-zA-Z0-9_.:] | '-')+"],
            [new ConformanceVersion(1, 2), '^bad^', true, "([a-zA-Z0-9_.:] | '-')+"],
            [new ConformanceVersion(1, 3), '^bad^', true, '1.0'],
            [new ConformanceVersion(1, 4), '^bad^', true, '1.0'],
            [new ConformanceVersion(1, 5), '^bad^', true, '1.[0-9]+'],
            [new ConformanceVersion(1, 6), '^bad^', true, '1.[0-9]+'],
            [new ConformanceVersion(1.1, 1), '^bad^', true, '1.1'],
            [new ConformanceVersion(1.1, 2), '^bad^', true, '1.1'],
            [new ConformanceVersion(1.1, 3), '^bad^', true, '1.1'],
         ];
         cases.forEach((details) => {
            const [confVer, version, isError, expected] = details;
            it(`reports ${
               isError ? 'an' : 'no'
            } error when the value is ${version} and the conf version is ${
               confVer.version === 1.0 ? '1.0' : 1.1
            }/${confVer.revision} (§2.8.0 and §4.3.4)`, () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: toSToken('<?'),
                  target: toSToken('xml'),
                  targetSpace: toSToken(' '),
                  fields: [
                     {
                        name: toSToken('version'),
                        equal: toSToken('='),
                        value: toSToken(version),
                     },
                  ],
                  close: toSToken('?>'),
               });

               xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

               if (isError) {
                  // @ts-expect-error 2329/matchers
                  expect(mockErrorCollector).toReportWFError({
                     id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
                     params: [expected, version],
                     position: xmlDeclPToken.fields[0].value,
                  });
               } else {
                  expect(mockErrorCollector.errors).toEqual([]);
               }
            });
         });

         it('reports no error when provided with a crazy version number and the processing version 1.0/1', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
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
                     value: toSToken('What-have:123.AAA_zowie'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion(1.0, 1));

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toNotReportError(WellFormedError.ID.XMLDECL_VERSION_INVALD);
         });

         it('reports no error when provided 1.1 with a processing version of 1.1/1', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
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
                     value: toSToken('1.1'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion(1.1, 1));

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toNotReportError(WellFormedError.ID.XMLDECL_VERSION_INVALD);
         });

         it('reports an error if the encoding is duplicated', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
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

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_DUPLICATE_VERSION,
               params: undefined,
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

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
               params: undefined,
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

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
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
                     name: toSToken('version'),
                     equal: toSToken('='),
                     value: toSToken('1.0'),
                  },
                  {
                     name: toSToken('encoding'),
                     equal: toSToken('='),
                     value: toSToken('usascii'),
                  },
                  {
                     name: toSToken('encoding'),
                     equal: toSToken('='),
                     value: toSToken('usascii'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_DUPLICATE_ENCODING,
               params: undefined,
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
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('yes'),
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

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_ORDER,
               params: undefined,
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
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('1.0'),
                  },
                  {
                     name: toSToken('standalone'),
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('Maybe'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
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
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('1.0'),
                  },
                  {
                     name: toSToken('standalone'),
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('YES'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
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
                     name: toSToken('version'),
                     equal: toSToken('='),
                     value: toSToken('1.0'),
                  },
                  {
                     name: toSToken('standalone'),
                     equal: toSToken('='),
                     value: toSToken('yes'),
                  },
                  {
                     name: toSToken('standalone'),
                     equal: toSToken('='),
                     value: toSToken('yes'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_DUPLICATE_STANDALONE,
               params: undefined,
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
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('1.0'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportWFError({
               id: WellFormedError.ID.XMLDECL_PARAM_UNKNOWN,
               params: ['bogus'],
               position: xmlDeclPToken.fields[0].name,
            });
         });
      });
   });
});
