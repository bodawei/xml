/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface FilterData {
   includedIds: Array<string>;
   excludedIds: Array<string>;
}

const testFilters: FilterData = {
   includedIds: ['rmt-e2e-36'],
   excludedIds: [
      // 'rmt-012', // the problem here is that the doc is 1.0, but it is in the 1.1 section.

      'rmt-e2e-36', // (valid:1/5) An external ATTLIST declaration does not make a document non-standalone if the normalization would have been the same without the declaration
      'o-p08fail1', // ELEMENTSTART_NMTOKENS_NOT_NMTOKEN --- ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED

      //  This messes up with attlists with enumerations.  It doesn't recognize the right wrod boundaries.
      // but the same is true for element declarations <!ELEMENT %name; (a|b)*>
      // The solution is either we need to always add other delimiters to word identification
      // or we need to completely chnage unassigned to just work with strings rather than preparsed
      'pr-xml-utf-8', // japanese charas in utf8... what happened

      // Misc
      'ext01', // We are creating PACE_PTOKEN's that we should not
      'sa02', // Some standalone problem/ misinterpretation
      'sa03', // Some standalone problem/ misinterpretation
      'sa04', // Some standalone problem/ misinterpretation
      'rmt-e2e-60', // conditional section mishandled (thinks it is in the wrong context)
      'rmt-e2e-18', // Tests relative entity lookup  one in a subdirectlry should be finding relative to the main document, not itself?????
      // characters
      'rmt-054', // Unclear what is going wrong
      // xml:lang
      'v-lang03', // xml:lang violation
      'v-lang04', // xml:lang violation
      'ibm-valid-P36-ibm36v01.xml', // a xml:lang violation
      // --- UTF16 validity problems
      'valid-ext-sa-008', // utf16
      'pr-xml-little', // utf16
      'pr-xml-utf-16', // utf16
      'weekly-little', // UTF16!
      'weekly-utf-16', // UTF16!
      'valid-sa-049', // UTF16 with BOM
      'valid-sa-050', // UTF16 with BOM
      'valid-sa-051', // utf16
      'valid-ext-sa-014', // External entity is utf16 with a BOM.  Oddly, the answer has the BOM in it.  Why isn't that stripped?  Be certain you understand this
      'valid-ext-sa-007', // utf16 BOM
      // utf8/BOM
      'rmt-e2e-22', // Starts with a BOM

      // Valid / Text problems
      // NOTE: A bunch of the 1.1 ones are easily fixed by adding the <?xml version="1.1" to the output.
      'valid-sa-044', // Test demonstrates that the empty-element tag must be use for an elements that are declared EMPTY.
      'valid-sa-068', // Tests definition of an internal entity holding a carriage return character reference, which must not be normalized before reporting to the application. Line break normalization only occurs when parsing external parsed entities.
      'valid-sa-110', // Basically an output test, this requires that a CDATA attribute with a CRLF be normalized to one space.
      'valid-sa-111', // Character references expanding to spaces doesn't affect treatment of attributes.
      'valid-not-sa-009', // Test demonstrates that an external identifier may include a public identifier.
      'valid-not-sa-018', // Test demonstrates an EnternalID whose contents contain an parameter entity declaration and a attribute list definition.
      'valid-not-sa-019', // Test demonstrates that a parameter entity will be expanded with spaces on either side.
      'valid-not-sa-021', // Test demonstrates a parameter entity declaration that contains a partial attribute list declaration.
      'valid-not-sa-023', // Test demonstrates the use of a parameter entity reference within an attribute list declaration.
      'valid-not-sa-024', // Constructs an!ATTLIST...>declaration from several PEs.
      'valid-not-sa-025', // Test demonstrates that when more that one definition is provided for the same entity only the first declaration is binding.
      'ext02', // Tests use of external parsed entities with different       encodings than the base document.
      'not-sa01', // A non-standalone document is valid if declared as such.
      'not-sa02', // A non-standalone document is valid if declared as such.
      'not-sa03', // A non-standalone document is valid if declared as such.
      'not-sa04', // A non-standalone document is valid if declared as such.
      'notation01', // NOTATION declarations don't need SYSTEM IDs; and externally declared notations may be used to declare unparsed entities in the internal DTD subset. The notation must be reported to the application.
      'sa05', // Like sa01 but this document is standalone since it has no optional whitespace. On output, requires notations to be correctly reported.
      'v-sgml01', // XML permits token reuse, while SGML does not.
      'rmt-007', // A vanilla XML 1.1 document
      'rmt-010', // Contains a C1 control, legal in XML 1.0, illegal in XML 1.1
      'rmt-022', // Has a NEL character; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-023', // Has a NEL character; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-024', // Has an LSEP character; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-025', // Has an LSEP character; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-026', // Has CR-NEL; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-027', // Has CR-NEL; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-028', // Has CR-LSEP; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1. Note that CR and LSEP are not combined into a single LF
      'rmt-029', // Has CR-LSEP; legal in both XML 1.0 and 1.1, but different canonical output because of normalization in 1.1
      'rmt-031', // Has a NEL character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-033', // Has an LSEP character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-035', // Has an NMTOKENS attribute containing a CR character that comes from a character reference in an internal entity. Because CR is in the S production, this is valid in both XML 1.0 and 1.1.
      'rmt-040', // Contains a C1 control character (partial line up), legal in XML 1.0 but not 1.1
      'rmt-043', // Contains a character reference to a C0 control character (form-feed), legal in XML 1.1 but not 1.0
      'rmt-045', // Contains a character reference to a C1 control character (partial line up), legal in both XML 1.0 and 1.1 (but for different reasons)
      'rmt-049', // has an LSEP character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-050', // Has element content whitespace containing a CR character that comes from a character reference in an internal entity. Because CR is in the S production, this is valid in both XML 1.0 and 1.1.
      'rmt-051', // Has element content whitespace containing a CR character that comes from a character reference in an internal entity. Because CR is in the S production, this is valid in both XML 1.0 and 1.1.

      //
      // ////////////
      // ////////////
      // INVALID
      // ////////////
      // ////////////
      //

      'invalid--005', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
      'invalid-not-sa-022', // Good error, but does not format right
      'invalid--006', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
      'inv-required01', // Tests the Attribute Value Type (declared) VC for the xml:space attribute
      'inv-required02', // Tests the Attribute Value Type (declared) VC for the xml:lang attribute

      // While this does find the right error, ir reports several others that are not right
      'attr03', // Tests the "Notation Attributes" VC for the NOTATION attribute type, first clause: value must be one of the ones that's declared.
      'attr04', // Tests the "Notation Attributes" VC for the NOTATION attribute type, second clause: the names in the declaration must all be declared.
      'utf16b', // Tests reading an invalid "big endian" UTF-16 document
      'utf16l', // Tests reading an invalid "little endian" UTF-16 document

      'o-p16fail1',
      'o-p01pass1', // : 'ANY_UNDECLARED_ELEMENT', // no prolog
      'o-p01pass3', // : 'ANY_UNDECLARED_ELEMENT', // Misc items after the document
      'o-p04pass1', // : 'ANY_UNDECLARED_ELEMENT', // names with all valid ASCII characters, and one from each other class in NameChar
      'o-p05pass1', // : 'ANY_UNDECLARED_ELEMENT', // various valid Name constructions
      'o-p10pass1', // : 'ANY_UNDECLARED_ELEMENT', // But this is not what it is trying to show -  valid attribute values
      'o-p16pass1', // : 'PI_TARGET_HAS_XML', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
      'o-p69pass1', // misidentifying a recursive call

      'ibm-1-1-valid-P46-ibm46i01.xml', // An element with Element-Only content contains the character #x85 (NEL not a whitespace character as defined by S).
      'ibm-1-1-valid-P46-ibm46i02.xml', // An element with Element-Only content contains the character #x2028 (LESP not a whitespace character as defined by S).

      'rmt-e2e-14', // Crashing bug - Declarations mis-nested wrt parameter entities are just validity errors (but note that some parsers treat some such errors as fatal)
      'rmt-e2e-20', // no error - Tokens, after normalization, must be separated by space, not other whitespace characters
      'rmt-015', // no error - Has a "long s" in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-017', // no error - Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-018', // no error - Has the last legal namechar in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-030', // no error, but format ouput is bad Has a NEL character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-032', // no error, but format ouput is bad  Has an LSEP character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-036', // no error, but format ouput is bad  Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-037', // Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-048', // Has an LSEP character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-046', // but output is bad 'CHILDREN_XTRA_CONTENT', // good - Has a NEL character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-052', // but output is bad 'CHILDREN_XTRA_CONTENT', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-053', // but output is bad 'CHILDREN_XTRA_CONTENT', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.

      // Group namespaces
      'rmt-ns10-017', // Simple legal case: no namespaces
      'rmt-ns10-018', // Simple legal case: default namespace
      'rmt-ns10-019', // Simple legal case: prefixed element
      'rmt-ns10-020', // Simple legal case: prefixed attribute
      'rmt-ns10-021', // Simple legal case: default namespace and unbinding
      'rmt-ns10-022', // Simple legal case: default namespace and rebinding
      'rmt-ns10-024', // Simple legal case: prefix rebinding
      'rmt-ns10-027', // Reserved prefixes and namespaces: using the xml prefix undeclared
      'rmt-ns10-028', // Reserved prefixes and namespaces: declaring the xml prefix correctly
      'rmt-ns10-034', // Reserved prefixes and namespaces: binding a reserved prefix
      'rmt-ns10-037', // Attribute uniqueness: different attributes with same local name
      'rmt-ns10-038', // Attribute uniqueness: prefixed and unprefixed attributes with same local name
      'rmt-ns10-039', // Attribute uniqueness: prefixed and unprefixed attributes with same local name, with default namespace
      'rmt-ns10-040', // Attribute uniqueness: prefixed and unprefixed attributes with same local name, with default namespace and element in default namespace
      'rmt-ns10-041', // Attribute uniqueness: prefixed and unprefixed attributes with same local name, element in same namespace as prefixed attribute
      'rmt-ns10-045', // Colon in ID attribute name
      'rmt-ns10-046', // Colon in ID attribute name

      // Group: some BOM problems. But several of these should be dying and
      'invalid-bo-1', // Byte order mark in general entity should go away (big-endian)
      'invalid-bo-2', // Byte order mark in general entity should go away (little-endian)
      'invalid-bo-3', // Byte order mark in general entity should go away (utf-8)
      'invalid-bo-4', // Two byte order marks in general entity produce only one (big-endian)
      'invalid-bo-5', // Two byte order marks in general entity produce only one (little-endian)
      'invalid-bo-6', // Two byte order marks in general entity produce only one (utf-8)
      'invalid-sa-140', // Character '#x309a;' is a CombiningChar, not a Letter, but as of 5th edition, may begin a name (c.f. xmltest/not-wf/sa/140.xml).
      'invalid-sa-141', // As of 5th edition, character #x0E5C is legal in XML names (c.f. xmltest/not-wf/sa/141.xml).
      'x-rmt5-014', // Has a "long s" in a name, legal in XML 1.1, legal in XML 1.0 5th edition
      'x-rmt5-016', // Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, legal in XML 1.0 5th edition
      'x-rmt5-019', // Has the last legal namechar in XML 1.1, legal in XML 1.0 5th edition
      'ibm-invalid-P89-ibm89n06.xml', // Tests Extender with an only legal per 5th edition character. The character #x0EC7 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'ibm-invalid-P89-ibm89n07.xml', // Tests Extender with an only legal per 5th edition character. The character #x3006 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'ibm-invalid-P89-ibm89n08.xml', // Tests Extender with an only legal per 5th edition character. The character #x3030 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'ibm-invalid-P89-ibm89n09.xml', // Tests Extender with an only legal per 5th edition character. The character #x3036 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'ibm-invalid-P89-ibm89n10.xml', // Tests Extender with an only legal per 5th edition character. The character #x309C occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'ibm-invalid-P89-ibm89n11.xml', // Tests Extender with an only legal per 5th edition character. The character #x309F occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'ibm-invalid-P89-ibm89n12.xml', // Tests Extender with an only legal per 5th edition character. The character #x30FF occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
      'hst-bh-005', // xmlns:xml is an attribute as far as validation is concerned and must be declared
      'hst-bh-006', // xmlns:foo is an attribute as far as validation is concerned and must be declared

      //
      // ////////////
      // ////////////
      // NOT WELL FORMED
      // ////////////
      // ////////////
      //

      'not-wf-not-sa-007', // CRASHES. OUT OF MEMORY
      'o-p31fail1', // CRASHES. SOME KIND OF ETERNAL HANG
      'not-wf-sa-047', // error message so bad that i think I'm not checking the right thing -  Invalid empty element tag invalid whitespace
      'not-wf-sa-054', // PUBLIC requires two literals.
      'not-wf-sa-098', // Only one "version=..." string may appear in an XML declaration.
      'not-wf-sa-113', // Parameter entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-114', // General entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-125', // Invalid syntax extra set of parenthesis not necessary.
      'not-wf-sa-126', // Invalid syntax Mixed-content must be defined as zero or more.
      'not-wf-sa-127', // Invalid syntax Mixed-content must be defined as zero or more.
      'not-wf-sa-132', // message is outright bad - Invalid syntax mixed connectors used.
      'not-wf-sa-145', // Character #xD800 is not legal anywhere in an XML document. (If it appeared in a UTF-16 surrogate pair, it'd represent half of a UCS-4 character and so wouldn't really be in the document.)
      'not-wf-sa-150',
      'not-wf-sa-159', // Uses '' unquoted in an entity declaration, which is illegal syntax for an entity reference.
      'not-wf-sa-168', // An unpaired surrogate (D800) is not legal anywhere in an XML document.
      'not-wf-sa-169', // An unpaired surrogate (DC00) is not legal anywhere in an XML document.
      'not-wf-sa-170', // Four byte UTF-8 encodings can encode UCS-4 characters which are beyond the range of legal XML characters (and can't be expressed in Unicode surrogate pairs). This document holds such a character.
      // not-wf-sa-088   seems a bit odd
      'ibm-not-wf-P66-ibm66n03.xml', // It is not clear if this is actually an error. If the entity were used, then it would be.  But it isn't, and it could as easily be a geref as a char ref.

      // These appear to have their text mangled in some way
      'x-ibm-1-0.5-not-wf-P04-ibm04n21.xml', // Tests an element with an illegal NameStartChar: #0xD800
      'x-ibm-1-0.5-not-wf-P04-ibm04n22.xml', // Tests an element with an illegal NameStartChar: #0xD801
      'x-ibm-1-0.5-not-wf-P04-ibm04n23.xml', // Tests an element with an illegal NameStartChar: #0xDAFF
      'x-ibm-1-0.5-not-wf-P04-ibm04n24.xml', // Tests an element with an illegal NameStartChar: #0xDFFF

      // These appear to have their text mangled in some way
      'x-ibm-1-0.5-not-wf-P04a-ibm04an21.xml', // Tests an element with an illegal NameChar: #0xD800
      'x-ibm-1-0.5-not-wf-P04a-ibm04an22.xml', // Tests an element with an illegal NameChar: #0xD801
      'x-ibm-1-0.5-not-wf-P04a-ibm04an23.xml', // Tests an element with an illegal NameChar: #0xDAFF
      'x-ibm-1-0.5-not-wf-P04a-ibm04an24.xml', // Tests an element with an illegal NameChar: #0xDFFF

      // Group: Namespaces
      'rmt-ns-e1.0-13a', // The xml namespace must not be declared as the default namespace.
      'rmt-ns-e1.0-13b', // The xmlns namespace must not be declared as the default namespace.
      'rmt-ns-e1.0-13c', // Elements must not have the prefix xmlns.

      // Group: Cahracter set
      'hst-bh-001', // decimal charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
      'hst-bh-002', // hex charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
      'hst-bh-003', // decimal charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
      'hst-bh-004', // hex charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
      'hst-lhs-007', // UTF-8 BOM plus xml decl of iso-8859-1 incompatible
      'hst-lhs-008', // UTF-16 BOM plus xml decl of utf-8 (using UTF-16 coding) incompatible
      'hst-lhs-009', // UTF-16 BOM plus xml decl of utf-8 (using UTF-8 coding) incompatible

      // -------

      'not-wf-not-sa-002', // Processing instruction target names may not be "XML" in any combination of cases.
      'not-wf-not-sa-007',
      'not-wf-sa-151',
      'not-wf-sa-153',
      'dtd07', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
      'pubid05', // SGML-ism: public ID without system ID
      'o-p09fail2', // EntityValue excludes ''
      'o-p30fail1', // An XML declaration is not the same as a TextDecl
      'o-p31fail1', // external subset excludes doctypedecl
      'o-p51fail1', // occurrence on #PCDATA group must be *
      'o-p51fail2', // occurrence on #PCDATA group must be *
      'o-p66fail6', // no references to non-characters
      'o-p75fail6', // "PUBLIC" requires two literals (contrast with SGML)

      'ibm-not-wf-P01-ibm01n02.xml', // Tests a document with wrong ordering of its prolog and element. The element occurs before the xml declaration and the DTD.
      'ibm-not-wf-P02-ibm02n30.xml', // Tests a comment which contains an illegal Char: #xD800
      'ibm-not-wf-P02-ibm02n31.xml', // Tests a comment which contains an illegal Char: #xDFFF
      'ibm-not-wf-P71-ibm70n01.xml', // Tests

      'ibm-1-1-not-wf-P02-ibm02n64.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n65.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n66.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n67.xml', // This test contains embeded character 0xD800. (Invalid UTF8 sequence)
      'ibm-1-1-not-wf-P02-ibm02n68.xml',
      'ibm-1-1-not-wf-P02-ibm02n69.xml',

      'ibm-1-1-not-wf-P04-ibm04n21.xml', // Tests an element with an illegal NameStartChar: #0xD800
      'ibm-1-1-not-wf-P04-ibm04n22.xml', // Tests an element with an illegal NameStartChar: #0xD801
      'ibm-1-1-not-wf-P04-ibm04n23.xml', // Tests an element with an illegal NameStartChar: #0xDAFF
      'ibm-1-1-not-wf-P04-ibm04n24.xml', // Tests an element with an illegal NameStartChar: #0xDFFF

      'ibm-1-1-not-wf-P04a-ibm04an21.xml', // Tests an element with an illegal NameChar: #0xD800
      'ibm-1-1-not-wf-P04a-ibm04an22.xml', // Tests an element with an illegal NameChar: #0xD801
      'ibm-1-1-not-wf-P04a-ibm04an23.xml', // Tests an element with an illegal NameChar: #0xDAFF
      'ibm-1-1-not-wf-P04a-ibm04an24.xml', // Tests an element with an illegal NameChar: #0xDFFF

      'ibm-1-1-not-wf-P77-ibm77n12.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x8E.
      'ibm-1-1-not-wf-P77-ibm77n13.xml', // The VersionNum of the primary document entity is 1.0 and that of the external 		dtd is 1.0. The external dtd contains an external entity whose VersionNum is 1.1.
      'ibm-1-1-not-wf-P77-ibm77n16.xml', // The VersionNum of the primary document entity is 1.0 and VersioNum of the external 		entity is absent. The replacement text of the entity contains an element followed 		by the valid XML 1.1 of line character NEL #x85 in its empty elem tag.
      'ibm-1-1-not-wf-P77-ibm77n17.xml', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 enf of line character NEL #x85.
      'ibm-1-1-not-wf-P77-ibm77n18.xml', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 of line character Unicode line separator #x2028.

      'rmt-e2e-27', // Contains an irregular UTF-8 sequence (i.e. a surrogate pair)
      'rmt-e2e-38', // XML 1.0 document refers to 1.1 entity
      'rmt-e2e-61', // (From John Cowan) An encoding declaration in ASCII specifying an encoding that is not compatible with ASCII (so the document is not in its declared encoding). It should generate a fatal error.
      'rmt-001', // External subset has later version number
      'rmt-002', // External PE has later version number
      'rmt-003', // External general entity has later version number
      'rmt-004', // External general entity has later version number (no decl means 1.0)
      'rmt-005', // Indirect external general entity has later version number
      'rmt-011', // Contains a C1 control, legal in XML 1.0, illegal in XML 1.1

      'rmt-041', // Contains a C1 control character (partial line up), legal in XML 1.0 but not 1.1
      'rmt-042', // Contains a character reference to a C0 control character (form-feed), legal in XML 1.1 but not 1.0

      // namespaces
      'rmt-ns10-009', // Namespace equality test: plain repetition
      'rmt-ns10-010', // Namespace equality test: use of character reference
      'rmt-ns10-011', // Namespace equality test: use of entity reference
      'rmt-ns10-012', // Namespace inequality test: equal after attribute value normalization
      'rmt-ns10-013', // Bad QName syntax: multiple colons
      'rmt-ns10-014', // Bad QName syntax: colon at end
      'rmt-ns10-015', // Bad QName syntax: colon at start
      'rmt-ns10-016', // Bad QName syntax: xmlns:
      'rmt-ns10-023', // Illegal use of 1.1-style prefix unbinding in 1.0 document
      'rmt-ns10-025', // Unbound element prefix
      'rmt-ns10-026', // Unbound attribute prefix
      'rmt-ns10-029', // Reserved prefixes and namespaces: declaring the xml prefix incorrectly
      'rmt-ns10-030', // Reserved prefixes and namespaces: binding another prefix to the xml namespace
      'rmt-ns10-031', // Reserved prefixes and namespaces: declaring the xmlns prefix with its correct URI (illegal)
      'rmt-ns10-032', // Reserved prefixes and namespaces: declaring the xmlns prefix with an incorrect URI
      'rmt-ns10-033', // Reserved prefixes and namespaces: binding another prefix to the xmlns namespace
      'rmt-ns10-035', // Attribute uniqueness: repeated identical attribute
      'rmt-ns10-036', // Attribute uniqueness: repeated attribute with different prefixes
      'rmt-ns10-042', // Colon in PI name
      'rmt-ns10-043', // Colon in entity name
      'rmt-ns10-044', // Colon in entity name
      'rmt-ns11-005', // Illegal use of prefix that has been unbound
      'ht-bh-ns11-007', // Attempt to unbind xmlns 'namespace'
      'ht-bh-ns11-008', // Attempt to unbind xml namespace

      //
      // ////////////
      // ////////////
      // ERRORS
      // ////////////
      // ////////////
      //

      // Group: Japanese encodings
      'pr-xml-euc-jp', // Test support for the EUC-JP encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'pr-xml-iso-2022-jp', // Test support for the ISO-2022-JP encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'pr-xml-shift_jis', // Test support for the Shift_JIS encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'weekly-euc-jp', // Test support for EUC-JP encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'weekly-iso-2022-jp', // Test support for ISO-2022-JP encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'weekly-shift_jis', // Test support for Shift_JIS encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      // Group: Other errors
      'uri01', // SYSTEM ids may not have URI fragments
      'rmt-e2e-34', // A non-deterministic content model is an error even if the element type is not used.
      'rmt-e2e-55', // A reference to an unparsed entity in an entity value is an error rather than forbidden (unless the entity is referenced, of course)
      'rmt-e2e-57', // A value other than preserve or default for xml:space is an error
      'rmt-055', // wrong error?  Has a Latin-1 NEL in the XML declaration (to be made an error in PR)
      'rmt-056', // Has a UTF-8 NEL in the XML declaration (to be made an error in PR)
      'rmt-057', // Has a UTF-8 LSEP in the XML declaration (to be made an error in PR)
      'rmt-ns10-004', // Namespace name test: a relative URI (deprecated)
      'rmt-ns10-005', // Namespace name test: a same-document relative URI (deprecated)
      'rmt-ns10-006', // Namespace name test: an http IRI that is not a URI
      'invalid-bo-7', // A byte order mark and a backwards one in general entity cause an illegal char. error (big-endian)
      'invalid-bo-8', // A byte order mark and a backwards one in general entity cause an illegal char. error (little-endian)
      'invalid-bo-9', // A byte order mark and a backwards one in general entity cause an illegal char. error (utf-8)
   ],
};

console.log('COUNTDOWN: Number of excluded IDs', Object.keys(testFilters.excludedIds).length);
export { testFilters };
