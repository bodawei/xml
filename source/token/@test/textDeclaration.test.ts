/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, EntityLocation, Range } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as misc from '../common/misc';
import { parseTextDeclaration, TextDeclarationPToken, TextDeclarationXToken } from '../textDeclaration';
import { InstructionStart } from '../bridge/instruction';
import literal from '../common/literal';
import * as entityInstr from '../common/entityInstruction';

describe('textDeclaration (unit)', () => {
   let textDeclPToken: TextDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      textDeclPToken = new TextDeclarationPToken({
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
         params: [{
            name: SToken.fromString('version'),
            nameSpace: undefined,
            equal: SToken.fromString('='),
            equalSpace: undefined,
         }],
         close: SToken.fromString('?>'),
      });

      start = {
         open: textDeclPToken.open,
         openSpace: undefined,
         target: textDeclPToken.target,
         targetSpace: textDeclPToken.targetSpace,
      };
   });

   describe('parseTextDeclaration()', () => {
      let callback: jasmine.Spy;
      let entitySpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         entitySpy = spyOn(entityInstr, 'parseEntityInstruction');
      });

      it('calls parseEntityInstruction()', () => {
         const mockSource = new MockSTokenSource([]);

         parseTextDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = entitySpy.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual([ 'version', 'encoding' ]);
         expect(args[3]).toBeInstanceOf(Function);
      });

      it('returns an XmlDeclaration', () => {
         entitySpy.and.callFake((_1: any, _2: any, _params: any, cb:(result?: any) => void) => {
            cb({
               open: SToken.fromString('testing'),
               params: [],
            });
         });
         const mockSource = new MockSTokenSource([]);

         parseTextDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.calls.argsFor(0)[0];
         expect(result).toEqual(new TextDeclarationPToken({
            open: SToken.fromString('testing'),
            params: [],
         }));
      });

   });

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         spyOn(misc, 'checkWellFormedText');
      });

      it('calls misc.checkWellFormedText() on the target value', () => {
         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(textDeclPToken.target, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedText() on the version value', () => {
         (textDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(textDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedText() on the encoding value', () => {
         (textDeclPToken.params[0].name as any) = SToken.fromString('encoding');
         (textDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(textDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('reports an error if there is a space after the "<?"', () => {
         (textDeclPToken as any).openSpace = SToken.fromString(' ');

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_SPACE_AFTER_OPEN,
            params: undefined,
            position: textDeclPToken.openSpace,
         });
      });

      it('reports an error if there is no target', () => {
         delete (textDeclPToken as any).target;

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_TARGET,
            params: undefined,
            lastPosition: textDeclPToken.open,
         });
      });

      it('reports an error if there is no space after the target', () => {
         delete (textDeclPToken as any).targetSpace;

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

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
            params: [{
               name: SToken.fromString('encoding'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('usascii'),
            }],
            close: SToken.fromString('?>'),
         });

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

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

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if a parameter is in the wrong case', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('VERSION'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.0'),
            }],
            close: SToken.fromString('?>'),
         });

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_PARAM_INVALID_CASE,
            params: [ 'version', 'VERSION' ],
            position: textDeclPToken.params[0].name,
         });
      });

      it('reports an error if there is no close', () => {
         textDeclPToken = new TextDeclarationPToken(start);

         textDeclPToken.checkWellFormed(mockErrorCollector, emd);

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
               params: [{
                  name: SToken.fromString('encoding'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('ASCII'),
               }, {
                  name: SToken.fromString('version'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('1.0'),
               }],
               close: SToken.fromString('?>'),
            });
   
            textDeclPToken.checkWellFormed(mockErrorCollector, emd);
   
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
               params: [{
                  name: SToken.fromString('version'),
                  nameSpace: SToken.fromString(' '),
                  equal: SToken.fromString('='),
                  equalSpace: SToken.fromString(' '),
                  value: SToken.fromString('1.2'),
               }],
               close: SToken.fromString('?>'),
            });
   
            textDeclPToken.checkWellFormed(mockErrorCollector, emd);
   
            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.TEXTDECL_VERSION_INVALD,
               params: [ '1.2' ],
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
                  params: [{
                     name: SToken.fromString('version'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('1.0'),
                  }, {
                     name: SToken.fromString('encoding'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('$$BAD_ENCODING$$'),
                  }],
                  close: SToken.fromString('?>'),
               });
      
               textDeclPToken.checkWellFormed(mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.TEXTDECL_ENCODING_INVALID,
                  params: [ '$$BAD_ENCODING$$' ],
                  position: textDeclPToken.params[1].value,
               });
            });

         });

      });

   });

   describe('pToken.toXToken()', () => {

      it('sets all parameters using the input', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.0'),
            }, {
               name: SToken.fromString('encoding'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('UTF-99'),
            }],
            close: SToken.fromString('?>'),
         });

         const result = textDeclPToken.toXToken();

         expect(result).toEqual(new TextDeclarationXToken(1.0, 'UTF-99', textDeclPToken));
      });

      it('sets version to 1.1 if that is what is passed in', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.1'),
            }],
            close: SToken.fromString('?>'),
         });

         const result = textDeclPToken.toXToken();

         expect(result).toEqual(new TextDeclarationXToken(1.1, undefined, textDeclPToken));
      });

      it('sets default parameters when input has none', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [],
            close: SToken.fromString('?>'),
         });

         const result = textDeclPToken.toXToken();

         expect(result).toEqual(new TextDeclarationXToken(1.0, 'utf-8', textDeclPToken));
      });

      it('sets default values when input values are erronious', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.2'),
            }, {
               name: SToken.fromString('encoding'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('some-encoding'),
            }, {
               name: SToken.fromString('standalone'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('bogus'),
            }],
            close: SToken.fromString('?>'),
         });

         const result = textDeclPToken.toXToken();

         expect(result).toEqual(new TextDeclarationXToken(1.0, 'some-encoding', textDeclPToken));
      });

      it('treats a mis-cased standalone as the correct case', () => {
         textDeclPToken = new TextDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.2'),
            }, {
               name: SToken.fromString('encoding'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('some-encoding'),
            }, {
               name: SToken.fromString('standalone'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('YES'),
            }],
            close: SToken.fromString('?>'),
         });

         const result = textDeclPToken.toXToken();

         expect(result).toEqual(new TextDeclarationXToken(1.0, 'some-encoding', textDeclPToken));
      });

   });

   describe('pToken.toSTokenArray()', () => {

      it('calls entityInstruction.sTokensFromPToken', () => {
         const entitySpy = spyOn(entityInstr, 'sTokensFromPToken');

         textDeclPToken.toSTokenArray();

         expect(entitySpy).toHaveBeenCalledWith(textDeclPToken);

      });

   });

});
