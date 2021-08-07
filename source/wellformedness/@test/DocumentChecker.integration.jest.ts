/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, ErrorCollector, ErrorToken, warning, WarningToken } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ContextType, ParseToken } from 'pToken';
import { PTokenStream } from '../../pTokenStream';
import { toSToken } from 'sToken';
import { STokenSource } from 'sToken';
import { AttFixerStream, EntityExpanderStream } from 'node';

import { DocumentChecker } from '../DocumentChecker';
import { ContentChecker } from '../ContentChecker';
import { MarkupDeclChecker } from '../MarkupDeclChecker';
import { WellFormedError } from '../error/WellFormedError';

const WFID = WellFormedError.ID;
const WARNID = warning.id;

describe('DocumentChecker (integration)', () => {
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

      pTokenStream = new PTokenStream(new STokenSource(), {
         confVer,
         context: ContextType.DOCUMENT,
      });
      pTokenStream.addText(input);
      pTokenStream.endText();
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

   it('reports an interoperability warning when an empty element tag is used for an element that was not declared as EMPTY (§3.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
         WARNID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
         done!,
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
