/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { ErrorCollector } from 'basic';
import { WellFormedError } from 'wellformedness';
import { SToken } from 'sToken';
import { getFirstSToken, PToken } from 'token';
import { ContentChecker, DocumentChecker, MarkupDeclChecker, } from 'wellformedness';

/*
 * This consumes a stream of PTokens and checks most of the Well-formedness
 * constraints from the XML Specification. The output of this stream are
 * each of those PTokens, where each one is preceeded by any WellFormedErrors
 * that this has discovered.
 *
 * There are a few Well-Formedness Constraints that this can not peform, and
 * those should have been performed by any entity expander that may have
 * acted before this.
 *
 * While the PTokens that are delivered to this may be any PTokens in any
 * order generated, this will judge those according to the definitions of
 * the XML standard (thus, it expects an XmlDeclarationPToken to be the
 * first PToken it encounters, any ElementStartPTokens must come after
 * the end of the DOCTYPE tokens, etc).
 *
 * This will accurately process the output of a non-validating parsing
 * (such that external entities have not been read and inlined, and
 * parameter entity references have not been expanded), or that of
 * a full validation-ready parsing, where all external entities
 * and parameter entity references have been expanded. This will use
 * the presence of the "standalone" parameter in the XML Declaration
 * as well as the presence or absence of a DTD to help it make
 * accurate assessments.
 *
 * This does depend on the artificial InternalSubsetStartToken as well
 * as the corresponding End, and ExternalSubset tokens to be present
 * in the incoming stream to accurately identify the internal and
 * external subsets (which should be between the start and end DocType
 * tokens). This also will handle the start and end markers for any
 * general and parameter entities that were expanded in the content
 * and DTD (using these to help identify if these entities were
 * both properly placed in the document, and that their contents
 * were properly nested). These will handle any EntityReference
 * tokens, assuming that they mean the relevant reference could not
 * be expanded (and depending on the "standalone" and presence of
 * DTD etc, consider them as errors or not). Finally, this will
 * report any markup declarations with unexpanded perefs as errors.
 */
class CheckWellFormed extends Transform {
   private checker = new DocumentChecker({
      content: ContentChecker,
      dtd: MarkupDeclChecker,
   });

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(pToken: PToken, encoding: string, done: () => void) {
      const errorCollector = new ErrorCollector(getFirstSToken(pToken), WellFormedError as any);
      this.checker.check(pToken, errorCollector);

      const errors = errorCollector.getErrors();

      for (const error of errors) {
         this.push(error);
      }

      this.push(pToken);
      done();
   }

   _final(done: () => void) {
      const errorCollector = new ErrorCollector(SToken.fromString(''), WellFormedError as any);
      this.checker.finish(errorCollector);

      const errors = errorCollector.getErrors();

      for (const error of errors) {
         this.push(error);
      }

      done();
   }
}

export default CheckWellFormed;

