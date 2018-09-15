## J Suggestions for XML Names (Non-Normative)

The following suggestions define what is believed to be best practice in the construction of XML names used as element names, attribute names, processing instruction targets, entity names, notation names, and the values of attributes of type ID, and are intended as guidance for document authors and schema designers. All references to Unicode are understood with respect to a particular version of the Unicode Standard greater than or equal to 5.0; which version should be used is left to the discretion of the document author or schema designer.

The first two suggestions are directly derived from the rules given for identifiers in Standard Annex #31 (UAX #31) of the Unicode Standard, version 5.0 [Unicode], and exclude all control characters, enclosing nonspacing marks, non-decimal numbers, private-use characters, punctuation characters (with the noted exceptions), symbol characters, unassigned codepoints, and white space characters. The other suggestions are mostly derived from Appendix B in previous editions of this specification.

1. The first character of any name should have a Unicode property of ID_Start, or else be '_' #x5F.

1. Characters other than the first should have a Unicode property of ID_Continue, or be one of the characters listed in the table entitled "Characters for Natural Language Identifiers" in UAX #31, with the exception of "'" #x27 and "’" #x2019.

1. Characters in names should be expressed using Normalization Form C as defined in [UnicodeNormal].

1. Ideographic characters which have a canonical decomposition (including those in the ranges [#xF900-#xFAFF] and [#x2F800-#x2FFFD], with 12 exceptions) should not be used in names.

1. Characters which have a compatibility decomposition (those with a "compatibility formatting tag" in field 5 of the Unicode Character Database -- marked by field 5 beginning with a "<") should not be used in names. This suggestion does not apply to characters which despite their compatibility decompositions are in regular use in their scripts, for example #x0E33 THAI CHARACTER SARA AM or #x0EB3 LAO CHARACTER AM.

1. Combining characters meant for use with symbols only (including those in the ranges [#x20D0-#x20EF] and [#x1D165-#x1D1AD]) should not be used in names.

1. The interlinear annotation characters ([#xFFF9-#xFFFB]) should not be used in names.

1. Variation selector characters should not be used in names.

1. Names which are nonsensical, unpronounceable, hard to read, or easily confusable with other names should not be employed.

> **1.1/1**

The following suggestions define what is believed to be best practice in the construction of XML names used as element names, attribute names, processing instruction targets, entity names, notation names, and the values of attributes of type ID, and are intended as guidance for document authors and schema designers. All references to Unicode are understood with respect to a particular version of the Unicode Standard greater than or equal to 3.0; which version should be used is left to the discretion of the document author or schema designer.

The first two suggestions are directly derived from the rules given for identifiers in the Unicode Standard, version 3.0, and exclude all control characters, enclosing nonspacing marks, non-decimal numbers, private-use characters, punctuation characters (with the noted exceptions), symbol characters, unassigned codepoints, and white space characters. The other suggestions are mostly derived from [XML-1.0] Appendix B.

1. The first character of any name should have a Unicode General Category of Ll, Lu, Lo, Lm, Lt, or Nl, or else be '_' #x5F.

1. Characters other than the first should have a Unicode General Category of Ll, Lu, Lo, Lm, Lt, Mc, Mn, Nl, Nd, Pc, or Cf, or else be one of the following: '-' #x2D, '.' #x2E, ':' #x3A or '·' #xB7 (middle dot). Since Cf characters are not directly visible, they should be employed with caution and only when necessary, to avoid creating names which are distinct to XML processors but look the same to human beings.

1. Ideographic characters which have a canonical decomposition (including those in the ranges [#xF900-#xFAFF] and [#x2F800-#x2FFFD], with 12 exceptions) should not be used in names.

1. Characters which have a compatibility decomposition (those with a "compatibility formatting tag" in field 5 of the Unicode Character Database -- marked by field 5 beginning with a "<") should not be used in names. This suggestion does not apply to #x0E33 THAI CHARACTER SARA AM or #x0EB3 LAO CHARACTER AM, which despite their compatibility decompositions are in regular use in those scripts.

1. Combining characters meant for use with symbols only (including those in the ranges [#x20D0-#x20EF] and [#x1D165-#x1D1AD]) should not be used in names.

1. The interlinear annotation characters ([#xFFF9-#xFFFB) should not be used in names.

> **1.1/2** Adds the missing ]

1. Variation selector characters should not be used in names.

1. Names which are nonsensical, unpronounceable, hard to read, or easily confusable with other names should not be employed.


### Appendix: Standards
* 1.0/5: https://www.w3.org/TR/xml/#sec-suggested-names
* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204/#sec-suggested-names
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-suggested-names


