/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { TextDeclarationPToken } from 'pToken';
import { SToken } from 'sToken';

import * as misc from '../../../token/common/misc';
import { InstructionStart } from '../../../pToken/bridge/instruction';

import { textDeclarationCheck } from '../textDeclarationCheck';

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
         params: [
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
      spyOn(misc, 'checkCharWellFormed');
   });

   it('calls misc.checkCharWellFormed() on the target value', () => {
      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
         textDeclPToken.target,
         mockErrorCollector,
         confVer,
      );
   });

   it('calls misc.checkCharWellFormed() on the version value', () => {
      (textDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
         textDeclPToken.params[0].value,
         mockErrorCollector,
         confVer,
      );
   });

   it('calls misc.checkCharWellFormed() on the encoding value', () => {
      (textDeclPToken.params[0].name as any) = SToken.fromString('encoding');
      (textDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
         textDeclPToken.params[0].value,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is a space after the "<?"', () => {
      (textDeclPToken as any).openSpace = SToken.fromString(' ');

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.TEXTDECL_SPACE_AFTER_OPEN,
         params: undefined,
         position: textDeclPToken.openSpace,
      });
   });

   it('reports an error if there is no target', () => {
      delete (textDeclPToken as any).target;

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.TEXTDECL_NO_TARGET,
         params: undefined,
         lastPosition: textDeclPToken.open,
      });
   });

   it('reports an error if there is no space after the target', () => {
      delete (textDeclPToken as any).targetSpace;

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
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
         params: [
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

      expect(mockErrorCollector.report).not.toHaveBeenCalled();
   });

   it('reports no errors if there are no parameters in the declaration', () => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         params: [],
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
         params: [
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

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.TEXTDECL_PARAM_INVALID_CASE,
         params: ['version', 'VERSION'],
         position: textDeclPToken.params[0].name,
      });
   });

   it('reports an error if there is no close', () => {
      textDeclPToken = new TextDeclarationPToken(start);

      textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
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
            params: [
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

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_VERSION_INVALID_ORDER,
            params: undefined,
            position: textDeclPToken.params[1].name,
         });
      });

      it('reports an error if the version is not a legal value', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [
               {
                  name: SToken.fromString('version'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('1.2'),
               },
            ],
            close: SToken.fromString('?>'),
         });

         textDeclarationCheck(textDeclPToken, mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_VERSION_INVALD,
            params: ['1.2'],
            position: textDeclPToken.params[0].value,
         });
      });

      describe('encoding parameter', () => {
         it('reports an error if the encoding is not a legal value', () => {
            textDeclPToken = new TextDeclarationPToken({
               open: SToken.fromString('<?'),
               openSpace: SToken.fromString(' '),
               target: SToken.fromString('xml'),
               targetSpace: SToken.fromString(' '),
               params: [
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

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.TEXTDECL_ENCODING_INVALID,
               params: ['$$BAD_ENCODING$$'],
               position: textDeclPToken.params[1].value,
            });
         });
      });
   });
});
