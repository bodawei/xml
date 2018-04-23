/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ValidityError, XmlWarning } from '../../error';
import {
   attListDeclaration,
   comment,
   docTypeStart,
   elementStart,
   elementEnd,
   elementDeclaration,
   notationDeclaration,
   processingInstruction,
   xmlDeclaration,
} from '../../token';

import CheckXTokenValidStream from '../CheckXTokenValidStream.js';

describe('CheckXTokenValidStream (unit)', () => {
   let validator;

   beforeEach(() => {
      validator = new CheckXTokenValidStream();
   });

   function gatherTokens(stream, cb) {
      const tokens = [];

      stream.on('data', (item) => {
         tokens.push(item);
      });
      stream.on('end', () => {
         cb(tokens);
      });
   }

   describe('_transform', () => {

      beforeEach(() => {
      });

      it('passes initial tokens through', () => {
         const xmlDecl = new xmlDeclaration.XToken([], []);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl);
      });

      it('stops passing through when encountering a docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         validator.write(dtStart);

         expect(validator.read()).toEqual(null);
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         const elStart = new elementStart.XToken('foo', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(elStart);
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart);
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.XToken('docTypeName', undefined, false, []);
         const elStart = new elementStart.XToken('elementName', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
         expect(validator.read()).toEqual(dtStart);
      });

      it('adds an error if the NOTATION name shows up more than once', () => {
         const nOne = new notationDeclaration.XToken('one', undefined, []);
         const nTwo = new notationDeclaration.XToken('one', undefined, []);

         validator.write(nOne);
         validator.write(nTwo);

         expect(validator.read()).toEqual(nOne);
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ]));
         expect(validator.read()).toEqual(nTwo);
      });

      it('adds an error if the ATTLIST name shows up more than once', () => {
         const aOne = new attListDeclaration.XToken('one', [], {});
         const aTwo = new attListDeclaration.XToken('one', [], {});

         validator.write(aOne);
         validator.write(aTwo);

         expect(validator.read()).toEqual(aOne);
         expect(validator.read()).toEqual(new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ]));
         expect(validator.read()).toEqual(aTwo);
      });

      describe('element content', () => {

         it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.end();

            gatherTokens(validator, (tokens) => {
               expect(tokens[1]).toEqual(new XmlWarning(XmlWarning.ID.INTEROP_USE_EMPTY, [ 'one' ]));
               done();
            });
         });

         it('reports an error if anything appears in an element declared to be EMPTY', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});
            const elTwo = new elementStart.XToken('one', [], {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.write(elTwo);
            validator.end();

            gatherTokens(validator, (tokens) => {
               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);

               expect(tokens[3]).toEqual(expected);
               done();
            });
         });

         it('reports no error if only an empty tag appears in an EMPTY element', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});
            const elTwo = new elementEnd.XToken('one', {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.write(elTwo);
            validator.end();

            gatherTokens(validator, (tokens) => {
               expect(tokens.length).toEqual(4);
               done();
            });
         });

         describe('mixed content', () => {

            it('reports an error if any element start appears in a PCDATA-only element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const child = new elementStart.XToken('sub', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(child);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  const expected = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED, [ 'one', 'sub' ]);

                  expect(tokens[2]).toEqual(expected);
                  done();
               });
            });

            it('reports no error if all the provided elements match expectsions', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'one',
                     repeat: 'ONE'
                  }, {
                     name: 'two',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const elEnd = new elementEnd.XToken('one', [], {});
               const child = new elementStart.XToken('two', [], {});
               const childEnd = new elementEnd.XToken('two', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elEnd);
               validator.write(child);
               validator.write(childEnd);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(5);
                  done();
               });
            });

            it('reports an error if one child element does not match any of the defined ones', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'one',
                     repeat: 'ONE'
                  }, {
                     name: 'two',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const elEnd = new elementEnd.XToken('one', [], {});
               const child = new elementStart.XToken('two', [], {});
               const childEnd = new elementEnd.XToken('two', [], {});
               const thirdStart = new elementStart.XToken('three', [], {});
               const expected = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED, [ 'one', 'three' ]);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elStart);
               validator.write(elEnd);
               validator.write(child);
               validator.write(childEnd);
               validator.write(thirdStart);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens[6]).toEqual(expected);
                  done();
               });
            });

            it('reports an error if there is a comment found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const commentToken = new comment.XToken('stuff', {});
               const elStart = new elementStart.XToken('one', [], {});
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI, [ 'one', 'comment' ]);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens[2]).toEqual(expected);
                  done();
               });
            });

            it('reports an error if there is a processing instruction found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const pi = new processingInstruction.XToken('stuff', undefined, {});
               const elStart = new elementStart.XToken('one', [], {});
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI, [ 'one', 'processing instruction' ]);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens[2]).toEqual(expected);
                  done();
               });
            });

         });

      });

   });

});
