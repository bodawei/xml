/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, Problem } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ParseType, ParseToken } from 'pToken';
import { STokenSource } from 'basic';
import { AttFixerStream, EntityExpanderStream, PTokenStream } from 'node';

import { DocumentChecker } from '../DocumentChecker';
import { ContentChecker } from '../ContentChecker';
import { MarkupDeclChecker } from '../MarkupDeclChecker';
import { warningCodes } from '../error/warningCodes';

const WID = warningCodes.id;

describe('DocumentChecker (integration)', () => {
   let checker: DocumentChecker;
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      checker = new DocumentChecker({
         content: ContentChecker,
         dtd: MarkupDeclChecker,
      });
   });

   function expectError(
      input: string,
      errorCode: string,
      done: () => void,
      confVer?: ConformanceVersion,
   ): void {
      const finalResults: Array<Problem> = [];
      const sTokenSource = new STokenSource();

      pTokenStream = new PTokenStream(sTokenSource, {
         confVer,
         parseType: ParseType.DOCUMENT,
      });
      sTokenSource.addText(input);
      sTokenSource.endText();
      const entityExpander = new EntityExpanderStream(true);
      const attFixer = new AttFixerStream();

      pTokenStream.pipe(entityExpander).pipe(attFixer);

      gatherStreamResults<ParseToken>(attFixer, (results) => {
         // console.json(results);
         for (const result of results) {
            const problems = checker.check(result);

            finalResults.push(...problems);
         }

         const targetError = finalResults.find((err) => err.id === errorCode);

         expect(targetError?.id).toEqual(errorCode || 'Unknown error code passed');
         done();
      });
   }

   it('reports an interoperability warning when an empty element tag is used for an element that was not declared as EMPTY (§3.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
         WID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
         done,
      );
   });

   it('reports a warning there is a second declaration of an existing general entity (§4.2.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY bar "goo">
            <!ENTITY bar "boo">
         ]>
         <bar/>`,
         WID.ENTITYDECL_XRA_DECLARATION,
         done,
      );
   });

   it('reports a warning there is a second declaration of an existing parameter entity (§4.2.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % bar "goo">
            <!ENTITY % bar "boo">
         ]>
         <bar/>`,
         WID.ENTITYDECL_XRA_DECLARATION,
         done,
      );
   });
});
