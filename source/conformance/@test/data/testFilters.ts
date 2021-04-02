/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface FilterData {
   includedIds: Array<string>;
   excludedIds: Array<string>;
   futureFeatures: Array<string>;
}

/*
- 
*/
const testFilters: FilterData = {
   includedIds: [],
   excludedIds: [
      // nasty - 638 'rmt-054' - checking on valid characters in already-processed chardata
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
       *
       * So contentCheck needs to know when we are in a geref (or in an attribute when in a geref)
       * - We are doing checks on literalValue, cdataCheck, charDataCheck and entityDeclarationCheck
       *       these need to receive a special thing.
       */
      'rmt-054',
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
      // This is really tricky. For a utf8 sequence, this is illegal. We can represent astral characters
      // in utf8 directly, without surrogate pairs.  the surrogate pairs are used in utf16 (and the js
      // representation of characters in memory). However, by the time this gets into our processor
      // we have "forgotten" whether this is a utf8 or utf16 stream, and so we can not distingusih
      // whether this is correct. This is a serious problem.  right now, all I can figure is
      // that the SToken system needs to produce some kind of error if it encuonters any
      // surrogate pair in a utf8 stream.
      'rmt-e2e-27', // Contains an irregular UTF-8 sequence (i.e. a surrogate pair)

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
