/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Problem } from 'basic';
import { STokenSource } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { AttFixerStream, EntityExpanderStream, PTokenStream } from 'node';
import { ParseType, ParseToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { ContentChecker } from '../ContentChecker';
import { DocumentChecker } from '../DocumentChecker';
import { warningCodes } from '../error/warningCodes';
import { MarkupDeclChecker } from '../MarkupDeclChecker';

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

   it('reports an interoperability warning when an empty element tag is used for an element that was not declared as EMPTY (§3.1.0)', () =>
      new Promise<void>((done) => {
         expectError(
            `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
            WID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
            done,
         );
      }));

   it('reports a warning there is a second declaration of an existing general entity (§4.2.0)', () =>
      new Promise<void>((done) => {
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
      }));

   it('reports a warning there is a second declaration of an existing parameter entity (§4.2.0)', () =>
      new Promise<void>((done) => {
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
      }));
});
