/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { STokenSource, SToken } from '../../sToken/index';

import { parseCdata, CdataPToken } from '../cdata';

type SectionStart = {
   open: SToken,
   openSpace?: SToken,
   sectionType?: SToken,
   sectionTypeSpace?: SToken,
};
type DeliverSection = (section: CdataPToken) => void;

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
   Lax:
      section ::= '<![' S name S
\**********************************************************************/

function parseSection(source: STokenSource, openSToken: SToken, deliverSection: DeliverSection) {
   const sectionData: SectionStart = {
      open: openSToken,
   };
   source.extractToObjectNoParams('space', sectionData, 'openSpace');
   source.extractToObject('word', [ '[', '>' ], sectionData, 'sectionType');
   source.extractNoParams('space', (typeSpace) => {
      sectionData.sectionTypeSpace = typeSpace;
      // revisit the checkWellFormed() cases when we add conditional sections
      parseCdata(source, sectionData, deliverSection);
   });
}

export {
   SectionStart,

   parseSection,
};
