/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Offset, EntityKind } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { makeSToken } from 'sToken-test';
import {
   declaration,

   attListDeclaration,
   elementDeclaration,
   ProcessingInstructionPToken,

   CdataPToken,
   CharDataPToken,
   CommentPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityReferencePToken,
   SpacePToken,
   TextDeclarationPToken,
   XmlDeclarationPToken,
   GeneralEntityStartPToken,
   CharRefPToken,
   ElementEndPToken,
   ElementStartPToken,
   ELEMENT_EMPTY_PTOKEN,
   ElementEmptyPToken,
   ParameterEntityStartPToken,
   TextPToken,
} from 'token';

import CheckPTokenWellFormedStream, { CheckWellFormedState } from '../CheckPTokenWellFormedStream';
import { ElementDeclarationPToken } from 'source/token/elementDeclaration';
import { SToken } from 'sToken';
import { expectNoErrorsOrWarnings, expectError } from 'source/expand/@test/utils';
import { AttributePToken } from 'source/token/common/attribute';
import { AttListPToken } from 'source/token/attListDeclaration';

type Token = { type: string, [other: string]: any };
type TokenArray = Array<Token>;

describe('CheckPTokenWellFormedStream (unit)', () => {
   let checker: CheckPTokenWellFormedStream;
   let metaData: EntityMetaData;

   beforeEach(() => {
      checker = new CheckPTokenWellFormedStream();
      metaData = new EntityMetaData();
   });

   it('passes unknown values through unchanged', () => {
      checker.write({
         type: 'BOGUS',
      });

      expect(checker.read()).toEqual({
         type: 'BOGUS',
      });
   });

   describe('attListDeclaration', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = {
            type: attListDeclaration.PTYPE,
            open: makeSToken('<!'),
            attDefs: [],
         };
      });

      it('calls attListDeclaration.checkWellFormed() when encountering a PToken', () => {
         const cwfSpy = spyOn(attListDeclaration, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('attribute definitions', () => {
         let docTypeStart: DocTypeStartPToken;
         let docTypeEnd: DocTypeEndPToken;
         let xmlDecl: XmlDeclarationPToken ;
         let geRef: GeneralEntityReferencePToken;
         let ge: GeneralEntityDeclarationPToken;

         beforeEach(() => {
            geRef = new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('ge'),
               close: SToken.fromString(';'),
            });
            pToken = new AttListPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('ATTLIST'),
               declTypeSpace: SToken.fromString(' '),
               elementName: SToken.fromString('root'),
               postElementNameSpace: SToken.fromString(' '),
               attDefs: [{
                  name: SToken.fromString('att1'),
                  postNameSpace: SToken.fromString(' '),
                  type: SToken.fromString('CDATA'),
                  postTypeSpace: SToken.fromString(' '),
                  openQuote: SToken.fromString('"'),
                  value: [geRef],
                  closeQuote: SToken.fromString('"'),
               }],
               close: SToken.fromString('>'),
            });
            ge = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('ENTITY'),
               name: SToken.fromString('ge'),
               nameSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               value: [],
               closeQuote: SToken.fromString('"'),
               close: SToken.fromString('>'),
            });
            docTypeStart = new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('DOCTYPE'),
               name: SToken.fromString('root'),
               openSubset: SToken.fromString('['),
            });
            docTypeEnd = new DocTypeEndPToken({
               docTypeStartPToken: docTypeStart,
               closeSubset: SToken.fromString(']'),
               close: SToken.fromString('>'),
            });
            xmlDecl = new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               target: SToken.fromString('xml'),
               targetSpace: SToken.fromString(' '),
               params: [{
                  name: SToken.fromString('version'),
                  value: SToken.fromString('1.0'),
               }],
               close: SToken.fromString('?>'),
            });
         });

         it('reports an error if there is a reference in the default value to an unparsed entity in an attribute value (§4.1.0)', (done) => {
            const declaration = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('unp'),
               nDataName: SToken.fromString('image/jpeg'),
               close: SToken.fromString('>'),
            });
            const unparsedReference = new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('unp'),
            });
            const attribute: AttributePToken = {
               name: SToken.fromString('foo'),
               value: [unparsedReference],
            };
            pToken.attDefs = [attribute];

            checker.write(metaData);
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(declaration);
            checker.write(docTypeEnd);
            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_UNPARSED_NO_USE, [], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports no errors if there was a declaration before the attlist (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(ge);
            checker.write(pToken);
            checker.write(docTypeEnd);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

         it('reports an error if there was a declaration after the attlist (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(pToken);
            checker.write(ge);
            checker.write(docTypeEnd);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, ['ge'], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports an error if there was not a declaration at all (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(pToken);
            checker.write(docTypeEnd);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, ['ge'], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports no error if there is only an internal DTD that has perefs before the ATTLIST and there is no declaration for the ref (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('pe'),
               close: SToken.fromString(';'),
            }));
            checker.write(pToken);
            checker.write(docTypeEnd);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

         it('reports an error if there is only an internal DTD that has perefs AFTER the ATTLIST and there is no declaration for the ref (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(pToken);
            checker.write(new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('pe'),
               close: SToken.fromString(';'),
            }));
            checker.write(docTypeEnd);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, ['ge'], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports error if there was no declaration but there was an external subset (logically wrong, but matches the spec) (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('DOCTYPE'),
               declTypeSpace: SToken.fromString(' '),
               name: SToken.fromString('foo'),
               externalId: {
                  idType: SToken.fromString('SYSTEM'),
                  postIdTypeSpace: SToken.fromString(' '),
                  system: {
                     openQuote: SToken.fromString('"'),
                     value: [ new TextPToken({ text: SToken.fromString('http://somewhere.com') }) ],
                     closeQuote: SToken.fromString('"'),
                  },
               },
               openSubset: SToken.fromString('['),
            }));
            checker.write(pToken);
            checker.write(docTypeEnd);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ATTLISTDECL_INVALID_CONTEXT);
         });

      });

   });

   describe('cdata', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new CdataPToken({
            open: makeSToken('<!['),
            text: makeSToken('good'),
         });
         spyOn(pToken, 'checkWellFormed');
      });

      it('calls cdata.checkWellFormed() when encountering a CDATA', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = pToken.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', () => {
            const checkerPushSpy = spyOn(checker, 'push');
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            checker.write(pToken);

            expect(checkerPushSpy.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CDATA_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('charData', () => {
      let pToken: CharDataPToken;

      beforeEach(() => {
         pToken = new CharDataPToken({
            text: makeSToken('good'),
         });
      });

      it('calls charData.checkWellFormed() when encountering a CHARDATA', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', () => {
            const checkerPushSpy = spyOn(checker, 'push');
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            checker.write(pToken);

            expect(checkerPushSpy.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('charRef', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new CharRefPToken({
            open: makeSToken('&#'),
            digits: makeSToken('234'),
            close: makeSToken(';'),
            charCode: 234,
         });
      });

      it('calls cdata.checkWellFormed() when encountering a charRef', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', (done) => {
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;

            checker.write(pToken);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

         it('reports an error if not IN_CONTENT', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CHARREF_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('comment', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new CommentPToken({
            open: makeSToken('<!--'),
            text: makeSToken('good'),
            close: makeSToken('-->'),
         });
      });

      it('calls comment.checkWellFormed() when encountering a COMMENT', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in non-start state', () => {
            const checkerPushSpy = spyOn(checker, 'push');
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            checker.write(pToken);

            expect(checkerPushSpy.calls.count()).toEqual(1); // for the pToken itself
         });

         it('reports an error if in start', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
         });

      });

   });

   it('calls declaration.checkWellFormed() when encountering an declaration parsing', () => {
      const cwfSpy = spyOn(declaration, 'checkWellFormed');
      const pToken = {
         type: declaration.PTYPE,
         open: makeSToken('<'),
      };
      checker.write(metaData);
      checker.write(pToken);

      const args = cwfSpy.calls.argsFor(0);
      expect(args[0]).toEqual(pToken);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   describe('docTypeStart', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new DocTypeStartPToken({
            open: makeSToken('<'),
         });
      });

      it('calls docTypeStart.checkWellFormed() when encountering an DOCTYPE start parsing', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if in the DTD', () => {
            (checker as any)._state = 'IN_DTD';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
         });

         it('leaves state in PREDOCTYPE if not starting internal subset', () => {
            (checker as any)._state = 'PROLOG_PREDOCTYPE';
            pToken.openSubset = false;
            checker.write(pToken);

            expect((checker as any)._state).toEqual('PROLOG_PREDOCTYPE');
         });

         it('changes state to IN_DTD if in PREDOCTYPE and starting internal subset', () => {
            (checker as any)._state = 'PROLOG_PREDOCTYPE';
            pToken.openSubset = true;
            checker.write(pToken);

            expect((checker as any)._state).toEqual('IN_DTD');
         });

      });

   });

   describe('docTypeEnd', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new DocTypeEndPToken({
            docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
            closeSubset: makeSToken(']'),
         });
      });

      it('calls docTypeEnd.checkWellFormed() when encountering a doctype end parsing', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports state error if the end comes without a start', (done) => {
            const results: TokenArray = [];

            checker.on('data', (data: Token) => {
               results.push(data);
            });
            checker.on('end', () => {
               expect(results[0]).toEqual(new WellFormedError('DOCTYPE_INVALID_DOC_CONTEXT', undefined,
                  new Offset(new EntityLocation(), 0, 0, 0), new Offset(new EntityLocation(), 0, 0, 0)));
               done();
            });

            checker.write(pToken);
            checker.end();
         });

      });

   });

   describe('elementStart', () => {
      let pToken: ElementStartPToken;
      let cwfSpy: jasmine.Spy;
      let docTypeStart: DocTypeStartPToken;
      let docTypeEnd: DocTypeEndPToken;
      let xmlDecl: XmlDeclarationPToken ;

      beforeEach(() => {
         pToken = new ElementStartPToken({
            open: SToken.fromString('<'),
         });
         cwfSpy = spyOn(pToken, 'checkWellFormed');
      });

      it('calls elementStart.checkWellFormed() when encountering an element start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      it('calls elementStart.checkWellFormed() when encountering an empty element', () => {
         (pToken as any).type = ELEMENT_EMPTY_PTOKEN;
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('attributes', () => {
         let docTypeStart: DocTypeStartPToken;
         let docTypeEnd: DocTypeEndPToken;
         let xmlDecl: XmlDeclarationPToken ;
         let geRef: GeneralEntityReferencePToken;
         let ge: GeneralEntityDeclarationPToken;

         beforeEach(() => {
            geRef = new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('ge'),
               close: SToken.fromString(';'),
            });
            pToken = new ElementStartPToken({
               open: SToken.fromString('<'),
               name: SToken.fromString('root'),
               nameSpace: SToken.fromString(' '),
               attributes: [{
                  name: SToken.fromString('att1'),
                  equal: SToken.fromString('='),
                  openQuote: SToken.fromString('"'),
                  value: [geRef],
                  closeQuote: SToken.fromString('"'),
               }],
               close: SToken.fromString('>'),
            });
            ge = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('ENTITY'),
               name: SToken.fromString('ge'),
               nameSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               value: [],
               closeQuote: SToken.fromString('"'),
               close: SToken.fromString('>'),
            });
            docTypeStart = new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('DOCTYPE'),
               name: SToken.fromString('root'),
               openSubset: SToken.fromString('['),
            });
            docTypeEnd = new DocTypeEndPToken({
               docTypeStartPToken: docTypeStart,
               closeSubset: SToken.fromString(']'),
               close: SToken.fromString('>'),
            });
            xmlDecl = new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               target: SToken.fromString('xml'),
               targetSpace: SToken.fromString(' '),
               params: [{
                  name: SToken.fromString('version'),
                  value: SToken.fromString('1.0'),
               }],
               close: SToken.fromString('?>'),
            });
         });

         it('reports an error if there is a reference to an unparsed entity in an attribute value (§4.1.0)', (done) => {
            const declaration = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('unp'),
               nDataName: SToken.fromString('image/jpeg'),
               close: SToken.fromString('>'),
            });
            const unparsedReference = new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('unp'),
            });
            const attribute: AttributePToken = {
               name: SToken.fromString('foo'),
               value: [unparsedReference],
            };
            pToken.attributes.push(attribute);

            checker.write(metaData);
            checker.write(declaration);
            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_UNPARSED_NO_USE, [], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports no error if there is the start of a parsed entity in an attribute value (§4.1.0)', (done) => {
            const declaration = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('unp'),
               nameSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               value: [],
               closeQuote: SToken.fromString('"'),
               close: SToken.fromString('>'),
            });
            const reference = new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('unp'),
            });
            const start = new GeneralEntityStartPToken(reference);
            const attribute: AttributePToken = {
               name: SToken.fromString('foo'),
               equal: SToken.fromString('='),
               openQuote: SToken.fromString('"'),
               value: [start, new TextPToken({ text: SToken.fromString('x') })],
               closeQuote: SToken.fromString('"'),
            };
            (pToken as any).attributes = [ attribute ];

            checker.write(metaData);
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(declaration);
            checker.write(docTypeEnd);
            checker.write(pToken);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

         it('reports no errors if there was a declaration (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(ge);
            checker.write(docTypeEnd);
            checker.write(pToken);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

         it('reports an error if there was not a declaration (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(docTypeStart);
            checker.write(docTypeEnd);
            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, ['ge'], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports no error if there was no declaration but there was an external subset (§4.1.0)', (done) => {
            checker.write(xmlDecl);
            checker.write(new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               declType: SToken.fromString('DOCTYPE'),
               declTypeSpace: SToken.fromString(' '),
               name: SToken.fromString('foo'),
               externalId: {
                  idType: SToken.fromString('SYSTEM'),
                  postIdTypeSpace: SToken.fromString(' '),
                  system: {
                     openQuote: SToken.fromString('"'),
                     value: [ new TextPToken({ text: SToken.fromString('http://somewhere.com') }) ],
                     closeQuote: SToken.fromString('"'),
                  },
               },
            }));
               checker.write(docTypeEnd);
            checker.write(pToken);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

      });

      describe('state checking', () => {

         it('changes the state to be in content if in PROLOG state', () => {
            (checker as any)._state = 'PROLOG';
            checker.write(pToken);

            expect((checker as any)._state).toEqual('IN_CONTENT');
         });

         it('changes the state to be in content if in PROLOG_PREDOCTYPE state', () => {
            (checker as any)._state = 'PROLOG_PREDOCTYPE';
            checker.write(pToken);

            expect((checker as any)._state).toEqual('IN_CONTENT');
         });

         it('reports an error if in the DTD', () => {
            (checker as any)._state = 'IN_DTD';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
         });

         it('reports an error if in some other state', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
         });

         it('reports an error if after content (§2.1 production [1])', () => {
            (checker as any)._state = 'AFTER_CONTENT';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_NO_MULTIPLE);
         });

         it('reports no error if in content', () => {
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.count()).toEqual(1);
         });

         it('errors include the element name if present', () => {
            (pToken as any).name = makeSToken('bogusName');
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].message).toContain('bogusName');
         });

      });

   });

   describe('elementEnd', () => {
      let pToken: Token;
      let cwfSpy: jasmine.Spy;

      beforeEach(() => {
         pToken = new ElementEndPToken({
            open: makeSToken('</'),
            close: makeSToken('>'),
         });
         cwfSpy = spyOn(pToken, 'checkWellFormed');
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         beforeEach(() => {
            checker.write(metaData);
            checker.write(new ElementStartPToken({
               open: makeSToken('<'),
            }));
         });

         it('reports an error if in the DTD', () => {
            (checker as any)._state = 'IN_DTD';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
         });

         it('reports an error if in some other state', () => {
            (checker as any)._state = 'PROLOG';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
         });

         it('reports no error if in content', () => {
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.count()).toEqual(1);
         });

         it('errors include the element name if present', () => {
            pToken.name = makeSToken('bogusName');
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].message).toContain('bogusName');
         });

         describe('tag balance', () => {

            beforeEach(() => {
               (checker as any)._state = 'PROLOG_PREDOCTYPE';
               checker.write(new ElementStartPToken({
                  open: makeSToken('<'),
                  name: makeSToken('one'),
               }));
            });

            it('reports an error if trying to close an element that was not opened', () => {
               pToken.name = makeSToken('two');
               const checkerPushSpy = spyOn(checker, 'push');
               checker.write(pToken);

               expect(checkerPushSpy.calls.argsFor(0)[0])
                  .toEqual(new WellFormedError(WellFormedError.ID.ELEMENT_UNBALANCED, [ 'one', 'two' ],
                     new Offset(new EntityLocation(), 0, 0, 0),
                     new Offset(new EntityLocation(), 0, 0, 0)));
            });

            it('reports no error if child is closed and then parent closed', () => {
               checker.write(new ElementStartPToken({
                  open: makeSToken('<'),
                  name: makeSToken('two'),
               }));
               pToken.name = makeSToken('two');
               checker.write(pToken);
               const checkerPushSpy = spyOn(checker, 'push');
               pToken.name = makeSToken('one');
               checker.write(pToken);

               expect(checkerPushSpy.calls.count()).toEqual(1);  // for the pToken itself
            });

            it('reports no error if an empty element is found between start and end', () => {
               checker.write(new ElementEmptyPToken({
                  open: makeSToken('</'),
                  name: makeSToken('two'),
                  close: makeSToken('>'),
               }));
               const checkerPushSpy = spyOn(checker, 'push');
               pToken.name = makeSToken('one');
               checker.write(pToken);

               expect(checkerPushSpy.calls.count()).toEqual(1);  // for the pToken itself
            });

         });

      });

   });

   describe('element declaration', () => {

      it('calls elementDeclaration.checkWellFormed() when encountering an ELEMENT declaration parsing', () => {
         const pToken = new ElementDeclarationPToken({
            open: makeSToken('<'),
         });
         const cwfSpy = spyOn(elementDeclaration, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            const pToken = new ElementDeclarationPToken({
               open: makeSToken('<'),
            });
            (checker as any)._state = CheckWellFormedState.IN_CONTENT;
            const checkerPushSpy = spyOn(checker, 'push');

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENTDECL_INVALID_CONTEXT);
         });

      });

   });

   it('calls entityDeclaration.checkWellFormed() when encountering an ENTITY declaation parsing', () => {
      const pToken = new GeneralEntityDeclarationPToken({
         open: makeSToken('<'),
      });
      const cwfSpy = spyOn(pToken, 'checkWellFormed');
      checker.write(metaData);
      checker.write(pToken);

      const args = cwfSpy.calls.argsFor(0);
      expect(args[0]).toBeInstanceOf(ErrorCollector);
      expect(args[1]).toEqual(metaData);
   });

   describe('general entity reference', () => {
      let pToken: GeneralEntityReferencePToken;
      let docTypeStart: DocTypeStartPToken;
      let docTypeEnd: DocTypeEndPToken;
      let elementStart: ElementStartPToken;
      let xmlDecl: XmlDeclarationPToken ;

      beforeEach(() => {
         pToken = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('fred'),
            close: SToken.fromString(';'),
         });

         docTypeStart = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            declType: SToken.fromString('DOCTYPE'),
            name: SToken.fromString('foo'),
            openSubset: SToken.fromString('['),
         });
         docTypeEnd = new DocTypeEndPToken({
            docTypeStartPToken: docTypeStart,
            closeSubset: SToken.fromString(']'),
            close: SToken.fromString('>'),
         });
         xmlDecl = new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               value: SToken.fromString('1.0'),
            }],
            close: SToken.fromString('?>'),
         });
         elementStart = new ElementStartPToken({
            open: SToken.fromString('<'),
            name: SToken.fromString('fred'),
            close: SToken.fromString('>'),
         });
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      it('reports no errors if there was a declaration (§4.1.0)', (done) => {
         checker.write(xmlDecl);
         checker.write(docTypeStart);
         checker.write(new GeneralEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            declType: SToken.fromString('ENTITY'),
            name: SToken.fromString('fred'),
            nameSpace: SToken.fromString(' '),
            openQuote: SToken.fromString('"'),
            value: [],
            closeQuote: SToken.fromString('"'),
            close: SToken.fromString('>'),
         }));
         checker.write(docTypeEnd);
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         expectNoErrorsOrWarnings(checker, done);
      });

      it('reports an error if there was no DTD and there is no declaration (§4.1.0)', (done) => {
         const docTypeStartPToken = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            declType: SToken.fromString('DOCTYPE'),
            name: SToken.fromString('foo'),
         });

         checker.write(xmlDecl);
         checker.write(docTypeStartPToken);
         checker.write(new DocTypeEndPToken({
            docTypeStartPToken,
            close: SToken.fromString('>'),
         }));
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, [ 'fred' ], pToken.open, pToken.open);
         expectError(checker, expected, done);
      });

      it('reports an error if there is only an internal DTD (that has no perefs) and there is no declaration for the ref (§4.1.0)', (done) => {
         checker.write(xmlDecl);
         checker.write(docTypeStart);
         checker.write(docTypeEnd);
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, [ 'fred' ], pToken.open, pToken.open);
         expectError(checker, expected, done);
      });

      it('reports no error if there is only an internal DTD (that has no perefs) and there is no declaration for the ref, but it is to one of the special entities (§4.1.0)', (done) => {
         pToken = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('quot'),
            close: SToken.fromString(';'),
         });
         checker.write(xmlDecl);
         checker.write(docTypeStart);
         checker.write(docTypeEnd);
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         expectNoErrorsOrWarnings(checker, done);
      });

      it('reports no error if there is an extneral DTD and there is no declaration for the ref (§4.1.0)', (done) => {
         checker.write(xmlDecl);
         checker.write(new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            declType: SToken.fromString('DOCTYPE'),
            declTypeSpace: SToken.fromString(' '),
            name: SToken.fromString('foo'),
            externalId: {
               idType: SToken.fromString('SYSTEM'),
               postIdTypeSpace: SToken.fromString(' '),
               system: {
                  openQuote: SToken.fromString('"'),
                  value: [ new TextPToken({ text: SToken.fromString('http://somewhere.com') }) ],
                  closeQuote: SToken.fromString('"'),
               },
            },
         }));
         checker.write(docTypeEnd);
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         expectNoErrorsOrWarnings(checker, done);
      });

      it('reports no error if there is only an internal DTD that has perefs and there is no declaration for the ref (§4.1.0)', (done) => {
         checker.write(xmlDecl);
         checker.write(docTypeStart);
         checker.write(new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe'),
            close: SToken.fromString(';'),
         }));
         checker.write(docTypeEnd);
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         expectNoErrorsOrWarnings(checker, done);
      });

      it('reports an error if standalone is yes and no declaration found (§4.1.0)', (done) => {
         const docTypeStartPToken = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            declType: SToken.fromString('DOCTYPE'),
            name: SToken.fromString('foo'),
         });

         checker.write(new XmlDeclarationPToken({
            open: SToken.fromString('<?'),
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
            params: [{
               name: SToken.fromString('version'),
               value: SToken.fromString('1.0'),
            }, {
               name: SToken.fromString('standalone'),
               value: SToken.fromString('yes'),
            }],
            close: SToken.fromString('?>'),
         }));
         checker.write(docTypeStartPToken);
         checker.write(new DocTypeEndPToken({
            docTypeStartPToken,
            close: SToken.fromString('>'),
         }));
         checker.write(elementStart);
         checker.write(pToken);
         checker.end();

         const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, [ 'fred' ], pToken.open, pToken.open);
         expectError(checker, expected, done);
      });

      describe('state checking', () => {

         it('reports an error if not IN_CONTENT', (done) => {
            (checker as any)._state = 'IN_DTD';

            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT, [], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports an error if there was no declaration', (done) => {
            (checker as any)._state = 'IN_CONTENT';

            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION, ['fred'], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports an error if n unparsed entity reference is found in content (§4.1.0)', (done) => {
            const declaration = new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('fred'),
               nDataName: SToken.fromString('image/jpeg'),
               close: SToken.fromString('>'),
            });
            (checker as any)._state = 'IN_CONTENT';

            checker.write(declaration);
            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.REFERENCE_UNPARSED_NO_USE, [], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

      });

   });

   describe('parameter entity reference', () => {
      let pToken: ParameterEntityReferencePToken;

      beforeEach(() => {
         pToken = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('foo'),
            close: SToken.fromString(';'),
         });
      });

      it('calls elementEnd.checkWellFormed() when encountering PEReference', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');

         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', (done) => {
            (checker as any)._state = 'START';

            checker.write(pToken);
            checker.end();

            const expected = new WellFormedError(WellFormedError.ID.PEREF_INVALID_CONTEXT, [], pToken.open, pToken.open);
            expectError(checker, expected, done);
         });

         it('reports no error if IN_DTD', (done) => {
            (checker as any)._state = CheckWellFormedState.IN_DTD;

            checker.write(pToken);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

      });

   });

   describe('parameter entity start', () => {
      let pToken: ParameterEntityStartPToken;

      beforeEach(() => {
         pToken = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('<!') }));
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', (done) => {
            (checker as any)._state = 'START';
            checker.write(pToken);
            checker.end();

            expectError(checker, new WellFormedError(WellFormedError.ID.PEREF_INVALID_CONTEXT, [], pToken.referencePToken.open, pToken.referencePToken.open), done);
         });

         it('reports no error if IN_DTD', (done) => {
            (checker as any)._state = CheckWellFormedState.IN_DTD;
            checker.write(pToken);
            checker.end();

            expectNoErrorsOrWarnings(checker, done);
         });

      });

   });

   it('calls notationDeclaration.checkWellFormed() when encountering a notation declaration', () => {
      const pToken = new NotationDeclarationPToken({
         open: makeSToken('<!'),
      });
      const cwfSpy = spyOn(pToken, 'checkWellFormed');
      checker.write(metaData);
      checker.write(pToken);

      const args = cwfSpy.calls.argsFor(0);
      expect(args[0]).toBeInstanceOf(ErrorCollector);
      expect(args[1]).toEqual(metaData);
   });

   it('reports an error if a NOTATION declaration is encountered not in the DTD', () => {
      (checker as any)._state = 'START';
      checker.write(metaData);
      const pToken = new NotationDeclarationPToken({
         open: makeSToken('<!'),
      });

      const checkerPushSpy = spyOn(checker, 'push');
      checker.write(pToken);

      expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_INVALID_CONTEXT);
   });

   describe('processingInstruction', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new ProcessingInstructionPToken({
            open: makeSToken('<?'),
         });
         spyOn(pToken, 'checkWellFormed');
      });

      it('calls pToken.checkWellFormed()', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = pToken.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not yet started', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.PI_INVALID_CONTEXT);
         });

      });

   });

   describe('space', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new SpacePToken({
            text: makeSToken(' '),
         });
      });

      it('calls spacePToken.checkWellFormed() when encountering a space parsing', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         (checker as any)._state = CheckWellFormedState.IN_CONTENT;
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if found at the start of a file', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.SPACE_INVALID_CONTEXT);
         });

      });

   });

   describe('textDeclaration', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new TextDeclarationPToken({
            open: makeSToken('<?'),
         });
      });

      it('calls pToken.checkWellFormed() when encountering an Text Declaration parsing', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no error if encountered at the start of a file', () => {
            const checkerPushSpy = spyOn(checker, 'push');
            metaData = new EntityMetaData(EntityKind.EXTERNAL, 1.0, 5);
            (checker as any)._state = 'START';
            spyOn(pToken, 'checkWellFormed');

            checker.write(metaData);
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(1)[0].id).toBeUndefined();
         });

         it('reports an error if encountered not at the start of a file', () => {
            (checker as any)._state = 'IN_CONTENT';
            const checkerPushSpy = spyOn(checker, 'push');

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.TEXTDECL_INVALID_CONTEXT);
         });

         it('reports an error if encountered at the start of a document entity', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(new EntityMetaData(EntityKind.DOCUMENT));

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(1)[0].id).toEqual(WellFormedError.ID.TEXTDECL_INVALID_CONTEXT);
         });

      });

   });

   describe('xmlDeclaration', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = new XmlDeclarationPToken({
            open: makeSToken('<?'),
         });
      });

      it('calls pToken.checkWellFormed() when encountering an XML Declaration parsing', () => {
         const cwfSpy = spyOn(pToken, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if encountered after the start of the file', () => {
            (checker as any)._state = 'IN_DTD';
            const checkerPushSpy = spyOn(checker, 'push');

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
         });

         it('reports an error if encountered at the start of a non-document entity', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(new EntityMetaData(EntityKind.EXTERNAL));

            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(1)[0].id).toEqual(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
         });

      });

   });

});
