/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { CHARREF_PTOKEN, ParseToken, PROCESSING_INSTRUCTION_PTOKEN, TEXTDECL_PTOKEN } from 'pToken';
import { strOrBlank } from 'sToken';
import {
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   SPACE_PTOKEN,
   CHARDATA_PTOKEN,
   COMMENT_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   getFirstSToken,
   CDATA_PTOKEN,
} from 'token';

import { validCodes } from '../error/validCodes';
import { isXmlData } from './isXmlData';
import { ElDeclType, ValidityState } from './validityState';

const VID = validCodes.id;
const S_REGEXP = /^[\t\n\r ]*$/;

function contentValidate(token: ParseToken, state: ValidityState, ec: ErrorCollector): void {
   const details = state.elementContext.activeContext?.details;
   const isXml = isXmlData(token);
   const ver = state.confVer.version;
   const ed = state.confVer.edition;

   if (details?.type === ElDeclType.EMPTY) {
      // §3.0.0 Validity Constraint: Element Valid
      //     1.0/1-2: 1. The declaration matches EMPTY and the element has no content.
      //     Other: The declaration matches EMPTY and the element has no content (not
      //        even entity references, comments, PIs or white space).
      //  [Note: we will never get here if an ElementEmpty was enccountered)
      ec.check(
         isXml && token.type !== ELEMENT_END_PTOKEN,
         VID.CONTENTEMPTY_INVALID_SYNTAX,
         [strOrBlank(details.token.name)],
         getFirstSToken(token),
      );
   } else if (details?.type === ElDeclType.ELEMENT) {
      // §3.0.0 Validity Constraint: Element Valid
      //     1.0/1: ...with optional white space (characters matching the nonterminal S)
      //         between each pair of child elements.
      //     1.0/2: ...with optional white space (characters matching the nonterminal S)
      //         between the start-tag and the first child element, between child elements,
      //         or between the last child element and the end-tag. Note that a CDATA
      //         section containing only white space does not match the nonterminal S,
      //         and hence cannot appear in these positions.
      //     other: ...with optional white space, comments and PIs (i.e. markup matching
      //         production [27] Misc) between the start-tag and the first child element,
      //         between child elements, or between the last child element and the end-tag.
      //         Note that a CDATA section containing only white space or a reference to
      //         an entity whose replacement text is character references expanding to
      //         white space do not match the nonterminal S, and hence cannot appear in
      //         these positions; however, a reference to an internal entity with
      //         a literal value consisting of character references expanding to white
      //         space does match S, since its replacement text is the white space
      //         resulting from expansion of the character references.
      //  Translation:
      //     In 1.0/1: We only allow S between elements (and not before the first child element)
      //     In 1.0/2: We allow S between, before and after children.
      //     In 1.0/3 and beyond: We allow S, comments, PI's and general entity references when
      //        those are expanded to otherwise valid content (note, that the xmlconf test
      //        ibm-1-1-valid-P77-ibm77v12.xml, among others, shows we allow entities
      //        that have not only whitspace, but other child elements.
      const allowMiscVersion = (ver === 1.0 && ed >= 3) || ver === 1.1;
      const isNoLeadingTrailingSpaceVersion = ver === 1.0 && ed === 1;
      const isWhitespace =
         token.type === SPACE_PTOKEN ||
         (token.type === CHARDATA_PTOKEN && S_REGEXP.test(strOrBlank(token.text)));
      let okType =
         isWhitespace ||
         token.type === ELEMENT_START_PTOKEN ||
         token.type === ELEMENT_END_PTOKEN ||
         token.type === ELEMENT_EMPTY_PTOKEN;

      if (allowMiscVersion) {
         okType =
            okType ||
            token.type === COMMENT_PTOKEN ||
            token.type === GENERAL_ENTITY_END_PTOKEN ||
            token.type === GENERAL_ENTITY_START_PTOKEN ||
            token.type === PROCESSING_INSTRUCTION_PTOKEN ||
            token.type === TEXTDECL_PTOKEN;
      }

      ec.check(
         isNoLeadingTrailingSpaceVersion &&
            isWhitespace &&
            !state.elementContext.activeContext?.lastToken,
         VID.CONTENTELEMENT_XTRA_SPACE,
         [strOrBlank(details.token.name)],
         getFirstSToken(token),
      );

      ec.check(
         isXml && !okType,
         VID.CONTENTELEMENT_INVALID_SYNTAX,
         [strOrBlank(details.token.name), String(ver), String(ed), token.type],
         getFirstSToken(token),
      );

      // §3.0.0 Validity Constraint: Element Valid
      //    1.0/1: ...with optional white space (characters matching the
      //    nonterminal S) between each pair of child elements.
      // Translation: in 1.0/1 only, it seemed to imply you should not have S
      // between the last element and the end token.
      const lastToken = state.elementContext.activeContext?.lastToken;

      if (
         token.type === ELEMENT_END_PTOKEN &&
         isNoLeadingTrailingSpaceVersion &&
         (lastToken?.type === SPACE_PTOKEN ||
            (lastToken?.type === CHARDATA_PTOKEN && S_REGEXP.test(strOrBlank(lastToken.text))))
      ) {
         ec.report(VID.CONTENTELEMENT_XTRA_SPACE, [strOrBlank(token.name)], lastToken.text);
      }
   } else if (details?.type === ElDeclType.MIXED || details?.type === ElDeclType.ANY) {
      // §3.0.0 Validity Constraint: Element Valid
      //    For Mixed
      //    1.0/1: The declaration matches Mixed and the content consists of
      //       character data and child elements whose types match names in the content model.
      //    1.0/3 and 1.1/1: The declaration matches Mixed and the content (after
      //       replacing any entity references with their replacement text) consists
      //       of character data, comments, PIs and child elements whose types match
      //       names in the content model.
      //    1.0/4 and 1.1/2: The declaration matches Mixed, and the content (after
      //       replacing any entity references with their replacement text) consists
      //       of character data (including CDATA sections), comments, PIs and
      //       child elements whose types match names in the content model.
      //    For ANY (this is effectively the same as MIXED as far as these are concerned.
      //    1.0/1: The declaration matches ANY, and the types of any child elements
      //       have been declared.
      //    1.0/3 and 1.1/1: The declaration matches ANY, and the content (after
      //       replacing any entity references with their replacement text) consists
      //       of character data and child elements whose types have been declared.
      //    1.0/4 and 1.1/2: The declaration matches ANY, and the content (after
      //       replacing any entity references with their replacement text) consists
      //       of character data, CDATA sections, comments, PIs and child elements
      //       whose types have been declared.
      const allowsComments = (ver === 1.0 && ed >= 3) || ver === 1.1;
      const allowsCdata = (ver === 1.0 && ed >= 4) || (ver === 1.1 && ed >= 2);
      let okType =
         token.type === CHARDATA_PTOKEN ||
         token.type === ELEMENT_START_PTOKEN ||
         token.type === ELEMENT_END_PTOKEN ||
         token.type === ELEMENT_EMPTY_PTOKEN ||
         token.type === SPACE_PTOKEN;

      if (allowsComments) {
         okType =
            okType ||
            token.type === COMMENT_PTOKEN ||
            token.type === GENERAL_ENTITY_END_PTOKEN ||
            token.type === GENERAL_ENTITY_START_PTOKEN ||
            token.type === PROCESSING_INSTRUCTION_PTOKEN ||
            token.type === TEXTDECL_PTOKEN;
      }

      if (allowsCdata) {
         okType = okType || token.type === CDATA_PTOKEN || token.type === CHARREF_PTOKEN;
      }

      ec.check(
         isXml && !okType,
         details.type === ElDeclType.MIXED
            ? VID.CONTENTMIXED_INVALID_SYNTAX
            : VID.CONTENTANY_INVALID_SYNTAX,
         [strOrBlank(details.token.name), String(ver), String(ed), token.type],
         getFirstSToken(token),
      );
   }
}

export { contentValidate };
