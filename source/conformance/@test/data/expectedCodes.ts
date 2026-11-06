/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorDetails } from '../helper/types';

type IdToErrorMap = Record<string, string | ErrorDetails>;

const expectedInvalidCodes: IdToErrorMap = {
   'invalid--002': 'PEREF_PARENS_UNBALANCED', // Tests the "Proper Group/PE Nesting" validity constraint by fragmenting a content model between two parameter entities.
   'invalid--005': 'ELEMENTDECL_EXTRA_TEXT', // ok - Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
   'invalid--006': 'ELEMENTDECL_EXTRA_TEXT', // Tests the "Proper Declaration/PE Nesting" validity constraint by fragmenting an element declaration between two parameter entities.
   'invalid-not-sa-022': 'CONDITIONALSECTION_PEREF_INVALID_BRACKET', // Test the "Proper Conditional Section/ PE Nesting" validity constraint.
   'inv-dtd01': 'ELEMENTDECL_XTRA_MIXED_NAME', // Tests the No Duplicate Types VC
   'inv-dtd02': 'ENTITYDECL_NO_NOTATION_DECLARATION', // Tests the "Notation Declared" VC by using an undeclared notation name.
   'inv-dtd03': 'CONTENT_PREMATURE_END', // Tests the "Element Valid" VC (clause 2) by omitting a required element.
   el01: 'ELEMENT_NO_DECLARATION', // Tests the Element Valid VC (clause 4) by including an undeclared child element.
   el02: 'CONTENTEMPTY_INVALID_SYNTAX', // Tests the Element Valid VC (clause 1) by including elements in an EMPTY content model.
   el03: 'CONTENTMIXED_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 3) by including a child element not permitted by a mixed content model.
   el04: 'ELEMENT_XTRA_DECLARATION', // Tests the Unique Element Type Declaration VC.
   el05: 'ELEMENTDECL_XTRA_MIXED_NAME', // Tests the No Duplicate Types VC.
   el06: 'CONTENTEMPTY_INVALID_SYNTAX', // Tests the Element Valid VC (clause 1), using one of the predefined internal entities inside an EMPTY content model.
   id01: 'ELEMENTSTART_ATT_INVALID_ID_NAME', // Tests the ID (is a Name) VC
   id02: 'ELEMENTSTART_ATT_XTRA_ID', // Tests the ID (appears once) VC
   id03: 'ATTLISTDECL_ATT_XTRA_ID', // Tests the One ID per Element Type VC
   id04: 'ATTLISTDECL_ATT_INVALID_ID_DEFAULT', // meh - Tests the ID Attribute Default VC
   id05: 'ATTLISTDECL_ATT_INVALID_ID_DEFAULT', // great Tests the ID Attribute Default VC
   id06: 'ELEMENTSTART_ATT_INVALID_IDREF_NAME', // Tests the IDREF (is a Name) VC
   id07: 'ELEMENTSTART_ATT_INVALID_IDREFS_NAME', // Tests the IDREFS (is a Names) VC
   id08: 'ELEMENTSTART_ATT_IDREF_NO_ID', // Tests the IDREF (matches an ID) VC
   id09: 'ELEMENTSTART_ATT_IDREF_NO_ID', // Tests the IDREF (IDREFS matches an ID) VC
   'inv-not-sa01': 'CONTENTELEMENT_AMBIGUOUS_SPACE', // Tests the Standalone Document Declaration VC, ensuring that optional whitespace causes a validity error.
   'inv-not-sa02': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that attributes needing normalization cause a validity error.
   'inv-not-sa04': 'ELEMENTSTART_ATT_DEFAULT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that attributes needing defaulting cause a validity error.
   'inv-not-sa05': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that a token attribute that needs normalization causes a validity error.
   'inv-not-sa06': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that a NOTATION attribute that needs normalization causes a validity error.
   'inv-not-sa07': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an NMTOKEN attribute needing normalization causes a validity error.
   'inv-not-sa08': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an NMTOKENS attribute needing normalization causes a validity error.
   'inv-not-sa09': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an ID attribute needing normalization causes a validity error.
   'inv-not-sa10': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an IDREF attribute needing normalization causes a validity error.
   'inv-not-sa11': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an IDREFS attribute needing normalization causes a validity error.
   'inv-not-sa12': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an ENTITY attribute needing normalization causes a validity error.
   'inv-not-sa13': 'ATTLISTDECL_ATT_EXTERNAL', // Tests the Standalone Document Declaration VC, ensuring that an ENTITIES attribute needing normalization causes a validity error.
   'inv-not-sa14': 'CONTENTELEMENT_INVALID_SYNTAX', // CDATA sections containing only whitespace do not match the nonterminal S, and cannot appear in these positions.

   optional01: 'CONTENT_PREMATURE_END', // ok - Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one is required.
   optional02: 'CONTENTELEMENT_CHILD_UNEXPECTED', // ok - Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing two children where one is required.
   optional03: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where two are required.
   optional04: 'CONTENTELEMENT_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where two are required.
   optional05: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (one construction of that model).
   optional06: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a second construction of that model).
   optional07: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a third construction of that model).
   optional08: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a fourth construction of that model).
   optional09: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or two are required (a fifth construction of that model).
   optional10: 'CONTENTELEMENT_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a basic construction of that model).
   optional11: 'CONTENTELEMENT_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a second construction of that model).
   optional12: 'CONTENTELEMENT_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a third construction of that model).
   optional13: 'CONTENTELEMENT_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a fourth construction of that model).
   optional14: 'CONTENTELEMENT_CHILD_UNEXPECTED', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing three children where one or two are required (a fifth construction of that model).
   optional20: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a sixth construction of that model).
   optional21: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a seventh construction of that model).
   optional22: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (an eigth construction of that model).
   optional23: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a ninth construction of that model).
   optional24: 'CONTENT_PREMATURE_END', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing no children where one or more are required (a tenth construction of that model).
   optional25: 'CONTENTELEMENT_INVALID_SYNTAX', // Tests the Element Valid VC (clause 2) for one instance of "children" content model, providing text content where one or more elements are required.
   'inv-required00': 'ELEMENTSTART_NO_REQUIRED', // Tests the Required Attribute VC.
   'inv-required01': 'ELEMENTSTART_ATT_UNDECLARED', // Tests the Attribute Value Type (declared) VC for the xml:space attribute
   'inv-required02': 'ELEMENTSTART_ATT_UNDECLARED', // Tests the Attribute Value Type (declared) VC for the xml:lang attribute

   root: 'ELEMENT_DOCTYPE_MISMATCH', // Tests the Root Element Type VC
   attr01: 'ELEMENTSTART_ATT_ENTITY_NO_DECLARATION', // Tests the "Entity Name" VC for the ENTITY attribute type.
   attr02: 'ELEMENTSTART_ATT_ENTITIES_NO_DECLARATION', // Tests the "Entity Name" VC for the ENTITIES attribute type.
   attr03: 'ELEMENTSTART_ATT_NOTATION_NO_DECLARATION', // ok - Tests the "Notation Attributes" VC for the NOTATION attribute type, first clause: value must be one of the ones that's declared.
   attr04: 'ATTLISTDECL_ATT_NOTATION_NO_DECLARATION', // ok - Tests the "Notation Attributes" VC for the NOTATION attribute type, second clause: the names in the declaration must all be declared.
   attr05: 'ELEMENTSTART_ATT_INVALID_NMTOKEN', // great - Tests the "Name Token" VC for the NMTOKEN attribute type.
   attr06: 'ELEMENTSTART_ATT_INVALID_NMTOKEN', // great Tests the "Name Token" VC for the NMTOKENS attribute type.
   attr07: 'ELEMENTSTART_ATT_ENUMERATION_NO_DECLARATION', // great Tests the "Enumeration" VC by providing a value which wasn't one of the choices.
   attr08: 'ELEMENTSTART_ATT_INVALID_FIXED', // great - Tests the "Fixed Attribute Default" VC by providing the wrong value.
   attr09: 'ATTLISTDECL_ATT_INVALID_IDREF_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal IDREF value.
   attr10: 'ATTLISTDECL_ATT_INVALID_IDREFS_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal IDREFS value.
   attr11: 'ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal ENTITY value.
   attr12: 'ATTLISTDECL_ATT_INVALID_ENTITIES_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal ENTITIES value.
   attr13: 'ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal NMTOKEN value.
   attr14: 'ATTLISTDECL_ATT_INVALID_NMTOKENS_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal NMTOKENS value.
   attr15: 'ATTLISTDECL_ATT_INVALID_NOTATION_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal NOTATIONS value.
   attr16: 'ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT', // Tests the "Attribute Default Legal" VC by providing an illegal enumeration value.
   utf16b: 'error', // Tests reading an invalid "big endian" UTF-16 document
   utf16l: 'error', // Tests reading an invalid "little endian" UTF-16 document
   empty: 'CONTENTELEMENT_INVALID_SYNTAX', // CDATA section containing only white space does not match the nonterminal S, and cannot appear in these positions.

   'o-p01pass1': 'ELEMENT_NO_DECLARATION', // no prolog
   'o-p01pass3': 'ELEMENT_NO_DECLARATION', // Misc items after the document
   'o-p03pass1': 'ELEMENT_NO_DECLARATION', // all valid S characters
   'o-p04pass1': 'ELEMENT_NO_DECLARATION', // names with all valid ASCII characters, and one from each other class in NameChar
   'o-p05pass1': 'ELEMENT_NO_DECLARATION', // various valid Name constructions
   'o-p10pass1': 'ELEMENT_NO_DECLARATION', // But this is not what it is trying to show -  valid attribute values
   'o-p06fail1': 'ELEMENTSTART_ATT_INVALID_IDREFS_NAME', // meh - Requires at least one name.
   'o-p08fail1': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // at least one Nmtoken is required.
   'o-p08fail2': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // an invalid Nmtoken character.
   'o-p14pass1': 'ELEMENT_NO_DECLARATION', // valid CharData
   'o-p15pass1': 'ELEMENT_NO_DECLARATION', // valid comments
   'o-p16pass1': 'PI_TARGET_HAS_XML', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
   'o-p16pass2': 'ELEMENT_NO_DECLARATION', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
   'o-p16pass3': 'ELEMENT_NO_DECLARATION', // Valid form of Processing Instruction. Shows that whitespace character data is valid before end of processing instruction.
   'o-p18pass1': 'ELEMENT_NO_DECLARATION', // valid CDSect's. Note that a CDStart in a CDSect is not recognized as such
   'o-p22pass1': 'ELEMENT_NO_DECLARATION', // prolog can be empty
   'o-p22pass2': 'ELEMENT_NO_DECLARATION', // XML declaration only
   'o-p22pass3': 'ELEMENT_NO_DECLARATION', // XML decl and Misc
   'o-p23pass1': 'ELEMENT_NO_DECLARATION', // Test shows a valid XML declaration along with version info.
   'o-p23pass2': 'ELEMENT_NO_DECLARATION', // Test shows a valid XML declaration along with encoding declaration.
   'o-p23pass3': 'ELEMENT_NO_DECLARATION', // Test shows a valid XML declaration along with Standalone Document Declaration.
   'o-p23pass4': 'ELEMENT_NO_DECLARATION', // Test shows a valid XML declaration, encoding declarationand Standalone Document Declaration.
   'o-p24pass1': 'ELEMENT_NO_DECLARATION', // Test shows a prolog that has the VersionInfo delimited by double quotes.
   'o-p24pass2': 'ELEMENT_NO_DECLARATION', // Test shows a prolog that has the VersionInfo delimited by single quotes.
   'o-p24pass3': 'ELEMENT_NO_DECLARATION', // Test shows whitespace is allowed in prolog before version info.
   'o-p24pass4': 'ELEMENT_NO_DECLARATION', // Test shows whitespace is allowed in prolog on both sides of equal sign.
   'o-p25pass1': 'ELEMENT_NO_DECLARATION', // Test shows whitespace is NOT necessary before or after equal sign of versioninfo.
   'o-p25pass2': 'ELEMENT_NO_DECLARATION', // Test shows whitespace can be used on both sides of equal sign of versioninfo.
   'o-p26pass1': 'ELEMENT_NO_DECLARATION', // The valid version number. We cannot test others because a 1.0 processor is allowed to fail them.
   'o-p27pass1': 'ELEMENT_NO_DECLARATION', // Comments are valid as the Misc part of the prolog.
   'o-p27pass2': 'ELEMENT_NO_DECLARATION', // Processing Instructions are valid as the Misc part of the prolog.
   'o-p27pass3': 'ELEMENT_NO_DECLARATION', // Whitespace is valid as the Misc part of the prolog.
   'o-p27pass4': 'ELEMENT_NO_DECLARATION', // A combination of comments, whitespaces and processing instructions are valid as the Misc part of the prolog.
   'o-p32pass1': 'ELEMENT_NO_DECLARATION', // Double quotes can be used as delimeters for the value of a Standalone Document Declaration.
   'o-p32pass2': 'ELEMENT_NO_DECLARATION', // Single quotes can be used as delimeters for the value of a Standalone Document Declaration.
   'o-p39pass1': 'ELEMENT_NO_DECLARATION', // Empty element tag may be used for any element which has no content.
   'o-p39pass2': 'ELEMENT_NO_DECLARATION', // Character data is valid element content.
   'o-p40pass1': 'ELEMENT_NO_DECLARATION', // Elements content can be empty.
   'o-p40pass2': 'ELEMENT_NO_DECLARATION', // Whitespace is valid within a Start-tag.
   'o-p40pass3': 'ELEMENT_NO_DECLARATION', // Attributes are valid within a Start-tag.
   'o-p40pass4': 'ELEMENT_NO_DECLARATION', // Whitespace and Multiple Attributes are valid within a Start-tag.
   'o-p41pass1': 'ELEMENT_NO_DECLARATION', // Attributes are valid within a Start-tag.
   'o-p41pass2': 'ELEMENT_NO_DECLARATION', // Whitespace is valid within a Start-tags Attribute.
   'o-p42pass1': 'ELEMENT_NO_DECLARATION', // Test shows proper syntax for an End-tag.
   'o-p42pass2': 'ELEMENT_NO_DECLARATION', // Whitespace is valid after name in End-tag.
   'o-p44pass1': 'ELEMENT_NO_DECLARATION', // Valid display of an Empty Element Tag.
   'o-p44pass2': 'ELEMENT_NO_DECLARATION', // Empty Element Tags can contain an Attribute.
   'o-p44pass3': 'ELEMENT_NO_DECLARATION', // Whitespace is valid in an Empty Element Tag following the end of the attribute value.
   'o-p44pass4': 'ELEMENT_NO_DECLARATION', // Whitespace is valid after the name in an Empty Element Tag.
   'o-p44pass5': 'ELEMENT_NO_DECLARATION', // Whitespace and Multiple Attributes are valid in an Empty Element Tag.
   'o-p66pass1': 'ELEMENT_NO_DECLARATION', // valid character references
   'o-p74pass1': 'ELEMENT_NO_DECLARATION', // PEDef is either an entity value or an external id
   'o-p75pass1': 'ELEMENT_NO_DECLARATION', // valid external identifiers
   'o-e2': 'ATTLISTDECL_ATT_XTRA_ENUMERATION_VALUE', // great - Validity Constraint: No duplicate tokens
   'ibm-invalid-P28-ibm28i01.xml': 'ELEMENT_DOCTYPE_MISMATCH', // great
   'ibm-invalid-P32-ibm32i01.xml': 'ELEMENTSTART_ATT_DEFAULT_EXTERNAL', // great
   'ibm-invalid-P32-ibm32i03.xml': 'ATTLISTDECL_ATT_EXTERNAL', // great
   'ibm-invalid-P32-ibm32i04.xml': 'CONTENTELEMENT_AMBIGUOUS_SPACE', // great
   'ibm-invalid-P39-ibm39i01.xml': 'CONTENTEMPTY_INVALID_SYNTAX', // great
   'ibm-invalid-P39-ibm39i02.xml': 'CONTENTELEMENT_INVALID_SYNTAX', // good
   'ibm-invalid-P39-ibm39i03.xml': 'CONTENTMIXED_CHILD_UNEXPECTED', // great
   'ibm-invalid-P39-ibm39i04.xml': 'ELEMENT_NO_DECLARATION', // great
   'ibm-invalid-P41-ibm41i01.xml': 'ELEMENTSTART_ATT_UNDECLARED', // great
   'ibm-invalid-P41-ibm41i02.xml': 'ELEMENTSTART_ATT_INVALID_FIXED', // great
   'ibm-invalid-P45-ibm45i01.xml': 'ELEMENT_XTRA_DECLARATION', // great
   'ibm-invalid-P49-ibm49i01.xml': 'PEREF_PARENS_UNBALANCED', // OK
   'ibm-invalid-P50-ibm50i01.xml': 'PEREF_PARENS_UNBALANCED', // OK
   'ibm-invalid-P51-ibm51i01.xml': 'PEREF_PARENS_UNBALANCED', // OK
   'ibm-invalid-P51-ibm51i03.xml': 'ELEMENTDECL_XTRA_MIXED_NAME', // great
   'ibm-invalid-P56-ibm56i01.xml': 'ELEMENTSTART_ATT_INVALID_ID_NAME', // great
   'ibm-invalid-P56-ibm56i02.xml': 'ELEMENTSTART_ATT_XTRA_ID', // great
   'ibm-invalid-P56-ibm56i03.xml': 'ATTLISTDECL_ATT_INVALID_ID_DEFAULT', // good
   'ibm-invalid-P56-ibm56i05.xml': 'ATTLISTDECL_ATT_INVALID_ID_DEFAULT', // good
   'ibm-invalid-P56-ibm56i06.xml': 'ATTLISTDECL_ATT_XTRA_ID', // good
   'ibm-invalid-P56-ibm56i07.xml': 'ELEMENTSTART_ATT_INVALID_IDREF_NAME', // good
   'ibm-invalid-P56-ibm56i08.xml': 'ELEMENTSTART_ATT_IDREF_NO_ID', // great
   'ibm-invalid-P56-ibm56i09.xml': 'ELEMENTSTART_ATT_INVALID_IDREFS_NAME', // good
   'ibm-invalid-P56-ibm56i10.xml': 'ELEMENTSTART_ATT_IDREF_NO_ID', // great
   'ibm-invalid-P56-ibm56i11.xml': 'ELEMENTSTART_ATT_ENTITY_NO_DECLARATION', // ok
   'ibm-invalid-P56-ibm56i12.xml': 'ELEMENTSTART_ATT_ENTITY_NO_DECLARATION', // ok
   'ibm-invalid-P56-ibm56i13.xml': 'ELEMENTSTART_ATT_PARSED_ENTITY', // great
   'ibm-invalid-P56-ibm56i14.xml': 'ELEMENTSTART_ATT_INVALID_ENTITIES_NAME', // great
   'ibm-invalid-P56-ibm56i15.xml': 'ELEMENTSTART_ATT_ENTITIES_NO_DECLARATION', // great
   'ibm-invalid-P56-ibm56i16.xml': 'ELEMENTSTART_ATT_PARSED_ENTITIES', // ok
   'ibm-invalid-P56-ibm56i17.xml': 'ELEMENTSTART_ATT_INVALID_NMTOKEN',
   'ibm-invalid-P56-ibm56i18.xml': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // great
   'ibm-invalid-P58-ibm58i01.xml': 'ELEMENTSTART_ATT_NOTATION_NO_DECLARATION', // great
   'ibm-invalid-P58-ibm58i02.xml': 'ATTLISTDECL_ATT_NOTATION_NO_DECLARATION', // great
   'ibm-invalid-P59-ibm59i01.xml': 'ELEMENTSTART_ATT_ENUMERATION_NO_DECLARATION', // great
   'ibm-invalid-P60-ibm60i01.xml': 'ELEMENTSTART_NO_REQUIRED', // great
   'ibm-invalid-P60-ibm60i02.xml': 'ELEMENTSTART_ATT_INVALID_FIXED', // great
   'ibm-invalid-P60-ibm60i03.xml': 'ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT', // great
   'ibm-invalid-P60-ibm60i04.xml': 'ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT', //great
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i01.xml': {
      id: 'GENERALENTITY_NO_DECLARATION',
      message: /entity "ge2" was/,
   },
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i02.xml': {
      id: 'GENERALENTITY_NO_DECLARATION',
      message: /entity "ge1" was/,
   },
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i03.xml': {
      id: 'GENERALENTITY_NO_DECLARATION',
      message: /entity "ge2" was/,
   },
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i04.xml': {
      id: 'GENERALENTITY_NO_DECLARATION',
      message: /entity "ge1" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i01.xml': {
      id: 'PARAMETERENTITY_NO_DECLARATION',
      message: /named "pe2" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i02.xml': {
      id: 'PARAMETERENTITY_NO_DECLARATION',
      message: /named "pe1" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i03.xml': {
      id: 'PARAMETERENTITY_NO_DECLARATION',
      message: /named "pe3" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i04.xml': 'PARAMETERENTITY_NO_DECLARATION',
   'ibm-invalid-P76-ibm76i01.xml': 'ENTITYDECL_NO_NOTATION_DECLARATION',
   'ibm-invalid-P89-ibm89n06.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x0EC7 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
   'ibm-invalid-P89-ibm89n07.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x3006 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
   'ibm-invalid-P89-ibm89n08.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x3030 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
   'ibm-invalid-P89-ibm89n09.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x3036 occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
   'ibm-invalid-P89-ibm89n10.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x309C occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
   'ibm-invalid-P89-ibm89n11.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x309F occurs as the second character in the PITarget in the PI in the prolog, and in an element name.
   'ibm-invalid-P89-ibm89n12.xml': 'ELEMENT_NO_DECLARATION', // good - Tests Extender with an only legal per 5th edition character. The character #x30FF occurs as the second character in the PITarget in the PI in the prolog, and in an element name.

   'ibm-1-1-valid-P46-ibm46i01.xml': 'CONTENTELEMENT_INVALID_SYNTAX', // ok - An element with Element-Only content contains the character #x85 (NEL not a whitespace character as defined by S).
   'ibm-1-1-valid-P46-ibm46i02.xml': 'CONTENTELEMENT_INVALID_SYNTAX', // ok - An element with Element-Only content contains the character #x2028 (LESP not a whitespace character as defined by S).

   'rmt-e2e-2a': 'ATTLISTDECL_ATT_XTRA_ENUMERATION_VALUE', // great - Duplicate token in enumerated attribute declaration
   'rmt-e2e-2b': 'ATTLISTDECL_ATT_XTRA_NOTATION_VALUE', // great - Duplicate token in NOTATION attribute declaration

   'rmt-e3e-06a': 'ATTLISTDECL_ATT_INVALID_IDREF_DEFAULT', // Default values for IDREF attributes must match Name.
   'rmt-e3e-06b': 'ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT', // Default values for ENTITY attributes must match Name.
   'rmt-e3e-06c': 'ATTLISTDECL_ATT_INVALID_IDREFS_DEFAULT', // Default values for IDREFS attributes must match Names.
   'rmt-e3e-06d': 'ATTLISTDECL_ATT_INVALID_ENTITIES_DEFAULT', // Default values for ENTITIES attributes must match Names.
   'rmt-e3e-06e': 'ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT', // Default values for NMTOKEN attributes must match Nmtoken.
   'rmt-e3e-06f': 'ATTLISTDECL_ATT_INVALID_NMTOKENS_DEFAULT', // Default values for NMTOKENS attributes must match Nmtokens.
   'rmt-e3e-06g': 'ATTLISTDECL_ATT_INVALID_NOTATION_DEFAULT', // Default values for NOTATION attributes must match one of the enumerated values.
   'rmt-e3e-06h': 'ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT', // Default values for enumerated attributes must match one of the enumerated values.
   'rmt-e2e-9b': 'ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT', // great - An attribute default must be syntactically correct even if unused
   'rmt-e3e-13': 'GENERALENTITY_NO_DECLARATION', // good - Even internal parameter entity references are enough to make undeclared entities into mere validity errors rather than well-formedness errors.

   'rmt-e2e-14': 'ATTLISTDECL_EXTRA_TEXT', // Declarations mis-nested wrt parameter entities are just validity errors (but note that some parsers treat some such errors as fatal)
   'rmt-e2e-15a': 'CONTENTEMPTY_INVALID_SYNTAX', // OK (but twice) Empty content can't contain an entity reference
   'rmt-e2e-15b': 'CONTENTEMPTY_INVALID_SYNTAX', // meh - Empty content can't contain a comment
   'rmt-e2e-15c': 'CONTENTEMPTY_INVALID_SYNTAX', // ok - Empty content can't contain a PI
   'rmt-e2e-15d': 'CONTENTEMPTY_INVALID_SYNTAX', // ok - Empty content can't contain whitespace
   'rmt-e2e-15g': 'CONTENTELEMENT_INVALID_SYNTAX', // ok - Element content can't contain character reference to whitespace
   'rmt-e2e-15h': 'CONTENTELEMENT_INVALID_SYNTAX', // ok - Element content can't contain entity reference if replacement text is character reference to whitespace
   'rmt-e2e-20': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // Tokens, after normalization, must be separated by space, not other whitespace characters
   'rmt-015': 'ELEMENT_NO_DECLARATION', // Has a "long s" in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
   'rmt-017': 'ELEMENT_NO_DECLARATION', // ok - Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
   'rmt-018': 'ELEMENT_NO_DECLARATION', // ok - Has the last legal namechar in XML 1.1, illegal in XML 1.0 thru 4th edition
   'rmt-030': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // ok - Has a NEL character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
   'rmt-032': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // ok - Has an LSEP character in an NMTOKENS attribute; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
   'rmt-036': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // ok - Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
   'rmt-037': 'ELEMENTSTART_ATT_INVALID_NMTOKENS', // Has an NMTOKENS attribute containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
   'rmt-048': 'CONTENTELEMENT_INVALID_SYNTAX', // meh - Has an LSEP character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
   'rmt-046': 'CONTENTELEMENT_INVALID_SYNTAX', // meh - Has a NEL character in element content whitespace; well-formed in both XML 1.0 and 1.1, but valid only in 1.1
   'rmt-052': 'CONTENTELEMENT_INVALID_SYNTAX', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.
   'rmt-053': 'CONTENTELEMENT_INVALID_SYNTAX', // Has element content whitespace containing a NEL character that comes from a character reference in an internal entity. Because NEL is not in the S production (even though real NELs are converted to LF on input), this is invalid in both XML 1.0 and 1.1.

   // Group namespaces
   'rmt-ns10-017': 'error', // Simple legal case: no namespaces
   'rmt-ns10-018': 'error', // Simple legal case: default namespace
   'rmt-ns10-019': 'error', // Simple legal case: prefixed element
   'rmt-ns10-020': 'error', // Simple legal case: prefixed attribute
   'rmt-ns10-021': 'error', // Simple legal case: default namespace and unbinding
   'rmt-ns10-022': 'error', // Simple legal case: default namespace and rebinding
   'rmt-ns10-024': 'error', // Simple legal case: prefix rebinding
   'rmt-ns10-027': 'error', // Reserved prefixes and namespaces: using the xml prefix undeclared
   'rmt-ns10-028': 'error', // Reserved prefixes and namespaces: declaring the xml prefix correctly
   'rmt-ns10-034': 'error', // Reserved prefixes and namespaces: binding a reserved prefix
   'rmt-ns10-037': 'error', // Attribute uniqueness: different attributes with same local name
   'rmt-ns10-038': 'error', // Attribute uniqueness: prefixed and unprefixed attributes with same local name
   'rmt-ns10-039': 'error', // Attribute uniqueness: prefixed and unprefixed attributes with same local name, with default namespace
   'rmt-ns10-040': 'error', // Attribute uniqueness: prefixed and unprefixed attributes with same local name, with default namespace and element in default namespace
   'rmt-ns10-041': 'error', // Attribute uniqueness: prefixed and unprefixed attributes with same local name, element in same namespace as prefixed attribute
   'rmt-ns10-045': 'error', // Colon in ID attribute name
   'rmt-ns10-046': 'error', // Colon in ID attribute name

   // Group: some BOM problems. But several of these should be dying and
   'invalid-bo-1': 'error', // Byte order mark in general entity should go away (big-endian)
   'invalid-bo-2': 'error', // Byte order mark in general entity should go away (little-endian)
   'invalid-bo-3': 'error', // Byte order mark in general entity should go away (utf-8)
   'invalid-bo-4': 'error', // Two byte order marks in general entity produce only one (big-endian)
   'invalid-bo-5': 'error', // Two byte order marks in general entity produce only one (little-endian)
   'invalid-bo-6': 'error', // Two byte order marks in general entity produce only one (utf-8)
   // These are not inalid as of the specified version, but they are not well formed. Why i nthis list?
   'invalid-sa-140': 'ELEMENT_NO_DECLARATION', // Character '#x309a;' is a CombiningChar, not a Letter, but as of 5th edition, may begin a name (c.f. xmltest/not-wf/sa/140.xml).
   'invalid-sa-141': 'ELEMENT_NO_DECLARATION', // As of 5th edition, character #x0E5C is legal in XML names (c.f. xmltest/not-wf/sa/141.xml).
   'x-rmt5-014': 'ELEMENT_NO_DECLARATION', // Has a "long s" in a name, legal in XML 1.1, legal in XML 1.0 5th edition
   'x-rmt5-016': 'ELEMENT_NO_DECLARATION', // ok - Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, legal in XML 1.0 5th edition
   'x-rmt5-019': 'ELEMENT_NO_DECLARATION', // ok - Has the last legal namechar in XML 1.1, legal in XML 1.0 5th edition
   'hst-bh-005': 'ELEMENTSTART_ATT_UNDECLARED', // xmlns:xml is an attribute as far as validation is concerned and must be declared
   'hst-bh-006': 'ELEMENTSTART_ATT_UNDECLARED', // xmlns:foo is an attribute as far as validation is concerned and must be declared
};

const expectedNotWfCodes: IdToErrorMap = {
   'not-wf-sa-001': 'ATTRIBUTE_INVALID_NAME', // great - Attribute values must start with attribute names, not "?".
   'not-wf-sa-002': 'ELEMENT_NAME_INVALID', // great - Names may not start with "."; it's not a Letter.
   'not-wf-sa-003': 'PI_NO_TARGET', // great - Processing Instruction target name is required.
   'not-wf-sa-004': 'PI_NO_CLOSE', // good - SGML-ism: processing instructions end in '?>' not '>'.
   'not-wf-sa-005': 'PI_NO_CLOSE', // good - Processing instructions end in '?>' not '?'.
   'not-wf-sa-006': 'COMMENT_DOUBLE_HYPHEN', // great - XML comments may not contain "--"
   'not-wf-sa-007': 'REFERENCE_XTRA_TRAILING_SPACE', // great - General entity references have no whitespace after the entity name and before the semicolon.
   'not-wf-sa-008': 'REFERENCE_NAME_INVALID', // great - Entity references must include names, which don't begin with '.' (it's not a Letter or other name start character).
   'not-wf-sa-009': 'CHARREF_NO_DIGITS', // great - Character references may have only decimal or numeric strings.
   'not-wf-sa-010': 'REFERENCE_XTRA_SPACE', // OK - Ampersand may only appear as part of a general entity reference.
   'not-wf-sa-011': 'ATTRIBUTE_NO_EQUAL', // good - SGML-ism: attribute values must be explicitly assigned a value, it can't act as a boolean toggle.
   'not-wf-sa-012': 'LITERAL_NO_OPEN_QUOTE', // great - SGML-ism: attribute values must be quoted in all cases.
   'not-wf-sa-013': 'ATTRIBUTE_INVALID_VALUE', // OK - The quotes on both ends of an attribute value must match.
   'not-wf-sa-014': 'ATTRIBUTE_INVALID_VALUE', // great - Attribute values may not contain literal '' characters.
   'not-wf-sa-015': 'LITERAL_NO_OPEN_QUOTE', // OK - Attribute values need a value, not just an equals sign.
   'not-wf-sa-016': 'ATTRIBUTE_INVALID_NAME', // OK - Attribute values need an associated name.
   'not-wf-sa-017': 'CDATA_NO_CLOSE', // great? - CDATA sections need a terminating ']]>'.
   'not-wf-sa-018': 'CDATA_XTRA_SPACE_AFTER_TYPE', // great - CDATA sections begin with a literal '![CDATA[', no space.
   'not-wf-sa-019': 'ELEMENT_NO_NAME', // great - End tags may not be abbreviated as '/>'.
   'not-wf-sa-020': 'REFERENCE_XTRA_SPACE', // OK - Attribute values may not contain literal '' characters except as part of an entity reference.
   'not-wf-sa-021': 'REFERENCE_NAME_INVALID', // OK - Attribute values may not contain literal '' characters except as part of an entity reference.
   'not-wf-sa-022': 'CHARREF_NO_CLOSE', // great - Character references end with semicolons, always!
   'not-wf-sa-023': 'ATTRIBUTE_INVALID_NAME', // great - Digits are not valid name start characters.
   'not-wf-sa-024': 'ELEMENT_NAME_INVALID', // great - Digits are not valid name start characters.
   'not-wf-sa-025': 'CHARDATA_INVALID_SECTION_END', // great - Text may not contain a literal ']]>' sequence.
   'not-wf-sa-026': 'CHARDATA_INVALID_SECTION_END', // great - Text may not contain a literal ']]>' sequence.
   'not-wf-sa-027': 'COMMENT_NO_CLOSE', // great - Comments must be terminated with "-->".
   'not-wf-sa-028': 'PI_NO_CLOSE', // great - Processing instructions must end with '?>'.
   'not-wf-sa-029': 'CHARDATA_INVALID_SECTION_END', // good - Text may not contain a literal ']]>' sequence.
   'not-wf-sa-030': 'CHARDATA_INVALID_CHAR', // good? - A form feed is not a legal XML character.
   'not-wf-sa-031': 'CHARDATA_INVALID_CHAR', // good? - A form feed is not a legal XML character.
   'not-wf-sa-032': 'CHARDATA_INVALID_CHAR', // good? - A form feed is not a legal XML character.
   'not-wf-sa-033': 'CHARDATA_INVALID_CHAR', // good? - An ESC (octal 033) is not a legal XML character.
   'not-wf-sa-034': 'ELEMENT_NAME_INVALID', // OK? - A form feed is not a legal XML character.
   'not-wf-sa-035': 'ELEMENT_XTRA_LEADING_SPACE', // OK - The '' character is a markup delimiter and must start an element, CDATA section, PI, or comment.
   'not-wf-sa-036': {
      // OK - Text may not appear after the root element.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARDATA_PTOKEN',
   },
   'not-wf-sa-037': {
      // OK - Character references may not appear after the root element.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARREF_PTOKEN',
   },
   'not-wf-sa-038': 'ATTRIBUTE_DUPLICATE_NAME', // great - Tests the "Unique Att Spec" WF constraint by providing multiple values for an attribute.
   'not-wf-sa-039': 'ELEMENT_UNBALANCED', // great - Tests the Element Type Match WFC', // end tag name must match start tag name.
   'not-wf-sa-040': {
      // ok - Provides two document elements.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'ELEMENT_START_PTOKEN',
   },
   'not-wf-sa-041': {
      // ok - Provides two document elements.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'ELEMENT_START_PTOKEN',
   },
   'not-wf-sa-042': 'ELEMENT_NAME_INVALID', // ok - Invalid End Tag
   'not-wf-sa-043': {
      // ok - Provides #PCDATA text after the document element.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARDATA_PTOKEN',
   },
   'not-wf-sa-044': {
      // ok - Provides two document elements.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'ELEMENT_EMPTY_PTOKEN',
   },
   'not-wf-sa-045': 'ELEMENT_NAME_INVALID', // ok = Invalid Empty Element Tag
   'not-wf-sa-046': 'ELEMENT_NAME_INVALID', // ok - This start (or empty element) tag was not terminated correctly.
   'not-wf-sa-047': 'ELEMENT_NO_CLOSE', // Invalid empty element tag invalid whitespace
   'not-wf-sa-048': {
      // good? - Provides a CDATA section after the root element.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CDATA_PTOKEN',
   },
   'not-wf-sa-049': 'ELEMENT_UNBALANCED', // ok - Missing start tag
   'not-wf-sa-050': 'DOC_END_EARLY', // great - Empty document, with no root element.
   'not-wf-sa-051': {
      // ok - CDATA is invalid at top level of document.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CDATA_PTOKEN',
   },
   'not-wf-sa-052': {
      // ok - Invalid character reference.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARREF_PTOKEN',
   },
   'not-wf-sa-053': 'ELEMENT_UNBALANCED', // ok - End tag does not match start tag.
   'not-wf-sa-054': 'EXTERNALID_MISSING_SYSTEM_VALUE', // ok - PUBLIC requires two literals.
   'not-wf-sa-055': {
      // ok - Invalid Document Type Definition format.
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: 'ELEMENT_START_PTOKEN',
   },
   'not-wf-sa-056': 'DOCTYPE_NO_CLOSE', // ok - Invalid Document Type Definition format': 'error', // misplaced comment.
   'not-wf-sa-057': 'ENTITYDECL_NO_CLOSE', // ok - This isn't SGML; comments can't exist in declarations.
   'not-wf-sa-058': 'WORDLIST_INVALID_NMTOKEN', // great - Invalid character , in ATTLIST enumeration
   'not-wf-sa-059': 'LITERAL_NO_OPEN_QUOTE', // great - String literal must be in quotes.
   'not-wf-sa-060': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // meh - Invalid type NAME defined in ATTLIST.
   'not-wf-sa-061': 'EXTERNALID_SYSTEM_NO_LEADING_SPACE', // great - External entity declarations require whitespace between public and system IDs.
   'not-wf-sa-062': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great - Entity declarations need space after the entity name.
   'not-wf-sa-063': {
      // meh - Conditional sections may only appear in the external DTD subset.
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: 'CONDITIONAL_START_PTOKEN',
   },
   'not-wf-sa-064': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE', // great - Space is required between attribute type and default values in!ATTLIST...>declarations.
   'not-wf-sa-065': 'ATTLISTDECL_ATTR_NAME_INVALID', // ok - Space is required between attribute name and type in!ATTLIST...>declarations.
   'not-wf-sa-066': 'ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE', // great - Required whitespace is missing.
   'not-wf-sa-067': 'ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE', // great - Space is required between attribute type and default values in!ATTLIST...>declarations.
   'not-wf-sa-068': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE', // great - Space is required between NOTATION keyword and list of enumerated choices in!ATTLIST...>declarations.
   'not-wf-sa-069': 'ENTITYDECL_EXTERNALID_NO_SPACE', // great - Space is required before an NDATA entity annotation.
   'not-wf-sa-070': 'COMMENT_DOUBLE_HYPHEN', // great - XML comments may not contain "--"
   'not-wf-sa-071': 'REFERENCE_INVALID_RECURSION', // great - ENTITY can't reference itself directly or indirectly.
   'not-wf-sa-072': 'REFERENCE_NO_DECLARATION', // great - Undefined ENTITY foo.
   'not-wf-sa-073': 'REFERENCE_NO_DECLARATION', // great - Undefined ENTITY f.
   'not-wf-sa-074': 'ELEMENT_UNBALANCED', // great - Internal general parsed entities are only well formed if they match the "content" production.
   'not-wf-sa-075': 'REFERENCE_INVALID_RECURSION', // great - ENTITY can't reference itself directly or indirectly.
   'not-wf-sa-076': 'REFERENCE_NO_DECLARATION', // great - Undefined ENTITY foo.
   'not-wf-sa-077': 'REFERENCE_NO_DECLARATION', // great - Undefined ENTITY bar.
   'not-wf-sa-078': 'REFERENCE_NO_DECLARATION', // great - Undefined ENTITY foo.
   'not-wf-sa-079': 'REFERENCE_INVALID_RECURSION', // ENTITY can't reference itself directly or indirectly.
   'not-wf-sa-080': 'REFERENCE_INVALID_RECURSION', // great - ENTITY can't reference itself directly or indirectly.
   'not-wf-sa-081': 'ATTRIBUTE_INVALID_REFERENCE', // great - This tests the_No External Entity References_WFC, since the entity is referred to within an attribute.
   'not-wf-sa-082': 'ATTRIBUTE_INVALID_REFERENCE', // great - This tests the_No External Entity References_WFC, since the entity is referred to within an attribute.
   'not-wf-sa-083': 'ENTITYDECL_NO_NOTATION_DECLARATION', // great - Undefined NOTATION n.
   'not-wf-sa-084': 'REFERENCE_UNPARSED_NO_USE', // great - Tests the_Parsed Entity_WFC by referring to an unparsed entity. (This precedes the error of not declaring that entity's notation, which may be detected any time before the DTD parsing is completed.)
   'not-wf-sa-085': 'EXTERNALID_PUBLIC_INVALID_CHARS', // great - Public IDs may not contain "[".
   'not-wf-sa-086': 'EXTERNALID_PUBLIC_INVALID_CHARS', // great - Public IDs may not contain "[".
   'not-wf-sa-087': 'EXTERNALID_PUBLIC_INVALID_CHARS', // great - Public IDs may not contain "[".
   'not-wf-sa-088': 'ATTRIBUTE_INVALID_VALUE', // ok - Attribute values are terminated by literal quote characters, and any entity expansion is done afterwards.
   'not-wf-sa-089': 'ENTITYDECL_NO_CLOSE', // ok - Parameter entities "are" always parsed; NDATA annotations are not permitted.
   'not-wf-sa-090': 'ATTRIBUTE_INVALID_VALUE', // great - Attributes may not contain a literal "" character; this one has one because of reference expansion.
   'not-wf-sa-091': 'ENTITYDECL_NO_CLOSE', // ok - Parameter entities "are" always parsed; NDATA annotations are not permitted.
   'not-wf-sa-092': 'REFERENCE_NAME_INVALID', // ok - The replacement text of this entity has an illegal reference, because the character reference is expanded immediately.
   'not-wf-sa-093': 'CHARREF_INVALID_HEX_CASE', // great - Hexadecimal character references may not use the uppercase 'X'.
   'not-wf-sa-094': 'XMLDECL_PARAM_INVALID_CASE', // great - Prolog VERSION must be lowercase.
   'not-wf-sa-095': 'XMLDECL_ENCODING_INVALID_ORDER', // great - VersionInfo must come before EncodingDecl.
   'not-wf-sa-096': 'XMLDECL_NO_SPACE_BETWEEN_PARAMS', // great - Space is required before the standalone declaration.
   'not-wf-sa-097': 'XMLDECL_VERSION_INVALD', // ok - Both quotes surrounding VersionNum must be the same.
   'not-wf-sa-098': 'XMLDECL_DUPLICATE_VERSION', // Only one "version=..." string may appear in an XML declaration.
   'not-wf-sa-099': 'XMLDECL_NO_CLOSE', // meh - Only three pseudo-attributes are in the XML declaration, and "valid=..." is not one of them.
   'not-wf-sa-100': 'XMLDECL_STANDALONE_INVALID_CASE', // great - Only "yes" and "no" are permitted as values of "standalone".
   'not-wf-sa-101': 'XMLDECL_ENCODING_INVALID', // ok - Space is not permitted in an encoding name.
   'not-wf-sa-102': 'XMLDECL_VERSION_INVALD', // ok - Provides an illegal XML version number; spaces are illegal.
   'not-wf-sa-103': 'ELEMENT_UNBALANCED', // ok - End-tag required for element foo.
   'not-wf-sa-104': 'ELEMENT_UNBALANCED', // ok - Internal general parsed entities are only well formed if they match the "content" production.
   'not-wf-sa-105': {
      // ok - Invalid placement of CDATA section.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CDATA_PTOKEN',
   },
   'not-wf-sa-106': {
      // ok - but strange test description - Invalid placement of entity declaration.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARREF_PTOKEN',
   },
   'not-wf-sa-107': {
      // ok - Invalid document type declaration. CDATA alone is invalid.
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: 'CDATA_PTOKEN',
   },
   'not-wf-sa-108': 'CDATA_XTRA_SPACE_AFTER_TYPE', // great - No space in '![CDATA['.
   'not-wf-sa-109': {
      // good - Tags invalid within EntityDecl.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'GENERAL_ENTITY_START_PTOKEN',
   },
   'not-wf-sa-110': {
      // ok - Entity reference must be in content of element.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'GENERAL_ENTITY_START_PTOKEN',
   },
   'not-wf-sa-111': 'ATTRIBUTE_INVALID_NAME', // OK - Entiry reference must be in content of element not Start-tag.
   'not-wf-sa-112': 'CDATA_INVALID_CASE', // great - CDATA sections start '![CDATA[', not '!cdata['.
   'not-wf-sa-113': 'REFERENCE_INVALID_CHARS', // ok - Parameter entity values must use valid reference syntax; this reference is malformed.
   'not-wf-sa-114': 'REFERENCE_INVALID_CHARS', // ok - General entity values must use valid reference syntax; this reference is malformed.
   'not-wf-sa-115': 'REFERENCE_NO_NAME', // ok - The replacement text of this entity is an illegal character reference, which must be rejected when it is parsed in the context of an attribute value.
   'not-wf-sa-116': 'CHARREF_NO_CLOSE', // good - Internal general parsed entities are only well formed if they match the "content" production. This is a partial character reference, not a full one.
   'not-wf-sa-117': 'REFERENCE_NO_NAME', // ok - Internal general parsed entities are only well formed if they match the "content" production. This is a partial character reference, not a full one.
   'not-wf-sa-118': 'REFERENCE_NAME_INVALID', // OK - Entity reference expansion is not recursive.
   'not-wf-sa-119': 'REFERENCE_NO_NAME', // ok - Internal general parsed entities are only well formed if they match the "content" production. This is a partial character reference, not a full one.
   'not-wf-sa-120': 'REFERENCE_NO_NAME', // ok - Character references are expanded in the replacement text of an internal entity, which is then parsed as usual. Accordingly,must be doubly quoted': 'error', // encoded either as_amp;_or as_#38;#38;_.
   'not-wf-sa-121': 'ENTITYDECL_NAME_INVALID', // great - A name of an ENTITY was started with an invalid character.
   'not-wf-sa-122': 'CONTENTMODEL_BAD_SEQUENCE', // ok - Invalid syntax mixed connectors are used.
   'not-wf-sa-123': 'ELEMENTDECL_NO_CLOSE', // meh - Invalid syntax mismatched parenthesis.
   'not-wf-sa-124': 'CONTENTMODEL_NAME_INVALID', // ok - Invalid format of Mixed-content declaration.
   'not-wf-sa-125': 'CONTENTMODEL_NAME_INVALID', // ok - Invalid syntax extra set of parenthesis not necessary.
   'not-wf-sa-126': 'CONTENTMODEL_MIXED_INVALID_REPEAT', // good - Invalid syntax Mixed-content must be defined as zero or more.
   'not-wf-sa-127': 'CONTENTMODEL_MIXED_INVALID_REPEAT', // good - Invalid syntax Mixed-content must be defined as zero or more.
   'not-wf-sa-128': 'ELEMENTDECL_SPEC_UNKNOWN', // OK - Invalid CDATA syntax.
   'not-wf-sa-129': 'ELEMENTDECL_SPEC_UNKNOWN', // OK - Invalid syntax for Element Type Declaration.
   'not-wf-sa-130': 'ELEMENTDECL_NO_CLOSE', // meh - Invalid syntax for Element Type Declaration.
   'not-wf-sa-131': 'ELEMENTDECL_NO_CLOSE', // meh - Invalid syntax for Element Type Declaration.
   'not-wf-sa-132': 'CONTENTMODEL_BAD_SEQUENCE', // Invalid syntax mixed connectors used.
   'not-wf-sa-133': 'CONTENTMODEL_NAME_EXTRA_SPACE', // good - Illegal whitespace before optional character causes syntax error.
   'not-wf-sa-134': 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // good - Illegal whitespace before optional character causes syntax error.
   'not-wf-sa-135': 'CONTENTMODEL_NAME_INVALID', // ok - Invalid character used as connector.
   'not-wf-sa-136': 'ELEMENTDECL_SPEC_UNKNOWN', // OK - Tag omission is invalid in XML.
   'not-wf-sa-137': 'ELEMENTDECL_NAME_NO_SPACE', // great - Space is required before a content model.
   'not-wf-sa-138': 'CONTENTMODEL_NO_DELIM', // meh - Invalid syntax for content particle.
   'not-wf-sa-139': 'CONTENTMODEL_NO_NAMES', // great - The element-content model should not be empty.
   'not-wf-sa-140': 'ELEMENT_NAME_INVALID', // ok - Character '#x309a;' is a CombiningChar, not a Letter, and so may not begin a name.
   'not-wf-sa-141': 'ELEMENT_NAME_INVALID', // good - Character #x0E5C is not legal in XML names.
   'not-wf-sa-142': 'CHARREF_INVALID_CHAR', // good - Character #x0000 is not legal anywhere in an XML document.
   'not-wf-sa-143': 'CHARREF_INVALID_CHAR', // good - Character #x001F is not legal anywhere in an XML document.
   'not-wf-sa-144': 'CHARREF_INVALID_CHAR', // good - Character #xFFFF is not legal anywhere in an XML document.
   'not-wf-sa-145': 'CHARDATA_INVALID_CHAR', // Character #xD800 is not legal anywhere in an XML document. (If it appeared in a UTF-16 surrogate pair, it'd represent half of a UCS-4 character and so wouldn't really be in the document.)
   'not-wf-sa-146': 'CHARREF_INVALID_CHAR', // good - Character references must also refer to legal XML characters; #x00110000 is one more than the largest legal character.
   'not-wf-sa-147': {
      // good - XML Declaration may not be preceded by whitespace.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'not-wf-sa-148': {
      // good - XML Declaration may not be preceded by comments or whitespace.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'not-wf-sa-149': {
      // good - XML Declaration may not be within a DTD.
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: 'XMLDECL_PTOKEN',
   },
   'not-wf-sa-150': {
      // good - XML declarations may not be within element content.
      id: 'CONTENT_INVALID_TOKEN',
      message: 'XMLDECL_PTOKEN',
   },
   'not-wf-sa-151': {
      // good - XML declarations may not follow document content.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'not-wf-sa-152': 'XMLDECL_ENCODING_INVALID_ORDER', // great - XML declarations must include the "version=..." string.
   'not-wf-sa-153': {
      id: 'CONTENT_INVALID_TOKEN', // ok - Text declarations may not begin internal parsed entities; they may only appear at the beginning of external parsed (parameter or general) entities.
      message: 'TEXTDECL_PTOKEN',
   },
   'not-wf-sa-154': 'XMLDECL_TARGET_INVALID_CASE', // ok - '?XML ...?>' is neither an XML declaration nor a legal processing instruction target name.
   'not-wf-sa-155': 'XMLDECL_TARGET_INVALID_CASE', // ok - '?xmL ...?>' is neither an XML declaration nor a legal processing instruction target name.
   'not-wf-sa-156': 'XMLDECL_TARGET_INVALID_CASE', // ok - '?xMl ...?>' is neither an XML declaration nor a legal processing instruction target name.
   'not-wf-sa-157': 'XMLDECL_TARGET_INVALID_CASE', // ok - '?xmL ...?>' is not a legal processing instruction target name.
   'not-wf-sa-158': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // OK - SGML-ism: "#NOTATION gif" can't have attributes.
   'not-wf-sa-159': 'REFERENCE_INVALID_CHARS', // OK - Uses '&' unquoted in an entity declaration, which is illegal syntax for an entity reference.
   'not-wf-sa-160': 'REFERENCE_INVALID_SUBSET_CONTEXT', // great - Violates the_PEs in Internal Subset_WFC by using a PE reference within a declaration.
   'not-wf-sa-161': 'REFERENCE_INVALID_SUBSET_CONTEXT', // great - Violates the_PEs in Internal Subset_WFC by using a PE reference within a declaration.
   'not-wf-sa-162': 'REFERENCE_INVALID_SUBSET_CONTEXT', // great - Violates the_PEs in Internal Subset_WFC by using a PE reference within a declaration.
   'not-wf-sa-163': {
      // OK - Invalid placement of Parameter entity reference.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARDATA_PTOKEN', // 'PARAMETER_ENTITY_START_PTOKEN',
   },
   'not-wf-sa-164': {
      // OK - Invalid placement of Parameter entity reference.
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'CHARDATA_PTOKEN', // 'PARAMETER_ENTITY_START_PTOKEN',
   },
   'not-wf-sa-165': 'ENTITYDECL_DECLTYPE_NO_SPACE_AFTER', // OK - Parameter entity declarations must have a space before the '%'.
   'not-wf-sa-166': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-167': 'CHARDATA_INVALID_CHAR', // good - Character FFFE is not legal anywhere in an XML document.
   'not-wf-sa-168': 'CHARDATA_INVALID_CHAR', // An unpaired surrogate (D800) is not legal anywhere in an XML document.
   'not-wf-sa-169': 'CHARDATA_INVALID_CHAR', // An unpaired surrogate (DC00) is not legal anywhere in an XML document.
   'not-wf-sa-170': 'error', // Four byte UTF-8 encodings can encode UCS-4 characters which are beyond the range of legal XML characters (and can't be expressed in Unicode surrogate pairs). This document holds such a character.
   'not-wf-sa-171': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-172': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-173': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-174': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-175': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-176': 'DOC_END_EARLY', // good - Start tags must have matching end tags.
   'not-wf-sa-177': 'CHARDATA_INVALID_CHAR', // good - Character FFFF is not legal anywhere in an XML document.
   'not-wf-sa-178': 'LITERAL_NO_CLOSE_QUOTE', // good - Invalid syntax matching double quote is missing.
   'not-wf-sa-179': 'LITERAL_NO_CLOSE_QUOTE', // good - Invalid syntax matching double quote is missing.
   'not-wf-sa-180': 'REFERENCE_NO_DECLARATION', // good - The_Entity Declared_WFC requires entities to be declared before they are used in an attribute list declaration.
   'not-wf-sa-181': 'CDATA_NO_CLOSE', // OK - Internal parsed entities must match the_content_production to be well formed.
   'not-wf-sa-182': 'COMMENT_NO_CLOSE', // OK - Internal parsed entities must match the_content_production to be well formed.
   'not-wf-sa-183': 'CONTENTMODEL_MIXED_NAME_EXTRA_REPEAT', // good - Mixed content declarations may not include content particles.
   'not-wf-sa-184': 'CONTENTMODEL_MIXED_INVALID_SUBPARTICLE', // OK - In mixed content models, element names must not be parenthesized.
   'not-wf-sa-185': 'REFERENCE_NO_DECLARATION', // great - Tests the_Entity Declared_WFC._Note:_a nonvalidating parser is permitted not to report this WFC violation, since it would need to read an external parameter entity to distinguish it from a violation of the_Standalone Declaration_VC.
   'not-wf-sa-186': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME', // great - Whitespace is required between attribute/value pairs.

   'not-wf-not-sa-001': 'CONDITIONAL_NO_CLOSE', // Conditional sections must be properly terminated ("]>" used instead of "]]>").
   'not-wf-not-sa-002': {
      id: 'MARKUPDECL_INVALID_TOKEN', // Processing instruction target names may not be "XML" in any combination of cases.
      message: 'TEXTDECL_PTOKEN',
   },
   'not-wf-not-sa-003': 'CONDITIONAL_NO_CLOSE', // Conditional sections must be properly terminated ("]]>" omitted).
   'not-wf-not-sa-004': 'CONDITIONAL_NO_CLOSE', // Conditional sections must be properly terminated ("]]>" omitted).
   'not-wf-not-sa-006': 'CONDITIONAL_NO_SECOND_BRACKET', // Conditional sections need a '[' after the INCLUDE or IGNORE.
   'not-wf-not-sa-007': {
      id: 'MARKUPDECL_INVALID_TOKEN', // A!DOCTYPE ...>declaration may not begin any external entity; it's only found once, in the document entity.
      message: 'DOCTYPE_START_PTOKEN',
   },
   'not-wf-not-sa-008': 'PEREF_NAME_INVALID', // In DTDs, the '%' character must be part of a parameter entity reference.
   'not-wf-not-sa-009': 'COMMENT_NO_CLOSE', // This test violates WFC:PE Between Declarations in Production 28a. The last character of a markup declaration is not contained in the same parameter-entity text replacement.
   'not-wf-ext-sa-001': 'REFERENCE_INVALID_RECURSION', // Tests the_No Recursion_WFC by having an external general entity be self-recursive.
   'not-wf-ext-sa-002': 'TEXTDECL_NO_CLOSE', // External entities have "text declarations", which do not permit the "standalone=..." attribute that's allowed in XML declarations.
   'not-wf-ext-sa-003': {
      id: 'CONTENT_INVALID_TOKEN', // Only one text declaration is permitted; a second one looks like an illegal processing instruction (target names of "xml" in any case are not allowed).
      message: 'TEXTDECL_PTOKEN',
   },
   'not-wf-sa03': 'REFERENCE_INVALID_STANDALONE', // Tests the Entity Declared WFC, ensuring that a reference to externally defined entity causes a well-formedness error.
   attlist01: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // SGML's NUTOKEN is not allowed.
   attlist02: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // SGML's NUTOKENS attribute type is not allowed.
   attlist03: 'WORDLIST_INVALID_NMTOKEN', // Comma doesn't separate enumerations, unlike in SGML.
   attlist04: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // SGML's NUMBER attribute type is not allowed.
   attlist05: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // SGML's NUMBERS attribute type is not allowed.
   attlist06: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // SGML's NAME attribute type is not allowed.
   attlist07: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // SGML's NAMES attribute type is not allowed.
   attlist08: 'ATTLISTDECL_ATTR_DEFAULT_UNKNOWN', // SGML's #CURRENT is not allowed.
   attlist09: 'ATTLISTDECL_ATTR_DEFAULT_UNKNOWN', // SGML's #CONREF is not allowed.
   attlist10: 'ATTRIBUTE_NO_SPACE_BEFORE_NAME', // Whitespace required between attributes
   attlist11: 'ATTRIBUTE_NO_SPACE_BEFORE_NAME', // Whitespace required between attributes
   cond01: {
      // Only INCLUDE and IGNORE are conditional section keywords
      id: 'CONDITIONAL_UNKNOWN',
      message: 'CDATA',
   },
   cond02: {
      // Must have keyword in conditional sections
      id: 'CONDITIONAL_UNKNOWN',
      message: '""',
   },
   content01: 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // No whitespace before "?" in content model
   content02: 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // No whitespace before "*" in content model
   content03: 'CONTENTMODEL_NAME_EXTRA_SPACE', // No whitespace before "+" in content model
   decl01: 'TEXTDECL_NO_CLOSE', // External entities may not have standalone decls.
   'nwf-dtd00': 'CONTENTMODEL_NO_DELIM', // Comma mandatory in content model
   'nwf-dtd01': 'CONTENTMODEL_BAD_SEQUENCE', // ok - Can't mix comma and vertical bar in content models
   dtd02: 'PEREF_XTRA_SPACE', // PE name immediately after "%"
   dtd03: 'PEREF_XTRA_TRAILING_SPACE', // PE name immediately followed by ";"
   dtd04: 'LITERAL_NO_OPEN_QUOTE', // PUBLIC literal must be quoted
   dtd05: 'EXTERNALID_MISSING_SYSTEM_VALUE', // meh - SYSTEM identifier must be quoted
   dtd07: 'TEXTDECL_ENCODING_MISSING', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
   element00: 'ELEMENT_NO_CLOSE', // EOF in middle of incomplete ETAG
   element01: 'ELEMENT_NO_CLOSE', // EOF in middle of incomplete ETAG
   element02: 'ATTRIBUTE_INVALID_NAME', // Illegal markup (... %>)
   element03: 'ELEMENT_NAME_INVALID', // Illegal markup ()
   element04: {
      // Illegal markup (!ELEMENT ...>)
      id: 'CONTENT_INVALID_TOKEN',
      message: 'ELEMENT_DECLARATION_PTOKEN',
   },
   encoding01: 'XMLDECL_ENCODING_INVALID', // Illegal character " " in encoding name
   encoding02: 'XMLDECL_ENCODING_INVALID', // Illegal character "/" in encoding name
   encoding03: 'XMLDECL_ENCODING_INVALID', // Illegal character reference in encoding name
   encoding04: 'XMLDECL_ENCODING_INVALID', // Illegal character ":" in encoding name
   encoding05: 'XMLDECL_ENCODING_INVALID', // Illegal character "@" in encoding name
   encoding06: 'XMLDECL_ENCODING_INVALID', // Illegal character "+" in encoding name
   encoding07: 'CONTENTEMPTY_INVALID_SYNTAX', // Text declarations (which optionally begin any external entity) are required to have "encoding=...".
   pi: 'PI_TARGET_NAME_INVALID', // No space between PI target name and data
   pubid01: 'EXTERNALID_PUBLIC_INVALID_CHARS', // Illegal entity ref in public ID
   pubid02: 'EXTERNALID_PUBLIC_INVALID_CHARS', // Illegal characters in public ID
   pubid03: 'EXTERNALID_PUBLIC_INVALID_CHARS', // Illegal characters in public ID
   pubid04: 'EXTERNALID_PUBLIC_INVALID_CHARS', // Illegal characters in public ID
   pubid05: 'EXTERNALID_MISSING_SYSTEM_VALUE', // ok - SGML-ism: public ID without system ID
   sgml01: 'CONTENTEMPTY_INVALID_SYNTAX', // SGML-ism: omitted end tag for EMPTY content
   sgml02: {
      // XML declaration must be at the very beginning of a document; it"s not a processing instruction
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   sgml03: 'COMMENT_DOUBLE_HYPHEN', // Comments may not contain "--"
   sgml04: 'ATTLISTDECL_ELEMENT_NAME_INVALID', // ATTLIST declarations apply to only one element, unlike SGML
   sgml05: 'ELEMENTDECL_NO_NAME', // ELEMENT declarations apply to only one element, unlike SGML
   sgml06: 'ATTLISTDECL_ELEMENT_NAME_INVALID', // ATTLIST declarations are never global, unlike in SGML
   sgml07: 'ELEMENTDECL_SPEC_UNKNOWN', // SGML Tag minimization specifications are not allowed
   sgml08: 'ELEMENTDECL_SPEC_UNKNOWN', // SGML Tag minimization specifications are not allowed
   sgml09: 'ELEMENTDECL_NO_CLOSE', // SGML Content model exception specifications are not allowed
   sgml10: 'ELEMENTDECL_NO_CLOSE', // SGML Content model exception specifications are not allowed
   sgml11: 'ELEMENTDECL_SPEC_UNKNOWN', // CDATA is not a valid content model spec
   sgml12: 'ELEMENTDECL_SPEC_UNKNOWN', // RCDATA is not a valid content model spec
   sgml13: 'CONTENTMODEL_NO_DELIM', // SGML Unordered content models not allowed

   'o-p01fail1': {
      // S cannot occur before the prolog
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'o-p01fail2': {
      // comments cannot occur before the prolog
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'o-p01fail3': {
      // only one document element
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'ELEMENT_EMPTY_PTOKEN',
   },
   'o-p01fail4': 'DOC_END_EARLY', // document element must be complete.
   'o-p02fail1': 'CHARDATA_INVALID_CHAR',
   'o-p02fail10': 'CHARDATA_INVALID_CHAR',
   'o-p02fail11': 'CHARDATA_INVALID_CHAR',
   'o-p02fail12': 'CHARDATA_INVALID_CHAR',
   'o-p02fail13': 'CHARDATA_INVALID_CHAR',
   'o-p02fail14': 'CHARDATA_INVALID_CHAR',
   'o-p02fail15': 'CHARDATA_INVALID_CHAR',
   'o-p02fail16': 'CHARDATA_INVALID_CHAR',
   'o-p02fail17': 'CHARDATA_INVALID_CHAR',
   'o-p02fail18': 'CHARDATA_INVALID_CHAR',
   'o-p02fail19': 'CHARDATA_INVALID_CHAR',
   'o-p02fail2': 'CHARDATA_INVALID_CHAR',
   'o-p02fail20': 'CHARDATA_INVALID_CHAR',
   'o-p02fail21': 'CHARDATA_INVALID_CHAR',
   'o-p02fail22': 'CHARDATA_INVALID_CHAR',
   'o-p02fail23': 'CHARDATA_INVALID_CHAR',
   'o-p02fail24': 'CHARDATA_INVALID_CHAR',
   'o-p02fail25': 'CHARDATA_INVALID_CHAR',
   'o-p02fail26': 'CHARDATA_INVALID_CHAR',
   'o-p02fail27': 'CHARDATA_INVALID_CHAR',
   'o-p02fail28': 'CHARDATA_INVALID_CHAR',
   'o-p02fail29': 'CHARDATA_INVALID_CHAR',
   'o-p02fail3': 'CHARDATA_INVALID_CHAR',
   'o-p02fail30': 'CHARDATA_INVALID_CHAR',
   'o-p02fail31': 'CHARDATA_INVALID_CHAR',
   'o-p02fail4': 'CHARDATA_INVALID_CHAR',
   'o-p02fail5': 'CHARDATA_INVALID_CHAR',
   'o-p02fail6': 'CHARDATA_INVALID_CHAR',
   'o-p02fail7': 'CHARDATA_INVALID_CHAR',
   'o-p02fail8': 'CHARDATA_INVALID_CHAR',
   'o-p02fail9': 'CHARDATA_INVALID_CHAR',
   'o-p03fail1': 'CHARDATA_INVALID_CHAR',
   'o-p03fail10': 'CHARDATA_INVALID_CHAR',
   'o-p03fail11': 'CHARDATA_INVALID_CHAR',
   'o-p03fail12': 'CHARDATA_INVALID_CHAR',
   'o-p03fail13': 'CHARDATA_INVALID_CHAR',
   'o-p03fail14': 'CHARDATA_INVALID_CHAR',
   'o-p03fail15': 'CHARDATA_INVALID_CHAR',
   'o-p03fail16': 'CHARDATA_INVALID_CHAR',
   'o-p03fail17': 'CHARDATA_INVALID_CHAR',
   'o-p03fail18': 'CHARDATA_INVALID_CHAR',
   'o-p03fail19': 'CHARDATA_INVALID_CHAR',
   'o-p03fail2': 'CHARDATA_INVALID_CHAR',
   'o-p03fail20': 'CHARDATA_INVALID_CHAR',
   'o-p03fail21': 'CHARDATA_INVALID_CHAR',
   'o-p03fail22': 'CHARDATA_INVALID_CHAR',
   'o-p03fail23': 'CHARDATA_INVALID_CHAR',
   'o-p03fail24': 'CHARDATA_INVALID_CHAR',
   'o-p03fail25': 'CHARDATA_INVALID_CHAR',
   'o-p03fail26': 'CHARDATA_INVALID_CHAR',
   'o-p03fail27': 'CHARDATA_INVALID_CHAR',
   'o-p03fail28': 'CHARDATA_INVALID_CHAR',
   'o-p03fail29': 'CHARDATA_INVALID_CHAR',
   'o-p03fail3': 'CHARDATA_INVALID_CHAR',
   'o-p03fail4': 'CHARDATA_INVALID_CHAR',
   'o-p03fail5': 'CHARDATA_INVALID_CHAR',
   'o-p03fail7': 'CHARDATA_INVALID_CHAR',
   'o-p03fail8': 'CHARDATA_INVALID_CHAR',
   'o-p03fail9': 'CHARDATA_INVALID_CHAR',
   'o-p04fail1': 'ELEMENT_NAME_INVALID', // Name contains invalid character.
   'o-p04fail2': 'ELEMENT_NAME_INVALID', // Name contains invalid character.
   'o-p04fail3': 'ELEMENT_NAME_INVALID', // Name contains invalid character.
   'o-p05fail1': 'ELEMENT_NAME_INVALID', // a Name cannot start with a digit
   'o-p05fail2': 'ELEMENT_NAME_INVALID', // a Name cannot start with a '.'
   'o-p05fail3': 'ELEMENT_NAME_INVALID', // a Name cannot start with a "-"
   'o-p05fail4': 'ELEMENT_NAME_INVALID', // a Name cannot start with a CombiningChar
   'o-p05fail5': 'ELEMENT_NAME_INVALID', // a Name cannot start with an Extender
   'o-p09fail1': 'PEREF_NO_SEMICOLON', // EntityValue excludes '%'
   'o-p09fail2': 'REFERENCE_INVALID_CHARS', // EntityValue excludes '&'
   'o-p09fail3': 'CHARREF_NO_CLOSE', // incomplete character reference
   'o-p09fail4': 'LITERAL_NO_CLOSE_QUOTE', // quote types must match
   'o-p09fail5': 'LITERAL_NO_CLOSE_QUOTE', // quote types must match
   'o-p10fail1': 'ATTRIBUTE_INVALID_VALUE', // attribute values exclude ''
   'o-p10fail2': 'REFERENCE_NAME_INVALID', // attribute values exclude ''
   'o-p10fail3': 'LITERAL_NO_CLOSE_QUOTE', // quote types must match
   'o-p11fail1': 'LITERAL_NO_CLOSE_QUOTE', // quote types must match
   'o-p11fail2': 'NOTATIONDECL_NO_CLOSE', // cannot contain delimiting quotes
   'o-p12fail1': 'EXTERNALID_PUBLIC_INVALID_CHARS', // '"' excluded
   'o-p12fail2': 'EXTERNALID_PUBLIC_INVALID_CHARS', // '\' excluded
   'o-p12fail3': 'EXTERNALID_PUBLIC_INVALID_CHARS', // entity references excluded
   'o-p12fail4': 'EXTERNALID_PUBLIC_INVALID_CHARS', // '>' excluded
   'o-p12fail5': 'EXTERNALID_PUBLIC_INVALID_CHARS', // '' excluded
   'o-p12fail6': 'EXTERNALID_PUBLIC_INVALID_CHARS', // built-in entity refs excluded
   'o-p12fail7': 'EXTERNALID_PUBLIC_INVALID_CHARS', // The public ID has a tab character, which is disallowed
   'o-p14fail1': 'ELEMENT_XTRA_LEADING_SPACE', // '' excluded
   'o-p14fail2': 'REFERENCE_XTRA_SPACE', // '' excluded
   'o-p14fail3': 'CHARDATA_INVALID_SECTION_END', // "]]>" excluded
   'o-p15fail1': 'COMMENT_DOUBLE_HYPHEN', // comments can't end in '-'
   'o-p15fail2': 'COMMENT_DOUBLE_HYPHEN', // one comment per comment (contrasted with SGML)
   'o-p15fail3': 'COMMENT_DOUBLE_HYPHEN', // can't include 2 or more adjacent '-'s

   'o-p16fail1': {
      // meh - someday we could give these better messages
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'o-p16fail2': 'PI_NO_TARGET', // a PITarget must be present
   'o-p16fail3': 'PI_TARGET_NAME_INVALID', // S after PITarget is required
   'o-p18fail1': 'CDATA_XTRA_SPACE_AFTER_OPEN', // no space before "CDATA"
   'o-p18fail2': 'CDATA_XTRA_SPACE_AFTER_TYPE', // no space after "CDATA"
   'o-p18fail3': 'CHARDATA_INVALID_SECTION_END', // CDSect's can't nest
   'o-p22fail1': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },
   'o-p22fail2': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: 'XMLDECL_PTOKEN',
   },

   'o-p23fail1': 'XMLDECL_TARGET_INVALID_CASE', // "xml" must be lower-case
   'o-p23fail2': 'XMLDECL_ENCODING_INVALID_ORDER', // VersionInfo must be supplied
   'o-p23fail3': 'XMLDECL_VERSION_INVALID_ORDER', // VersionInfo must come first
   'o-p23fail4': 'XMLDECL_ENCODING_INVALID_ORDER', // SDDecl must come last
   'o-p23fail5': 'XMLDECL_NO_CLOSE', // no SGML-type PIs
   'o-p24fail1': 'XMLDECL_VERSION_INVALD', // quote types must match
   'o-p24fail2': 'XMLDECL_VERSION_INVALD', // quote types must match
   'o-p25fail1': 'XMLDECL_VERSION_INVALD', // Comment is illegal in VersionInfo.
   'o-p26fail1': 'XMLDECL_VERSION_INVALD', // Illegal character in VersionNum.
   'o-p26fail2': 'XMLDECL_VERSION_INVALD', // Illegal character in VersionNum.
   'o-p27fail1': 'TOKEN_INVALID_CONTEXT', // References aren't allowed in Misc, even if they would resolve to valid Misc.
   'o-p28fail1': {
      id: 'MARKUPDECL_INVALID_TOKEN', // only declarations in DTD.
      message: 'ELEMENT_EMPTY_PTOKEN',
   },
   'o-p29fail1': 'MARKUPDECL_INVALID_TOKEN', // A processor must not pass unknown declaration types.
   'o-p30fail1': 'TEXTDECL_NO_CLOSE', // meh - An XML declaration is not the same as a TextDecl
   'o-p31fail1': {
      id: 'MARKUPDECL_INVALID_TOKEN', // external subset excludes doctypedecl
      message: 'DOCTYPE_START_PTOKEN',
   },
   'o-p32fail1': 'XMLDECL_STANDALONE_INVALID', // quote types must match
   'o-p32fail2': 'XMLDECL_STANDALONE_INVALID', // quote types must match
   'o-p32fail3': 'XMLDECL_NO_SPACE_BETWEEN_PARAMS', // initial S is required
   'o-p32fail4': 'XMLDECL_STANDALONE_INVALID', // quotes are required
   'o-p32fail5': 'XMLDECL_STANDALONE_INVALID_CASE', // yes or no must be lower case
   'o-p39fail1': 'DOC_END_EARLY', // start-tag requires end-tag
   'o-p39fail2': 'ELEMENT_UNBALANCED', // end-tag requires start-tag
   'o-p39fail3': 'DOC_END_EARLY', // XML documents contain one or more elements
   'o-p39fail4': 'XMLDECL_NO_CLOSE', // XML declarations must be correctly terminated
   'o-p39fail5': 'XMLDECL_NO_CLOSE', // XML declarations must be correctly terminated
   'o-p40fail1': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME', // S is required between attributes
   'o-p40fail2': 'ELEMENT_NAME_INVALID', // tags start with names, not nmtokens
   'o-p40fail3': 'ELEMENT_NAME_INVALID', // tags start with names, not nmtokens
   'o-p40fail4': 'ELEMENT_XTRA_LEADING_SPACE', // no space before name
   'o-p41fail1': 'LITERAL_NO_OPEN_QUOTE', // quotes are required (contrast with SGML)
   'o-p41fail2': 'ATTRIBUTE_NO_EQUAL', // attribute name is required (contrast with SGML)
   'o-p41fail3': 'ATTRIBUTE_NO_EQUAL', // Eq required
   'o-p42fail1': 'ELEMENT_XTRA_LEADING_SPACE', // no space before name
   'o-p42fail2': 'ELEMENT_NAME_INVALID', // cannot end with "/>"
   'o-p42fail3': 'ELEMENT_NAME_INVALID', // no NET (contrast with SGML)
   'o-p43fail1': {
      // no non-comment declarations
      id: 'CONTENT_INVALID_TOKEN',
      message: 'GENERAL_ENTITY_DECLARATION_PTOKEN',
   },
   'o-p43fail2': {
      // no conditional sections
      id: 'CONTENT_INVALID_TOKEN',
      message: 'CONDITIONAL_START_PTOKEN',
   },
   'o-p43fail3': {
      // no conditional sections
      id: 'CONTENT_INVALID_TOKEN',
      message: 'CONDITIONAL_START_PTOKEN',
   },
   'o-p44fail1': 'ELEMENT_XTRA_LEADING_SPACE', // Illegal space before Empty element tag.
   'o-p44fail2': 'ELEMENT_NAME_INVALID', // Illegal space after Empty element tag.
   'o-p44fail3': 'ATTRIBUTE_INVALID_NAME', // Illegal comment in Empty element tag.
   'o-p44fail4': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME', // Whitespace required between attributes.
   'o-p44fail5': 'ATTRIBUTE_DUPLICATE_NAME', // Duplicate attribute name is illegal.
   'o-p45fail1': 'ELEMENTDECL_DECLTYPE_INVALID', // ELEMENT must be upper case.
   'o-p45fail2': 'ELEMENTDECL_NAME_NO_SPACE', // S before contentspec is required.
   'o-p45fail3': 'ELEMENTDECL_NO_NAME', // only one content spec
   'o-p45fail4': 'ELEMENTDECL_NO_CLOSE', // no comments in declarations (contrast with SGML)
   'o-p46fail1': 'CONTENTMODEL_NAME_INVALID', // no parens on declared content
   'o-p46fail2': 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // no inclusions (contrast with SGML)
   'o-p46fail3': 'ELEMENTDECL_NO_CLOSE', // no exclusions (contrast with SGML)
   'o-p46fail4': 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // no space before occurrence
   'o-p46fail5': 'ELEMENTDECL_NO_CLOSE', // single group
   'o-p46fail6': 'ELEMENTDECL_NO_CLOSE', // can't be both declared and modeled
   'o-p47fail1': 'CONTENTMODEL_BAD_SEQUENCE', // ok - Invalid operator '|' must match previous operator ','
   'o-p47fail2': 'ELEMENTDECL_NO_CLOSE', // Illegal character '-' in Element-content model
   'o-p47fail3': 'ELEMENTDECL_SPEC_UNKNOWN', // Optional character must follow a name or list
   'o-p47fail4': 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // Illegal space before optional character
   'o-p48fail1': 'CONTENTMODEL_NAME_EXTRA_SPACE', // Illegal space before optional character
   'o-p48fail2': 'CONTENTMODEL_CLOSE_EXTRA_SPACE', // Illegal space before optional character
   'o-p49fail1': 'CONTENTMODEL_BAD_CHOICE', // ok - connectors must match
   'o-p50fail1': 'CONTENTMODEL_BAD_SEQUENCE', // ok - connectors must match
   'o-p51fail1': 'CONTENTMODEL_MIXED_INVALID_REPEAT', // good - occurrence on #PCDATA group must be *
   'o-p51fail2': 'CONTENTMODEL_MIXED_INVALID_REPEAT', // good - occurrence on #PCDATA group must be *
   'o-p51fail3': 'CONTENTMODEL_NAME_INVALID', // #PCDATA must come first
   'o-p51fail4': 'CONTENTMODEL_MIXED_INVALID_REPEAT', // occurrence on #PCDATA group must be *
   'o-p51fail5': 'CONTENTMODEL_BAD_CHOICE', // ok - only '|' connectors
   'o-p51fail6': 'CONTENTMODEL_BAD_CHOICE', // Only '|' connectors and occurrence on #PCDATA group must be *
   'o-p51fail7': 'CONTENTMODEL_MIXED_INVALID_SUBPARTICLE', // no nested groups
   'o-p52fail1': 'ATTLISTDECL_NO_ELEMENT_NAME', // A name is required
   'o-p52fail2': 'ATTLISTDECL_NO_ELEMENT_NAME', // A name is required
   'o-p53fail1': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE', // S is required before default
   'o-p53fail2': 'ATTLISTDECL_ATTR_NAME_INVALID', // S is required before type
   'o-p53fail3': 'ATTLISTDECL_ATTR_NO_ATTTYPE', // type is required
   'o-p53fail4': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE', // default is required
   'o-p53fail5': 'ATTLISTDECL_ATTR_NAME_INVALID', // name is requried
   'o-p54fail1': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // don't pass unknown attribute types
   'o-p55fail1': 'ATTLISTDECL_ATTR_TYPE_INVALID', // must be upper case
   'o-p56fail1': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // no IDS type
   'o-p56fail2': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // no NUMBER type
   'o-p56fail3': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // no NAME type
   'o-p56fail4': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN', // no ENTITYS type - types must be upper case
   'o-p56fail5': 'ATTLISTDECL_ATTR_TYPE_INVALID', // types must be upper case
   'o-p57fail1': 'ATTLISTDECL_ATTR_NAME_INVALID', // no keyword for NMTOKEN enumeration
   'o-p58fail1': 'WORDLIST_NO_WORDS', // at least one value required
   'o-p58fail2': 'WORDLIST_INVALID_NAME', // separator must be '|'
   'o-p58fail3': 'WORDLIST_INVALID_NAME', // notations are NAMEs, not NMTOKENs -- note: Leaving the invalid notation undeclared would cause a validating parser to fail without checking the name syntax, so the notation is declared with an invalid name. A parser that reports error positions should report an error at the AttlistDecl on line 6, before reaching the notation declaration.
   'o-p58fail4': 'ATTLISTDECL_ATTR_TYPE_INVALID', // NOTATION must be upper case
   'o-p58fail5': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE', // S after keyword is required
   'o-p58fail6': 'ATTLISTDECL_ATTR_NO_NOTATION', // parentheses are require
   'o-p58fail7': 'ATTLISTDECL_ATTR_NO_NOTATION', // values are unquoted
   'o-p58fail8': 'WORDLIST_INVALID_NAME', // values are unquoted
   'o-p59fail1': 'WORDLIST_NO_WORDS', // great at least one required
   'o-p59fail2': 'WORDLIST_INVALID_NMTOKEN', // ok : test decription unclearseparator must be ","
   'o-p59fail3': 'WORDLIST_INVALID_NMTOKEN', // great values are unquoted
   'o-p60fail1': 'ATTLISTDECL_ATTR_DEFAULT_INVALID', // great keywords must be upper case
   'o-p60fail2': 'ATTLISTDECL_ATTR_FIXED_NO_SPACE', // great S is required after #FIXED
   'o-p60fail3': 'ATTLISTDECL_ATTR_NAME_INVALID', // ok only #FIXED has both keyword and value
   'o-p60fail4': 'ATTLISTDECL_ATTR_FIXED_NO_VALUE', // great #FIXED required value
   'o-p60fail5': 'ATTLISTDECL_ATTR_NAME_INVALID', // OK - only one default type
   'o-p61fail1': 'CONDITIONAL_UNKNOWN', // great no other types, including TEMP, which is valid in SGML
   'o-p62fail1': 'CONDITIONAL_INVALID_CASE', // great INCLUDE must be upper case
   'o-p62fail2': 'CONDITIONAL_NO_CLOSE', // OK no spaces in terminating delimiter
   'o-p63fail1': 'CONDITIONAL_INVALID_CASE', // IGNORE must be upper case
   'o-p63fail2': 'CONDITIONAL_NO_CLOSE', // OK delimiters must be balanced
   'o-p64fail1': 'MARKUPDECL_INVALID_TOKEN', // ok section delimiters must balance
   'o-p64fail2': 'CONDITIONAL_NO_CLOSE', // OK section delimiters must balance
   'o-p66fail1': 'CHARREF_NO_CLOSE', // terminating ';' is required
   'o-p66fail2': 'CHARREF_XTRA_POST_OPEN_SPACE', // great no S after '#'
   'o-p66fail3': 'CHARREF_NO_DIGITS', // meh no hex digits in numeric reference
   'o-p66fail4': 'CHARREF_NO_CLOSE', // meh - only hex digits in hex references
   'o-p66fail5': 'CHARREF_INVALID_CHAR', // great - no references to non-characters
   'o-p66fail6': 'CHARDATA_INVALID_CHAR', // no references to non-characters
   'o-p68fail1': 'REFERENCE_NO_SEMICOLON', // terminating ';' is required
   'o-p68fail2': 'REFERENCE_XTRA_SPACE', // no S after ''
   'o-p68fail3': 'REFERENCE_XTRA_TRAILING_SPACE', // no S before ';'
   'o-p69fail1': 'PEREF_NAME_INVALID', // terminating ';' is required
   'o-p69fail2': 'PEREF_XTRA_SPACE', // no S after '%'
   'o-p69fail3': 'PEREF_XTRA_TRAILING_SPACE', // no S before ';'
   'o-p70fail1': 'ENTITYDECL_NAME_INVALID', // ok This is neither
   'o-p71fail1': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great S is required before EntityDef
   'o-p71fail2': 'ENTITYDECL_NAME_INVALID', // ok Entity name is a Name, not an NMToken
   'o-p71fail3': 'ENTITYDECL_OPEN_XTRA_SPACE_AFTER', // no S after "!"
   'o-p71fail4': 'MARKUPDECL_INVALID_TOKEN', // ok S is required after "!ENTITY"
   'o-p72fail1': 'ENTITYDECL_DECLTYPE_NO_SPACE_AFTER', // great
   'o-p72fail2': 'ENTITYDECL_PERCENT_NO_TRAILING_SPACE', // great S is required after '%'
   'o-p72fail3': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great S is required after name
   'o-p72fail4': 'ENTITYDECL_NAME_INVALID', // great Entity name is a name, not an NMToken
   'o-p73fail1': 'LITERAL_NO_OPEN_QUOTE', // great No typed replacement text
   'o-p73fail2': 'ENTITYDECL_NO_CLOSE', //great  Only one replacement value
   'o-p73fail3': 'ENTITYDECL_NO_CLOSE', // great No NDataDecl on replacement text
   'o-p73fail4': 'LITERAL_NO_OPEN_QUOTE', // Value is required
   'o-p73fail5': 'LITERAL_NO_OPEN_QUOTE', // ok No NDataDecl without value
   'o-p74fail1': 'MARKUPDECL_INVALID_TOKEN', // ok no NDataDecls on parameter entities
   'o-p74fail2': 'LITERAL_NO_OPEN_QUOTE', //OK  value is required
   'o-p74fail3': 'ENTITYDECL_NO_CLOSE', // ok only one value
   'o-p75fail1': 'EXTERNALID_EXTERNALTYPE_NO_SPACE', // good S required after "PUBLIC"
   'o-p75fail2': 'EXTERNALID_EXTERNALTYPE_NO_SPACE', // good S required after "SYSTEM"
   'o-p75fail3': 'EXTERNALID_SYSTEM_NO_LEADING_SPACE', // good S required between literals
   'o-p75fail4': 'ENTITYDECL_NO_CLOSE', // good "SYSTEM" implies only one literal
   'o-p75fail5': 'ENTITYDECL_NO_CLOSE', // good only one keyword
   'o-p75fail6': 'EXTERNALID_MISSING_SYSTEM_VALUE', // ok - "PUBLIC" requires two literals (contrast with SGML)
   'o-p76fail1': 'ENTITYDECL_EXTERNALID_NO_SPACE', // S is required before "NDATA"
   'o-p76fail2': 'ENTITYDECL_NDATA_INVALID_CASE', // good "NDATA" is upper-case
   'o-p76fail3': 'ENTITYDECL_NDATA_NO_NAME', // good notation name is required
   'o-p76fail4': 'NOTATIONDECL_NAME_INVALID', // good notation names are Names

   'ibm-not-wf-P01-ibm01n01.xml': 'DOC_END_EARLY',
   'ibm-not-wf-P01-ibm01n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P01-ibm01n03.xml': 'TOKEN_INVALID_CONTEXT',
   'ibm-not-wf-P02-ibm02n01.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n02.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n03.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n04.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n05.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n06.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n07.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n08.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n09.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n10.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n11.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n12.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n13.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n14.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n15.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n16.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n17.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n18.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n19.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n20.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n21.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n22.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n23.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n24.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n25.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n26.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n27.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n28.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n29.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n30.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n31.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n32.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P02-ibm02n33.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-not-wf-P03-ibm03n01.xml': 'ELEMENT_NO_CLOSE',

   // §2.3 These check that strange characters in the element name are rejected
   'ibm-not-wf-P04-ibm04n01.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n02.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n03.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n04.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n05.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n06.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n07.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n08.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n09.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n10.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n11.xml': {
      // In this case we interpret [ as the end of the name and start of the internal subset
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /CHARDATA_PTOKEN/,
   },
   'ibm-not-wf-P04-ibm04n12.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n13.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n14.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n15.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n16.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n17.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P04-ibm04n18.xml': 'DOCTYPE_NAME_INVALID',

   // §2.3 bad characters in beginning, middle and end
   'ibm-not-wf-P05-ibm05n01.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P05-ibm05n02.xml': 'DOCTYPE_NAME_INVALID',
   'ibm-not-wf-P05-ibm05n03.xml': 'DOCTYPE_NAME_INVALID',
   'ibm05n04.xml': 'DOCTYPE_NAME_INVALID',
   'ibm05n05.xml': 'DOCTYPE_NAME_INVALID',

   // §2.3 Various bad entity values
   'ibm-not-wf-P09-ibm09n01.xml': 'PEREF_NAME_INVALID', // could parse this differently, and stop with the quote: <!ENTITY FullName "Snow%Man">
   'ibm-not-wf-P09-ibm09n02.xml': 'REFERENCE_NO_SEMICOLON',
   'ibm-not-wf-P09-ibm09n03.xml': 'ENTITYDECL_NO_CLOSE',
   'ibm-not-wf-P09-ibm09n04.xml': 'LITERAL_NO_CLOSE_QUOTE',

   // §2.3 Bad attribute values
   'ibm-not-wf-P10-ibm10n01.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm-not-wf-P10-ibm10n02.xml': 'REFERENCE_NO_SEMICOLON',
   'ibm-not-wf-P10-ibm10n03.xml': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
   'ibm-not-wf-P10-ibm10n04.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm-not-wf-P10-ibm10n05.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm-not-wf-P10-ibm10n06.xml': 'REFERENCE_NO_SEMICOLON',
   'ibm-not-wf-P10-ibm10n07.xml': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
   'ibm-not-wf-P10-ibm10n08.xml': 'ATTRIBUTE_INVALID_VALUE',

   // §2.3 Bad system literals
   'ibm-not-wf-P11-ibm11n01.xml': 'DOCTYPE_NO_CLOSE',
   'ibm-not-wf-P11-ibm11n02.xml': 'DOCTYPE_NO_CLOSE',
   'ibm-not-wf-P11-ibm11n03.xml': 'LITERAL_NO_CLOSE_QUOTE',
   'ibm-not-wf-P11-ibm11n04.xml': 'LITERAL_NO_CLOSE_QUOTE',

   // §2.3 Bad system literals
   'ibm-not-wf-P12-ibm12n01.xml': 'LITERAL_NO_CLOSE_QUOTE',
   'ibm-not-wf-P12-ibm12n02.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',
   'ibm-not-wf-P12-ibm12n03.xml': 'LITERAL_NO_CLOSE_QUOTE',

   // §2.3 Bad characters in public id
   'ibm-not-wf-P13-ibm13n01.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',
   'ibm-not-wf-P13-ibm13n02.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',
   'ibm-not-wf-P13-ibm13n03.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',

   // §2.4 Bad characters in chardata
   'ibm-not-wf-P14-ibm14n01.xml': 'CHARDATA_INVALID_SECTION_END',
   'ibm-not-wf-P14-ibm14n02.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm-not-wf-P14-ibm14n03.xml': 'REFERENCE_XTRA_TRAILING_SPACE',

   // §2.5 Comments
   'ibm-not-wf-P15-ibm15n01.xml': 'COMMENT_DOUBLE_HYPHEN',
   'ibm-not-wf-P15-ibm15n02.xml': 'COMMENT_NO_CLOSE',
   'ibm-not-wf-P15-ibm15n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /UNKNOWNDECL/,
   },
   'ibm-not-wf-P15-ibm15n04.xml': 'COMMENT_NO_CLOSE',

   // §2.6 PI
   'ibm-not-wf-P16-ibm16n01.xml': 'TOKEN_INVALID_CONTEXT',
   'ibm-not-wf-P16-ibm16n02.xml': 'PI_NO_TARGET',
   'ibm-not-wf-P16-ibm16n03.xml': 'PI_NO_CLOSE',
   'ibm-not-wf-P16-ibm16n04.xml': 'PI_NO_CLOSE',

   // §2.6 PI
   'ibm-not-wf-P17-ibm17n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P17-ibm17n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P17-ibm17n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P17-ibm17n04.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },

   // §2.7 CData sections
   'ibm-not-wf-P18-ibm18n01.xml': 'CHARDATA_INVALID_SECTION_END',
   'ibm-not-wf-P18-ibm18n02.xml': 'CDATA_NO_CLOSE',

   // §2.7 CData sections
   'ibm-not-wf-P19-ibm19n01.xml': 'CDATA_INVALID_CASE',
   'ibm-not-wf-P19-ibm19n02.xml': 'CONDITIONAL_UNKNOWN',
   'ibm-not-wf-P19-ibm19n03.xml': 'PI_NO_CLOSE',

   // §2.7 CData sections
   'ibm-not-wf-P20-ibm20n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CHARDATA_PTOKEN/,
   },

   // §2.7 CData sections
   'ibm-not-wf-P21-ibm21n01.xml': 'CONDITIONAL_UNKNOWN',
   'ibm-not-wf-P21-ibm21n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CDATA_PTOKEN/,
   },
   'ibm-not-wf-P21-ibm21n03.xml': 'CDATA_NO_CLOSE',

   // §2.8 Prolog
   'ibm-not-wf-P22-ibm22n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P22-ibm22n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P22-ibm22n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },

   // §2.8 Xml decl
   'ibm-not-wf-P23-ibm23n01.xml': 'XMLDECL_ENCODING_INVALID_ORDER',
   'ibm-not-wf-P23-ibm23n02.xml': 'XMLDECL_ENCODING_INVALID_ORDER',
   'ibm-not-wf-P23-ibm23n03.xml': 'XMLDECL_ENCODING_INVALID_ORDER',
   'ibm-not-wf-P23-ibm23n04.xml': 'XMLDECL_TARGET_INVALID_CASE',
   'ibm-not-wf-P23-ibm23n05.xml': 'XMLDECL_NO_CLOSE',
   'ibm-not-wf-P23-ibm23n06.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /UNKNOWNDECL/,
   },

   // §2.8 Xml decl version
   'ibm-not-wf-P24-ibm24n01.xml': 'XMLDECL_VERSION_INVALD',
   'ibm-not-wf-P24-ibm24n02.xml': 'PI_TARGET_HAS_XML',
   'ibm-not-wf-P24-ibm24n03.xml': 'XMLDECL_NO_PARAMS',
   'ibm-not-wf-P24-ibm24n04.xml': 'XMLDECL_NO_PARAMS',
   'ibm-not-wf-P24-ibm24n05.xml': 'XMLDECL_NO_PARAMS',
   'ibm-not-wf-P24-ibm24n06.xml': 'XMLDECL_PARAM_INVALID_CASE',
   'ibm-not-wf-P24-ibm24n07.xml': 'XMLDECL_PARAM_INVALID_CASE',
   'ibm-not-wf-P24-ibm24n08.xml': 'XMLDECL_VERSION_INVALD',
   'ibm-not-wf-P24-ibm24n09.xml': 'XMLDECL_VERSION_INVALD',

   // §2.8 Xml decl version equal
   'ibm-not-wf-P25-ibm25n01.xml': 'XMLDECL_VERSION_INVALD',
   'ibm-not-wf-P25-ibm25n02.xml': 'XMLDECL_VERSION_INVALD',

   // §2.8 VersionNum
   'ibm-not-wf-P26-ibm26n01.xml': 'XMLDECL_VERSION_INVALD',

   // §2.8 Misc
   'ibm-not-wf-P27-ibm27n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_DECLARATION_PTOKEN/,
   },

   // §2.8 doctypedecl
   'ibm-not-wf-P28-ibm28n01.xml': 'DOCTYPE_NO_CLOSE',
   'ibm-not-wf-P28-ibm28n02.xml': 'DOCTYPE_NO_NAME',
   'ibm-not-wf-P28-ibm28n03.xml': 'DOCTYPE_NO_CLOSE',
   'ibm-not-wf-P28-ibm28n04.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /GENERAL_ENTITY_START_PTOKEN/,
   },
   'ibm-not-wf-P28-ibm28n05.xml': 'DECL_DECLTYPE_INVALID_CASE',
   'ibm-not-wf-P28-ibm28n06.xml': 'MARKUPDECL_INVALID_TOKEN',
   'ibm-not-wf-P28-ibm28n07.xml': 'DOCTYPE_NO_CLOSE',
   'ibm-not-wf-P28-ibm28n08.xml': 'PI_NO_CLOSE',

   // §2.8 doctypedecl
   'ibm-not-wf-p28a-ibm28an01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /CHARDATA_PTOKEN/,
   },

   // §2.9 markupdecl
   'ibm-not-wf-P29-ibm29n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm-not-wf-P29-ibm29n02.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm-not-wf-P29-ibm29n03.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm-not-wf-P29-ibm29n04.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm-not-wf-P29-ibm29n05.xml': 'PI_NO_CLOSE',
   'ibm-not-wf-P29-ibm29n06.xml': 'COMMENT_NO_CLOSE',
   'ibm-not-wf-P29-ibm29n07.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',

   // §2.8 External Subset
   'ibm-not-wf-P30-ibm30n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /TEXTDECL_PTOKEN/,
   },

   // §2.8 extSubsetDecl
   'ibm-not-wf-P31-ibm31n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /GENERAL_ENTITY_START_PTOKEN/,
   },

   // §2.9 standalone
   'ibm-not-wf-P32-ibm32n01.xml': 'XMLDECL_NO_SPACE_BETWEEN_PARAMS',
   'ibm-not-wf-P32-ibm32n02.xml': 'XMLDECL_NO_CLOSE',
   'ibm-not-wf-P32-ibm32n03.xml': 'XMLDECL_PARAM_INVALID_CASE',
   'ibm-not-wf-P32-ibm32n04.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm-not-wf-P32-ibm32n05.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm-not-wf-P32-ibm32n06.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm-not-wf-P32-ibm32n07.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm-not-wf-P32-ibm32n08.xml': 'XMLDECL_NO_CLOSE',
   'ibm-not-wf-P32-ibm32n09.xml': 'REFERENCE_INVALID_STANDALONE',

   // §3.0 Element
   'ibm-not-wf-P39-ibm39n01.xml': 'DOC_END_EARLY',
   'ibm-not-wf-P39-ibm39n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CHARDATA_PTOKEN/,
   },
   'ibm-not-wf-P39-ibm39n03.xml': 'DOC_END_EARLY',
   'ibm-not-wf-P39-ibm39n04.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_END_PTOKEN/,
   },
   'ibm-not-wf-P39-ibm39n05.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_END_PTOKEN/,
   },
   'ibm-not-wf-P39-ibm39n06.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CHARDATA_PTOKEN/,
   },

   // §3.1 Attributes of start tags
   'ibm-not-wf-P40-ibm40n01.xml': 'ELEMENT_NAME_INVALID',
   'ibm-not-wf-P40-ibm40n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm-not-wf-P40-ibm40n03.xml': 'ELEMENT_NAME_INVALID',
   'ibm-not-wf-P40-ibm40n04.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /UNKNOWNDECL/,
   },
   'ibm-not-wf-P40-ibm40n05.xml': 'ATTRIBUTE_DUPLICATE_NAME',

   // §3.1 Attributes of start tags
   'ibm-not-wf-P41-ibm41n01.xml': 'ELEMENT_NO_CLOSE',
   'ibm-not-wf-P41-ibm41n02.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm-not-wf-P41-ibm41n03.xml': 'LITERAL_NO_OPEN_QUOTE',
   'ibm-not-wf-P41-ibm41n04.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm-not-wf-P41-ibm41n05.xml': 'ATTRIBUTE_NO_EQUAL',
   'ibm-not-wf-P41-ibm41n06.xml': 'ELEMENT_NO_CLOSE',
   'ibm-not-wf-P41-ibm41n07.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm-not-wf-P41-ibm41n08.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm-not-wf-P41-ibm41n09.xml': 'ELEMENT_NO_CLOSE',
   'ibm-not-wf-P41-ibm41n10.xml': 'ATTRIBUTE_INVALID_REFERENCE',
   'ibm-not-wf-P41-ibm41n11.xml': 'ATTRIBUTE_INVALID_REFERENCE',
   'ibm-not-wf-P41-ibm41n12.xml': 'REFERENCE_UNPARSED_NO_USE',
   'ibm-not-wf-P41-ibm41n13.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm-not-wf-P41-ibm41n14.xml': 'ATTRIBUTE_INVALID_VALUE',

   // §3.1 Attributes of start tags
   'ibm-not-wf-P42-ibm42n01.xml': 'ELEMENT_NO_NAME',
   'ibm-not-wf-P42-ibm42n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm-not-wf-P42-ibm42n03.xml': 'DOC_END_EARLY',
   'ibm-not-wf-P42-ibm42n04.xml': 'ELEMENT_XTRA_LEADING_SPACE',
   'ibm-not-wf-P42-ibm42n05.xml': 'ELEMENT_NO_CLOSE',

   // §3.1 content
   'ibm-not-wf-P43-ibm43n01.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /NOTATION_DECLARATION_PTOKEN/,
   },
   'ibm-not-wf-P43-ibm43n02.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /ELEMENT_DECLARATION_PTOKEN/,
   },
   'ibm-not-wf-P43-ibm43n04.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /GENERAL_ENTITY_DECLARATION_PTOKEN/,
   },
   'ibm-not-wf-P43-ibm43n05.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /ATTLIST_DECLARATION_PTOKEN/,
   },

   // §3.1 EmptyElemTag
   'ibm-not-wf-P44-ibm44n01.xml': 'ELEMENT_XTRA_LEADING_SPACE',
   'ibm-not-wf-P44-ibm44n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm-not-wf-P44-ibm44n03.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm-not-wf-P44-ibm44n04.xml': 'ATTRIBUTE_DUPLICATE_NAME',

   // §3.2.0 elementdecl
   'ibm-not-wf-P45-ibm45n01.xml': 'ELEMENTDECL_NO_NAME',
   'ibm-not-wf-P45-ibm45n02.xml': 'ELEMENTDECL_NAME_NO_SPACE',
   'ibm-not-wf-P45-ibm45n03.xml': 'ELEMENTDECL_NO_SPEC',
   'ibm-not-wf-P45-ibm45n04.xml': 'ELEMENTDECL_NAME_NO_SPACE',
   'ibm-not-wf-P45-ibm45n05.xml': 'ELEMENTDECL_NO_NAME',
   'ibm-not-wf-P45-ibm45n06.xml': 'ELEMENTDECL_NO_NAME',
   'ibm-not-wf-P45-ibm45n07.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /ELEMENT_START_PTOKEN/,
   },
   'ibm-not-wf-P45-ibm45n08.xml': 'ELEMENTDECL_DECLTYPE_INVALID',
   'ibm-not-wf-P45-ibm45n09.xml': 'ELEMENTDECL_DECLTYPE_INVALID',

   // §3.2.0 contentspec
   'ibm-not-wf-P46-ibm46n01.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm-not-wf-P46-ibm46n02.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm-not-wf-P46-ibm46n03.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm-not-wf-P46-ibm46n04.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm-not-wf-P46-ibm46n05.xml': 'ELEMENTDECL_SPEC_UNKNOWN',

   // §3.2.1 children
   'ibm-not-wf-P47-ibm47n01.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm-not-wf-P47-ibm47n02.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm-not-wf-P47-ibm47n03.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm-not-wf-P47-ibm47n04.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm-not-wf-P47-ibm47n05.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm-not-wf-P47-ibm47n06.xml': 'ELEMENTDECL_NO_CLOSE',

   // §3.2.1 cp
   'ibm-not-wf-P48-ibm48n01.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P48-ibm48n02.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P48-ibm48n03.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P48-ibm48n04.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P48-ibm48n05.xml': 'CONTENTMODEL_NO_DELIM',
   'ibm-not-wf-P48-ibm48n06.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P48-ibm48n07.xml': 'CONTENTMODEL_NAME_INVALID',

   // §3.2.1 choice
   'ibm-not-wf-P49-ibm49n01.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P49-ibm49n02.xml': 'CONTENTMODEL_EXTRA_DELIM',
   'ibm-not-wf-P49-ibm49n03.xml': 'CONTENTMODEL_NAME_INVALID',
   'ibm-not-wf-P49-ibm49n04.xml': 'CONTENTMODEL_NO_DELIM',
   'ibm-not-wf-P49-ibm49n05.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P49-ibm49n06.xml': 'CONTENTMODEL_NAME_EXTRA_SPACE',

   // §3.2.1 seq
   'ibm-not-wf-P50-ibm50n01.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P50-ibm50n02.xml': 'CONTENTMODEL_EXTRA_DELIM',
   'ibm-not-wf-P50-ibm50n03.xml': 'CONTENTMODEL_BAD_SEQUENCE', // ok
   'ibm-not-wf-P50-ibm50n04.xml': 'CONTENTMODEL_NO_DELIM',
   'ibm-not-wf-P50-ibm50n05.xml': 'CONTENTMODEL_NO_NAME',
   'ibm-not-wf-P50-ibm50n06.xml': 'CONTENTMODEL_NO_DELIM',
   'ibm-not-wf-P50-ibm50n07.xml': 'CONTENTMODEL_NAME_INVALID',

   // §3.2.2 Mixed
   'ibm-not-wf-P51-ibm51n01.xml': 'CONTENTMODEL_PCDATA_INVALID_CASE',
   'ibm-not-wf-P51-ibm51n02.xml': 'CONTENTMODEL_NAME_INVALID',
   'ibm-not-wf-P51-ibm51n03.xml': 'CONTENTMODEL_NO_DELIM',
   'ibm-not-wf-P51-ibm51n04.xml': 'CONTENTMODEL_NAME_INVALID',
   'ibm-not-wf-P51-ibm51n05.xml': 'CONTENTMODEL_MIXED_INVALID_REPEAT',
   'ibm-not-wf-P51-ibm51n06.xml': 'CONTENTMODEL_NO_DELIM',
   'ibm-not-wf-P51-ibm51n07.xml': 'CONTENTMODEL_NO_CLOSE',

   // §3.3.0 AttlistDecl
   'ibm-not-wf-P52-ibm52n01.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',
   'ibm-not-wf-P52-ibm52n02.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /UNKNOWNDECL/,
   },
   'ibm-not-wf-P52-ibm52n03.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',
   'ibm-not-wf-P52-ibm52n04.xml': 'ATTLISTDECL_DECLTYPE_INVALID',
   'ibm-not-wf-P52-ibm52n05.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm-not-wf-P52-ibm52n06.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /ELEMENT_START_PTOKEN/,
   },

   // §3.3.0 AttDef
   'ibm-not-wf-P53-ibm53n01.xml': 'ATTLISTDECL_ATTR_NO_VALUE',
   'ibm-not-wf-P53-ibm53n02.xml': 'ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE',
   'ibm-not-wf-P53-ibm53n03.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',
   'ibm-not-wf-P53-ibm53n04.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm-not-wf-P53-ibm53n05.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm-not-wf-P53-ibm53n06.xml': 'ATTLISTDECL_ATTR_DEFAULT_INVALID',
   'ibm-not-wf-P53-ibm53n07.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm-not-wf-P53-ibm53n08.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',

   // Really start calling out strange messages

   // §3.3.1 AttType
   'ibm-not-wf-P54-ibm54n01.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',
   'ibm-not-wf-P54-ibm54n02.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',

   // §3.3.1 StringType
   'ibm-not-wf-P55-ibm55n01.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P55-ibm55n02.xml': 'ATTLISTDECL_ATTR_DEFAULT_UNKNOWN',
   'ibm-not-wf-P55-ibm55n03.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',

   // §3.3.1 TokenizedType
   'ibm-not-wf-P56-ibm56n01.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P56-ibm56n02.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P56-ibm56n03.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P56-ibm56n04.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P56-ibm56n05.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P56-ibm56n06.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P56-ibm56n07.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',

   // §3.3.1 EnumeratedType
   'ibm-not-wf-P57-ibm57n01.xml': 'ATTLISTDECL_ATTR_NO_VALUE', // murky

   // §3.3.1 NotationType
   'ibm-not-wf-P58-ibm58n01.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm-not-wf-P58-ibm58n02.xml': 'ATTLISTDECL_ATTR_NO_NOTATION',
   'ibm-not-wf-P58-ibm58n03.xml': 'WORDLIST_NO_WORDS',
   'ibm-not-wf-P58-ibm58n04.xml': 'WORDLIST_NO_CONNECTOR',
   'ibm-not-wf-P58-ibm58n05.xml': 'ATTLISTDECL_ATTR_NO_VALUE', // ?
   'ibm-not-wf-P58-ibm58n06.xml': 'WORDLIST_INVALID_NAME',
   'ibm-not-wf-P58-ibm58n07.xml': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE',
   'ibm-not-wf-P58-ibm58n08.xml': 'WORDLIST_INVALID_NAME',

   // §3.3.1 Enumeration
   'ibm-not-wf-P59-ibm59n01.xml': 'WORDLIST_NO_WORDS',
   'ibm-not-wf-P59-ibm59n02.xml': 'WORDLIST_NO_CONNECTOR',
   'ibm-not-wf-P59-ibm59n03.xml': 'WORDLIST_INVALID_NMTOKEN', // ?
   'ibm-not-wf-P59-ibm59n04.xml': 'WORDLIST_INVALID_NMTOKEN',
   'ibm-not-wf-P59-ibm59n05.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',
   'ibm-not-wf-P59-ibm59n06.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',

   // §3.3.1 DefaultDecl
   'ibm-not-wf-P60-ibm60n01.xml': 'ATTLISTDECL_ATTR_DEFAULT_INVALID', // great
   'ibm-not-wf-P60-ibm60n02.xml': 'ATTLISTDECL_ATTR_DEFAULT_INVALID', // great
   'ibm-not-wf-P60-ibm60n03.xml': 'ATTLISTDECL_ATTR_NO_VALUE', // ok
   'ibm-not-wf-P60-ibm60n04.xml': 'ATTLISTDECL_ATTR_FIXED_NO_VALUE', // great
   'ibm-not-wf-P60-ibm60n05.xml': 'ATTLISTDECL_ATTR_FIXED_NO_SPACE', // great
   'ibm-not-wf-P60-ibm60n06.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm-not-wf-P60-ibm60n07.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm-not-wf-P60-ibm60n08.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'simpleltinentval.xml': 'ATTRIBUTE_INVALID_VALUE',

   // §3.4.0 conditionalSect
   'ibm-not-wf-P61-ibm61n01.xml': 'CONDITIONAL_UNKNOWN',

   // §3.4.0 conditionalSect
   'ibm-not-wf-P62-ibm62n01.xml': 'CONDITIONAL_INVALID_CASE', // great
   'ibm-not-wf-P62-ibm62n02.xml': 'CONDITIONAL_UNKNOWN', // good
   'ibm-not-wf-P62-ibm62n03.xml': 'PI_NO_CLOSE', // great
   'ibm-not-wf-P62-ibm62n04.xml': 'CONDITIONAL_UNKNOWN', // great
   'ibm-not-wf-P62-ibm62n05.xml': 'CONDITIONAL_NO_SECOND_BRACKET', // great
   'ibm-not-wf-P62-ibm62n06.xml': 'CONDITIONAL_UNKNOWN', // ok
   'ibm-not-wf-P62-ibm62n07.xml': 'CONDITIONAL_NO_CLOSE',
   'ibm-not-wf-P62-ibm62n08.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /CHARDATA_PTOKEN/,
   },

   // §3.4.0 ignoreSect
   'ibm-not-wf-P63-ibm63n01.xml': 'CONDITIONAL_INVALID_CASE', // great
   'ibm-not-wf-P63-ibm63n02.xml': 'CONDITIONAL_UNKNOWN', // good
   'ibm-not-wf-P63-ibm63n03.xml': 'PI_NO_CLOSE', // good
   'ibm-not-wf-P63-ibm63n04.xml': 'CONDITIONAL_UNKNOWN', // good
   'ibm-not-wf-P63-ibm63n05.xml': 'CONDITIONAL_NO_SECOND_BRACKET', // great
   'ibm-not-wf-P63-ibm63n06.xml': 'CONDITIONAL_UNKNOWN', // ok
   'ibm-not-wf-P63-ibm63n07.xml': 'CONDITIONAL_NO_CLOSE', // great

   // §3.4.0 ignoreSectContents
   'ibm-not-wf-P64-ibm64n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /CHARDATA_PTOKEN/,
   },
   'ibm-not-wf-P64-ibm64n02.xml': 'CONDITIONAL_NO_CLOSE', // great
   'ibm-not-wf-P64-ibm64n03.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /CHARDATA_PTOKEN/,
   },

   // §3.4.0 Ignore
   'ibm-not-wf-P65-ibm65n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // good
      message: /CHARDATA_PTOKEN/,
   },
   'ibm-not-wf-P65-ibm65n02.xml': 'CONDITIONAL_NO_CLOSE', // great

   // §4.1.0 CharRef
   'ibm-not-wf-P66-ibm66n01.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm-not-wf-P66-ibm66n02.xml': 'CHARREF_NO_CLOSE', // great
   'ibm-not-wf-P66-ibm66n03.xml': 'REFERENCE_INVALID_SYNTAX', // mech - Tests CharRef with an illegal character referred to. The "49" is used as the referred character in the CharRef in the EntityDecl in the DTD.
   'ibm-not-wf-P66-ibm66n04.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm-not-wf-P66-ibm66n05.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm-not-wf-P66-ibm66n06.xml': 'CHARREF_INVALID_CHAR', // great
   'ibm-not-wf-P66-ibm66n07.xml': 'CHARREF_NO_CLOSE', // great
   'ibm-not-wf-P66-ibm66n08.xml': 'CHARREF_NO_CLOSE', // good
   'ibm-not-wf-P66-ibm66n09.xml': 'CHARREF_NO_CLOSE', // great
   'ibm-not-wf-P66-ibm66n10.xml': 'CHARREF_NO_CLOSE', // good
   'ibm-not-wf-P66-ibm66n11.xml': 'CHARREF_XTRA_POST_DIGITS_SPACE', // great
   'ibm-not-wf-P66-ibm66n12.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm-not-wf-P66-ibm66n13.xml': 'CHARREF_INVALID_CHAR', // great
   'ibm-not-wf-P66-ibm66n14.xml': 'CHARREF_INVALID_CHAR', // great
   'ibm-not-wf-P66-ibm66n15.xml': 'CHARREF_INVALID_CHAR', // great

   // great - Seeing the message immediately identifies the problem
   // ok - can kinda identify the problem
   // bad - with work can identify the problem

   // §4.1.0 EntityRef
   'ibm-not-wf-P68-ibm68n01.xml': 'REFERENCE_NO_NAME', // great
   'ibm-not-wf-P68-ibm68n02.xml': 'REFERENCE_NO_SEMICOLON', // great
   'ibm-not-wf-P68-ibm68n03.xml': 'REFERENCE_XTRA_SPACE', // great
   'ibm-not-wf-P68-ibm68n04.xml': 'REFERENCE_NO_DECLARATION', // ok  (case difference)
   'ibm-not-wf-P68-ibm68n05.xml': 'REFERENCE_NO_DECLARATION', // great
   'ibm-not-wf-P68-ibm68n06.xml': 'REFERENCE_INVALID_STANDALONE',
   'ibm-not-wf-P68-ibm68n07.xml': 'REFERENCE_NO_DECLARATION', // ok - no declaration doesn't say before declared
   'ibm-not-wf-P68-ibm68n08.xml': 'REFERENCE_UNPARSED_NO_USE', // great
   'ibm-not-wf-P68-ibm68n09.xml': 'REFERENCE_INVALID_RECURSION', // great
   'ibm-not-wf-P68-ibm68n10.xml': 'REFERENCE_INVALID_RECURSION', // great

   // §4.1.0 PEReference
   'ibm-not-wf-P69-ibm69n01.xml': 'PEREF_NO_NAME', // great
   'ibm-not-wf-P69-ibm69n02.xml': 'PEREF_XTRA_TRAILING_SPACE',
   'ibm-not-wf-P69-ibm69n03.xml': 'PEREF_XTRA_TRAILING_SPACE',
   'ibm-not-wf-P69-ibm69n04.xml': 'PEREF_XTRA_SPACE',
   'ibm-not-wf-P69-ibm69n05.xml': 'REFERENCE_NO_DECLARATION', // ok - forward declaration
   'ibm-not-wf-P69-ibm69n06.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm-not-wf-P69-ibm69n07.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',

   // §4.2.0 EntityDecl
   'ibm-not-wf-P70-ibm70n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /ELEMENT_EMPTY_PTOKEN/,
   },

   // §4.2.0 GEDecl
   'ibm-not-wf-P71-ibm70n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // Tests putting an element reference in the DTS
      message: /ELEMENT_EMPTY_PTOKEN/,
   },
   'ibm-not-wf-P71-ibm71n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok - better to notice a bad entity declaration
      message: /UNKNOWNDECL/,
   },
   'ibm-not-wf-P71-ibm71n02.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great
   'ibm-not-wf-P71-ibm71n03.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // ok - better to point out that there is no value
   'ibm-not-wf-P71-ibm71n04.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P71-ibm71n05.xml': 'ENTITYDECL_NO_NAME', // ok - maybe better to notice that it looks like a value?
   'ibm-not-wf-P71-ibm71n06.xml': 'ENTITYDECL_DECLTYPE_INVALID', // great
   'ibm-not-wf-P71-ibm71n07.xml': 'ENTITYDECL_NO_CLOSE', // great
   'ibm-not-wf-P71-ibm71n08.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok - better to recognize that this is a malfomed decl
      message: /ELEMENT_START_PTOKEN/,
   },

   // §4.2.0 PEDecl
   'ibm-not-wf-P72-ibm72n01.xml': 'ENTITYDECL_DECLTYPE_NO_SPACE_AFTER', // great
   'ibm-not-wf-P72-ibm72n02.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P72-ibm72n03.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great
   'ibm-not-wf-P72-ibm72n04.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // ok. better state no value
   'ibm-not-wf-P72-ibm72n05.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P72-ibm72n06.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P72-ibm72n07.xml': 'ENTITYDECL_DECLTYPE_INVALID', // great
   'ibm-not-wf-P72-ibm72n08.xml': 'ENTITYDECL_NO_CLOSE', // great
   'ibm-not-wf-P72-ibm72n09.xml': 'ENTITYDECL_NO_CLOSE', // great (note that the input has other serrors

   // §4.2.0 EntityDef
   'ibm-not-wf-P73-ibm73n01.xml': 'LITERAL_NO_OPEN_QUOTE', // ok. better to note ndata not there
   'ibm-not-wf-P73-ibm73n03.xml': 'LITERAL_NO_OPEN_QUOTE', // ok. better to note ndata not there

   // §4.2.0 PEDef
   'ibm-not-wf-P74-ibm74n01.xml': 'ENTITYDECL_NO_CLOSE', // ok. idealy would be shouting that ndata isn't allowed here

   // §4.2.2 ExternalId
   'ibm-not-wf-P75-ibm75n01.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm-not-wf-P75-ibm75n02.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm-not-wf-P75-ibm75n03.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm-not-wf-P75-ibm75n04.xml': 'DOCTYPE_NO_CLOSE', // ok.
   'ibm-not-wf-P75-ibm75n05.xml': 'EXTERNALID_EXTERNALTYPE_NO_SPACE', // great
   'ibm-not-wf-P75-ibm75n06.xml': 'EXTERNALID_MISSING_SYSTEM_VALUE', // ok
   'ibm-not-wf-P75-ibm75n07.xml': 'EXTERNALID_SYSTEM_NO_LEADING_SPACE', // great
   'ibm-not-wf-P75-ibm75n08.xml': 'DOCTYPE_NO_CLOSE', // ok a lack of PUBLIC would be better
   'ibm-not-wf-P75-ibm75n09.xml': 'EXTERNALID_EXTERNALTYPE_NO_SPACE', // great
   'ibm-not-wf-P75-ibm75n10.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS', // great
   'ibm-not-wf-P75-ibm75n11.xml': 'EXTERNALID_INVALID_CASE', // great (though, test would like to complain about no system value
   'ibm-not-wf-P75-ibm75n12.xml': 'ENTITYDECL_NO_CLOSE', // ok. more than SYSTEM is misplace
   'ibm-not-wf-P75-ibm75n13.xml': 'DOCTYPE_NO_CLOSE', // ok. more than PUBLIC is missing

   // §4.2.2 ExternalId
   'ibm-not-wf-P76-ibm76n01.xml': 'ENTITYDECL_NDATA_INVALID_CASE', // great
   'ibm-not-wf-P76-ibm76n02.xml': 'ENTITYDECL_NDATA_INVALID_CASE', // great
   'ibm-not-wf-P76-ibm76n03.xml': 'ENTITYDECL_EXTERNALID_NO_SPACE', // great
   'ibm-not-wf-P76-ibm76n04.xml': 'ENTITYDECL_NO_CLOSE', // ok - better to notice that this is missing ndata
   'ibm-not-wf-P76-ibm76n05.xml': 'ENTITYDECL_NDATA_NO_NAME', // great
   'ibm-not-wf-P76-ibm76n06.xml': 'ENTITYDECL_NO_CLOSE', // ok - again would be better to note something isnt good
   'ibm-not-wf-P76-ibm76n07.xml': 'ENTITYDECL_NO_CLOSE', // ok - "

   // §4.3.1 textdecl
   'ibm-not-wf-P77-ibm77n01.xml': 'TEXTDECL_VERSION_INVALID_ORDER', // great
   'ibm-not-wf-P77-ibm77n02.xml': 'TEXTDECL_TARGET_INVALID_CASE', // great
   'ibm-not-wf-P77-ibm77n03.xml': 'TEXTDECL_NO_CLOSE', // great
   'ibm-not-wf-P77-ibm77n04.xml': 'TEXTDECL_NO_CLOSE', // great

   // §4.3.2 extParsedEnt
   'ibm-not-wf-P78-ibm78n01.xml': {
      id: 'CONTENT_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },
   'ibm-not-wf-P78-ibm78n02.xml': {
      id: 'CONTENT_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },

   // §4.3.2 extPE
   'ibm-not-wf-P79-ibm79n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },
   'ibm-not-wf-P79-ibm79n02.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },

   // §4.3.3 EncodingDecl
   'ibm-not-wf-P80-ibm80n01.xml': 'XMLDECL_NO_SPACE_BETWEEN_PARAMS', // great
   'ibm-not-wf-P80-ibm80n02.xml': 'XMLDECL_ENCODING_NO_EQUAL', // great
   'ibm-not-wf-P80-ibm80n03.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P80-ibm80n04.xml': 'XMLDECL_NO_CLOSE', // ok
   'ibm-not-wf-P80-ibm80n05.xml': 'XMLDECL_NO_CLOSE', // ok
   'ibm-not-wf-P80-ibm80n06.xml': 'XMLDECL_PARAM_INVALID_CASE', // great

   // §4.3.3 EncName
   'ibm-not-wf-P81-ibm81n01.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n02.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n03.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n04.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n05.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n06.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n07.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n08.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm-not-wf-P81-ibm81n09.xml': 'XMLDECL_ENCODING_INVALID', // great

   // §4.7.0 NotationDecl
   'ibm-not-wf-P82-ibm82n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /UNKNOWNDECL/,
   },
   'ibm-not-wf-P82-ibm82n02.xml': 'NOTATIONDECL_NO_EXTERNALID', // ok
   'ibm-not-wf-P82-ibm82n03.xml': 'NOTATIONDECL_NO_EXTERNALID', // great
   'ibm-not-wf-P82-ibm82n04.xml': 'NOTATIONDECL_NO_EXTERNALID', // great
   'ibm-not-wf-P82-ibm82n05.xml': 'NOTATIONDECL_DECLTYPE_INVALID', // great
   'ibm-not-wf-P82-ibm82n06.xml': 'NOTATIONDECL_NO_CLOSE', // great
   'ibm-not-wf-P82-ibm82n07.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /ELEMENT_START_PTOKEN/,
   },
   'ibm-not-wf-P82-ibm82n08.xml': 'NOTATIONDECL_NO_CLOSE', // great

   // §4.7.0 PublicID
   'ibm-not-wf-P83-ibm83n01.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm-not-wf-P83-ibm83n02.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm-not-wf-P83-ibm83n03.xml': 'NOTATIONDECL_NO_EXTERNALID', // ok
   'ibm-not-wf-P83-ibm83n04.xml': 'EXTERNALID_EXTERNALTYPE_NO_SPACE', // great
   'ibm-not-wf-P83-ibm83n05.xml': 'LITERAL_NO_OPEN_QUOTE', // great
   'ibm-not-wf-P83-ibm83n06.xml': 'NOTATIONDECL_NO_EXTERNALID', // great

   // §B.0.0 BaseChar
   'ibm-not-wf-P85-ibm85n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n13.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n14.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n15.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n16.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n17.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n18.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n19.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n20.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n21.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n22.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n23.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n24.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n25.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n26.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n27.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n28.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n29.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n30.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n31.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n32.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n33.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n34.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n35.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n36.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n37.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n38.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n39.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n40.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n41.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n42.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n43.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n44.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n45.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n46.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n47.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n48.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n49.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n50.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n51.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n52.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n53.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n54.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n55.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n56.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n57.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n58.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n59.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n60.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n61.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n62.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n63.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n64.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n65.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n66.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n67.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n68.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n69.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n70.xml': 'PI_TARGET_NAME_INVALID',

   'ibm-not-wf-P85-ibm85n71.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n72.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n73.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n74.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n75.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n76.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n77.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n78.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n79.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n80.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n81.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n82.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n83.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n84.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n85.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n86.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n87.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n88.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n89.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n90.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n91.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n92.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n93.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n94.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n95.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n96.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n97.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n98.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n99.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n100.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n101.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n102.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n103.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n104.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n105.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n106.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n107.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n108.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n109.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n110.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n111.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n112.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n113.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n114.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n115.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n116.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n117.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n118.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n119.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n120.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n121.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n122.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n123.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n124.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n125.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n126.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n127.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n128.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n129.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n130.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n131.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n132.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n133.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n134.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n135.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n136.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n137.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n138.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n139.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n140.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n141.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n142.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n143.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n144.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n145.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n146.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n147.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n148.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n149.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n150.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n151.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n152.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n153.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n154.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n155.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n156.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n157.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n158.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n159.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n160.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n161.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n162.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n163.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n164.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n165.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n166.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n167.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n168.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n169.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n170.xml': 'PI_TARGET_NAME_INVALID',

   'ibm-not-wf-P85-ibm85n171.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n172.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n173.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n174.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n175.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n176.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n177.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n178.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n179.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n180.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n181.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n182.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n183.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n184.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n185.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n186.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n187.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n188.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n189.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n190.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n191.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n192.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n193.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n194.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n195.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n196.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n197.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P85-ibm85n198.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 Ideographic
   'ibm-not-wf-P86-ibm86n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P86-ibm86n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P86-ibm86n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P86-ibm86n04.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 CombiningChar
   'ibm-not-wf-P87-ibm87n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n13.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n14.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n15.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n16.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n17.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n18.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n19.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n20.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n21.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n22.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n23.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n24.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n25.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n26.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n27.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n28.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n29.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n30.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n31.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n32.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n33.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n34.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n35.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n36.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n37.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n38.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n39.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n40.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n41.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n42.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n43.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n44.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n45.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n46.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n47.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n48.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n49.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n50.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n51.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n52.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n53.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n54.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n55.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n56.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n57.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n58.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n59.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n60.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n61.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n62.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n63.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n64.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n66.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n67.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n68.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n69.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n70.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n71.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n72.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n73.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n74.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n75.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n76.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n77.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n78.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n79.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n80.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n81.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n82.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n83.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n84.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P87-ibm87n85.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 Digit
   'ibm-not-wf-P88-ibm88n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n13.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n14.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n15.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P88-ibm88n16.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 Extender
   'ibm-not-wf-P89-ibm89n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-not-wf-P89-ibm89n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm-1-1-not-wf-P02-ibm02n01.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n02.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n03.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n04.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n05.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n06.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n07.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n08.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n09.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n10.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n11.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n12.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n14.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n15.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n16.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n17.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n18.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n19.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n20.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n21.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n22.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n23.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n24.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n25.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n26.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n27.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n28.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n29.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n30.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n31.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n32.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n33.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n34.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n35.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n36.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n37.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n38.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n39.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n40.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n41.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n42.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n43.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n44.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n45.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n46.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n47.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n48.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n49.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n50.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n51.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n52.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n53.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n54.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n55.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n56.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n57.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n58.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n59.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n60.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n61.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n62.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n63.xml': 'CHARDATA_INVALID_CHAR',
   'ibm-1-1-not-wf-P02-ibm02n64.xml': 'CHARDATA_INVALID_CHAR', // This test contains embeded control characters present in an external entity.
   'ibm-1-1-not-wf-P02-ibm02n65.xml': 'CHARDATA_INVALID_CHAR', // This test contains embeded control characters present in an external entity.
   'ibm-1-1-not-wf-P02-ibm02n66.xml': 'CHARDATA_INVALID_CHAR', // This test contains embeded control characters present in an external entity.
   'ibm-1-1-not-wf-P02-ibm02n67.xml': 'CHARDATA_INVALID_CHAR', // ok - This test contains embeded character 0xD800. (Invalid UTF8 sequence)
   'ibm-1-1-not-wf-P02-ibm02n68.xml': 'CHARDATA_INVALID_CHAR', // ok - This test contains embeded character 0xFFFE.
   'ibm-1-1-not-wf-P02-ibm02n69.xml': 'CHARDATA_INVALID_CHAR', // ok - This test contains embeded character 0xFFFF.
   'ibm-1-1-not-wf-P02-ibm02n70.xml': 'CHARREF_INVALID_CHAR', // This test contains a reference to character 0xFFFE.
   'ibm-1-1-not-wf-P02-ibm02n71.xml': 'CHARREF_INVALID_CHAR', // This test contains a reference to character 0xFFFF.
   'ibm-1-1-not-wf-P04-ibm04n01.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n03.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n04.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n05.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n06.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n07.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n08.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n09.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n10.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n11.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n12.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n13.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n14.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n15.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n16.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n17.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n18.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n19.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n20.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n21.xml': 'DOCTYPE_NAME_INVALID', // good - Tests an element with an illegal NameStartChar: #0xD800
   'ibm-1-1-not-wf-P04-ibm04n22.xml': 'DOCTYPE_NAME_INVALID', // good - Tests an element with an illegal NameStartChar: #0xD801
   'ibm-1-1-not-wf-P04-ibm04n23.xml': 'DOCTYPE_NAME_INVALID', // good - Tests an element with an illegal NameStartChar: #0xDAFF
   'ibm-1-1-not-wf-P04-ibm04n24.xml': 'DOCTYPE_NAME_INVALID', // good - Tests an element with an illegal NameStartChar: #0xDFFF
   'ibm-1-1-not-wf-P04-ibm04n25.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n26.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n27.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n28.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an01.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an02.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an03.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an04.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an05.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an06.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an07.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an08.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an09.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an10.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an11.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an12.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an13.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an14.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an15.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an16.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an17.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an18.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an19.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an20.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an21.xml': 'DOCTYPE_NAME_INVALID', // good -  Tests an element with an illegal NameChar: #0xD800
   'ibm-1-1-not-wf-P04a-ibm04an22.xml': 'DOCTYPE_NAME_INVALID', // good -  Tests an element with an illegal NameChar: #0xD801
   'ibm-1-1-not-wf-P04a-ibm04an23.xml': 'DOCTYPE_NAME_INVALID', // good -  Tests an element with an illegal NameChar: #0xDAFF
   'ibm-1-1-not-wf-P04a-ibm04an24.xml': 'DOCTYPE_NAME_INVALID', // good -  Tests an element with an illegal NameChar: #0xDFFF
   'ibm-1-1-not-wf-P04a-ibm04an25.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an26.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an27.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an28.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P05-ibm05n01.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P05-ibm05n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P05-ibm05n03.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P05-ibm05n04.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P05-ibm05n05.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P05-ibm05n06.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P77-ibm77n01.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and that of the external dtd 1.0. The external dtd contains the invalid XML1.1 but valid XML 1.0 character #x7F.
   'ibm-1-1-not-wf-P77-ibm77n02.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and that of the external dtd 1.0. The external dtd contains a comment with the invalid XML1.1 but valid XML 1.0 character #x80.
   'ibm-1-1-not-wf-P77-ibm77n03.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and that of the external dtd 1.0. The external dtd contains a PI with the invalid XML1.1 but valid XML 1.0 character #x9F.
   'ibm-1-1-not-wf-P77-ibm77n04.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and that of the external entity 1.0. The external entity the contains invalid XML1.1 but valid XML 1.0 character #x89.
   'ibm-1-1-not-wf-P77-ibm77n05.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and that of the external entity 1.0. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x94.
   'ibm-1-1-not-wf-P77-ibm77n06.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and that of the external entity 1.0. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x9F.
   'ibm-1-1-not-wf-P77-ibm77n07.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x7F.
   'ibm-1-1-not-wf-P77-ibm77n08.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a VersionNum in the textDecl. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x9B.
   'ibm-1-1-not-wf-P77-ibm77n09.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML1.1 but valid XML 1.0 character #x8D.
   'ibm-1-1-not-wf-P77-ibm77n10.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a VersionNum in the textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x84.
   'ibm-1-1-not-wf-P77-ibm77n11.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x88.
   'ibm-1-1-not-wf-P77-ibm77n12.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the document entity is 1.1 and the external dtd does not contain a textDecl. The external entity contains the invalid XML 1.1 but valid XML 1.0 character #x8E.
   'ibm-1-1-not-wf-P77-ibm77n13.xml': 'TEXTDECL_VERSION_INVALD', // The VersionNum of the primary document entity is 1.0 and that of the external 		dtd is 1.0. The external dtd contains an external entity whose VersionNum is 1.1.
   'ibm-1-1-not-wf-P77-ibm77n14.xml': 'ELEMENTDECL_NAME_INVALID', // The VersionNum of the primary document entity is 1.1 and that of the external 		dtd is 1.0. The external dtd contains an element declaration with an invalid 		XML 1.1 and 1.0 name.
   'ibm-1-1-not-wf-P77-ibm77n15.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the primary document entity is 1.1 and testDecl of the external 		dtd is absent. The external dtd contains an external entity whose VersionNum is 		1.1 containing a valid XML1.0 but an invalid XML 1.1 character #x7F.
   'ibm-1-1-not-wf-P77-ibm77n16.xml': 'ELEMENT_NAME_INVALID', // The VersionNum of the primary document entity is 1.0 and VersioNum of the external 		entity is absent. The replacement text of the entity contains an element followed 		by the valid XML 1.1 of line character NEL #x85 in its empty elem tag.
   'ibm-1-1-not-wf-P77-ibm77n17.xml': 'TEXTDECL_NO_CLOSE', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 enf of line character NEL #x85.
   'ibm-1-1-not-wf-P77-ibm77n18.xml': 'TEXTDECL_NO_CLOSE', // The VersionNum of the primary document entity is absent and that of the external 		entity is 1.0. The textDecl in the external entity contains an invalid XML1.0 		but valid XML 1.1 of line character Unicode line separator #x2028.
   'ibm-1-1-not-wf-P77-ibm77n19.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the primary document entity is 1.1 and that of the external 		dtd is absent. The external dtd contains an external entity whose VersionNum is 		absent and it contains a valid XML 1.0 but an invalid XML 1.1 character #x94.
   'ibm-1-1-not-wf-P77-ibm77n20.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the primary document entity is 1.1 and that of the external 		dtd is 1.1. The external dtd contains an external entity whose VersionNum is 		absent and it contains a valid XML 1.0 but an invalid XML 1.1 character #x8F.
   'ibm-1-1-not-wf-P77-ibm77n21.xml': 'CHARDATA_INVALID_CHAR', // The VersionNum of the primary document entity is 1.1 and the texlDecl of the 		external dtd is absent. The external dtd contains a reference to an external 		parameter entity whose VersionNum is absent from the textDecl and it contains 		an invalid XML 1.1 character #x8F.
   'rmt-e2e-27': 'error', // Contains an irregular UTF-8 sequence (i.e. a surrogate pair)
   'rmt-e2e-38': 'TEXTDECL_VERSION_INVALD', // XML 1.0 document refers to 1.1 entity
   'rmt-e2e-61': 'error', // (From John Cowan) An encoding declaration in ASCII specifying an encoding that is not compatible with ASCII (so the document is not in its declared encoding). It should generate a fatal error.
   'rmt-001': 'TEXTDECL_VERSION_INVALD', // External subset has later version number
   'rmt-002': 'TEXTDECL_VERSION_INVALD', // External PE has later version number
   'rmt-003': 'TEXTDECL_VERSION_INVALD', // External general entity has later version number
   'rmt-004': 'TEXTDECL_VERSION_INVALD', // External general entity has later version number (no decl means 1.0)
   'rmt-005': 'TEXTDECL_VERSION_INVALD', // Indirect external general entity has later version number
   'rmt-011': 'CHARDATA_INVALID_CHAR', // Contains a C1 control, legal in XML 1.0, illegal in XML 1.1
   'rmt-013': 'CHARDATA_INVALID_CHAR', // Contains a DEL, legal in XML 1.0, illegal in XML 1.1
   'rmt-014': 'ELEMENT_NAME_INVALID', // Has a "long s" in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
   'rmt-016': 'ELEMENT_NAME_INVALID', // Has a Byzantine Musical Symbol Kratimata in a name, legal in XML 1.1, illegal in XML 1.0 thru 4th edition
   'rmt-019': 'ELEMENT_NAME_INVALID', // Has the last legal namechar in XML 1.1, illegal in XML 1.0 thru 4th edition
   'rmt-020': 'ELEMENT_NAME_INVALID', // Has the first character after the last legal namechar in XML 1.1, illegal in both XML 1.0 and 1.1
   'rmt-021': 'ELEMENT_NAME_INVALID', // Has the first character after the last legal namechar in XML 1.1, illegal in both XML 1.0 and 1.1
   'rmt-038': 'CHARDATA_INVALID_CHAR', // Contains a C0 control character (form-feed), illegal in both XML 1.0 and 1.1
   'rmt-039': 'CHARDATA_INVALID_CHAR', // Contains a C0 control character (form-feed), illegal in both XML 1.0 and 1.1
   'rmt-041': 'CHARDATA_INVALID_CHAR', // Contains a C1 control character (partial line up), legal in XML 1.0 but not 1.1
   'rmt-042': 'CHARREF_INVALID_CHAR', // Contains a character reference to a C0 control character (form-feed), legal in XML 1.1 but not 1.0
   'rmt-ns10-009': 'error', // Namespace equality test: plain repetition
   'rmt-ns10-010': 'error', // Namespace equality test: use of character reference
   'rmt-ns10-011': 'error', // Namespace equality test: use of entity reference
   'rmt-ns10-012': 'error', // Namespace inequality test: equal after attribute value normalization
   'rmt-ns10-013': 'error', // Bad QName syntax: multiple colons
   'rmt-ns10-014': 'error', // Bad QName syntax: colon at end
   'rmt-ns10-015': 'error', // Bad QName syntax: colon at start
   'rmt-ns10-016': 'error', // Bad QName syntax: xmlns:
   'rmt-ns10-023': 'error', // Illegal use of 1.1-style prefix unbinding in 1.0 document
   'rmt-ns10-025': 'error', // Unbound element prefix
   'rmt-ns10-026': 'error', // Unbound attribute prefix
   'rmt-ns10-029': 'error', // Reserved prefixes and namespaces: declaring the xml prefix incorrectly
   'rmt-ns10-030': 'error', // Reserved prefixes and namespaces: binding another prefix to the xml namespace
   'rmt-ns10-031': 'error', // Reserved prefixes and namespaces: declaring the xmlns prefix with its correct URI (illegal)
   'rmt-ns10-032': 'error', // Reserved prefixes and namespaces: declaring the xmlns prefix with an incorrect URI
   'rmt-ns10-033': 'error', // Reserved prefixes and namespaces: binding another prefix to the xmlns namespace
   'rmt-ns10-035': 'error', // Attribute uniqueness: repeated identical attribute
   'rmt-ns10-036': 'error', // Attribute uniqueness: repeated attribute with different prefixes
   'rmt-ns10-042': 'error', // Colon in PI name
   'rmt-ns10-043': 'error', // Colon in entity name
   'rmt-ns10-044': 'error', // Colon in entity name
   'rmt-ns11-005': 'error', // Illegal use of prefix that has been unbound
   'ht-bh-ns11-007': 'error', // Attempt to unbind xmlns 'namespace'
   'ht-bh-ns11-008': 'error', // Attempt to unbind xml namespace
   'rmt-e3e-12': 'ATTRIBUTE_INVALID_REFERENCE', // good Default values for attributes may not contain references to external entities.
   'x-ibm-1-0.5-not-wf-P04-ibm04n02.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n03.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n04.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n05.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n06.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n07.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n08.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n09.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n10.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n11.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n12.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n13.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n14.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n15.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n16.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n17.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n18.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n19.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n20.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n21.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n22.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n23.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n24.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n25.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n26.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n27.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04-ibm04n28.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an01.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an02.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an03.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an04.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an05.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an06.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an07.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an08.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an09.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an10.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an11.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an12.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an13.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an14.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an15.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an16.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an17.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an18.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an19.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an20.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an21.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an22.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an23.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an24.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an25.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an26.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an27.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P04a-ibm04an28.xml': 'ELEMENT_NAME_INVALID',

   'x-ibm-1-0.5-not-wf-P05-ibm05n01.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P05-ibm05n02.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P05-ibm05n03.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P05-ibm05n04.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P05-ibm05n05.xml': 'ELEMENT_NAME_INVALID',
   'x-ibm-1-0.5-not-wf-P05-ibm05n06.xml': 'ELEMENT_NAME_INVALID',
   'rmt-ns-e1.0-13a': 'error', // The xml namespace must not be declared as the default namespace.
   'rmt-ns-e1.0-13b': 'error', // The xmlns namespace must not be declared as the default namespace.
   'rmt-ns-e1.0-13c': 'error', // Elements must not have the prefix xmlns.
   'hst-bh-001': 'CHARREF_INVALID_CHAR', // ok - decimal charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
   'hst-bh-002': 'CHARREF_INVALID_CHAR', // ok - hex charref > 10FFFF, indeed > max 32 bit integer, checking for recovery from possible overflow
   'hst-bh-003': 'CHARREF_INVALID_CHAR', // ok - decimal charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
   'hst-bh-004': 'CHARREF_INVALID_CHAR', // ok - hex charref > 10FFFF, indeed > max 64 bit integer, checking for recovery from possible overflow
   'hst-lhs-007': 'error', // UTF-8 BOM plus xml decl of iso-8859-1 incompatible
   'hst-lhs-008': 'error', // UTF-16 BOM plus xml decl of utf-8 (using UTF-16 coding) incompatible
   'hst-lhs-009': 'error', // UTF-16 BOM plus xml decl of utf-8 (using UTF-8 coding) incompatible
};

const expectedErrorCodes: IdToErrorMap = {
   'not-wf-not-sa-005': 'PARAMETERENTITY_NO_DECLARATION', // Tests the_Entity Declared_VC by referring to an undefined parameter entity within an external entity.
   'ibm-invalid-P68-ibm68i01.xml': 'GENERALENTITY_NO_DECLARATION', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge2" is referred in the file ibm68i01.dtd", but not declared.
   'ibm-invalid-P68-ibm68i02.xml': 'GENERALENTITY_NO_DECLARATION', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge1" is referred before declared in the file ibm68i01.dtd".
   'ibm-invalid-P68-ibm68i03.xml': 'GENERALENTITY_NO_DECLARATION', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge2" is referred in the file ibm68i03.ent", but not declared.
   'ibm-invalid-P68-ibm68i04.xml': 'GENERALENTITY_NO_DECLARATION', // Tests invalid EntityRef which is against P68 VC: Entity Declared. The GE with the name "ge1" is referred before declared in the file ibm68i04.ent".
   'ibm-invalid-P69-ibm69i01.xml': 'PARAMETERENTITY_NO_DECLARATION', // Tests invalid PEReference which is against P69 VC: Entity Declared. The Name "pe2" in the PEReference in the file ibm69i01.dtd does not match the Name of any declared PE.
   'ibm-invalid-P69-ibm69i02.xml': 'PARAMETERENTITY_NO_DECLARATION', // Tests invalid PEReference which is against P69 VC: Entity Declared. The PE with the name "pe1" is referred before declared in the file ibm69i02.dtd
   'ibm-invalid-P69-ibm69i03.xml': 'PARAMETERENTITY_NO_DECLARATION', // Tests invalid PEReference which is against P69 VC: Entity Declared. The Name "pe3" in the PEReference in the file ibm69i03.ent does not match the Name of any declared PE.
   'ibm-invalid-P69-ibm69i04.xml': 'PARAMETERENTITY_NO_DECLARATION', // Tests invalid PEReference which is against P69 VC: Entity Declared. The PE with the name "pe2" is referred before declared in the file ibm69i04.ent.
   'ibm-not-wf-P69-ibm69n05.xml': 'REFERENCE_NO_DECLARATION', // good - Based on E29 substantial source: minutes XML-Syntax 1999-02-24 E38 in XML 1.0 Errata, this WFC does not apply to P69, but the VC Entity declared still apply. Tests PEReference which is against P69 WFC: Entity Declared. The PE with the name "paaa" is referred before declared in the DTD.
   'rmt-e2e-34': 'ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC', // A non-deterministic content model is an error even if the element type is not used.
   'rmt-e2e-55': 'REFERENCE_INVALID_UNPARSED', // ok - Has a UTF-8 LSEP in the XML declaration (to be made an error in PR)
   'x-rmt-008': 'XMLDECL_VERSION_INVALD', // a document with version=1.7, illegal in XML 1.0 through 4th edition
   'x-rmt-008--V1R1': 'XMLDECL_VERSION_INVALID', // This input is actually just fine for 1.0/1
   'x-rmt-008--V1R2': 'XMLDECL_VERSION_INVALID', // This input is actually just fine for 1.0/1
   'x-rmt-008--V1R5': 'XMLDECL_VERSION_INVALID', // This input is actually just fine for 1.0/5
   'rmt-e2e-57': 'XMLSPACE_INVALID_VALUE', // ok - A value other than preserve or default for xml:space is an error
   uri01: 'SYSTEMLITERAL_NO_FRAGMENT', // ok - The system literal may not contain fragments (§4.2.2). Found "foo#bar".
   'o-p11pass1': 'SYSTEMLITERAL_NO_FRAGMENT', // A reference to an unparsed entity in an entity value is an error rather than forbidden (unless the entity is referenced, of course)
   'rmt-008': 'XMLDECL_VERSION_INVALD', // an implausibly-versioned document
   'rmt-009': 'TEXTDECL_VERSION_INVALD', // External general entity has implausible version number
   'rmt-055': 'XMLDECL_INVALID_SPACE', // ok - Has a Latin-1 NEL in the XML declaration (to be made an error in PR)
   'rmt-056': 'XMLDECL_INVALID_SPACE', // ok - Has a UTF-8 NEL in the XML declaration (to be made an error in PR)
   'rmt-057': 'XMLDECL_INVALID_SPACE', // ok - Has a UTF-8 LSEP in the XML declaration (to be made an error in PR)
};

export { IdToErrorMap, expectedErrorCodes, expectedNotWfCodes, expectedInvalidCodes };
