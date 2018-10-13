/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Offset } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';

import { SToken } from '../../sToken';
import { makeSToken } from '../../sToken/@test/helper';
import {
   declaration,
   instruction,

   attListDeclaration,
   charData,
   charRef,
   comment,
   docTypeEnd,
   docTypeStart,
   elementEnd,
   elementStart,
   elementDeclaration,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   ProcessingInstructionPToken,
   space,
   xmlDeclaration,
   CdataPToken,
} from '../../token';

import CheckPTokenWellFormedStream from '../CheckPTokenWellFormedStream.js';

describe('CheckPTokenWellFormedStream (unit)', () => {
   let checker;
   let metaData;

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
      let pToken;

      beforeEach(() => {
         spyOn(attListDeclaration, 'checkWellFormed');
         pToken = {
            type: attListDeclaration.PTYPE,
            open: makeSToken('<!'),
         };
      });

      it('calls attListDeclaration.checkWellFormed() when encountering a PToken', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = attListDeclaration.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            checker._state = 'IN_CONTENT';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ATTLISTDECL_INVALID_CONTEXT);
         });

      });

   });

   describe('cdata', () => {
      let pToken;

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
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';
            checker.write(pToken);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CDATA_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('charData', () => {
      let pToken;

      beforeEach(() => {
         spyOn(charData, 'checkWellFormed');
         pToken = {
            type: charData.PTYPE,
            text: makeSToken('good'),
         };
      });

      it('calls charData.checkWellFormed() when encountering a CHARDATA', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = charData.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', () => {
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';
            checker.write(pToken);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('charRef', () => {
      let pToken;

      beforeEach(() => {
         spyOn(charRef, 'checkWellFormed');
         pToken = new charRef.CharRefPToken({
            open: makeSToken('&#'),
            digits: makeSToken('234'),
            close: makeSToken(';')
         });
      });

      it('calls cdata.checkWellFormed() when encountering a charRef', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = charRef.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', () => {
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';

            checker.write(pToken);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'START';
            spyOn(checker, 'push');

            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CHARREF_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('comment', () => {
      let pToken;

      beforeEach(() => {
         spyOn(comment, 'checkWellFormed');
         pToken = {
            type: comment.PTYPE,
            text: makeSToken('good'),
            close: makeSToken('-->'),
         };
      });

      it('calls comment.checkWellFormed() when encountering a COMMENT', () => {
         checker.write(pToken);

         const args = comment.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in non-start state', () => {
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';
            checker.write(pToken);

            expect(checker.push.calls.count()).toEqual(1); // for the pToken itself
         });

         it('reports an error if in start', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
         });

      });

   });

   it('calls declaration.checkWellFormed() when encountering an declaration parsing', () => {
      spyOn(declaration, 'checkWellFormed');
      const pToken = {
         type: declaration.PTYPE,
         open: makeSToken('<'),
      };
      checker.write(metaData);
      checker.write(pToken);

      const args = declaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(pToken);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   it('calls instruction.checkWellFormed() when encountering an declaration parsing', () => {
      spyOn(instruction, 'checkWellFormed');
      const pToken = {
         type: instruction.PTYPE,
         open: makeSToken('<?'),
      };
      checker.write(metaData);
      checker.write(pToken);

      const args = instruction.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(pToken);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   describe('docTypeStart', () => {
      let pToken;

      beforeEach(() => {
         spyOn(docTypeStart, 'checkWellFormed');
         pToken = {
            type: docTypeStart.PTYPE,
            open: makeSToken('<'),
         };
      });

      it('calls docTypeStart.checkWellFormed() when encountering an DOCTYPE start parsing', () => {
         checker.write(pToken);

         const args = docTypeStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if in the DTD', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
         });

         it('leaves state in PREDOCTYPE if not starting internal subset', () => {
            checker._state = 'PROLOG_PREDOCTYPE';
            pToken.startInternalSubset = false;
            checker.write(pToken);

            expect(checker._state).toEqual('PROLOG_PREDOCTYPE');
         });

         it('changes state to IN_DTD if in PREDOCTYPE and starting internal subset', () => {
            checker._state = 'PROLOG_PREDOCTYPE';
            pToken.startInternalSubset = true;
            checker.write(pToken);

            expect(checker._state).toEqual('IN_DTD');
         });

      });

   });

   describe('docTypeEnd', () => {
      let pToken;

      beforeEach(() => {
         spyOn(docTypeEnd, 'checkWellFormed');
         pToken = {
            type: docTypeEnd.PTYPE,
            closeInternalSubset: makeSToken(']'),
         };
      });

      it('calls docTypeEnd.checkWellFormed() when encountering a doctype end parsing', () => {
         checker.write(pToken);

         const args = docTypeEnd.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[2]).toBeInstanceOf(ErrorCollector);
         expect(args[3]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports state error if the end comes without a start', (done) => {
            const results = [];

            checker.on('data', (data) => {
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
      let pToken;

      beforeEach(() => {
         spyOn(elementStart, 'checkWellFormed');
         pToken = {
            type: elementStart.PTYPE,
            open: makeSToken('<'),
         };
      });

      it('calls elementStart.checkWellFormed() when encountering an element start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = elementStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      it('calls elementStart.checkWellFormed() when encountering an empty element', () => {
         pToken.type = elementStart.EMPTY_TYPE;
         checker.write(metaData);
         checker.write(pToken);

         const args = elementStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('changes the state to be in content if in PROLOG state', () => {
            checker._state = 'PROLOG';
            checker.write(pToken);

            expect(checker._state).toEqual('IN_CONTENT');
         });

         it('changes the state to be in content if in PROLOG_PREDOCTYPE state', () => {
            checker._state = 'PROLOG_PREDOCTYPE';
            checker.write(pToken);

            expect(checker._state).toEqual('IN_CONTENT');
         });

         it('reports an error if in the DTD', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
         });

         it('reports an error if in some other state', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
         });

         it('reports no error if in content', () => {
            checker._state = 'IN_CONTENT';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('errors include the element name if present', () => {
            pToken.name = makeSToken('bogusName');
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].message).toContain('bogusName');
         });

      });

   });

   describe('elementEnd', () => {
      let pToken;

      beforeEach(() => {
         spyOn(elementEnd, 'checkWellFormed');
         pToken = {
            type: elementEnd.PTYPE,
            open: makeSToken('</'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = elementEnd.checkWellFormed.calls.argsFor(0);
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
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
         });

         it('reports an error if in some other state', () => {
            checker._state = 'PROLOG';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
         });

         it('reports no error if in content', () => {
            checker._state = 'IN_CONTENT';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('errors include the element name if present', () => {
            pToken.name = makeSToken('bogusName');
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].message).toContain('bogusName');
         });

         describe('tag balance', () => {

            beforeEach(() => {
               checker._state = 'PROLOG_PREDOCTYPE';
               checker.write({
                  type: elementStart.PTYPE,
                  open: makeSToken('<'),
                  name: makeSToken('one'),
               });
            });

            it('reports an error if trying to close an element that was not opened', () => {
               pToken.name = makeSToken('two');
               spyOn(checker, 'push');
               checker.write(pToken);

               expect(checker.push.calls.argsFor(0)[0])
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
               spyOn(checker, 'push');
               pToken.name = makeSToken('one');
               checker.write(pToken);

               expect(checker.push.calls.count()).toEqual(1);  // for the pToken itself
            });

            it('reports no error if an empty element is found between start and end', () => {
               checker.write({
                  type: elementStart.EMPTY_TYPE,
                  open: makeSToken('<'),
                  name: makeSToken('two'),
               });
               spyOn(checker, 'push');
               pToken.name = makeSToken('one');
               checker.write(pToken);

               expect(checker.push.calls.count()).toEqual(1);  // for the pToken itself
            });

         });

      });

   });

   describe('element declaration', () => {

      it('calls elementDeclaration.checkWellFormed() when encountering an ELEMENT declaration parsing', () => {
         spyOn(elementDeclaration, 'checkWellFormed');
         const pToken = {
            type: elementDeclaration.PTYPE,
            open: makeSToken('<'),
         };
         checker.write(metaData);
         checker.write(pToken);
   
         const args = elementDeclaration.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            const pToken = {
               type: elementDeclaration.PTYPE,
               open: makeSToken('<'),
            };
            checker._state = 'IN_CONTENT';
            spyOn(checker, 'push');

            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENTDECL_INVALID_CONTEXT);
         });

      });

   });

   it('calls entityDeclaration.checkWellFormed() when encountering an ENTITY declaation parsing', () => {
      spyOn(entityDeclaration, 'checkWellFormed');
      const pToken = {
         type: entityDeclaration.PTYPE,
         open: makeSToken('<'),
      };
      checker.write(metaData);
      checker.write(pToken);

      const args = entityDeclaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(pToken);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   describe('entity reference', () => {
      let pToken;

      beforeEach(() => {
         spyOn(entityReference, 'checkWellFormed');
         pToken = {
            type: entityReference.PTYPE,
            open: makeSToken('&'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = entityReference.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('parameter entity reference', () => {
      let pToken;

      beforeEach(() => {
         spyOn(entityReference, 'checkWellFormed');
         pToken = {
            type: entityReference.PARAM_PTYPE,
            open: makeSToken('%'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering PEReference', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = entityReference.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.PEREF_INVALID_CONTEXT);
         });

         it('reports no error if IN_DTD', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0]).toEqual(pToken);
         });

      });

   });

   it('calls notationDeclaration.checkWellFormed() when encountering a notation declaration', () => {
      spyOn(notationDeclaration, 'checkWellFormed');
      const pToken = {
         type: notationDeclaration.PTYPE,
         open: makeSToken('<!'),
      };
      checker.write(metaData);
      checker.write(pToken);

      const args = notationDeclaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(pToken);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   it('reports an error if a NOTATION declaration is encountered not in the DTD', () => {
      checker._state = 'START';
      checker.write(metaData);
      const pToken = {
         type: notationDeclaration.PTYPE,
         open: makeSToken('<!'),
      };

      spyOn(checker, 'push');
      checker.write(pToken);

      expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_INVALID_CONTEXT);
   });

   describe('processingInstruction', () => {
      let pToken;

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
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.PI_INVALID_CONTEXT);
         });

      });

   });

   describe('space', () => {
      let pToken;

      beforeEach(() => {
         spyOn(space, 'checkWellFormed');
         pToken = {
            type: space.PTYPE,
            text: makeSToken(' '),
         };
      });

      it('calls space.checkWellFormed() when encountering a space parsing', () => {
         checker._state = 'IN_CONTENT';
         checker.write(pToken);

         const args = space.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if found at the start of a file', () => {
            checker._state = 'START';
            spyOn(checker, 'push');

            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.SPACE_INVALID_CONTEXT);
         });

      });

   });

   describe('xmlDeclaration', () => {
      let pToken;

      beforeEach(() => {
         spyOn(xmlDeclaration, 'checkWellFormed');
         pToken = {
            type: xmlDeclaration.PTYPE,
            open: makeSToken('<?'),
         };
      });

      it('calls xmlDeclaration.checkWellFormed() when encountering an XML Declaration parsing', () => {
         checker.write(metaData);
         checker.write(pToken);

         const args = xmlDeclaration.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(pToken);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if encountered ', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');

            checker.write(pToken);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
         });

      });

   });

});
