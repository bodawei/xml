/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface FilterData {
   includedIds: Array<string>;
   excludedIds: Array<string>;
}

const testFilters: FilterData = {
   includedIds: [],
   excludedIds: [
      'valid-sa-049', // special char
      'valid-sa-050', // special char
      'valid-sa-051', // utf16
      'valid-sa-076', // another notation problem
      'valid-sa-087', // char ref in internal entities
      'valid-sa-089', // bad chars
      'valid-sa-090', // notation attributes not handled right
      'valid-sa-096', // some error with whitespace
      'valid-not-sa-003', // wellformedcheck isn't handling ELIDED_ENTITY_DECLARATION_PTOKEN
      'valid-not-sa-004', // wellformedcheck isn't handling ELIDED_ENTITY_DECLARATION_PTOKEN
      'valid-not-sa-015', // bad conditional section.
      'valid-not-sa-016', // bad conditional section.
      'valid-not-sa-020', // some problem with param entities
      'valid-not-sa-031', // wellformedcheck isn't handling ELIDED_ENTITY_DECLARATION_PTOKEN
      'valid-ext-sa-007', // ?? esxternal entity. maybe also utf16?
      'valid-ext-sa-008', // utf16
      'valid-ext-sa-014', // some character pboelm.  Seems like it should be ok but not happy
      'pr-xml-little', // utf16
      'pr-xml-utf-16', // utf16
      'pr-xml-utf-8', // japanese charas in utf8... what happened
      'weekly-little', // UTF16!
      'weekly-utf-16', // UTF16!
      'ext01', // Some external entity problem
      'sa02', // Some standalone problem/ misinterpretation
      'sa03', // Some standalone problem/ misinterpretation
      'sa04', // Some standalone problem/ misinterpretation
      'valid-not-sa-014', // Conditional section with %pe; not unerstood
      'x-rmt-008b', // version="1.7" allowed in rev 5?
      'o-p57pass1', // expansion problem with a pe reference. clearly a bug
      'o-p69pass1', // expansion problem with a pe reference. clearly a bug
      'v-lang03', // xml:lang violation
      'v-lang04', // xml:lang violation
      'ibm-valid-P36-ibm36v01.xml', // a xml:lang violation
      'ibm-valid-P85-ibm85v01.xml', // a legal char issue
      'ibm-1-1-valid-P77-ibm77v04.xml', // a legal char issue
      'ibm-1-1-valid-P77-ibm77v05.xml', // a legal char issue
      'ibm-1-1-valid-P77-ibm77v06.xml', // a legal char issue
      'ibm-1-1-valid-P77-ibm77v07.xml', // not at all clear. A bad character, but why?
      'ibm-1-1-valid-P77-ibm77v10.xml', // not at all clear. A bad character, but why?
      'ibm-1-1-valid-P77-ibm77v11.xml', // not at all clear. A bad character, but why?
      'ibm-1-1-valid-P77-ibm77v12.xml', // not at all clear. A bad character, but why?
      'rmt-e2e-50', // a 1.1 new line problem
      'rmt-e2e-60', // conditional section mishandled (thinks it is in the wrong context)
      'rmt-006', // xml version match problem
      'rmt-e2e-22', // Starts with a BOM
      'rmt-e2e-18', // Need to find entities in subdirectories. And "subdir1/E18-pe" has no extension
      'rmt-012', // 1.1 char problem.
      'rmt-047', // 1.1 char problem.
      'rmt-054', // A character problem

      // Text problems
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
      'ibm-1-1-valid-P03-ibm03v01.xml', // The two character sequence #x0D #x85 in an external entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v02.xml', // The single character sequence #x85 in an external entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v03.xml', // The two character sequence #x0D #x85 in an external entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v04.xml', // The single character sequence #x85 in an external entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v05.xml', // The two character sequence #x0D #x85 in a document entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v06.xml', // The single character sequence #x85 in a document entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v07.xml', // The single character sequence #x2028 in a document entity must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v08.xml', // The single character sequence #x85 in the XMLDecl must be normalized to a single newline.
      'ibm-1-1-valid-P03-ibm03v09.xml', // The single character sequence #x2028 in the XMLDecl must be normalized to a single newline. (This test is questionable)
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

      // Invalid
      // A lot just need you to write down the code
      'invalid--002', // Tests the "Proper Group/PE Nesting" validity constraint by fragmenting a content model between two parameter entities.
      'invalid--005', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
      'invalid--006', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
      'invalid-not-sa-022', // Test the "Proper Conditional Section/ PE Nesting" validity constraint.
      'inv-dtd01', // Tests the No Duplicate Types VC
      'inv-dtd02', // Tests the "Notation Declared" VC by using an undeclared notation name.
      'inv-dtd03', // Tests the "Element Valid" VC (clause 2) by omitting a required element.
      'el01', // Tests the Element Valid VC (clause 4) by including an undeclared child element.
      'el02', // Tests the Element Valid VC (clause 1) by including elements in an EMPTY content model.
      'el03', // Tests the Element Valid VC (clause 3) by including a child element not permitted by a mixed content model.
      'el04', // Tests the Unique Element Type Declaration VC.
      'el05', // Tests the No Duplicate Types VC.
      'el06', // Tests the Element Valid VC (clause 1), using one of the predefined internal entities inside an EMPTY content model.
      'id01', // Tests the ID (is a Name) VC
      'id02', // Tests the ID (appears once) VC
      'id03', // Tests the One ID per Element Type VC
      'id04', // Tests the ID Attribute Default VC
      'id05', // Tests the ID Attribute Default VC
      'id06', // Tests the IDREF (is a Name) VC
      'id07', // Tests the IDREFS (is a Names) VC
      'id08', // Tests the IDREF (matches an ID) VC
      'id09', // Tests the IDREF (IDREFS matches an ID) VC
      'inv-not-sa01', // Tests the Standalone Document Declaration VC, ensuring that optional whitespace causes a validity error.
      'inv-not-sa02', // Tests the Standalone Document Declaration VC, ensuring that attributes needing normalization cause a validity error.
      'inv-not-sa04', // Tests the Standalone Document Declaration VC, ensuring that attributes needing defaulting cause a validity error.
      'inv-not-sa05', // Tests the Standalone Document Declaration VC, ensuring that a token attribute that needs normalization causes a validity error.
      'inv-not-sa06', // Tests the Standalone Document Declaration VC, ensuring that a NOTATION attribute that needs normalization causes a validity error.
      'inv-not-sa07', // Tests the Standalone Document Declaration VC, ensuring that an NMTOKEN attribute needing normalization causes a validity error.
      'inv-not-sa08', // Tests the Standalone Document Declaration VC, ensuring that an NMTOKENS attribute needing normalization causes a validity error.
      'inv-not-sa09', // Tests the Standalone Document Declaration VC, ensuring that an ID attribute needing normalization causes a validity error.
      'inv-not-sa10', // Tests the Standalone Document Declaration VC, ensuring that an IDREF attribute needing normalization causes a validity error.
      'inv-not-sa11', // Tests the Standalone Document Declaration VC, ensuring that an IDREFS attribute needing normalization causes a validity error.
      'inv-not-sa12', // Tests the Standalone Document Declaration VC, ensuring that an ENTITY attribute needing normalization causes a validity error.
      'inv-not-sa13', // Tests the Standalone Document Declaration VC, ensuring that an ENTITIES attribute needing normalization causes a validity error.
      'inv-not-sa14', // CDATA sections containing only whitespace do not match the nonterminal S, and cannot appear in these positions.
      'optional01', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one is required.
      'optional02', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing two children where one is required.
      'optional03', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where two are required.
      'optional04', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where two are required.
      'optional05', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (one construction of that model).
      'optional06', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a second construction of that model).
      'optional07', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a third construction of that model).
      'optional08', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a fourth construction of that model).
      'optional09', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a fifth construction of that model).
      'optional10', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a basic construction of that model).
      'optional11', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a second construction of that model).
      'optional12', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a third construction of that model).
      'optional13', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a fourth construction of that model).
      'optional14', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a fifth construction of that model).
      'optional20', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a sixth construction of that model).
      'optional21', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a seventh construction of that model).
      'optional22', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (an eigth construction of that model).
      'optional23', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a ninth construction of that model).
      'optional24', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a tenth construction of that model).
      'optional25', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing text content where one or more elements are required.
      'inv-required00', // Tests the Required Attribute VC.
      'inv-required01', // Tests the Attribute Value Type (declared) VC for the xml:space attribute
      'inv-required02', // Tests the Attribute Value Type (declared) VC for the xml:lang attribute
      'root', // Tests the Root Element Type VC
      'attr01', // Tests the "Entity Name" VC for the ENTITY attribute type.
      'attr02', // Tests the "Entity Name" VC for the ENTITIES attribute type.
      'attr03', // Tests the "Notation Attributes" VC for the NOTATION attribute type, first clause: value must be one of the ones that's declared.
      'attr04', // Tests the "Notation Attributes" VC for the NOTATION attribute type, second clause: the names in the declaration must all be declared.
      'attr05', // Tests the "Name Token" VC for the NMTOKEN attribute type.
      'attr06', // Tests the "Name Token" VC for the NMTOKENS attribute type.
      'attr07', // Tests the "Enumeration" VC by providing a value which wasn't one of the choices.
      'attr08', // Tests the "Fixed Attribute Default" VC by providing the wrong value.
      'attr09', // Tests the "Attribute Default Legal" VC by providing an illegal IDREF value.
      'attr10', // Tests the "Attribute Default Legal" VC by providing an illegal IDREFS value.
      'attr11', // Tests the "Attribute Default Legal" VC by providing an illegal ENTITY value.
      'attr12', // Tests the "Attribute Default Legal" VC by providing an illegal ENTITIES value.
      'attr13', // Tests the "Attribute Default Legal" VC by providing an illegal NMTOKEN value.
      'attr14', // Tests the "Attribute Default Legal" VC by providing an illegal NMTOKENS value.
      'attr15', // Tests the "Attribute Default Legal" VC by providing an illegal NOTATIONS value.
      'attr16', // Tests the "Attribute Default Legal" VC by providing an illegal enumeration value.
      'utf16b', // Tests reading an invalid "big endian" UTF-16 document
      'utf16l', // Tests reading an invalid "little endian" UTF-16 document
      'empty', // CDATA section containing only white space does not match the nonterminal S, and cannot appear in these positions.
      'o-p01pass1', // no prolog
      'o-p01pass3', // Misc items after the document
      'o-p03pass1', // all valid S characters
      'o-p04pass1', // names with all valid ASCII characters, and one from each other class in NameChar
      'o-p05pass1', // various valid Name constructions
      'o-p06fail1', // Requires at least one name.
      'o-p08fail1', // at least one Nmtoken is required.
      'o-p08fail2', // an invalid Nmtoken character.
      'o-p10pass1', // valid attribute values
      'o-p14pass1', // valid CharData
      'o-p15pass1', // valid comments
      'o-p16pass1', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
      'o-p16pass2', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
      'o-p16pass3', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
      'o-p18pass1', // valid CDSect's. Note that a CDStart in a CDSect is not recognized as such
      'o-p22pass1', // prolog can be empty
      'o-p22pass2', // XML declaration only
      'o-p22pass3', // XML decl and Misc
      'o-p23pass1', // Test shows a valid XML declaration along with version info.
      'o-p23pass2', // Test shows a valid XML declaration along with encoding declaration.
      'o-p23pass3', // Test shows a valid XML declaration along with Standalone Document Declaration.
      'o-p23pass4', // Test shows a valid XML declaration, encoding declarationand Standalone Document Declaration.
      'o-p24pass1', // Test shows a prolog that has the VersionInfo delimited by double quotes.
      'o-p24pass2', // Test shows a prolog that has the VersionInfo delimited by single quotes.
      'o-p24pass3', // Test shows whitespace is allowed in prolog before version info.
      'o-p24pass4', // Test shows whitespace is allowed in prolog on both sides of equal sign.
      'o-p25pass1', // Test shows whitespace is NOT necessary before or after equal sign of versioninfo.
      'o-p25pass2', // Test shows whitespace can be used on both sides of equal sign of versioninfo.
      'o-p26pass1', // The valid version number. We cannot test others because a 1.0 processor is allowed to fail them.
      'o-p27pass1', // Comments are valid as the Misc part of the prolog.
      'o-p27pass2', // Processing Instructions are valid as the Misc part of the prolog.
      'o-p27pass3', // Whitespace is valid as the Misc part of the prolog.
      'o-p27pass4', // A combination of comments, whitespaces and processing instructions are valid as the Misc part of the prolog.
      'o-p32pass1', // Double quotes can be used as delimeters for the value of a Standalone Document Declaration.
      'o-p32pass2', // Single quotes can be used as delimeters for the value of a Standalone Document Declaration.
      'o-p39pass1', // Empty element tag may be used for any element which has no content.
      'o-p39pass2', // Character data is valid element content.
      'o-p40pass1', // Elements content can be empty.
      'o-p40pass2', // Whitespace is valid within a Start-tag.
      'o-p40pass3', // Attributes are valid within a Start-tag.
      'o-p40pass4', // Whitespace and Multiple Attributes are valid within a Start-tag.
      'o-p41pass1', // Attributes are valid within a Start-tag.
      'o-p41pass2', // Whitespace is valid within a Start-tags Attribute.
      'o-p42pass1', // Test shows proper syntax for an End-tag.
      'o-p42pass2', // Whitespace is valid after name in End-tag.
      'o-p44pass1', // Valid display of an Empty Element Tag.
      'o-p44pass2', // Empty Element Tags can contain an Attribute.
      'o-p44pass3', // Whitespace is valid in an Empty Element Tag following the end of the attribute value.
      'o-p44pass4', // Whitespace is valid after the name in an Empty Element Tag.
      'o-p44pass5', // Whitespace and Multiple Attributes are valid in an Empty Element Tag.
      'o-p66pass1', // valid character references
      'o-p74pass1', // PEDef is either an entity value or an external id
      'o-p75pass1', // valid external identifiers
      'o-e2', // Validity Constraint: No duplicate tokens
      'ibm-1-1-valid-P46-ibm46i01.xml', // An element with Element-Only content contains the character #x85 (NEL not a whitespace character as defined by S).
      'ibm-1-1-valid-P46-ibm46i02.xml', // An element with Element-Only content contains the character #x2028 (LESP not a whitespace character as defined by S).
      'rmt-e2e-2a', // Duplicate token in enumerated attribute declaration
      'rmt-e2e-2b', // Duplicate token in NOTATION attribute declaration
      'rmt-e2e-9b', // An attribute default must be syntactically correct even if unused
      'rmt-e2e-14', // Declarations mis-nested wrt parameter entities are just validity errors (but note that some parsers treat some such errors as fatal)
      'rmt-e2e-15a', // Empty content can't contain an entity reference
      'rmt-e2e-15b', // Empty content can't contain a comment
      'rmt-e2e-15c', // Empty content can't contain a PI
      'rmt-e2e-15d', // Empty content can't contain whitespace
      'rmt-e2e-15g', // Element content can't contain character reference to whitespace
      'rmt-e2e-15h', // Element content can't contain entity reference if replacement text is character reference to whitespace
      'rmt-e2e-20', // Tokens, after normalization, must be separated by space, not other whitespace characters
      'rmt-015', // Has a "long s" in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-017', // Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-018', // Has the last legal namechar in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-030', // Has a NEL character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-032', // Has an LSEP character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-036', // Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-037', // Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-046', // Has a NEL character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-048', // Has an LSEP character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
      'rmt-052', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
      'rmt-053', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
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
      'rmt-e3e-06a', // Default values for IDREF attributes must match Name.
      'rmt-e3e-06b', // Default values for ENTITY attributes must match Name.
      'rmt-e3e-06c', // Default values for IDREFS attributes must match Names.
      'rmt-e3e-06d', // Default values for ENTITIES attributes must match Names.
      'rmt-e3e-06e', // Default values for NMTOKEN attributes must match Nmtoken.
      'rmt-e3e-06f', // Default values for NMTOKENS attributes must match Nmtokens.
      'rmt-e3e-06g', // Default values for NOTATION attributes must match one of the enumerated values.
      'rmt-e3e-06h', // Default values for enumerated attributes must match one of the enumerated values.
      'rmt-e3e-13', // Even internal parameter entity references are enough to make undeclared entities into mere validity errors rather than well-formedness errors.
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

      // Not wellformed
      'not-wf-not-sa-007', // CRASHES. OUT OF MEMORY
      'o-p31fail1', // CRASHES. SOME KIND OF ETERNAL HANG
      'not-wf-sa-001', // Attribute values must start with attribute names, not "?".
      'not-wf-sa-002', // Names may not start with "."; it's not a Letter.
      'not-wf-sa-003', // Processing Instruction target name is required.
      'not-wf-sa-004', // SGML-ism: processing instructions end in '?>' not '>'.
      'not-wf-sa-005', // Processing instructions end in '?>' not '?'.
      'not-wf-sa-006', // XML comments may not contain "--"
      'not-wf-sa-007', // General entity references have no whitespace after the entity name and before the semicolon.
      'not-wf-sa-008', // Entity references must include names, which don't begin with '.' (it's not a Letter or other name start character).
      'not-wf-sa-009', // Character references may have only decimal or numeric strings.
      'not-wf-sa-010', // Ampersand may only appear as part of a general entity reference.
      'not-wf-sa-011', // SGML-ism: attribute values must be explicitly assigned a value, it can't act as a boolean toggle.
      'not-wf-sa-012', // SGML-ism: attribute values must be quoted in all cases.
      'not-wf-sa-013', // The quotes on both ends of an attribute value must match.
      'not-wf-sa-014', // Attribute values may not contain literal '' characters.
      'not-wf-sa-015', // Attribute values need a value, not just an equals sign.
      'not-wf-sa-016', // Attribute values need an associated name.
      'not-wf-sa-017', // CDATA sections need a terminating ']]>'.
      'not-wf-sa-018', // CDATA sections begin with a literal '![CDATA[', no space.
      'not-wf-sa-019', // End tags may not be abbreviated as '/>'.
      'not-wf-sa-020', // Attribute values may not contain literal '' characters except as part of an entity reference.
      'not-wf-sa-021', // Attribute values may not contain literal '' characters except as part of an entity reference.
      'not-wf-sa-022', // Character references end with semicolons, always!
      'not-wf-sa-023', // Digits are not valid name start characters.
      'not-wf-sa-024', // Digits are not valid name start characters.
      'not-wf-sa-025', // Text may not contain a literal ']]>' sequence.
      'not-wf-sa-026', // Text may not contain a literal ']]>' sequence.
      'not-wf-sa-027', // Comments must be terminated with "-->".
      'not-wf-sa-028', // Processing instructions must end with '?>'.
      'not-wf-sa-029', // Text may not contain a literal ']]>' sequence.
      'not-wf-sa-030', // A form feed is not a legal XML character.
      'not-wf-sa-031', // A form feed is not a legal XML character.
      'not-wf-sa-032', // A form feed is not a legal XML character.
      'not-wf-sa-033', // An ESC (octal 033) is not a legal XML character.
      'not-wf-sa-034', // A form feed is not a legal XML character.
      'not-wf-sa-035', // The '' character is a markup delimiter and must start an element, CDATA section, PI, or comment.
      'not-wf-sa-036', // Text may not appear after the root element.
      'not-wf-sa-037', // Character references may not appear after the root element.
      'not-wf-sa-038', // Tests the "Unique Att Spec" WF constraint by providing multiple values for an attribute.
      'not-wf-sa-039', // Tests the Element Type Match WFC', // end tag name must match start tag name.
      'not-wf-sa-040', // Provides two document elements.
      'not-wf-sa-041', // Provides two document elements.
      'not-wf-sa-042', // Invalid End Tag
      'not-wf-sa-043', // Provides #PCDATA text after the document element.
      'not-wf-sa-044', // Provides two document elements.
      'not-wf-sa-045', // Invalid Empty Element Tag
      'not-wf-sa-046', // This start (or empty element) tag was not terminated correctly.
      'not-wf-sa-047', // Invalid empty element tag invalid whitespace
      'not-wf-sa-048', // Provides a CDATA section after the root element.
      'not-wf-sa-049', // Missing start tag
      'not-wf-sa-050', // Empty document, with no root element.
      'not-wf-sa-051', // CDATA is invalid at top level of document.
      'not-wf-sa-052', // Invalid character reference.
      'not-wf-sa-053', // End tag does not match start tag.
      'not-wf-sa-054', // PUBLIC requires two literals.
      'not-wf-sa-055', // Invalid Document Type Definition format.
      'not-wf-sa-056', // Invalid Document Type Definition format', // misplaced comment.
      'not-wf-sa-057', // This isn't SGML; comments can't exist in declarations.
      'not-wf-sa-058', // Invalid character , in ATTLIST enumeration
      'not-wf-sa-059', // String literal must be in quotes.
      'not-wf-sa-060', // Invalid type NAME defined in ATTLIST.
      'not-wf-sa-061', // External entity declarations require whitespace between public and system IDs.
      'not-wf-sa-062', // Entity declarations need space after the entity name.
      'not-wf-sa-063', // Conditional sections may only appear in the external DTD subset.
      'not-wf-sa-064', // Space is required between attribute type and default values in!ATTLIST...>declarations.
      'not-wf-sa-065', // Space is required between attribute name and type in!ATTLIST...>declarations.
      'not-wf-sa-066', // Required whitespace is missing.
      'not-wf-sa-067', // Space is required between attribute type and default values in!ATTLIST...>declarations.
      'not-wf-sa-068', // Space is required between NOTATION keyword and list of enumerated choices in!ATTLIST...>declarations.
      'not-wf-sa-069', // Space is required before an NDATA entity annotation.
      'not-wf-sa-070', // XML comments may not contain "--"
      'not-wf-sa-071', // ENTITY can't reference itself directly or indirectly.
      'not-wf-sa-072', // Undefined ENTITY foo.
      'not-wf-sa-073', // Undefined ENTITY f.
      'not-wf-sa-074', // Internal general parsed entities are only well formed if they match the "content" production.
      'not-wf-sa-075', // ENTITY can't reference itself directly or indirectly.
      'not-wf-sa-076', // Undefined ENTITY foo.
      'not-wf-sa-077', // Undefined ENTITY bar.
      'not-wf-sa-078', // Undefined ENTITY foo.
      'not-wf-sa-079', // ENTITY can't reference itself directly or indirectly.
      'not-wf-sa-080', // ENTITY can't reference itself directly or indirectly.
      'not-wf-sa-081', // This tests the_No External Entity References_WFC, since the entity is referred to within an attribute.
      'not-wf-sa-082', // This tests the_No External Entity References_WFC, since the entity is referred to within an attribute.
      'not-wf-sa-083', // Undefined NOTATION n.
      'not-wf-sa-084', // Tests the_Parsed Entity_WFC by referring to an unparsed entity. (This precedes the error of not declaring that entity's notation, which may be detected any time before the DTD parsing is completed.)
      'not-wf-sa-085', // Public IDs may not contain "[".
      'not-wf-sa-086', // Public IDs may not contain "[".
      'not-wf-sa-087', // Public IDs may not contain "[".
      'not-wf-sa-088', // Attribute values are terminated by literal quote characters, and any entity expansion is done afterwards.
      'not-wf-sa-089', // Parameter entities "are" always parsed; NDATA annotations are not permitted.
      'not-wf-sa-090', // Attributes may not contain a literal "" character; this one has one because of reference expansion.
      'not-wf-sa-091', // Parameter entities "are" always parsed; NDATA annotations are not permitted.
      'not-wf-sa-092', // The replacement text of this entity has an illegal reference, because the character reference is expanded immediately.
      'not-wf-sa-093', // Hexadecimal character references may not use the uppercase 'X'.
      'not-wf-sa-094', // Prolog VERSION must be lowercase.
      'not-wf-sa-095', // VersionInfo must come before EncodingDecl.
      'not-wf-sa-096', // Space is required before the standalone declaration.
      'not-wf-sa-097', // Both quotes surrounding VersionNum must be the same.
      'not-wf-sa-098', // Only one "version=..." string may appear in an XML declaration.
      'not-wf-sa-099', // Only three pseudo-attributes are in the XML declaration, and "valid=..." is not one of them.
      'not-wf-sa-100', // Only "yes" and "no" are permitted as values of "standalone".
      'not-wf-sa-101', // Space is not permitted in an encoding name.
      'not-wf-sa-102', // Provides an illegal XML version number; spaces are illegal.
      'not-wf-sa-103', // End-tag required for element foo.
      'not-wf-sa-104', // Internal general parsed entities are only well formed if they match the "content" production.
      'not-wf-sa-105', // Invalid placement of CDATA section.
      'not-wf-sa-106', // Invalid placement of entity declaration.
      'not-wf-sa-107', // Invalid document type declaration. CDATA alone is invalid.
      'not-wf-sa-108', // No space in '![CDATA['.
      'not-wf-sa-109', // Tags invalid within EntityDecl.
      'not-wf-sa-110', // Entity reference must be in content of element.
      'not-wf-sa-111', // Entiry reference must be in content of element not Start-tag.
      'not-wf-sa-112', // CDATA sections start '![CDATA[', not '!cdata['.
      'not-wf-sa-113', // Parameter entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-114', // General entity values must use valid reference syntax; this reference is malformed.
      'not-wf-sa-115', // The replacement text of this entity is an illegal character reference, which must be rejected when it is parsed in the context of an attribute value.
      'not-wf-sa-116', // Internal general parsed entities are only well formed if they match the "content" production. This is a partial character reference, not a full one.
      'not-wf-sa-117', // Internal general parsed entities are only well formed if they match the "content" production. This is a partial character reference, not a full one.
      'not-wf-sa-118', // Entity reference expansion is not recursive.
      'not-wf-sa-119', // Internal general parsed entities are only well formed if they match the "content" production. This is a partial character reference, not a full one.
      'not-wf-sa-120', // Character references are expanded in the replacement text of an internal entity, which is then parsed as usual. Accordingly,must be doubly quoted', // encoded either as_amp;_or as_#38;#38;_.
      'not-wf-sa-121', // A name of an ENTITY was started with an invalid character.
      'not-wf-sa-122', // Invalid syntax mixed connectors are used.
      'not-wf-sa-123', // Invalid syntax mismatched parenthesis.
      'not-wf-sa-124', // Invalid format of Mixed-content declaration.
      'not-wf-sa-125', // Invalid syntax extra set of parenthesis not necessary.
      'not-wf-sa-126', // Invalid syntax Mixed-content must be defined as zero or more.
      'not-wf-sa-127', // Invalid syntax Mixed-content must be defined as zero or more.
      'not-wf-sa-128', // Invalid CDATA syntax.
      'not-wf-sa-129', // Invalid syntax for Element Type Declaration.
      'not-wf-sa-130', // Invalid syntax for Element Type Declaration.
      'not-wf-sa-131', // Invalid syntax for Element Type Declaration.
      'not-wf-sa-132', // Invalid syntax mixed connectors used.
      'not-wf-sa-133', // Illegal whitespace before optional character causes syntax error.
      'not-wf-sa-134', // Illegal whitespace before optional character causes syntax error.
      'not-wf-sa-135', // Invalid character used as connector.
      'not-wf-sa-136', // Tag omission is invalid in XML.
      'not-wf-sa-137', // Space is required before a content model.
      'not-wf-sa-138', // Invalid syntax for content particle.
      'not-wf-sa-139', // The element-content model should not be empty.
      'not-wf-sa-140', // Character '#x309a;' is a CombiningChar, not a Letter, and so may not begin a name.
      'not-wf-sa-141', // Character #x0E5C is not legal in XML names.
      'not-wf-sa-142', // Character #x0000 is not legal anywhere in an XML document.
      'not-wf-sa-143', // Character #x001F is not legal anywhere in an XML document.
      'not-wf-sa-144', // Character #xFFFF is not legal anywhere in an XML document.
      'not-wf-sa-145', // Character #xD800 is not legal anywhere in an XML document. (If it appeared in a UTF-16 surrogate pair, it'd represent half of a UCS-4 character and so wouldn't really be in the document.)
      'not-wf-sa-146', // Character references must also refer to legal XML characters; #x00110000 is one more than the largest legal character.
      'not-wf-sa-147', // XML Declaration may not be preceded by whitespace.
      'not-wf-sa-148', // XML Declaration may not be preceded by comments or whitespace.
      'not-wf-sa-149', // XML Declaration may not be within a DTD.
      'not-wf-sa-150', // XML declarations may not be within element content.
      'not-wf-sa-151', // XML declarations may not follow document content.
      'not-wf-sa-152', // XML declarations must include the "version=..." string.
      'not-wf-sa-153', // Text declarations may not begin internal parsed entities; they may only appear at the beginning of external parsed (parameter or general) entities.
      'not-wf-sa-154', // '?XML ...?>' is neither an XML declaration nor a legal processing instruction target name.
      'not-wf-sa-155', // '?xmL ...?>' is neither an XML declaration nor a legal processing instruction target name.
      'not-wf-sa-156', // '?xMl ...?>' is neither an XML declaration nor a legal processing instruction target name.
      'not-wf-sa-157', // '?xmL ...?>' is not a legal processing instruction target name.
      'not-wf-sa-158', // SGML-ism: "#NOTATION gif" can't have attributes.
      'not-wf-sa-159', // Uses '' unquoted in an entity declaration, which is illegal syntax for an entity reference.
      'not-wf-sa-160', // Violates the_PEs in Internal Subset_WFC by using a PE reference within a declaration.
      'not-wf-sa-161', // Violates the_PEs in Internal Subset_WFC by using a PE reference within a declaration.
      'not-wf-sa-162', // Violates the_PEs in Internal Subset_WFC by using a PE reference within a declaration.
      'not-wf-sa-163', // Invalid placement of Parameter entity reference.
      'not-wf-sa-164', // Invalid placement of Parameter entity reference.
      'not-wf-sa-165', // Parameter entity declarations must have a space before the '%'.
      'not-wf-sa-166', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-167', // Character FFFE is not legal anywhere in an XML document.
      'not-wf-sa-168', // An unpaired surrogate (D800) is not legal anywhere in an XML document.
      'not-wf-sa-169', // An unpaired surrogate (DC00) is not legal anywhere in an XML document.
      'not-wf-sa-170', // Four byte UTF-8 encodings can encode UCS-4 characters which are beyond the range of legal XML characters (and can't be expressed in Unicode surrogate pairs). This document holds such a character.
      'not-wf-sa-171', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-172', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-173', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-174', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-175', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-176', // Start tags must have matching end tags.
      'not-wf-sa-177', // Character FFFF is not legal anywhere in an XML document.
      'not-wf-sa-178', // Invalid syntax matching double quote is missing.
      'not-wf-sa-179', // Invalid syntax matching double quote is missing.
      'not-wf-sa-180', // The_Entity Declared_WFC requires entities to be declared before they are used in an attribute list declaration.
      'not-wf-sa-181', // Internal parsed entities must match the_content_production to be well formed.
      'not-wf-sa-182', // Internal parsed entities must match the_content_production to be well formed.
      'not-wf-sa-183', // Mixed content declarations may not include content particles.
      'not-wf-sa-184', // In mixed content models, element names must not be parenthesized.
      'not-wf-sa-185', // Tests the_Entity Declared_WFC._Note:_a nonvalidating parser is permitted not to report this WFC violation, since it would need to read an external parameter entity to distinguish it from a violation of the_Standalone Declaration_VC.
      'not-wf-sa-186', // Whitespace is required between attribute/value pairs.
      'not-wf-not-sa-001', // Conditional sections must be properly terminated ("]>" used instead of "]]>").
      'not-wf-not-sa-002', // Processing instruction target names may not be "XML" in any combination of cases.
      'not-wf-not-sa-003', // Conditional sections must be properly terminated ("]]>" omitted).
      'not-wf-not-sa-004', // Conditional sections must be properly terminated ("]]>" omitted).
      'not-wf-not-sa-006', // Conditional sections need a '[' after the INCLUDE or IGNORE.
      'not-wf-not-sa-008', // In DTDs, the '%' character must be part of a parameter entity reference.
      'not-wf-not-sa-009', // This test violates WFC:PE Between Declarations in Production 28a. The last character of a markup declaration is not contained in the same parameter-entity text replacement.
      'not-wf-ext-sa-001', // Tests the_No Recursion_WFC by having an external general entity be self-recursive.
      'not-wf-ext-sa-002', // External entities have "text declarations", which do not permit the "standalone=..." attribute that's allowed in XML declarations.
      'not-wf-ext-sa-003', // Only one text declaration is permitted; a second one looks like an illegal processing instruction (target names of "xml" in any case are not allowed).
      'not-wf-sa03', // Tests the Entity Declared WFC, ensuring that a reference to externally defined entity causes a well-formedness error.
      'attlist01', // SGML's NUTOKEN is not allowed.
      'attlist02', // SGML's NUTOKENS attribute type is not allowed.
      'attlist03', // Comma doesn't separate enumerations, unlike in SGML.
      'attlist04', // SGML's NUMBER attribute type is not allowed.
      'attlist05', // SGML's NUMBERS attribute type is not allowed.
      'attlist06', // SGML's NAME attribute type is not allowed.
      'attlist07', // SGML's NAMES attribute type is not allowed.
      'attlist08', // SGML's #CURRENT is not allowed.
      'attlist09', // SGML's #CONREF is not allowed.
      'attlist10', // Whitespace required between attributes
      'attlist11', // Whitespace required between attributes
      'cond01', // Only INCLUDE and IGNORE are conditional section keywords
      'cond02', // Must have keyword in conditional sections
      'content01', // No whitespace before "?" in content model
      'content02', // No whitespace before "*" in content model
      'content03', // No whitespace before "+" in content model
      'decl01', // External entities may not have standalone decls.
      'nwf-dtd00', // Comma mandatory in content model
      'nwf-dtd01', // Can't mix comma and vertical bar in content models
      'dtd02', // PE name immediately after "%"
      'dtd03', // PE name immediately followed by ";"
      'dtd04', // PUBLIC literal must be quoted
      'dtd05', // SYSTEM identifier must be quoted
      'dtd07', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
      'element00', // EOF in middle of incomplete ETAG
      'element01', // EOF in middle of incomplete ETAG
      'element02', // Illegal markup (... %>)
      'element03', // Illegal markup ()
      'element04', // Illegal markup (!ELEMENT ...>)
      'encoding01', // Illegal character " " in encoding name
      'encoding02', // Illegal character "/" in encoding name
      'encoding03', // Illegal character reference in encoding name
      'encoding04', // Illegal character ":" in encoding name
      'encoding05', // Illegal character "@" in encoding name
      'encoding06', // Illegal character "+" in encoding name
      'encoding07', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
      'pi', // No space between PI target name and data
      'pubid01', // Illegal entity ref in public ID
      'pubid02', // Illegal characters in public ID
      'pubid03', // Illegal characters in public ID
      'pubid04', // Illegal characters in public ID
      'pubid05', // SGML-ism: public ID without system ID
      'sgml01', // SGML-ism: omitted end tag for EMPTY content
      'sgml02', // XML declaration must be at the very beginning of a document; it"s not a processing instruction
      'sgml03', // Comments may not contain "--"
      'sgml04', // ATTLIST declarations apply to only one element, unlike SGML
      'sgml05', // ELEMENT declarations apply to only one element, unlike SGML
      'sgml06', // ATTLIST declarations are never global, unlike in SGML
      'sgml07', // SGML Tag minimization specifications are not allowed
      'sgml08', // SGML Tag minimization specifications are not allowed
      'sgml09', // SGML Content model exception specifications are not allowed
      'sgml10', // SGML Content model exception specifications are not allowed
      'sgml11', // CDATA is not a valid content model spec
      'sgml12', // RCDATA is not a valid content model spec
      'sgml13', // SGML Unordered content models not allowed
      'o-p01fail1', // S cannot occur before the prolog
      'o-p01fail2', // comments cannot occur before the prolog
      'o-p01fail3', // only one document element
      'o-p01fail4', // document element must be complete.
      'o-p04fail1', // Name contains invalid character.
      'o-p04fail2', // Name contains invalid character.
      'o-p04fail3', // Name contains invalid character.
      'o-p05fail1', // a Name cannot start with a digit
      'o-p05fail2', // a Name cannot start with a '.'
      'o-p05fail3', // a Name cannot start with a "-"
      'o-p05fail4', // a Name cannot start with a CombiningChar
      'o-p05fail5', // a Name cannot start with an Extender
      'o-p09fail1', // EntityValue excludes '%'
      'o-p09fail2', // EntityValue excludes ''
      'o-p09fail3', // incomplete character reference
      'o-p09fail4', // quote types must match
      'o-p09fail5', // quote types must match
      'o-p10fail1', // attribute values exclude ''
      'o-p10fail2', // attribute values exclude ''
      'o-p10fail3', // quote types must match
      'o-p11fail1', // quote types must match
      'o-p11fail2', // cannot contain delimiting quotes
      'o-p12fail1', // '"' excluded
      'o-p12fail2', // '\' excluded
      'o-p12fail3', // entity references excluded
      'o-p12fail4', // '>' excluded
      'o-p12fail5', // '' excluded
      'o-p12fail6', // built-in entity refs excluded
      'o-p12fail7', // The public ID has a tab character, which is disallowed
      'o-p14fail1', // '' excluded
      'o-p14fail2', // '' excluded
      'o-p14fail3', // "]]>" excluded
      'o-p15fail1', // comments can't end in '-'
      'o-p15fail2', // one comment per comment (contrasted with SGML)
      'o-p15fail3', // can't include 2 or more adjacent '-'s
      'o-p16fail1', // "xml" is an invalid PITarget
      'o-p16fail2', // a PITarget must be present
      'o-p16fail3', // S after PITarget is required
      'o-p18fail1', // no space before "CDATA"
      'o-p18fail2', // no space after "CDATA"
      'o-p18fail3', // CDSect's can't nest
      'o-p22fail1', // prolog must start with XML decl
      'o-p22fail2', // prolog must start with XML decl
      'o-p23fail1', // "xml" must be lower-case
      'o-p23fail2', // VersionInfo must be supplied
      'o-p23fail3', // VersionInfo must come first
      'o-p23fail4', // SDDecl must come last
      'o-p23fail5', // no SGML-type PIs
      'o-p24fail1', // quote types must match
      'o-p24fail2', // quote types must match
      'o-p25fail1', // Comment is illegal in VersionInfo.
      'o-p26fail1', // Illegal character in VersionNum.
      'o-p26fail2', // Illegal character in VersionNum.
      'o-p27fail1', // References aren't allowed in Misc, even if they would resolve to valid Misc.
      'o-p28fail1', // only declarations in DTD.
      'o-p29fail1', // A processor must not pass unknown declaration types.
      'o-p30fail1', // An XML declaration is not the same as a TextDecl
      'o-p32fail1', // quote types must match
      'o-p32fail2', // quote types must match
      'o-p32fail3', // initial S is required
      'o-p32fail4', // quotes are required
      'o-p32fail5', // yes or no must be lower case
      'o-p39fail1', // start-tag requires end-tag
      'o-p39fail2', // end-tag requires start-tag
      'o-p39fail3', // XML documents contain one or more elements
      'o-p39fail4', // XML declarations must be correctly terminated
      'o-p39fail5', // XML declarations must be correctly terminated
      'o-p40fail1', // S is required between attributes
      'o-p40fail2', // tags start with names, not nmtokens
      'o-p40fail3', // tags start with names, not nmtokens
      'o-p40fail4', // no space before name
      'o-p41fail1', // quotes are required (contrast with SGML)
      'o-p41fail2', // attribute name is required (contrast with SGML)
      'o-p41fail3', // Eq required
      'o-p42fail1', // no space before name
      'o-p42fail2', // cannot end with "/>"
      'o-p42fail3', // no NET (contrast with SGML)
      'o-p43fail1', // no non-comment declarations
      'o-p43fail2', // no conditional sections
      'o-p43fail3', // no conditional sections
      'o-p44fail1', // Illegal space before Empty element tag.
      'o-p44fail2', // Illegal space after Empty element tag.
      'o-p44fail3', // Illegal comment in Empty element tag.
      'o-p44fail4', // Whitespace required between attributes.
      'o-p44fail5', // Duplicate attribute name is illegal.
      'o-p45fail1', // ELEMENT must be upper case.
      'o-p45fail2', // S before contentspec is required.
      'o-p45fail3', // only one content spec
      'o-p45fail4', // no comments in declarations (contrast with SGML)
      'o-p46fail1', // no parens on declared content
      'o-p46fail2', // no inclusions (contrast with SGML)
      'o-p46fail3', // no exclusions (contrast with SGML)
      'o-p46fail4', // no space before occurrence
      'o-p46fail5', // single group
      'o-p46fail6', // can't be both declared and modeled
      'o-p47fail1', // Invalid operator '|' must match previous operator ','
      'o-p47fail2', // Illegal character '-' in Element-content model
      'o-p47fail3', // Optional character must follow a name or list
      'o-p47fail4', // Illegal space before optional character
      'o-p48fail1', // Illegal space before optional character
      'o-p48fail2', // Illegal space before optional character
      'o-p49fail1', // connectors must match
      'o-p50fail1', // connectors must match
      'o-p51fail1', // occurrence on #PCDATA group must be *
      'o-p51fail2', // occurrence on #PCDATA group must be *
      'o-p51fail3', // #PCDATA must come first
      'o-p51fail4', // occurrence on #PCDATA group must be *
      'o-p51fail5', // only '|' connectors
      'o-p51fail6', // Only '|' connectors and occurrence on #PCDATA group must be *
      'o-p51fail7', // no nested groups
      'o-p52fail1', // A name is required
      'o-p52fail2', // A name is required
      'o-p53fail1', // S is required before default
      'o-p53fail2', // S is required before type
      'o-p53fail3', // type is required
      'o-p53fail4', // default is required
      'o-p53fail5', // name is requried
      'o-p54fail1', // don't pass unknown attribute types
      'o-p55fail1', // must be upper case
      'o-p56fail1', // no IDS type
      'o-p56fail2', // no NUMBER type
      'o-p56fail3', // no NAME type
      'o-p56fail4', // no ENTITYS type', // types must be upper case
      'o-p56fail5', // types must be upper case
      'o-p57fail1', // no keyword for NMTOKEN enumeration
      'o-p58fail1', // at least one value required
      'o-p58fail2', // separator must be '|'
      'o-p58fail3', // notations are NAMEs, not NMTOKENs -- note: Leaving the invalid notation undeclared would cause a validating parser to fail without checking the name syntax, so the notation is declared with an invalid name. A parser that reports error positions should report an error at the AttlistDecl on line 6, before reaching the notation declaration.
      'o-p58fail4', // NOTATION must be upper case
      'o-p58fail5', // S after keyword is required
      'o-p58fail6', // parentheses are require
      'o-p58fail7', // values are unquoted
      'o-p58fail8', // values are unquoted
      'o-p59fail1', // at least one required
      'o-p59fail2', // separator must be ","
      'o-p59fail3', // values are unquoted
      'o-p60fail1', // keywords must be upper case
      'o-p60fail2', // S is required after #FIXED
      'o-p60fail3', // only #FIXED has both keyword and value
      'o-p60fail4', // #FIXED required value
      'o-p60fail5', // only one default type
      'o-p61fail1', // no other types, including TEMP, which is valid in SGML
      'o-p62fail1', // INCLUDE must be upper case
      'o-p62fail2', // no spaces in terminating delimiter
      'o-p63fail1', // IGNORE must be upper case
      'o-p63fail2', // delimiters must be balanced
      'o-p64fail1', // section delimiters must balance
      'o-p64fail2', // section delimiters must balance
      'o-p66fail1', // terminating ';' is required
      'o-p66fail2', // no S after '#'
      'o-p66fail3', // no hex digits in numeric reference
      'o-p66fail4', // only hex digits in hex references
      'o-p66fail5', // no references to non-characters
      'o-p66fail6', // no references to non-characters
      'o-p68fail1', // terminating ';' is required
      'o-p68fail2', // no S after ''
      'o-p68fail3', // no S before ';'
      'o-p69fail1', // terminating ';' is required
      'o-p69fail2', // no S after '%'
      'o-p69fail3', // no S before ';'
      'o-p70fail1', // This is neither
      'o-p71fail1', // S is required before EntityDef
      'o-p71fail2', // Entity name is a Name, not an NMToken
      'o-p71fail3', // no S after "!"
      'o-p71fail4', // S is required after "!ENTITY"
      'o-p72fail1', // S is required after "!ENTITY"
      'o-p72fail2', // S is required after '%'
      'o-p72fail3', // S is required after name
      'o-p72fail4', // Entity name is a name, not an NMToken
      'o-p73fail1', // No typed replacement text
      'o-p73fail2', // Only one replacement value
      'o-p73fail3', // No NDataDecl on replacement text
      'o-p73fail4', // Value is required
      'o-p73fail5', // No NDataDecl without value
      'o-p74fail1', // no NDataDecls on parameter entities
      'o-p74fail2', // value is required
      'o-p74fail3', // only one value
      'o-p75fail1', // S required after "PUBLIC"
      'o-p75fail2', // S required after "SYSTEM"
      'o-p75fail3', // S required between literals
      'o-p75fail4', // "SYSTEM" implies only one literal
      'o-p75fail5', // only one keyword
      'o-p75fail6', // "PUBLIC" requires two literals (contrast with SGML)
      'o-p76fail1', // S is required before "NDATA"
      'o-p76fail2', // "NDATA" is upper-case
      'o-p76fail3', // notation name is required
      'o-p76fail4', // notation names are Names
      'ibm-not-wf-P01-ibm01n02.xml', // Tests a document with wrong ordering of its prolog and element. The element occurs before the xml declaration and the DTD.
      'ibm-not-wf-P02-ibm02n30.xml', // Tests a comment which contains an illegal Char: #xD800
      'ibm-not-wf-P02-ibm02n31.xml', // Tests a comment which contains an illegal Char: #xDFFF
      'ibm-not-wf-P22-ibm22n01.xml', // Tests prolog with wrong field ordering. The XMLDecl occurs after the DTD.
      'ibm-not-wf-P22-ibm22n02.xml', // Tests prolog with wrong field ordering. The Misc (comment) occurs before the XMLDecl.
      'ibm-not-wf-P22-ibm22n03.xml', // Tests prolog with wrong field ordering. The XMLDecl occurs after the DTD and a comment. The other comment occurs before the DTD.
      'ibm-not-wf-P29-ibm29n01.xml', // Tests markupdecl with an illegal markup declaration. A XMLDecl occurs inside the DTD.
      'ibm-not-wf-P29-ibm29n03.xml', // Tests WFC "PEs in Internal Subset". A PE reference occurs inside an ATTlistDecl in the DTD.
      'ibm-not-wf-P71-ibm70n01.xml', // Tests

      'ibm-1-1-not-wf-P02-ibm02n64.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n65.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n66.xml', // This test contains embeded control characters present in an external entity.
      'ibm-1-1-not-wf-P02-ibm02n67.xml', // This test contains embeded character 0xD800. (Invalid UTF8 sequence)
      'ibm-1-1-not-wf-P02-ibm02n68.xml', // This test contains embeded character 0xFFFE.
      'ibm-1-1-not-wf-P02-ibm02n69.xml', // This test contains embeded character 0xFFFF.
      'ibm-1-1-not-wf-P02-ibm02n70.xml', // This test contains a reference to character 0xFFFE.
      'ibm-1-1-not-wf-P02-ibm02n71.xml', // This test contains a reference to character 0xFFFF.

      'ibm-1-1-not-wf-P04-ibm04n21.xml', // Tests an element with an illegal NameStartChar: #0xD800
      'ibm-1-1-not-wf-P04-ibm04n22.xml', // Tests an element with an illegal NameStartChar: #0xD801
      'ibm-1-1-not-wf-P04-ibm04n23.xml', // Tests an element with an illegal NameStartChar: #0xDAFF
      'ibm-1-1-not-wf-P04-ibm04n24.xml', // Tests an element with an illegal NameStartChar: #0xDFFF

      'ibm-1-1-not-wf-P04a-ibm04an21.xml', // Tests an element with an illegal NameChar: #0xD800
      'ibm-1-1-not-wf-P04a-ibm04an22.xml', // Tests an element with an illegal NameChar: #0xD801
      'ibm-1-1-not-wf-P04a-ibm04an23.xml', // Tests an element with an illegal NameChar: #0xDAFF
      'ibm-1-1-not-wf-P04a-ibm04an24.xml', // Tests an element with an illegal NameChar: #0xDFFF

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
      'rmt-e2e-27', // Contains an irregular UTF-8 sequence (i.e. a surrogate pair)
      'rmt-e2e-38', // XML 1.0 document refers to 1.1 entity
      'rmt-e2e-61', // (From John Cowan) An encoding declaration in ASCII specifying an encoding that is not compatible with ASCII (so the document is not in its declared encoding). It should generate a fatal error.
      'rmt-001', // External subset has later version number
      'rmt-002', // External PE has later version number
      'rmt-003', // External general entity has later version number
      'rmt-004', // External general entity has later version number (no decl means 1.0)
      'rmt-005', // Indirect external general entity has later version number
      'rmt-011', // Contains a C1 control, legal in XML 1.0, illegal in XML 1.1
      'rmt-013', // Contains a DEL, legal in XML 1.0, illegal in XML 1.1
      'rmt-014', // Has a "long s" in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-016', // Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-019', // Has the last legal namechar in XML 1.1, illegal in XML 1.0 thru 4th edition
      'rmt-020', // Has the first character after the last legal namechar in XML 1.1, illegal in both XML 1.0 and 1.1
      'rmt-021', // Has the first character after the last legal namechar in XML 1.1, illegal in both XML 1.0 and 1.1
      'rmt-038', // Contains a C0 control character (form-feed), illegal in both XML 1.0 and 1.1
      'rmt-039', // Contains a C0 control character (form-feed), illegal in both XML 1.0 and 1.1
      'rmt-041', // Contains a C1 control character (partial line up), legal in XML 1.0 but not 1.1
      'rmt-042', // Contains a character reference to a C0 control character (form-feed), legal in XML 1.1 but not 1.0
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
      'rmt-e3e-12', // Default values for attributes may not contain references to external entities.

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

      'rmt-ns-e1.0-13a', // The xml namespace must not be declared as the default namespace.
      'rmt-ns-e1.0-13b', // The xmlns namespace must not be declared as the default namespace.
      'rmt-ns-e1.0-13c', // Elements must not have the prefix xmlns.
      'hst-bh-001', // decimal charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
      'hst-bh-002', // hex charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
      'hst-bh-003', // decimal charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
      'hst-bh-004', // hex charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
      'hst-lhs-007', // UTF-8 BOM plus xml decl of iso-8859-1 incompatible
      'hst-lhs-008', // UTF-16 BOM plus xml decl of utf-8 (using UTF-16 coding) incompatible
      'hst-lhs-009', // UTF-16 BOM plus xml decl of utf-8 (using UTF-8 coding) incompatible
      'ibm-not-wf-P66-ibm66n03.xml', // It is not clear if this is actually an error. If the entity were used, then it would be.  But it isn't, and it could as easily be a geref as a char ref.

      // errors
      'not-wf-not-sa-005', // Tests the_Entity Declared_VC by referring to an undefined parameter entity within an external entity.
      'pr-xml-euc-jp', // Test support for the EUC-JP encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'pr-xml-iso-2022-jp', // Test support for the ISO-2022-JP encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'pr-xml-shift_jis', // Test support for the Shift_JIS encoding, and for text 	which relies on Japanese characters._If a processor does not support this encoding, it must
      'weekly-euc-jp', // Test support for EUC-JP encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'weekly-iso-2022-jp', // Test support for ISO-2022-JP encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'weekly-shift_jis', // Test support for Shift_JIS encoding, and 	XML names which contain Japanese characters._If a processor does not support this encoding, it must
      'uri01', // SYSTEM ids may not have URI fragments
      'o-p11pass1', // system literals may not contain URI fragments
      'ibm-invalid-P68-ibm68i01.xml', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge2" is referred in the file ibm68i01.dtd", but not declared.
      'ibm-invalid-P68-ibm68i02.xml', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge1" is referred before declared in the file ibm68i01.dtd".
      'ibm-invalid-P68-ibm68i03.xml', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge2" is referred in the file ibm68i03.ent", but not declared.
      'ibm-invalid-P68-ibm68i04.xml', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge1" is referred before declared in the file ibm68i04.ent".
      'ibm-invalid-P69-ibm69i01.xml', // Tests invalid PEReference which is against P69 VC: Entity Declared. The Name "pe2" in the PEReference in the file ibm69i01.dtd does not match the Name of any declared PE.
      'ibm-invalid-P69-ibm69i02.xml', // Tests invalid PEReference which is against P69 VC: Entity Declared. The PE with the name "pe1" is referred before declared in the file ibm69i02.dtd
      'ibm-invalid-P69-ibm69i03.xml', // Tests invalid PEReference which is against P69 VC: Entity Declared. The Name "pe3" in the PEReference in the file ibm69i03.ent does not match the Name of any declared PE.
      'ibm-invalid-P69-ibm69i04.xml', // Tests invalid PEReference which is against P69 VC: Entity Declared. The PE with the name "pe2" is referred before declared in the file ibm69i04.ent.
      'ibm-not-wf-P69-ibm69n05.xml', // Based on E29 substantial source: minutes XML-Syntax 1999-02-24 E38 in XML 1.0 Errata, this WFC does not apply to P69, but the VC Entity declared still apply. Tests PEReference which is against P69 WFC: Entity Declared. The PE with the name "paaa" is referred before declared in the DTD.
      'rmt-e2e-34', // A non-deterministic content model is an error even if the element type is not used.
      'rmt-e2e-55', // A reference to an unparsed entity in an entity value is an error rather than forbidden (unless the entity is referenced, of course)
      'rmt-e2e-57', // A value other than preserve or default for xml:space is an error
      'rmt-008', // an implausibly-versioned document
      'rmt-009', // External general entity has implausible version number
      'rmt-055', // Has a Latin-1 NEL in the XML declaration (to be made an error in PR)
      'rmt-056', // Has a UTF-8 NEL in the XML declaration (to be made an error in PR)
      'rmt-057', // Has a UTF-8 LSEP in the XML declaration (to be made an error in PR)
      'rmt-ns10-004', // Namespace name test: a relative URI (deprecated)
      'rmt-ns10-005', // Namespace name test: a same-document relative URI (deprecated)
      'rmt-ns10-006', // Namespace name test: an http IRI that is not a URI
      'invalid-bo-7', // A byte order mark and a backwards one in general entity cause an illegal char. error (big-endian)
      'invalid-bo-8', // A byte order mark and a backwards one in general entity cause an illegal char. error (little-endian)
      'invalid-bo-9', // A byte order mark and a backwards one in general entity cause an illegal char. error (utf-8)
      'x-rmt-008', // a document with version=1.7, illegal in XML 1.0 through 4th edition
   ],
};

export { testFilters };
