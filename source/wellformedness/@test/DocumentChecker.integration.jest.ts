/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, ErrorCollector, ErrorToken } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ParseType, ParseToken } from 'pToken';
import { toSToken } from 'sToken';
import { STokenSource } from 'sToken';
import { AttFixerStream, EntityExpanderStream, PTokenStream } from 'node';

import { DocumentChecker } from '../DocumentChecker';
import { ContentChecker } from '../ContentChecker';
import { MarkupDeclChecker } from '../MarkupDeclChecker';
import { WellFormedError } from '../error/WellFormedError';
import { wellFormedWarningCodes } from '../error/wellFormedWarningCodes';

const WFID = WellFormedError.ID;
const WARNID = wellFormedWarningCodes.id;

fdescribe('DocumentChecker (integration)', () => {
   let ec: ErrorCollector;
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
      const finalResults: Array<ErrorToken> = [];
      const sTokenSource = new STokenSource();

      pTokenStream = new PTokenStream(sTokenSource, {
         confVer,
         context: ParseType.DOCUMENT,
      });
      sTokenSource.addText(input);
      sTokenSource.endText();
      const entityExpander = new EntityExpanderStream(true);
      const attFixer = new AttFixerStream();

      pTokenStream.pipe(entityExpander).pipe(attFixer);

      gatherStreamResults<ParseToken>(attFixer, (results) => {
         // console.json(results);
         for (const result of results) {
            ec = new ErrorCollector(
               'open' in result ? result.open : toSToken('foo'),
               WellFormedError,
            );

            checker.check(result, ec);

            finalResults.push(...(ec.errors as Array<ErrorToken>));
         }

         const targetError = finalResults.find((err) => err.id === errorCode);

         expect(targetError?.id).toEqual(errorCode || 'Unknown error code passed');
         done();
      });
   }

   fit('reports an interoperability warning when an empty element tag is used for an element that was not declared as EMPTY (§3.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
         WARNID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
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
         WARNID.ENTITYDECL_XRA_DECLARATION,
         done!,
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
         WARNID.ENTITYDECL_XRA_DECLARATION,
         done!,
      );
   });
});
