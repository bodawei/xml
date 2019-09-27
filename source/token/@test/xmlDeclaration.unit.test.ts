/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, EntityLocation, Range } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as misc from '../common/misc';
import { parseXmlDeclaration, XmlDeclarationPToken, XmlDeclarationXToken } from '../xmlDeclaration';
import { InstructionStart } from '../bridge/instruction';
import literal from '../common/literal';
import * as entityInstr from '../common/entityInstruction';

describe('xmlDeclaration (unit)', () => {
   let xmlDeclPToken: XmlDeclarationPToken;
   let start: InstructionStart;

   beforeEach(() => {
      xmlDeclPToken = new XmlDeclarationPToken({
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
         open: xmlDeclPToken.open,
         openSpace: undefined,
         target: xmlDeclPToken.target,
         targetSpace: xmlDeclPToken.targetSpace,
      };
});

   describe('parseXmlDeclaration()', () => {
      let callback: jasmine.Spy;
      let entitySpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         entitySpy = spyOn(entityInstr, 'parseEntityInstruction');
      });

      it('calls parseEntityInstruction()', () => {
         const mockSource = new MockSTokenSource([]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const args = entitySpy.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual(start);
         expect(args[2]).toEqual([ 'version', 'encoding', 'standalone' ]);
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

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         const result = callback.calls.argsFor(0)[0];
         expect(result).toEqual(new XmlDeclarationPToken({
            open: SToken.fromString('testing'),
            params: [],
         }));
      });

   });

   fdescribe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         spyOn(misc, 'checkCharWellFormed');
      });

      it('calls misc.checkCharWellFormed() on the target value', () => {
         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(xmlDeclPToken.target, mockErrorCollector, emd);
      });

      it('calls misc.checkCharWellFormed() on the version value', () => {
         (xmlDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkCharWellFormed)
            .toHaveBeenCalledWith(xmlDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('calls misc.checkCharWellFormed() on the encoding value', () => {
         (xmlDeclPToken.params[0].name as any) = SToken.fromString('encoding');
         (xmlDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkCharWellFormed)
            .toHaveBeenCalledWith(xmlDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('calls misc.checkCharWellFormed() on the standalone value', () => {
         (xmlDeclPToken.params[0].name as any) = SToken.fromString('standalone');
         (xmlDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkCharWellFormed)
            .toHaveBeenCalledWith(xmlDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('reports an error if there is a space after the "<?"', () => {
         (xmlDeclPToken as any).openSpace = SToken.fromString(' ');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_SPACE_AFTER_OPEN,
            params: undefined,
            position: xmlDeclPToken.openSpace,
         });
      });

      it('reports an error if there is no target', () => {
         delete (xmlDeclPToken as any).target;

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_TARGET,
            params: undefined,
            lastPosition: xmlDeclPToken.open,
         });
      });

      it('reports an error if xml is the wrong case', () => {
         (xmlDeclPToken as any).target.str = 'XmL';

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_TARGET_INVALID_CASE,
            params: [ 'XmL' ],
            position: xmlDeclPToken.target,
         });
      });

      it('reports an error if there is no space after the target', () => {
         delete (xmlDeclPToken as any).targetSpace;

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_SPACE_AFTER_TARGET,
            params: undefined,
            lastPosition: xmlDeclPToken.target,
         });
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: undefined,
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('1.0'),
            }],
            close: SToken.fromString('?>'),
         });

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if there are no parameters in the base document entity', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: undefined,
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [],
            close: SToken.fromString('?>'),
         });

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_PARAMS,
            params: undefined,
            position: xmlDeclPToken.targetSpace,
         });
      });

      it('reports an error if a parameter is in the wrong case', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_PARAM_INVALID_CASE,
            params: [ 'version', 'VERSION' ],
            position: xmlDeclPToken.params[0].name,
         });
      });

      it('reports an error if there is no close', () => {
         xmlDeclPToken = new XmlDeclarationPToken(start);

         xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_CLOSE,
            params: undefined,
            lastPosition: xmlDeclPToken.targetSpace,
         });
      });

      describe('version parameter', () => {

         it('reports an error if a version is in the wrong order', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
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

            xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.XMLDECL_VERSION_INVALID_ORDER,
               params: undefined,
               position: xmlDeclPToken.params[1].name,
            });
         });

         it('reports an error if the version is not a legal value', () => {
            xmlDeclPToken = new XmlDeclarationPToken({
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

            xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

            expect(mockErrorCollector).toReportError({
               id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
               params: [ '1.2' ],
               position: xmlDeclPToken.params[0].value,
            });

         });

         describe('encoding parameter', () => {

            it('reports an error if a encoding is in the wrong order', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
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

               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
                  params: undefined,
                  position: xmlDeclPToken.params[0].name,
               });
            });

            it('reports an error if the encoding is not a legal value', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
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

               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
                  params: [ '$$BAD_ENCODING$$' ],
                  position: xmlDeclPToken.params[1].value,
               });
            });

         });

         describe('standalone parameter', () => {

            it('reports an error if a standalone is in the wrong order', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: SToken.fromString('<?'),
                  openSpace: SToken.fromString(' '),
                  target: SToken.fromString('xml'),
                  targetSpace: SToken.fromString(' '),
                  params: [{
                     name: SToken.fromString('standalone'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('yes'),
                  }, {
                     name: SToken.fromString('version'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('1.0'),
                  }],
                  close: SToken.fromString('?>'),
               });

               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_ORDER,
                  params: undefined,
                  position: xmlDeclPToken.params[0].name,
               });
            });

            it('reports an error if the standalone is neither "yes" or "no"', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
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
                     name: SToken.fromString('standalone'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('Maybe'),
                  }],
                  close: SToken.fromString('?>'),
               });

               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData(EntityKind.EXTERNAL));

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
                  params: [ 'Maybe' ],
                  position: xmlDeclPToken.params[1].value,
               });
            });

            it('reports an error if the standalone is the wrong case', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
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
                     name: SToken.fromString('standalone'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('YES'),
                  }],
                  close: SToken.fromString('?>'),
               });

               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData(EntityKind.EXTERNAL));

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
                  params: [ 'yes', 'YES' ],
                  position: xmlDeclPToken.params[1].value,
               });
            });

         });

         describe('other parameter', () => {

            it('reports an error if a an unknown parameter is found (parsing wont actually allow this)', () => {
               xmlDeclPToken = new XmlDeclarationPToken({
                  open: SToken.fromString('<?'),
                  openSpace: SToken.fromString(' '),
                  target: SToken.fromString('xml'),
                  targetSpace: SToken.fromString(' '),
                  params: [{
                     name: SToken.fromString('bogus'),
                     nameSpace: SToken.fromString(' '),
                     equal: SToken.fromString('='),
                     equalSpace: SToken.fromString(' '),
                     value: SToken.fromString('1.0'),
                  }],
                  close: SToken.fromString('?>'),
               });

               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_PARAM_UNKNOWN,
                  params: [ 'bogus' ],
                  position: xmlDeclPToken.params[0].name,
               });
            });

         });

      });

   });

   describe('pToken.toXToken()', () => {

      it('sets all parameters using the input', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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
            }, {
               name: SToken.fromString('standalone'),
               nameSpace: SToken.fromString(' '),
               equal: SToken.fromString('='),
               equalSpace: SToken.fromString(' '),
               value: SToken.fromString('yes'),
            }],
            close: SToken.fromString('?>'),
         });

         const result = xmlDeclPToken.toXToken();

         expect(result).toEqual(new XmlDeclarationXToken(1.0, 'UTF-99', true, xmlDeclPToken));
      });

      it('sets version to 1.1 if that is what is passed in', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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

         const result = xmlDeclPToken.toXToken();

         expect(result).toEqual(new XmlDeclarationXToken(1.1, undefined, undefined, xmlDeclPToken));
      });

      it('sets default parameters when input has none', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            openSpace: SToken.fromString(' '),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [],
            close: SToken.fromString('?>'),
         });

         const result = xmlDeclPToken.toXToken();

         expect(result).toEqual(new XmlDeclarationXToken(1.0, 'utf-8', false, xmlDeclPToken));
      });

      it('sets default values when input values are erronious', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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

         const result = xmlDeclPToken.toXToken();

         expect(result).toEqual(new XmlDeclarationXToken(1.0, 'some-encoding', false, xmlDeclPToken));
      });

      it('treats a mis-cased standalone as the correct case', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
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

         const result = xmlDeclPToken.toXToken();

         expect(result).toEqual(new XmlDeclarationXToken(1.0, 'some-encoding', true, xmlDeclPToken));
      });

   });

   describe('pToken.toSTokenArray()', () => {

      it('calls entityInstruction.sTokensFromPToken', () => {
         const entitySpy = spyOn(entityInstr, 'sTokensFromPToken');
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
         });

         xmlDeclPToken.toSTokenArray();

         expect(entitySpy).toHaveBeenCalledWith(xmlDeclPToken);

      });

   });

   describe('pToken.isStandalone()', () => {

      it('returns false if there is no standalone property', () => {
         expect(xmlDeclPToken.isStandalone()).toEqual(false);
      });

      it('returns true if there is a standalone property set to yes', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            params: [{
               name: SToken.fromString('standalone'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
               value: SToken.fromString('yes'),
            }],
            close: SToken.fromString('?>'),
         });

         expect(xmlDeclPToken.isStandalone()).toEqual(true);
      });

      it('returns false if there is a standalone property set to no', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            params: [{
               name: SToken.fromString('standalone'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
               value: SToken.fromString('no'),
            }],
            close: SToken.fromString('?>'),
         });

         expect(xmlDeclPToken.isStandalone()).toEqual(false);
      });

      it('returns true if there is a standalone property and value are all the wrong case', () => {
         xmlDeclPToken = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            params: [{
               name: SToken.fromString('StAndAlOne'),
               nameSpace: undefined,
               equal: SToken.fromString('='),
               equalSpace: undefined,
               value: SToken.fromString('YeS'),
            }],
            close: SToken.fromString('?>'),
         });

         expect(xmlDeclPToken.isStandalone()).toEqual(true);
      });

   });

});
