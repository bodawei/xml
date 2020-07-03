/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { STokenSource, SToken } from 'sToken';

import { parseCdata, CdataPToken } from '../cdata';
import { parseConditional, ConditionalPToken } from '../conditional';
import {
   parseParameterEntityReference,
   ParameterEntityReferencePToken,
} from '../parameterEntityReference';

type SectionStart = {
   open: SToken;
   openSpace?: SToken;
   sectionType?: SToken;
   peRef?: ParameterEntityReferencePToken;
   peRefPlus?: Array<ParameterEntityReferencePToken>;
   sectionTypeSpace?: SToken;
};
type DeliverSection = (section: CdataPToken | ConditionalPToken) => void;

function continueToContent(
   source: STokenSource,
   sectionData: SectionStart,
   deliverSection: DeliverSection,
): void {
   source.extractNoParams('space', (typeSpace) => {
      sectionData.sectionTypeSpace = typeSpace;

      if (sectionData.sectionType && sectionData.sectionType.str.toLowerCase() === 'cdata') {
         parseCdata(source, sectionData, deliverSection);
      } else {
         parseConditional(source, sectionData, deliverSection);
      }
   });
}

/**********************************************************************\
 parseSection() parses a "section", which is either a CDATA section or
 a conditional section.

 PARAM
 source: A STokenSource to read from
 openSToken: the SToken for <![
 deliverStart: Callback to deliver the section start

 SYNTAX
   §2.7
      [19] CDStart     ::= '<![CDATA' ...
      [62] includeSect ::= '<![' S? 'INCLUDE' S? ...
      [63] ignoreSect  ::= '<![' S? 'IGNORE' S? ...
      (implicitly)  ::= '<![' S? parameterEntityReference S? ...
   Lax:
      section ::= '<![' S name S
      section ::= '<![' S % S name S ; S
\**********************************************************************/

function parseSection(source: STokenSource, openSToken: SToken, deliverSection: DeliverSection) {
   const sectionData: SectionStart = {
      open: openSToken,
   };
   source.extractToObjectNoParams('space', sectionData, 'openSpace');
   source.extractNoParams('peekChar', (charSToken) => {
      if (charSToken && charSToken.str === '%') {
         parseParameterEntityReference(source, (result) => {
            sectionData.peRef = result;

            if (result) {
               sectionData.peRefPlus = [result];
            }

            continueToContent(source, sectionData, deliverSection);
         });
      } else {
         source.extractToObject('word', ['[', '>'], sectionData, 'sectionType');
         continueToContent(source, sectionData, deliverSection);
      }
   });
}

export { SectionStart, parseSection };
