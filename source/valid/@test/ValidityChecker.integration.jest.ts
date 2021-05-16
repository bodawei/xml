/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ErrorCollector } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ContextType, ParseToken } from 'pToken';
import { PTokenStream } from '../../pTokenStream';
import { toSToken } from 'sToken';
import { STokenSource } from 'sToken';
import { ErrorToken } from 'token';
import { AttFixerStream, EntityExpanderStream } from 'node';

import { ValidityChecker } from '../ValidityChecker';
import { ValidityError } from '../error/ValidityError';

describe('ValidityChecker (integration)', () => {
   let ec: ErrorCollector;
   let checker: ValidityChecker;
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      checker = new ValidityChecker();
   });

   function expectError(input: string, errorCode: string, done: () => void): void {
      const finalResults: Array<ErrorToken> = [];

      pTokenStream = new PTokenStream(new STokenSource(), {
         context: ContextType.DOCUMENT,
      });
      pTokenStream.addText(input);
      pTokenStream.endText();
      const entityExpander = new EntityExpanderStream(true);
      const attFixer = new AttFixerStream();

      pTokenStream.pipe(entityExpander).pipe(attFixer);

      gatherStreamResults<ParseToken>(attFixer, (results) => {
         for (const result of results) {
            ec = new ErrorCollector(
               'open' in result ? result.open : toSToken('foo'),
               ValidityError,
            );

            checker.checkPToken(result, ec);

            finalResults.push(...(ec.errors as any));
         }

         const targetError = finalResults.find((err) => err.id === errorCode);

         expect(targetError?.id).toEqual(errorCode);
         done();
      });
   }

   it('reports an error the current context is a ELEMENT context, but we are not at the end', (done) => {
      expectError(
         `<?xml version="1.0"?>
      <!DOCTYPE root [
         <!ELEMENT one ANY>
         <!ELEMENT two ANY>
         <!ENTITY % CM '(one | two'>
         <!ELEMENT root %CM;>
      ]>
      <root/>`,
         ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         done!,
      );
   });

   it('reports an Element End error if children of an element end before the context model says it should', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT one ANY>
            <!ELEMENT two ANY>
            <!ELEMENT root (one , two)>
         ]>
         <root>
            <one>
            </one>
         </root>`,
         ValidityError.ID.ELEMENT_UNEXPECTED_END,
         done!,
      );
   });

   it('reports an Element Start error', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root SYSTEM "./source/valid/@test/@entities/defaultAttributes.xml" [
            <!ELEMENT root ANY>
         ]>
         <root>
         </root>`,
         ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
         done!,
      );
   });

   it('reports a general entity reference error', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
         ]>
         <root>
           &I-Am-Not-Defined;
         </root>`,
         ValidityError.ID.GEREF_UNDEFINED,
         done!,
      );
   });

   it('reports a parameter entity reference error', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            %I-Am-Not-Defined;
         ]>
         <root/>`,
         ValidityError.ID.PEREF_UNDEFINED,
         done!,
      );
   });

   it('reports an error when the doctype does not match the root element (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
         ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
         done!,
      );
   });

   it('reports an error when a notation name is declared more than once (§4.7.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!NOTATION bar PUBLIC "http://somewhere.com">
            <!NOTATION bar PUBLIC "http://somewhere-else.com">
         ]>
         <root/>`,
         ValidityError.ID.NOTATION_NOT_UNIQUE,
         done!,
      );
   });
});
