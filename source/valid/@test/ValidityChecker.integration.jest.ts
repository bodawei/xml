/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ErrorCollector } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { defaultExtractors } from 'extractor';
import { ContextType, ParseValue } from 'pToken';
import { toSToken } from 'sToken';
import { STokenSource } from 'sToken';
import { AttFixerStream, EntityExpanderStream } from 'nodeStream';

import { ValidityChecker } from '../ValidityChecker';
import { ValidityError } from '../error/ValidityError';

// ick
import { PTokenStream } from '../../pTokenStream';
import { XmlError } from 'token';

describe('ValidityChecker (integration)', () => {
   let ec: ErrorCollector;
   let checker: ValidityChecker;
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      checker = new ValidityChecker();
   });

   function expectError(input: string, errorCode: string, done: () => void): void {
      const finalResults: Array<XmlError> = [];

      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
         context: ContextType.DOCUMENT,
      });
      pTokenStream.addText(input);
      pTokenStream.endText();
      const entityExpander = new EntityExpanderStream(true);
      const attFixer = new AttFixerStream();

      pTokenStream.pipe(entityExpander).pipe(attFixer);

      gatherStreamResults<ParseValue>(attFixer, (results) => {
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

   it('reports an error the current context is a CHILDREN context, but we are not at the end', (done) => {
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
         ValidityError.ID.CHILDREN_UNEXPECTED_END,
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
         done,
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
});
