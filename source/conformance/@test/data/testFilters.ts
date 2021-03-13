/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface FilterData {
   includedIds: Array<string>;
   excludedIds: Array<string>;
   futureFeatures: Array<string>;
}

const testFilters: FilterData = {
   includedIds: [],
   excludedIds: [
      // 675 - Validity constraint: Proper Declaration/PE Nesting - A trailing > is a violation of this.
      'rmt-e2e-14', // Declarations mis-nested wrt parameter entities are just validity errors (but note that some parsers treat some such errors as fatal)
      'invalid--006', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.

      // 672
      // This is serious.  We need to allow "INCLUDE[..." to be the text in the parameter entity reference in a conditional section.
      // Doc must mention this aspect of what %foo; in a markup declaration can carry
      // This changes setupConditional()
      // - Minmally, we need a resumeParseConditionalStart() which pulls out the first word and possibly [ and then
      //    - defers to parseBody()
      // - But a related problem is taht we assume we can read in the whle PE value into memory, which isn't strictly true
      //    - so we need to investigate a steaming support here.
      'invalid-not-sa-022', // Good error, but does not format right

      // Easy: We are probably swallowing these text declarations before we do a check on them.
      'dtd07', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".

      // Looks like the characters are still getting mangled?
      'x-rmt5-016', // Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, legal in XML 1.0 5th edition
      'x-rmt5-019', // Has the last legal namechar in XML 1.1, legal in XML 1.0 5th edition

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

      // not checking characters and versions correctly for element names
      'x-rmt5-014', // Has a "long s" in a name, legal in XML 1.1, legal in XML 1.0 5th edition

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
      'rmt-052', // this should ultimately fail for other reasons, too. but the output does not match because we are convering 0x85 into \n  // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-053', // this should ultimately fail for other reasons, too. but the output does not match because we are convering 0x85 into \n // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.

      // We are normalizing across char references, but should not be.
      'valid-sa-110', // Basically an output test, this requires that a CDATA attribute with a CRLF be normalized to one space.
      'valid-sa-111', // Character references expanding to spaces doesn't affect treatment of attributes.

      // This actually isn't wellformed either
      'invalid--005', // 'ELEMENTDECL_NO_CLOSE', // ok - Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.

      // WellFormed: These all are concerned, it seems, that a 1.0 document refers to a > 1.0.  But I am puzzled because I do not read the spec as saying this is an erro
      'ibm-1-1-not-wf-P77-ibm77n13.xml', // The VersionNum of the primary document entity is 1.0 and that of the external 		dtd is 1.0. The external dtd contains an external entity whose VersionNum is 1.1.
      'ibm-1-1-not-wf-P77-ibm77n16.xml', // The VersionNum of the primary document entity is 1.0 and VersioNum of the external 		entity is absent. The replacement text of the entity contains an element followed 		by the valid XML 1.1 of line character NEL #x85 in its empty elem tag.
      'ibm-1-1-not-wf-P77-ibm77n17.xml', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 enf of line character NEL #x85.
      'ibm-1-1-not-wf-P77-ibm77n18.xml', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 of line character Unicode line separator #x2028.
      'rmt-e2e-38', // XML 1.0 document refers to 1.1 entity
      'rmt-001', // External subset has later version number
      'rmt-002', // External PE has later version number
      'rmt-003', // External general entity has later version number
      'rmt-004', // External general entity has later version number (no decl means 1.0)
      'rmt-005', // Indirect external general entity has later version number
      'rmt-037', // Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.

      //
      // ////////////
      // ////////////
      // INVALID
      // ////////////
      // ////////////
      //
      'o-p69pass1', // misidentifying a recursive call
      'ibm-1-1-valid-P46-ibm46i01.xml', // does not fail -  An element with Element-Only content contains the character #x85 (NEL not a whitespace character as defined by S).
      'ibm-1-1-valid-P46-ibm46i02.xml', // An element with Element-Only content contains the character #x2028 (LESP not a whitespace character as defined by S).

      //
      // ////////////
      // ////////////
      // NOT WELL FORMED
      // ////////////
      // ////////////
      //

      'o-p31fail1', // CRASHES. SOME KIND OF ETERNAL HANG
      'not-wf-sa-047', // error message so bad that i think I'm not checking the right thing -  Invalid empty element tag invalid whitespace
      'not-wf-sa-054', // PUBLIC requires two literals.
      'not-wf-sa-113', // Parameter entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-114', // General entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-132', // message is outright bad - Invalid syntax mixed connectors used.
      'not-wf-sa-150',
      'not-wf-sa-159', // Uses '' unquoted in an entity declaration, which is illegal syntax for an entity reference.
      'ibm-not-wf-P66-ibm66n03.xml', // It is not clear if this is actually an error. If the entity were used, then it would be.  But it isn't, and it could as easily be a geref as a char ref.
      'dtd07', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
      'pubid05', // SGML-ism: public ID without system ID
      'o-p09fail2', // EntityValue excludes ''
      'o-p30fail1', // An XML declaration is not the same as a TextDecl
      'o-p31fail1', // external subset excludes doctypedecl
      'o-p66fail6', // no references to non-characters
      'o-p75fail6', // "PUBLIC" requires two literals (contrast with SGML)

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
      // UTF16
      'utf16b', // Tests reading an invalid "big endian" UTF-16 document
      'utf16l', // Tests reading an invalid "little endian" UTF-16 document

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
      // Characters:Charsets
      // This is tricky. The file contains 0xf7 0x80 0x8 0x80 which is 0x1c0000 or 1835008
      // This is not a valid unicode character, and there is no way to force it into a JavaScript string.
      // That is, all the JS processors either read it in as four invalid character (ef bf bd four times)
      // or if you try to force the utf decoding and then pass 0x1c0000 to fromCharCode(), you'll get
      // back 0. Unsurprisingy \u1c0000 treats the first 4 chars as the character and the following 0's as string.
      // Thus, without building our own utf8 decoder, it is not clear to me how to test this.
      'not-wf-sa-170', // Four byte UTF-8 encodings can encode UCS-4 characters which are beyond the range of legal XML characters (and can't be expressed in Unicode surrogate pairs). This document holds such a character.

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
      'rmt-e2e-61', // (From John Cowan) An encoding declaration in ASCII specifying an encoding that is not compatible with ASCII (so the document is not in its declared encoding). It should generate a fatal error.

      // Characters:BOM
      'invalid-bo-7', // A byte order mark and a backwards one in general entity cause an illegal char. error (big-endian)
      'invalid-bo-8', // A byte order mark and a backwards one in general entity cause an illegal char. error (little-endian)
      'invalid-bo-9', // A byte order mark and a backwards one in general entity cause an illegal char. error (utf-8)
   ],
};

console.log('COUNTDOWN: Number of excluded IDs', Object.keys(testFilters.excludedIds).length);
export { testFilters };
