/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { toSToken } from 'sToken';
import { XmlDeclarationPToken } from 'token';

import * as misc from '../../../token/common/misc';
import { xmlDeclarationCheck } from '../xmlDeclarationCheck';
import { InstructionStart } from '../../../token/bridge/instruction';
import { ConformanceVersion } from 'basic';

describe('xmlDeclarationCheck() (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
         open: toSToken('<?'),
         openSpace: undefined,
         target: toSToken('xml'),
         targetSpace: toSToken(' '),
         params: [
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
         spyOn(misc, 'checkCharWellFormed');
      });

      it('calls misc.checkCharWellFormed() on the target value', () => {
         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
            xmlDeclPToken.target,
            mockErrorCollector,
            confVer,
         );
      });

      it('calls misc.checkCharWellFormed() on the version value', () => {
         (xmlDeclPToken.params[0].value as any) = toSToken('\u0001');

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
            xmlDeclPToken.params[0].value,
            mockErrorCollector,
            confVer,
         );
      });

      it('calls misc.checkCharWellFormed() on the encoding value', () => {
         (xmlDeclPToken.params[0].name as any) = toSToken('encoding');
         (xmlDeclPToken.params[0].value as any) = toSToken('\u0001');

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
            xmlDeclPToken.params[0].value,
            mockErrorCollector,
            confVer,
         );
      });

      it('calls misc.checkCharWellFormed() on the standalone value', () => {
         (xmlDeclPToken.params[0].name as any) = toSToken('standalone');
         (xmlDeclPToken.params[0].value as any) = toSToken('\u0001');

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, confVer);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
            xmlDeclPToken.params[0].value,
            mockErrorCollector,
            confVer,
         );
      });

      it('reports an error if there is a space after the "<?"', () => {
         (xmlDeclPToken as any).openSpace = toSToken(' ');

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_SPACE_AFTER_OPEN,
            params: undefined,
            position: xmlDeclPToken.openSpace,
         });
      });

      it('reports an error if there is no target', () => {
         delete (xmlDeclPToken as any).target;

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_TARGET,
            params: undefined,
            lastPosition: xmlDeclPToken.open,
         });
      });

      it('reports an error if xml is the wrong case', () => {
         (xmlDeclPToken as any).target.str = 'XmL';

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_TARGET_INVALID_CASE,
            params: ['XmL'],
            position: xmlDeclPToken.target,
         });
      });

      it('reports an error if there is no space after the target', () => {
         delete (xmlDeclPToken as any).targetSpace;

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector).toReportError({
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
            params: [
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

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if there are no parameters in the base document entity', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: toSToken('<?'),
            openSpace: undefined,
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            params: [],
            close: toSToken('?>'),
         });

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector).toReportError({
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
            params: [
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

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_PARAM_INVALID_CASE,
            params: ['version', 'VERSION'],
            position: xmlDeclPToken.params[0].name,
         });
      });

      it('reports an error if there is no close', () => {
         xmlDeclPToken = new XmlDeclarationPToken(start);

         xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector).toReportError({
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
            params: [
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

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_SPACE_BETWEEN_PARAMS,
            params: ['standalone'],
            position: xmlDeclPToken.params[1].name,
         });
      });

      describe('version parameter', () => {
         it('reports an error if a version is in the wrong order', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               open: toSToken('<?'),
               openSpace: toSToken(' '),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               params: [
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

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.XMLDECL_VERSION_INVALID_ORDER,
               params: undefined,
               position: xmlDeclPToken.params[1].name,
            });
         });

         it('reports an error if the version is not a legal value', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               open: toSToken('<?'),
               openSpace: toSToken(' '),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               params: [
                  {
                     name: toSToken('version'),
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('1.2'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion(1.0, 4));

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
               params: ['1.2'],
               position: xmlDeclPToken.params[0].value,
            });
         });

         it('reports no error when provided with a crazy version number and the processing version 1.0/1', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               open: toSToken('<?'),
               openSpace: toSToken(' '),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               params: [
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

            expect(mockErrorCollector).toNotReportError(WellFormedError.ID.XMLDECL_VERSION_INVALD);
         });

         it('reports no error when provided 1.1 with a processing version of 1.1/1', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               open: toSToken('<?'),
               openSpace: toSToken(' '),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               params: [
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

            expect(mockErrorCollector).toNotReportError(WellFormedError.ID.XMLDECL_VERSION_INVALD);
         });

         it('reports no error when provided 1.9 with a processing version of 1.0/5', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
               open: toSToken('<?'),
               openSpace: toSToken(' '),
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               params: [
                  {
                     name: toSToken('version'),
                     nameSpace: toSToken(' '),
                     equal: toSToken('='),
                     equalSpace: toSToken(' '),
                     value: toSToken('1.9'),
                  },
               ],
               close: toSToken('?>'),
            });

            xmlDeclarationCheck(xmlDeclPToken, mockErrorCollector, new ConformanceVersion(1.0, 5));

            expect(mockErrorCollector).toNotReportError(WellFormedError.ID.XMLDECL_VERSION_INVALD);
         });

         describe('encoding parameter', () => {
            it('reports an error if a encoding is in the wrong order', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: toSToken('<?'),
                  openSpace: toSToken(' '),
                  target: toSToken('xml'),
                  targetSpace: toSToken(' '),
                  params: [
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

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
                  params: undefined,
                  position: xmlDeclPToken.params[0].name,
               });
            });

            it('reports an error if the encoding is not a legal value', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: toSToken('<?'),
                  openSpace: toSToken(' '),
                  target: toSToken('xml'),
                  targetSpace: toSToken(' '),
                  params: [
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

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
                  params: ['$$BAD_ENCODING$$'],
                  position: xmlDeclPToken.params[1].value,
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
                  params: [
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

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_ORDER,
                  params: undefined,
                  position: xmlDeclPToken.params[0].name,
               });
            });

            it('reports an error if the standalone is neither "yes" or "no"', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: toSToken('<?'),
                  openSpace: toSToken(' '),
                  target: toSToken('xml'),
                  targetSpace: toSToken(' '),
                  params: [
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

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
                  params: ['Maybe'],
                  position: xmlDeclPToken.params[1].value,
               });
            });

            it('reports an error if the standalone is the wrong case', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: toSToken('<?'),
                  openSpace: toSToken(' '),
                  target: toSToken('xml'),
                  targetSpace: toSToken(' '),
                  params: [
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

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
                  params: ['yes', 'YES'],
                  position: xmlDeclPToken.params[1].value,
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
                  params: [
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

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_PARAM_UNKNOWN,
                  params: ['bogus'],
                  position: xmlDeclPToken.params[0].name,
               });
            });
         });
      });
   });
});
