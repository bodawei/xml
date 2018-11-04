/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, EntityLocation, Range } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import * as misc from '../common/misc';
import { parseXmlDeclaration, XmlDeclarationPToken, XmlDeclarationXToken } from '../xmlDeclaration';
import { InstructionStart } from '../bridge/instruction';
import literal from '../common/literal';

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

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let litParse: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         litParse = spyOn(literal, 'parse');
      });

      it('does a basic parsing', () => {
         litParse.and.callFake((_1: any, _2: any, cb:() => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(xmlDeclPToken);
      });

      it('calls literal.parse()', () => {
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseXmlDeclaration(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const args = litParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            pToken: {
               name: new SToken('version', 'version', new Range(new EntityLocation(), 7, 0, 7, 14, 0, 14)),
               nameSpace: undefined,
               equal: new SToken('=', '=', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
               equalSpace: undefined,
            },
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('parses multiple attributes', () => {
         let calls = 0;
         (xmlDeclPToken.params[0].valueSpace as any) = SToken.fromString(' ');
         (xmlDeclPToken.params as any).push({
            name: SToken.fromString('encoding'),
            nameSpace: SToken.fromString(' '),
            equal: SToken.fromString('='),
            equalSpace: SToken.fromString(' '),
         });
         litParse.and.callFake((_1: any, _2: any, cb:(result?: any) => void) => {
            calls ++;
            cb(calls === 1 ? { value: [] } : undefined);
         });
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ ' ', 'space' ],
            [ 'encoding', 'peekWord', ['=', '?>'] ],
            [ 'encoding', 'word', ['=', '?>'] ],
            [ ' ', 'space' ],
            [ '=', 'match', '=' ],
            [ ' ', 'space' ],
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(xmlDeclPToken);
      });

      it('parses zero parameters', () => {
         (xmlDeclPToken.params as any).pop();
         litParse.and.callFake((_1: any, _2: any, cb:() => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [ undefined, 'peekWord', ['=', '?>'] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(xmlDeclPToken);
      });

      it('stops parsing if an unexpected parameter is found', () => {
         (xmlDeclPToken as any).close = undefined;
         litParse.and.callFake((_1: any, _2: any, cb:(result?: any) => void) => {
            cb();
         });
         const mockSource = new MockSTokenSource([
            [ 'version', 'peekWord', ['=', '?>'] ],
            [ 'version', 'word', ['=', '?>'] ],
            [ undefined, 'space' ],
            [ '=', 'match', '=' ],
            [ undefined, 'space' ],
            [ 'bogus', 'peekWord', ['=', '?>'] ],
            [ undefined, 'match', '?>' ],
         ]);

         parseXmlDeclaration(mockSource, start, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(xmlDeclPToken);
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
         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(xmlDeclPToken.target, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedText() on the version value', () => {
         (xmlDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(xmlDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedText() on the encoding value', () => {
         (xmlDeclPToken.params[0].name as any) = SToken.fromString('encoding');
         (xmlDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(xmlDeclPToken.params[0].value, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedText() on the standalone value', () => {
         (xmlDeclPToken.params[0].name as any) = SToken.fromString('standalone');
         (xmlDeclPToken.params[0].value as any) = SToken.fromString('\u0001');

         xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
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

      // it('reports an error if there are no parameters in the text declaration', () => {
      //    const emd = new EntityMetaData(EntityKind.EXTERNALSUBSET);
      //    (xmlDeclPToken as any).params = [];

      //    xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

      //    expect(mockErrorCollector).toReportError({
      //       id: WellFormedError.ID.TEXTDECL_NO_ATTRIBUTES,
      //       params: undefined,
      //       position: xmlDeclPToken.close,
      //    });
      // });

      // it('reports an error if there is no encoding in the text declaration', () => {
      //    const emd = new EntityMetaData(EntityKind.EXTERNALSUBSET);

      //    xmlDeclPToken.checkWellFormed(mockErrorCollector, emd);

      //    expect(mockErrorCollector).toReportError({
      //       id: WellFormedError.ID.TEXTDECL_NO_ENCODING,
      //       params: undefined,
      //       position: xmlDeclPToken.close,
      //    });
      // });

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

            it('reports no error if a entity is not a document', () => {
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
      
               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData(EntityKind.EXTERNAL));
   
               expect(mockErrorCollector).not.toReportError({
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

            it('reports an error if a standalone is in not in a document entity', () => {
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
                     value: SToken.fromString('yes'),
                  }],
                  close: SToken.fromString('?>'),
               });
      
               xmlDeclPToken.checkWellFormed(mockErrorCollector, new EntityMetaData(EntityKind.EXTERNAL));
   
               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.TEXTDECL_XTRA_STANDALONE,
                  params: undefined,
                  position: xmlDeclPToken.params[1].name,
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

      it('extracts all the STokens', () => {
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
               openQuote: SToken.fromString('"'),
               value: SToken.fromString('1.2'),
               closeQuote: SToken.fromString('"'),
               valueSpace: SToken.fromString(' '),
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

         const result = xmlDeclPToken.toSTokenArray();

         expect(result).toEqual([
            xmlDeclPToken.open,
            xmlDeclPToken.openSpace,
            xmlDeclPToken.target,
            xmlDeclPToken.targetSpace,
            xmlDeclPToken.params[0].name,
            xmlDeclPToken.params[0].nameSpace,
            xmlDeclPToken.params[0].equal,
            xmlDeclPToken.params[0].equalSpace,
            xmlDeclPToken.params[0].openQuote,
            xmlDeclPToken.params[0].value,
            xmlDeclPToken.params[0].closeQuote,
            xmlDeclPToken.params[0].valueSpace,
            xmlDeclPToken.params[1].name,
            xmlDeclPToken.params[1].nameSpace,
            xmlDeclPToken.params[1].equal,
            xmlDeclPToken.params[1].equalSpace,
            xmlDeclPToken.params[1].value,
            xmlDeclPToken.params[2].name,
            xmlDeclPToken.params[2].nameSpace,
            xmlDeclPToken.params[2].equal,
            xmlDeclPToken.params[2].equalSpace,
            xmlDeclPToken.params[2].value,
            xmlDeclPToken.close,
         ] as any);
      });

   });
});
