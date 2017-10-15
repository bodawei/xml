/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Offset } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';

import { makeLToken } from '../lToken/test';
import {
   declaration,
   envelope,
   instruction,

   cdata,
   charData,
   comment,
   docTypeEnd,
   docTypeStart,
   elementEnd,
   elementStart,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   xmlDeclaration,
} from '../xToken';

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream (unit)', () => {
   let checker;
   let metaData;

   beforeEach(() => {
      checker = new WFCheckStream();
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

   describe('envelope', () => {
      let parsed;

      beforeEach(() => {
         spyOn(envelope, 'checkWellFormed');
         parsed = {
            type: envelope.TYPE,
         };
      });

      it('calls envelope.checkWellFormed() when encountering a CDATA', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = envelope.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toEqual(true);
         expect(args[2]).toBeInstanceOf(ErrorCollector);
         expect(args[3]).toEqual(metaData);
      });

   });

   describe('cdata', () => {
      let parsed;

      beforeEach(() => {
         spyOn(cdata, 'checkWellFormed');
         parsed = {
            type: cdata.TYPE,
            text: makeLToken('good'),
         };
      });

      it('calls cdata.checkWellFormed() when encountering a CDATA', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = cdata.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', () => {
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';
            checker.write(parsed);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CDATA_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('charData', () => {
      let parsed;

      beforeEach(() => {
         spyOn(charData, 'checkWellFormed');
         parsed = {
            type: charData.TYPE,
            text: makeLToken('good'),
         };
      });

      it('calls charData.checkWellFormed() when encountering a CHARDATA', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = charData.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in the content state', () => {
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';
            checker.write(parsed);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('comment', () => {
      let parsed;

      beforeEach(() => {
         spyOn(comment, 'checkWellFormed');
         parsed = {
            type: comment.TYPE,
            text: makeLToken('good'),
            close: makeLToken('-->'),
         };
      });

      it('calls comment.checkWellFormed() when encountering a COMMENT', () => {
         checker.write(parsed);

         const args = comment.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports no errors when in non-start state', () => {
            spyOn(checker, 'push');
            checker._state = 'IN_CONTENT';
            checker.write(parsed);

            expect(checker.push.calls.count()).toEqual(1); // for the parsed itself
         });

         it('reports an error if in start', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
         });

      });

   });

   it('calls declaration.checkWellFormed() when encountering an declaration parsing', () => {
      spyOn(declaration, 'checkWellFormed');
      const parsed = {
         type: declaration.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = declaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   it('calls instruction.checkWellFormed() when encountering an declaration parsing', () => {
      spyOn(instruction, 'checkWellFormed');
      const parsed = {
         type: instruction.TYPE,
         open: makeLToken('<?'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = instruction.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   describe('docTypeStart', () => {
      let parsed;

      beforeEach(() => {
         spyOn(docTypeStart, 'checkWellFormed');
         parsed = {
            type: docTypeStart.TYPE,
            open: makeLToken('<'),
         };
      });

      it('calls docTypeStart.checkWellFormed() when encountering an DOCTYPE start parsing', () => {
         checker.write(parsed);

         const args = docTypeStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if in the DTD', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('docTypeEnd', () => {
      let parsed;

      beforeEach(() => {
         spyOn(docTypeEnd, 'checkWellFormed');
         parsed = {
            type: docTypeEnd.TYPE,
            closeInternalSubset: makeLToken(']'),
         };
      });

      it('calls docTypeEnd.checkWellFormed() when encountering a doctype end parsing', () => {
         checker.write(parsed);

         const args = docTypeEnd.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
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

            checker.write(parsed);
            checker.end();
         });

      });

   });

   describe('elementStart', () => {
      let parsed;

      beforeEach(() => {
         spyOn(elementStart, 'checkWellFormed');
         parsed = {
            type: elementStart.TYPE,
            open: makeLToken('<'),
         };
      });

      it('calls elementStart.checkWellFormed() when encountering an element start', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = elementStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      it('calls elementStart.checkWellFormed() when encountering an empty element', () => {
         parsed.type = elementStart.EMPTY_TYPE;
         checker.write(metaData);
         checker.write(parsed);

         const args = elementStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('changes the state to be in content if in PROLOG state', () => {
            checker._state = 'PROLOG';
            checker.write(parsed);

            expect(checker._state).toEqual('IN_CONTENT');
         });

         it('changes the state to be in content if in PROLOG_PREDOCTYPE state', () => {
            checker._state = 'PROLOG_PREDOCTYPE';
            checker.write(parsed);

            expect(checker._state).toEqual('IN_CONTENT');
         });

         it('reports an error if in the DTD', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
         });

         it('reports an error if in some other state', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
         });

         it('reports no error if in content', () => {
            checker._state = 'IN_CONTENT';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('errors include the element name if present', () => {
            parsed.name = makeLToken('bogusName');
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].message).toContain('bogusName');
         });

      });

   });

   describe('elementEnd', () => {
      let parsed;

      beforeEach(() => {
         spyOn(elementEnd, 'checkWellFormed');
         parsed = {
            type: elementEnd.TYPE,
            open: makeLToken('</'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = elementEnd.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         beforeEach(() => {
            checker.write(metaData);
            checker.write({
               type: elementStart.TYPE,
               open: makeLToken('<'),
            });
         });

         it('reports an error if in the DTD', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
         });

         it('reports an error if in some other state', () => {
            checker._state = 'PROLOG';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
         });

         it('reports no error if in content', () => {
            checker._state = 'IN_CONTENT';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.count()).toEqual(1);
         });

         it('errors include the element name if present', () => {
            parsed.name = makeLToken('bogusName');
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].message).toContain('bogusName');
         });

         describe('tag balance', () => {

            beforeEach(() => {
               checker._state = 'PROLOG_PREDOCTYPE';
               checker.write({
                  type: elementStart.TYPE,
                  open: makeLToken('<'),
                  name: makeLToken('one'),
               });
            });

            it('reports an error if trying to close an element that was not opened', () => {
               parsed.name = makeLToken('two');
               spyOn(checker, 'push');
               checker.write(parsed);

               expect(checker.push.calls.argsFor(0)[0])
                  .toEqual(new WellFormedError(WellFormedError.ID.ELEMENT_UNBALANCED, [ 'one', 'two' ],
                     new Offset(new EntityLocation(), 0, 0, 0),
                     new Offset(new EntityLocation(), 0, 0, 0)));
            });

            it('reports no error if child is closed and then parent closed', () => {
               checker.write({
                  type: elementStart.TYPE,
                  open: makeLToken('<'),
                  name: makeLToken('two'),
               });
               parsed.name = makeLToken('two');
               checker.write(parsed);
               spyOn(checker, 'push');
               parsed.name = makeLToken('one');
               checker.write(parsed);

               expect(checker.push.calls.count()).toEqual(1);  // for the parsed itself
            });

            it('reports no error if an empty element is found between start and end', () => {
               checker.write({
                  type: elementStart.EMPTY_TYPE,
                  open: makeLToken('<'),
                  name: makeLToken('two'),
               });
               spyOn(checker, 'push');
               parsed.name = makeLToken('one');
               checker.write(parsed);

               expect(checker.push.calls.count()).toEqual(1);  // for the parsed itself
            });

         });

      });

   });

   it('calls entityDeclaration.checkWellFormed() when encountering an ENTITY declaation parsing', () => {
      spyOn(entityDeclaration, 'checkWellFormed');
      const parsed = {
         type: entityDeclaration.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = entityDeclaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   describe('entity reference', () => {
      let parsed;

      beforeEach(() => {
         spyOn(entityReference, 'checkWellFormed');
         parsed = {
            type: entityReference.TYPE,
            open: makeLToken('&'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering an end tag start', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = entityReference.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_CONTENT', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
         });

      });

   });

   describe('parameter entity reference', () => {
      let parsed;

      beforeEach(() => {
         spyOn(entityReference, 'checkWellFormed');
         parsed = {
            type: entityReference.PARAM_TYPE,
            open: makeLToken('%'),
         };
      });

      it('calls elementEnd.checkWellFormed() when encountering PEReference', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = entityReference.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not IN_DTD', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.PEREF_INVALID_CONTEXT);
         });

      });

   });

   it('calls notationDeclaration.checkWellFormed() when encountering a notation declaration', () => {
      spyOn(notationDeclaration, 'checkWellFormed');
      const parsed = {
         type: notationDeclaration.TYPE,
         open: makeLToken('<!'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = notationDeclaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1]).toBeInstanceOf(ErrorCollector);
      expect(args[2]).toEqual(metaData);
   });

   it('reports an error if a NOTATION declaration is encountered not in the DTD', () => {
      checker._state = 'START';
      checker.write(metaData);
      const parsed = {
         type: notationDeclaration.TYPE,
         open: makeLToken('<!'),
      };

      spyOn(checker, 'push');
      checker.write(parsed);

      expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_INVALID_CONTEXT);
   });

   describe('processingInstruction', () => {
      let parsed;

      beforeEach(() => {
         spyOn(processingInstruction, 'checkWellFormed');
         parsed = {
            type: processingInstruction.TYPE,
            open: makeLToken('<?'),
         };
      });

      it('calls processingInstruction.checkWellFormed()', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = processingInstruction.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if not yet started', () => {
            checker._state = 'START';
            spyOn(checker, 'push');
            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.PI_INVALID_CONTEXT);
         });

      });

   });

   describe('space', () => {
      let parsed;

      beforeEach(() => {
         spyOn(space, 'checkWellFormed');
         parsed = {
            type: space.TYPE,
            text: makeLToken(' '),
         };
      });

      it('calls space.checkWellFormed() when encountering a space parsing', () => {
         checker.write(parsed);

         const args = space.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if found at the start of a file', () => {
            checker._state = 'START';
            spyOn(checker, 'push');

            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.SPACE_INVALID_CONTEXT);
         });

      });

   });

   describe('xmlDeclaration', () => {
      let parsed;

      beforeEach(() => {
         spyOn(xmlDeclaration, 'checkWellFormed');
         parsed = {
            type: xmlDeclaration.TYPE,
            open: makeLToken('<?'),
         };
      });

      it('calls xmlDeclaration.checkWellFormed() when encountering an XML Declaration parsing', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = xmlDeclaration.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1]).toBeInstanceOf(ErrorCollector);
         expect(args[2]).toEqual(metaData);
      });

      describe('state checking', () => {

         it('reports an error if encountered ', () => {
            checker._state = 'IN_DTD';
            spyOn(checker, 'push');

            checker.write(parsed);

            expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
         });

      });

   });

});
