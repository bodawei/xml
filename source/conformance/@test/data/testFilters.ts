/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface FilterData {
   includedIds: Array<string>;
   excludedIds: Array<string>;
   futureFeatures: Array<string>;
}

const testFilters: FilterData = {
   includedIds: [],
   excludedIds: [
      // WE are either not checking chardata correctly, and/or our error messages are wonked out
      'rmt-e2e-27', // Contains an irregular UTF-8 sequence (i.e. a surrogate pair)
      'ibm-not-wf-P02-ibm02n30.xml', // Tests a comment which contains an illegal Char: #xD800
      'ibm-not-wf-P02-ibm02n31.xml', // Tests a comment which contains an illegal Char: #xDFFF
      'not-wf-sa-145', // Character #xD800 is not legal anywhere in an XML document. (If it appeared in a UTF-16 surrogate pair, it'd represent half of a UCS-4 character and so wouldn't really be in the document.)
      'not-wf-sa-168', // An unpaired surrogate (D800) is not legal anywhere in an XML document.
      'not-wf-sa-169', // An unpaired surrogate (DC00) is not legal anywhere in an XML document.
      'ibm-1-1-not-wf-P02-ibm02n68.xml',
      'ibm-1-1-not-wf-P02-ibm02n69.xml',
      'ibm-1-1-not-wf-P02-ibm02n67.xml', // - alomst, except only identifies 2 of three. Also coment and pi are saying CHARDATA_INVALID_CHAR as is CDATA   This test contains embeded character 0xD800. (Invalid UTF8 sequence)

      'rmt-020', // broke
      'rmt-021', // broke
      'ibm-not-wf-P72-ibm72n08.xml', // we have broken this in that entity (and maybe all declarations) should be stopping in parseUnexpanded if they encounter a ], at least in the internal subset.  maybe all
      /*
       * This is nasty, and I think it reflects we are doing something wrong.
       * an internal GE has "&#x0c" which is a form feed char. The replacement text has \f in it.
       *    So far, this is ok, as the replacement text has to match `content`, which it does.
       * We have parsed the "\f" as CharData. which is OK
       * But then when we do a checkWellFormed on CharData, we barf, because it is wrong.
       * But, that isn't true. CharData allows any char.  The trouble is we are mixing two things.
       * raw CharData in any entity may not have \f or other chars. But stuff passed through
       * into replacement text may. And indeed the logical document may too:
       *    Encoded document: Must be content - restrictedChar
       *    Logical document: any
       * The trouble is we do not make this distinction in the code. CharData is CharData.
       * We can detect this as we go through the check well formed and notice if we are in a general entity,
       * and process differently.
       *
       * I think we need to remove the check from CharData and do this check in ContentChecker if not in a general entity.
       * Review uses of misc.checkCharWellFormed()
       */
      'rmt-054',
      /*
       * We are processing newliens in internal entities inappropriately.
       * once we have processed input once, we no longer convert new liness to \n
       */
      'rmt-050', // Has element content whitespace containing a CR character that comes from a character reference in an internal entity. Because CR is in the S production, this is valid in both XML 1.0 and 1.1.
      'rmt-051', // Has element content whitespace containing a CR character that comes from a character reference in an internal entity. Because CR is in the S production, this is valid in both XML 1.0 and 1.1.
      'valid-sa-068', // Tests definition of an internal entity holding a carriage return character reference, which must not be normalized before reporting to the application. Line break normalization only occurs when parsing external parsed entities.

      // We are normalizing across char references, but should not be.
      'valid-sa-110', // Basically an output test, this requires that a CDATA attribute with a CRLF be normalized to one space.
      'valid-sa-111', // Character references expanding to spaces doesn't affect treatment of attributes.

      // This actually isn't wellformed either
      'invalid--005', // 'ELEMENTDECL_NO_CLOSE', // ok - Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.

      //
      // ////////////
      // ////////////
      // INVALID
      // ////////////
      // ////////////
      //

      'invalid-not-sa-022', // Good error, but does not format right
      'invalid--006', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
      'inv-required01', // Tests the Attribute Value Type (declared) VC for the xml:space attribute
      'inv-required02', // Tests the Attribute Value Type (declared) VC for the xml:lang attribute

      // While this does find the right error, ir reports several others that are not right
      'attr03', // Tests the "Notation Attributes" VC for the NOTATION attribute type, first clause: value must be one of the ones that's declared.
      'attr04', // Tests the "Notation Attributes" VC for the NOTATION attribute type, second clause: the names in the declaration must all be declared.
      'utf16b', // Tests reading an invalid "big endian" UTF-16 document
      'utf16l', // Tests reading an invalid "little endian" UTF-16 document

      'o-p16fail1', // This is sorta working.  Might be nice to give a better message than TOKEN_INVALID_CONTEXT / XMLDECL_PTOKEN
      'o-p69pass1', // misidentifying a recursive call

      'ibm-1-1-valid-P46-ibm46i01.xml', // An element with Element-Only content contains the character #x85 (NEL not a whitespace character as defined by S).
      'ibm-1-1-valid-P46-ibm46i02.xml', // An element with Element-Only content contains the character #x2028 (LESP not a whitespace character as defined by S).
      'ibm-1-1-valid-P77-ibm77v30.xml', // The VersionNum of the document is 1.1 and the textDecl is missing in the external entity. The replacement text of an entity declared in the external DTD contains a reference to the character #x1, #x7F.

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
      'rmt-046', // message not very clear 'CHILDREN_XTRA_CONTENT', // good - Has a NEL character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-052', // message not very clear 'CHILDREN_XTRA_CONTENT', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-053', // message not very clear 'CHILDREN_XTRA_CONTENT', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.

      // Group: some BOM problems. But several of these should be dying and
      'invalid-sa-140', // Character '#x309a;' is a CombiningChar, not a Letter, but as of 5th edition, may begin a name (c.f. xmltest/not-wf/sa/140.xml).
      'invalid-sa-141', // As of 5th edition, character #x0E5C is legal in XML names (c.f. xmltest/not-wf/sa/141.xml).
      'x-rmt5-014', // Has a "long s" in a name, legal in XML 1.1, legal in XML 1.0 5th edition
      'x-rmt5-016', // Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, legal in XML 1.0 5th edition
      'x-rmt5-019', // Has the last legal namechar in XML 1.1, legal in XML 1.0 5th edition
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
      'not-wf-sa-113', // Parameter entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-114', // General entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-132', // message is outright bad - Invalid syntax mixed connectors used.
      'not-wf-sa-150',
      'not-wf-sa-159', // Uses '' unquoted in an entity declaration, which is illegal syntax for an entity reference.
      'not-wf-sa-170', // Four byte UTF-8 encodings can encode UCS-4 characters which are beyond the range of legal XML characters (and can't be expressed in Unicode surrogate pairs). This document holds such a character.
      // not-wf-sa-088   seems a bit odd
      'ibm-not-wf-P66-ibm66n03.xml', // It is not clear if this is actually an error. If the entity were used, then it would be.  But it isn't, and it could as easily be a geref as a char ref.

      // Group: Cahracter set
      'hst-bh-001', // decimal charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
      'hst-bh-002', // hex charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
      'hst-bh-003', // decimal charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
      'hst-bh-004', // hex charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow

      // -------

      'not-wf-not-sa-007',
      'not-wf-sa-151',
      'not-wf-sa-153',
      'dtd07', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
      'pubid05', // SGML-ism: public ID without system ID
      'o-p09fail2', // EntityValue excludes ''
      'o-p30fail1', // An XML declaration is not the same as a TextDecl
      'o-p31fail1', // external subset excludes doctypedecl
      'o-p66fail6', // no references to non-characters
      'o-p75fail6', // "PUBLIC" requires two literals (contrast with SGML)

      'ibm-not-wf-P01-ibm01n02.xml', // Tests a document with wrong ordering of its prolog and element. The element occurs before the xml declaration and the DTD.
      'ibm-not-wf-P71-ibm70n01.xml', // Tests

      'ibm-1-1-not-wf-P02-ibm02n64.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n65.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n66.xml', // This test contains embeded control characters present in an external entity.

      'ibm-1-1-not-wf-P77-ibm77n01.xml', // The VersionNum of the document entity is 1.1 and that of the external dtd 1.0. The external dtd contains the invalid XML1.1 but valid XML 1.0 character #x7F.
      'ibm-1-1-not-wf-P77-ibm77n02.xml', // The VersionNum of the document entity is 1.1 and that of the external dtd 1.0. The external dtd contains a comment with the invalid XML1.1 but valid XML 1.0 character #x80.
      'ibm-1-1-not-wf-P77-ibm77n03.xml', // The VersionNum of the document entity is 1.1 and that of the external dtd 1.0. The external dtd contains a PI with the invalid XML1.1 but valid XML 1.0 character #x9F.
      'ibm-1-1-not-wf-P77-ibm77n04.xml', // The VersionNum of the document entity is 1.1 and that of the external entity 1.0. The external entity the contains invalid XML1.1 but valid XML 1.0 character #x89.
      'ibm-1-1-not-wf-P77-ibm77n05.xml', // The VersionNum of the document entity is 1.1 and that of the external entity 1.0. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x94.
      'ibm-1-1-not-wf-P77-ibm77n06.xml', // The VersionNum of the document entity is 1.1 and that of the external entity 1.0. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x9F.
      'ibm-1-1-not-wf-P77-ibm77n07.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x7F.
      'ibm-1-1-not-wf-P77-ibm77n08.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a VersionNum in the textDecl. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x9B.
      'ibm-1-1-not-wf-P77-ibm77n09.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x8D.
      'ibm-1-1-not-wf-P77-ibm77n10.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a VersionNum in the textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x84.
      'ibm-1-1-not-wf-P77-ibm77n11.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x88.
      'ibm-1-1-not-wf-P77-ibm77n12.xml', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x8E.
      'ibm-1-1-not-wf-P77-ibm77n13.xml', // The VersionNum of the primary document entity is 1.0 and that of the external 		dtd is 1.0. The external dtd contains an external entity whose VersionNum is 1.1.
      'ibm-1-1-not-wf-P77-ibm77n14.xml', // The VersionNum of the primary document entity is 1.1 and that of the external 		dtd is 1.0. The external dtd contains an element declaration with an invalid 		XML 1.1 and 1.0 name.
      'ibm-1-1-not-wf-P77-ibm77n15.xml', // The VersionNum of the primary document entity is 1.1 and testDecl of the external 		dtd is absent. The external dtd contains an external entity whose VersionNum is 		1.1 containing a valid XML1.0 but an invalid XML 1.1 character #x7F.
      'ibm-1-1-not-wf-P77-ibm77n16.xml', // The VersionNum of the primary document entity is 1.0 and VersioNum of the external 		entity is absent. The replacement text of the entity contains an element followed 		by the valid XML 1.1 of line character NEL #x85 in its empty elem tag.
      'ibm-1-1-not-wf-P77-ibm77n17.xml', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 enf of line character NEL #x85.
      'ibm-1-1-not-wf-P77-ibm77n18.xml', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 of line character Unicode line separator #x2028.
      'ibm-1-1-not-wf-P77-ibm77n19.xml', // The VersionNum of the primary document entity is 1.1 and that of the external 		dtd is absent. The external dtd contains an external entity whose VersionNum is 		absent and it contains a valid XML 1.0 but an invalid XML 1.1 character #x94.
      'ibm-1-1-not-wf-P77-ibm77n20.xml', // The VersionNum of the primary document entity is 1.1 and that of the external 		dtd is 1.1. The external dtd contains an external entity whose VersionNum is 		absent and it contains a valid XML 1.0 but an invalid XML 1.1 character #x8F.
      'ibm-1-1-not-wf-P77-ibm77n21.xml', // The VersionNum of the primary document entity is 1.1 and the texlDecl of the 		external dtd is absent. The external dtd contains a reference to an external 		parameter entity whose VersionNum is absent from the textDecl and it contains 		an invalid XML 1.1 character #x8F.

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

      //
      // ////////////
      // ////////////
      // ERRORS
      // ////////////
      // ////////////
      //

      // URI Fragments
      'o-p11pass1', // : 'none', // system literals may not contain URI fragments
      'uri01', // SYSTEM ids may not have URI fragments
      // Other
      'x-rmt-008', // : 'XMLDECL_VERSION_INVALD', // a document with version=1.7, illegal in XML 1.0 through 4th edition
      'rmt-e2e-34', // A non-deterministic content model is an error even if the element type is not used.
      'rmt-e2e-55', // A reference to an unparsed entity in an entity value is an error rather than forbidden (unless the entity is referenced, of course)
      'rmt-e2e-57', // A value other than preserve or default for xml:space is an error
      'rmt-055', // Has a Latin-1 NEL in the XML declaration (to be made an error in PR)
      'rmt-056', // Has a UTF-8 NEL in the XML declaration (to be made an error in PR)
      'rmt-057', // Has a UTF-8 LSEP in the XML declaration (to be made an error in PR)
   ],

   futureFeatures: [
      // ==== VALID ====
      // Characters:Charset
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
      'ext02', // Tests use of external parsed entities with different       encodings than the base document. --  may not be loading the entities correctly.
      'rmt-040', // iso-8859-1 characters, with an 8 bit char

      // Characters:BOM
      'rmt-e2e-22', // Starts with a BOM

      // === INVALID ===
      // Characters:BOM
      'invalid-bo-1', // Byte order mark in general entity should go away (big-endian)
      'invalid-bo-2', // Byte order mark in general entity should go away (little-endian)
      'invalid-bo-3', // Byte order mark in general entity should go away (utf-8)
      'invalid-bo-4', // Two byte order marks in general entity produce only one (big-endian)
      'invalid-bo-5', // Two byte order marks in general entity produce only one (little-endian)
      'invalid-bo-6', // Two byte order marks in general entity produce only one (utf-8)

      // namespaces
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

      // ==== Not wellformed ====
      // Characters:BOM
      'hst-lhs-007', // UTF-8 BOM plus xml decl of iso-8859-1 incompatible
      'hst-lhs-008', // UTF-16 BOM plus xml decl of utf-8 (using UTF-16 coding) incompatible
      'hst-lhs-009', // UTF-16 BOM plus xml decl of utf-8 (using UTF-8 coding) incompatible

      // Namespaces
      'rmt-ns-e1.0-13a', // The xml namespace must not be declared as the default namespace.
      'rmt-ns-e1.0-13b', // The xmlns namespace must not be declared as the default namespace.
      'rmt-ns-e1.0-13c', // Elements must not have the prefix xmlns.

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

      // ==== ERROR ====
      // Namespace
      'rmt-ns10-004', // Namespace name test: a relative URI (deprecated)
      'rmt-ns10-005', // Namespace name test: a same-document relative URI (deprecated)
      'rmt-ns10-006', // Namespace name test: an http IRI that is not a URI

      // Characters:Charsets
      'pr-xml-euc-jp', // Test support for the EUC-JP encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'pr-xml-iso-2022-jp', // Test support for the ISO-2022-JP encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'pr-xml-shift_jis', // Test support for the Shift_JIS encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'weekly-euc-jp', // Test support for EUC-JP encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'weekly-iso-2022-jp', // Test support for ISO-2022-JP encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'weekly-shift_jis', // Test support for Shift_JIS encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must

      // Characters:BOM
      'invalid-bo-7', // A byte order mark and a backwards one in general entity cause an illegal char. error (big-endian)
      'invalid-bo-8', // A byte order mark and a backwards one in general entity cause an illegal char. error (little-endian)
      'invalid-bo-9', // A byte order mark and a backwards one in general entity cause an illegal char. error (utf-8)
   ],
};

console.log('COUNTDOWN: Number of excluded IDs', Object.keys(testFilters.excludedIds).length);
export { testFilters };
