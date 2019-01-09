/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Offset, EntityKind } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { makeSToken } from 'sToken-test';
import {
   declaration,

   attListDeclaration,
   charData,
   charRef,
   comment,
   docTypeEnd,
   docTypeStart,
   elementEnd,
   elementStart,
   elementDeclaration,
   ProcessingInstructionPToken,
   CdataPToken,

   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityReferencePToken,
   SpacePToken,
   TextDeclarationPToken,
   XmlDeclarationPToken,
} from 'token';

import CheckPTokenWellFormedStream, { CheckWellFormedState } from '../CheckPTokenWellFormedStream';
import { ElementDeclarationPToken } from 'source/token/elementDeclaration';

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
      let pToken: Token;

      beforeEach(() => {
         pToken = {
            type: charData.PTYPE,
            text: makeSToken('good'),
         };
      });

      it('calls charData.checkWellFormed() when encountering a CHARDATA', () => {
         const cwfSpy = spyOn(charData, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
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
         pToken = new charRef.CharRefPToken({
            open: makeSToken('&#'),
            digits: makeSToken('234'),
            close: makeSToken(';')
         });
      });

      it('calls cdata.checkWellFormed() when encountering a charRef', () => {
         const cwfSpy = spyOn(charRef, 'checkWellFormed');
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
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

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CHARREF_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('comment', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = {
            type: comment.PTYPE,
            text: makeSToken('good'),
            close: makeSToken('-->'),
         };
      });

      it('calls comment.checkWellFormed() when encountering a COMMENT', () => {
         const cwfSpy = spyOn(comment, 'checkWellFormed');
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
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
         pToken = {
            type: docTypeStart.PTYPE,
            open: makeSToken('<'),
         };
      });

      it('calls docTypeStart.checkWellFormed() when encountering an DOCTYPE start parsing', () => {
         const cwfSpy = spyOn(docTypeStart, 'checkWellFormed');
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
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
            pToken.startInternalSubset = false;
            checker.write(pToken);

            expect((checker as any)._state).toEqual('PROLOG_PREDOCTYPE');
         });

         it('changes state to IN_DTD if in PREDOCTYPE and starting internal subset', () => {
            (checker as any)._state = 'PROLOG_PREDOCTYPE';
            pToken.startInternalSubset = true;
            checker.write(pToken);

            expect((checker as any)._state).toEqual('IN_DTD');
         });

      });

   });

   describe('docTypeEnd', () => {
      let pToken: Token;

      beforeEach(() => {
         pToken = {
            type: docTypeEnd.PTYPE,
            closeInternalSubset: makeSToken(']'),
         };
      });

      it('calls docTypeEnd.checkWellFormed() when encountering a doctype end parsing', () => {
         const cwfSpy = spyOn(docTypeEnd, 'checkWellFormed');
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[2]).toBeInstanceOf(ErrorCollector);
         expect(args[3]).toEqual(metaData);
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
      let pToken: Token;
      let cwfSpy: jasmine.Spy;

      beforeEach(() => {
         cwfSpy = spyOn(elementStart, 'checkWellFormed');
         pToken = {
            type: elementStart.PTYPE,
            open: makeSToken('<'),
         };
      });

      it('calls elementStart.checkWellFormed() when encountering an element start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      it('calls elementStart.checkWellFormed() when encountering an empty element', () => {
         pToken.type = elementStart.EMPTY_TYPE;
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
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

      });

   });

   describe('elementEnd', () => {
      let pToken: Token;
      let cwfSpy: jasmine.Spy;

      beforeEach(() => {
         cwfSpy = spyOn(elementEnd, 'checkWellFormed');
         pToken = {
            type: elementEnd.PTYPE,
            open: makeSToken('</'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         beforeEach(() => {
            checker.write(metaData);
            checker.write({
               type: elementStart.PTYPE,
               open: makeSToken('<'),
            });
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
               checker.write({
                  type: elementStart.PTYPE,
                  open: makeSToken('<'),
                  name: makeSToken('one'),
               });
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
               checker.write({
                  type: elementStart.PTYPE,
                  open: makeSToken('<'),
                  name: makeSToken('two'),
               });
               pToken.name = makeSToken('two');
               checker.write(pToken);
               const checkerPushSpy = spyOn(checker, 'push');
               pToken.name = makeSToken('one');
               checker.write(pToken);

               expect(checkerPushSpy.calls.count()).toEqual(1);  // for the pToken itself
            });

            it('reports no error if an empty element is found between start and end', () => {
               checker.write({
                  type: elementStart.EMPTY_TYPE,
                  open: makeSToken('<'),
                  name: makeSToken('two'),
               });
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

   describe('entity reference', () => {
      let pToken: GeneralEntityReferencePToken;

      beforeEach(() => {
         pToken = new GeneralEntityReferencePToken({
            open: makeSToken('&'),
            name: makeSToken('fred'),
            close: makeSToken(';'),
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

      describe('state checking', () => {

         it('reports an error if not IN_CONTENT', () => {
            (checker as any)._state = 'IN_DTD';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(1)[0].id).toEqual(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
         });

         it('reports an error if there was no declaration', () => {
            (checker as any)._state = 'IN_CONTENT';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.REFERENCE_NO_DECLARATION);
         });

      });

   });

   describe('parameter entity reference', () => {
      let pToken: ParameterEntityReferencePToken;
      let cwfSpy: jasmine.Spy;

      beforeEach(() => {
         pToken = new ParameterEntityReferencePToken({
            open: makeSToken('%'),
         });
         cwfSpy = spyOn(pToken, 'checkWellFormed');
      });

      it('calls elementEnd.checkWellFormed() when encountering PEReference', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = cwfSpy.calls.argsFor(0);
         expect(args[0]).toBeInstanceOf(ErrorCollector);
         expect(args[1]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            (checker as any)._state = 'START';
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(1)[0].id).toEqual(WellFormedError.ID.PEREF_INVALID_CONTEXT);
         });

         it('reports no error if IN_DTD', () => {
            (checker as any)._state = CheckWellFormedState.IN_DTD;
            const checkerPushSpy = spyOn(checker, 'push');
            checker.write(pToken);

            expect(checkerPushSpy.calls.argsFor(1)[0]).toEqual(pToken);
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
