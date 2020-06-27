type TestToErrorMap = {
   [testName: string]: string | { id: string, message?: RegExp },
};

const notWellFormedCodes = {
   'ibm01n01.xml': 'DOC_END_EARLY',
   'ibm01n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_START_PTOKEN/,
   },
   'ibm01n03.xml': 'TOKEN_INVALID_CONTEXT',
   'ibm02n01.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n02.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n03.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n04.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n05.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n06.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n07.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n08.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n09.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n10.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n11.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n12.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n13.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n14.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n15.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n16.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n17.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n18.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n19.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n20.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n21.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n22.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n23.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n24.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n25.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n26.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n27.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n28.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n29.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n30.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n31.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n32.xml': 'CHARDATA_INVALID_CHAR',
   'ibm02n33.xml': 'CHARDATA_INVALID_CHAR',
   'ibm03n01.xml': 'ELEMENT_NO_CLOSE',

   // §2.3 These check that strange characters in the element name are rejected
   'ibm04n01.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n02.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n03.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n04.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n05.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n06.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n07.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n08.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n09.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n10.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n11.xml': {
      // In this case we interpret [ as the end of the name and start of the internal subset
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /CHARDATA_PTOKEN/,
   },
   'ibm04n12.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n13.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n14.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n15.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n16.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n17.xml': 'DOCTYPE_NAME_INVALID',
   'ibm04n18.xml': 'DOCTYPE_NAME_INVALID',

   // §2.3 bad characters in beginning, middle and end
   'ibm05n01.xml': 'DOCTYPE_NAME_INVALID',
   'ibm05n02.xml': 'DOCTYPE_NAME_INVALID',
   'ibm05n03.xml': 'DOCTYPE_NAME_INVALID',
   'ibm05n04.xml': 'DOCTYPE_NAME_INVALID',
   'ibm05n05.xml': 'DOCTYPE_NAME_INVALID',

   // §2.3 Various bad entity values
   'ibm09n01.xml': 'PEREF_NAME_INVALID', // could parse this differently, and stop with the quote: <!ENTITY FullName "Snow%Man">
   'ibm09n02.xml': 'REFERENCE_NO_SEMICOLON',
   'ibm09n03.xml': 'ENTITYDECL_NO_CLOSE',
   'ibm09n04.xml': 'LITERAL_NO_CLOSE_QUOTE',

   // §2.3 Bad attribute values
   'ibm10n01.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm10n02.xml': 'REFERENCE_NO_SEMICOLON',
   'ibm10n03.xml': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
   'ibm10n04.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm10n05.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm10n06.xml': 'REFERENCE_NO_SEMICOLON',
   'ibm10n07.xml': 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
   'ibm10n08.xml': 'ATTRIBUTE_INVALID_VALUE',

   // §2.3 Bad system literals
   'ibm11n01.xml': 'DOCTYPE_NO_CLOSE',
   'ibm11n02.xml': 'DOCTYPE_NO_CLOSE',
   'ibm11n03.xml': 'LITERAL_NO_CLOSE_QUOTE',
   'ibm11n04.xml': 'LITERAL_NO_CLOSE_QUOTE',

   // §2.3 Bad system literals
   'ibm12n01.xml': 'LITERAL_NO_CLOSE_QUOTE',
   'ibm12n02.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',
   'ibm12n03.xml': 'LITERAL_NO_CLOSE_QUOTE',

   // §2.3 Bad characters in public id
   'ibm13n01.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',
   'ibm13n02.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',
   'ibm13n03.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS',

   // §2.4 Bad characters in chardata
   'ibm14n01.xml': 'CHARDATA_INVALID_SECTION_END',
   'ibm14n02.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm14n03.xml': 'REFERENCE_XTRA_TRAILING_SPACE',

   // §2.5 Comments
   'ibm15n01.xml': 'COMMENT_DOUBLE_HYPHEN',
   'ibm15n02.xml': 'COMMENT_NO_CLOSE',
   'ibm15n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /UNKNOWNDECL/,
   },
   'ibm15n04.xml': 'COMMENT_NO_CLOSE',

   // §2.6 PI
   'ibm16n01.xml': 'TOKEN_INVALID_CONTEXT',
   'ibm16n02.xml': 'PI_NO_TARGET',
   'ibm16n03.xml': 'PI_NO_CLOSE',
   'ibm16n04.xml': 'PI_NO_CLOSE',

   // §2.6 PI
   'ibm17n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm17n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm17n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },
   'ibm17n04.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /XMLDECL_PTOKEN/,
   },

   // §2.7 CData sections
   'ibm18n01.xml': 'CHARDATA_INVALID_SECTION_END',
   'ibm18n02.xml': 'CDATA_NO_CLOSE',

   // §2.7 CData sections
   'ibm19n01.xml': 'CDATA_INVALID_CASE',
   'ibm19n02.xml': 'CONDITIONAL_UNKNOWN',
   'ibm19n03.xml': 'PI_NO_CLOSE',

   // §2.7 CData sections
   'ibm20n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CHARDATA_PTOKEN/,
   },

   // §2.7 CData sections
   'ibm21n01.xml': 'CONDITIONAL_UNKNOWN',
   'ibm21n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CDATA_PTOKEN/
   },
   'ibm21n03.xml': 'CDATA_NO_CLOSE',

   // §2.8 Prolog
   'ibm22n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /DOCTYPE_START_PTOKEN/,
   },
   'ibm22n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /COMMENT_PTOKEN/,
   },
   'ibm22n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /COMMENT_PTOKEN/,
   },

   // §2.8 Xml decl
   'ibm23n01.xml': 'XMLDECL_ENCODING_INVALID_ORDER',
   'ibm23n02.xml': 'XMLDECL_ENCODING_INVALID_ORDER',
   'ibm23n03.xml': 'XMLDECL_ENCODING_INVALID_ORDER',
   'ibm23n04.xml': 'XMLDECL_TARGET_INVALID_CASE',
   'ibm23n05.xml': 'XMLDECL_NO_CLOSE',
   'ibm23n06.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /UNKNOWNDECL/,
   },

   // §2.8 Xml decl version
   'ibm24n01.xml': 'XMLDECL_VERSION_INVALD',
   'ibm24n02.xml': 'PI_TARGET_HAS_XML',
   'ibm24n03.xml': 'XMLDECL_NO_PARAMS',
   'ibm24n04.xml': 'XMLDECL_NO_PARAMS',
   'ibm24n05.xml': 'XMLDECL_NO_PARAMS',
   'ibm24n06.xml': 'XMLDECL_PARAM_INVALID_CASE',
   'ibm24n07.xml': 'XMLDECL_PARAM_INVALID_CASE',
   'ibm24n08.xml': 'XMLDECL_VERSION_INVALD',
   'ibm24n09.xml': 'XMLDECL_VERSION_INVALD',

   // §2.8 Xml decl version equal
   'ibm25n01.xml': 'XMLDECL_VERSION_INVALD',
   'ibm25n02.xml': 'XMLDECL_VERSION_INVALD',

   // §2.8 VersionNum
   'ibm26n01.xml': 'XMLDECL_VERSION_INVALD',

   // §2.8 Misc
   'ibm27n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENTDECL/,
   },

   // §2.8 doctypedecl
   'ibm28n01.xml': 'DOCTYPE_NO_CLOSE',
   'ibm28n02.xml': 'DOCTYPE_NO_NAME',
   'ibm28n03.xml': 'DOCTYPE_NO_CLOSE',
   'ibm28n04.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /GENERAL_ENTITY_START_PTOKEN/,
   },
   'ibm28n05.xml': 'DECL_DECLTYPE_INVALID_CASE',
   'ibm28n06.xml': 'MARKUPDECL_INVALID_TOKEN',
   'ibm28n07.xml': 'DOCTYPE_NO_CLOSE',
   'ibm28n08.xml': 'PI_NO_CLOSE',

   // §2.8 doctypedecl
   'ibm28an01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /CHARDATA_PTOKEN/,
   },

   // §2.9 markupdecl
   'ibm29n01.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /DOCTYPE_START_PTOKEN/,
   },
   'ibm29n02.xml': 'ELEMENTDECL_EXTRA_TEXT',
   'ibm29n03.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm29n04.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm29n05.xml': 'PI_NO_CLOSE',
   'ibm29n06.xml': 'COMMENT_NO_CLOSE',
   'ibm29n07.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',

   // §2.8 External Subset
   'ibm30n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /TEXTDECL_PTOKEN/,
   },

   // §2.8 extSubsetDecl
   'ibm31n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /GENERAL_ENTITY_START_PTOKEN/,
   },

   // §2.9 standalone
   'ibm32n01.xml': 'XMLDECL_NO_SPACE_BETWEEN_PARAMS',
   'ibm32n02.xml': 'XMLDECL_NO_CLOSE',
   'ibm32n03.xml': 'XMLDECL_PARAM_INVALID_CASE',
   'ibm32n04.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm32n05.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm32n06.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm32n07.xml': 'XMLDECL_STANDALONE_INVALID_CASE',
   'ibm32n08.xml': 'XMLDECL_NO_CLOSE',
   'ibm32n09.xml': 'REFERENCE_INVALID_STANDALONE',

   // §3.0 Element
   'ibm39n01.xml': 'DOC_END_EARLY',
   'ibm39n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CHARDATA_PTOKEN/,
   },
   'ibm39n03.xml': 'DOC_END_EARLY',
   'ibm39n04.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_END_PTOKEN/,
   },
   'ibm39n05.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_END_PTOKEN/,
   },
   'ibm39n06.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /CHARDATA_PTOKEN/,
   },

   // §3.1 Attributes of start tags
   'ibm40n01.xml': 'ELEMENT_NAME_INVALID',
   'ibm40n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm40n03.xml': 'ELEMENT_NAME_INVALID',
   'ibm40n04.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /UNKNOWNDECL/,
   },
   'ibm40n05.xml': 'ATTRIBUTE_DUPLICATE_NAME',

   // §3.1 Attributes of start tags
   'ibm41n01.xml': 'ELEMENT_NO_CLOSE',
   'ibm41n02.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm41n03.xml': 'LITERAL_NO_OPEN_QUOTE',
   'ibm41n04.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm41n05.xml': 'ATTRIBUTE_NO_EQUAL',
   'ibm41n06.xml': 'ELEMENT_NO_CLOSE',
   'ibm41n07.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm41n08.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm41n09.xml': 'ELEMENT_NO_CLOSE',
   'ibm41n10.xml': 'ATTRIBUTE_INVALID_REFERENCE',
   'ibm41n11.xml': 'ATTRIBUTE_INVALID_REFERENCE',
   'ibm41n12.xml': 'REFERENCE_UNPARSED_NO_USE',
   'ibm41n13.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm41n14.xml': 'ATTRIBUTE_INVALID_VALUE',

   // §3.1 Attributes of start tags
   'ibm42n01.xml': 'ELEMENT_NO_NAME',
   'ibm42n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm42n03.xml': 'DOC_END_EARLY',
   'ibm42n04.xml': 'ELEMENT_XTRA_LEADING_SPACE',
   'ibm42n05.xml': 'ELEMENT_NO_CLOSE',

   // §3.1 content
   'ibm43n01.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /NOTATION_DECLARATION_PTOKEN/,
   },
   'ibm43n02.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /ELEMENTDECL/,
   },
   'ibm43n04.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /GENERAL_ENTITY_DECLARATION_PTOKEN/,
   },
   'ibm43n05.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /ATTLISTDECL_PTOKEN_TYPE/,
   },

   // §3.1 EmptyElemTag
   'ibm44n01.xml': 'ELEMENT_XTRA_LEADING_SPACE',
   'ibm44n02.xml': 'ELEMENT_NAME_INVALID',
   'ibm44n03.xml': 'ATTRIBUTE_INVALID_NAME',
   'ibm44n04.xml': 'ATTRIBUTE_DUPLICATE_NAME',

   // §3.2.0 elementdecl
   'ibm45n01.xml': 'ELEMENTDECL_NO_NAME',
   'ibm45n02.xml': 'ELEMENTDECL_NAME_NO_SPACE',
   'ibm45n03.xml': 'ELEMENTDECL_NO_SPEC',
   'ibm45n04.xml': 'ELEMENTDECL_NAME_NO_SPACE',
   'ibm45n05.xml': 'ELEMENTDECL_NO_NAME',
   'ibm45n06.xml': 'ELEMENTDECL_NO_NAME',
   'ibm45n07.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /ELEMENT_START_PTOKEN/,
   },
   'ibm45n08.xml': 'DECL_DECLTYPE_INVALID_CASE',
   'ibm45n09.xml': 'DECL_DECLTYPE_INVALID_CASE',

   // §3.2.0 contentspec
   'ibm46n01.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm46n02.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm46n03.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm46n04.xml': 'ELEMENTDECL_SPEC_INVALID_CASE',
   'ibm46n05.xml': 'ELEMENTDECL_SPEC_UNKNOWN',

   // §3.2.1 children
   'ibm47n01.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm47n02.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm47n03.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm47n04.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm47n05.xml': 'ELEMENTDECL_SPEC_UNKNOWN',
   'ibm47n06.xml': 'ELEMENTDECL_NO_CLOSE',

   // §3.2.1 cp
   'ibm48n01.xml': 'NAMELIST_NO_NAME',
   'ibm48n02.xml': 'NAMELIST_NO_NAME',
   'ibm48n03.xml': 'NAMELIST_NO_NAME',
   'ibm48n04.xml': 'NAMELIST_NO_NAME',
   'ibm48n05.xml': 'NAMELIST_NO_DELIM',
   'ibm48n06.xml': 'NAMELIST_NO_NAME',
   'ibm48n07.xml': 'NAMELIST_NAME_INVALID',

   // §3.2.1 choice
   'ibm49n01.xml': 'NAMELIST_NO_NAME',
   'ibm49n02.xml': 'NAMELIST_EXTRA_DELIM',
   'ibm49n03.xml': 'NAMELIST_NAME_INVALID',
   'ibm49n04.xml': 'NAMELIST_NO_DELIM',
   'ibm49n05.xml': 'NAMELIST_NO_NAME',
   'ibm49n06.xml': 'NAMELIST_NAME_EXTRA_SPACE',

   // §3.2.1 seq
   'ibm50n01.xml': 'NAMELIST_NO_NAME',
   'ibm50n02.xml': 'NAMELIST_EXTRA_DELIM',
   'ibm50n03.xml': 'NAMELIST_NAME_INVALID',
   'ibm50n04.xml': 'NAMELIST_NO_DELIM',
   'ibm50n05.xml': 'NAMELIST_NO_NAME',
   'ibm50n06.xml': 'NAMELIST_NO_DELIM',
   'ibm50n07.xml': 'NAMELIST_NAME_INVALID',


   // §3.2.2 Mixed
   'ibm51n01.xml': 'NAMELIST_PCDATA_INVALID_CASE',
   'ibm51n02.xml': 'NAMELIST_NAME_INVALID',
   'ibm51n03.xml': 'NAMELIST_NO_DELIM',
   'ibm51n04.xml': 'NAMELIST_NAME_INVALID',
   'ibm51n05.xml': 'NAMELIST_MIXED_INVALID_REPEAT',
   'ibm51n06.xml': 'NAMELIST_NO_DELIM',
   'ibm51n07.xml': 'NAMELIST_NO_CLOSE',

   // §3.3.0 AttlistDecl
   'ibm52n01.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',
   'ibm52n02.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /UNKNOWNDECL/,
   },
   'ibm52n03.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',
   'ibm52n04.xml': 'ATTLISTDECL_DECLTYPE_INVALID',
   'ibm52n05.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm52n06.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /ELEMENT_START_PTOKEN/,
   },

   // §3.3.0 AttDef
   'ibm53n01.xml': 'ATTLISTDECL_ATTR_NO_VALUE',
   'ibm53n02.xml': 'ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE',
   'ibm53n03.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',
   'ibm53n04.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm53n05.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm53n06.xml': 'ATTLISTDECL_ATTR_DEFAULT_INVALID',
   'ibm53n07.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm53n08.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',

   // Really start calling out strange messages

   // §3.3.1 AttType
   'ibm54n01.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',
   'ibm54n02.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',

   // §3.3.1 StringType
   'ibm55n01.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm55n02.xml': 'ATTLISTDECL_ATTR_DEFAULT_UNKNOWN',
   'ibm55n03.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',

   // §3.3.1 TokenizedType
   'ibm56n01.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm56n02.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm56n03.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm56n04.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm56n05.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm56n06.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm56n07.xml': 'ATTLISTDECL_ATTR_NO_ATTTYPE',

   // §3.3.1 EnumeratedType
   'ibm57n01.xml': 'ATTLISTDECL_ATTR_NO_VALUE', // murky

   // §3.3.1 NotationType
   'ibm58n01.xml': 'ATTLISTDECL_ATTR_TYPE_INVALID',
   'ibm58n02.xml': 'ATTLISTDECL_ATTR_NO_NOTATION',
   'ibm58n03.xml': 'WORDLIST_NO_WORDS',
   'ibm58n04.xml': 'WORDLIST_NO_CONNECTOR',
   'ibm58n05.xml': 'ATTLISTDECL_ATTR_NO_VALUE', // ?
   'ibm58n06.xml': 'WORDLIST_INVALID_NAME',
   'ibm58n07.xml': 'ATTLISTDECL_ATTR_TYPE_NO_SPACE',
   'ibm58n08.xml': 'WORDLIST_INVALID_NAME',

   // §3.3.1 Enumeration
   'ibm59n01.xml': 'WORDLIST_NO_WORDS',
   'ibm59n02.xml': 'WORDLIST_NO_CONNECTOR',
   'ibm59n03.xml': 'WORDLIST_INVALID_NMTOKEN', // ?
   'ibm59n04.xml': 'WORDLIST_INVALID_NMTOKEN',
   'ibm59n05.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',
   'ibm59n06.xml': 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',

   // §3.3.1 DefaultDecl
   'ibm60n01.xml': 'ATTLISTDECL_ATTR_DEFAULT_INVALID', // great
   'ibm60n02.xml': 'ATTLISTDECL_ATTR_DEFAULT_INVALID', // great
   'ibm60n03.xml': 'ATTLISTDECL_ATTR_NO_VALUE', // ok
   'ibm60n04.xml': 'ATTLISTDECL_ATTR_FIXED_NO_VALUE', // great
   'ibm60n05.xml': 'ATTLISTDECL_ATTR_FIXED_NO_SPACE', // great
   'ibm60n06.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'ibm60n07.xml': 'ATTRIBUTE_INVALID_VALUE',
   'ibm60n08.xml': 'ATTLISTDECL_ATTR_NAME_INVALID',
   'simpleltinentval.xml': 'ATTRIBUTE_INVALID_VALUE',

   // §3.4.0 conditionalSect
   'ibm61n01.xml': 'CONDITIONAL_UNKNOWN',

   // §3.4.0 conditionalSect
   'ibm62n01.xml': 'CONDITIONAL_INVALID_CASE', // great
   'ibm62n02.xml': 'CONDITIONAL_UNKNOWN', // good
   'ibm62n03.xml': 'PI_NO_CLOSE', // great
   'ibm62n04.xml': 'CONDITIONAL_UNKNOWN', // great
   'ibm62n05.xml': 'CONDITIONAL_NO_SECOND_BRACKET', // great
   'ibm62n06.xml': 'CONDITIONAL_UNKNOWN', // ok
   'ibm62n07.xml': 'xxx', // no trailing ]]>
   'ibm62n08.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN',
      message: /CHARDATA_PTOKEN/,
   },

   // §3.4.0 ignoreSect
   'ibm63n01.xml': 'CONDITIONAL_INVALID_CASE', // great
   'ibm63n02.xml': 'CONDITIONAL_UNKNOWN', // good
   'ibm63n03.xml': 'PI_NO_CLOSE', // good
   'ibm63n04.xml': 'CONDITIONAL_UNKNOWN', // good
   'ibm63n05.xml': 'CONDITIONAL_NO_SECOND_BRACKET', // great
   'ibm63n06.xml': 'CONDITIONAL_UNKNOWN', // ok
   'ibm63n07.xml': 'CONDITIONAL_NO_CLOSE', // great

   // §3.4.0 ignoreSectContents
   'ibm64n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /CHARDATA_PTOKEN/,
   },
   'ibm64n02.xml': 'CONDITIONAL_NO_CLOSE', // great
   'ibm64n03.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /CHARDATA_PTOKEN/,
   },

   // §3.4.0 Ignore
   'ibm65n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // good
      message: /CHARDATA_PTOKEN/,
   },
   'ibm65n02.xml': 'CONDITIONAL_NO_CLOSE', // great

   // §4.1.0 CharRef
   'ibm66n01.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm66n02.xml': 'CHARREF_NO_CLOSE', // great
   'ibm66n03.xml': 'OK',
   'ibm66n04.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm66n05.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm66n06.xml': 'CHARREF_INVALID_CHAR', // great
   'ibm66n07.xml': 'CHARREF_NO_CLOSE', // great
   'ibm66n08.xml': 'CHARREF_NO_CLOSE', // good
   'ibm66n09.xml': 'CHARREF_NO_CLOSE', // great
   'ibm66n10.xml': 'CHARREF_NO_CLOSE', // good
   'ibm66n11.xml': 'CHARREF_XTRA_POST_DIGITS_SPACE', // great
   'ibm66n12.xml': 'CHARREF_INVALID_CHAR', // good
   'ibm66n13.xml': 'CHARREF_INVALID_CHAR', // great
   'ibm66n14.xml': 'CHARREF_INVALID_CHAR', // great
   'ibm66n15.xml': 'CHARREF_INVALID_CHAR', // great

   // great - Seeing the message immediately identifies the problem
   // ok - can kinda identify the problem
   // bad - with work can identify the problem

   // §4.1.0 EntityRef
   'ibm68n01.xml': 'REFERENCE_NO_NAME', // great
   'ibm68n02.xml': 'REFERENCE_NO_SEMICOLON', // great
   'ibm68n03.xml': 'REFERENCE_XTRA_SPACE', // great
   'ibm68n04.xml': 'REFERENCE_NO_DECLARATION', // ok  (case difference)
   'ibm68n05.xml': 'REFERENCE_NO_DECLARATION', // great
   'ibm68n06.xml': 'REFERENCE_INVALID_STANDALONE',
   'ibm68n07.xml': 'REFERENCE_NO_DECLARATION', // ok - no declaration doesn't say before declared
   'ibm68n08.xml': 'REFERENCE_UNPARSED_NO_USE', // great
   'ibm68n09.xml': 'REFERENCE_INVALID_RECURSION', // great
   'ibm68n10.xml': 'REFERENCE_INVALID_RECURSION', // great

   // §4.1.0 PEReference
   'ibm69n01.xml': 'PEREF_NO_NAME', // great
   'ibm69n02.xml': 'PEREF_XTRA_TRAILING_SPACE',
   'ibm69n03.xml': 'PEREF_XTRA_TRAILING_SPACE',
   'ibm69n04.xml': 'PEREF_XTRA_SPACE',
   'ibm69n05.xml': 'REFERENCE_NO_DECLARATION', // ok - forward declaration
   'ibm69n06.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',
   'ibm69n07.xml': 'REFERENCE_INVALID_SUBSET_CONTEXT',

   // §4.2.0 EntityDecl
   'ibm70n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /ELEMENT_EMPTY_PTOKEN/,
   },

   // §4.2.0 GEDecl
   'ibm71n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok - better to notice a bad entity declaration
      message: /UNKNOWNDECL/,
   },
   'ibm71n02.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great
   'ibm71n03.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // ok - better to point out that there is no value
   'ibm71n04.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm71n05.xml': 'ENTITYDECL_NO_NAME', // ok - maybe better to notice that it looks like a value?
   'ibm71n06.xml': 'ENTITYDECL_DECLTYPE_INVALID', // great
   'ibm71n07.xml': 'ENTITYDECL_NO_CLOSE', // great
   'ibm71n08.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok - better to recognize that this is a malfomed decl
      message: /ELEMENT_START_PTOKEN/,
   },

   // §4.2.0 PEDecl
   'ibm72n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok
      message: /UNKNOWNDECL/,
   },
   'ibm72n02.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm72n03.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great
   'ibm72n04.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // ok. better state no value
   'ibm72n05.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm72n06.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm72n07.xml': 'ENTITYDECL_DECLTYPE_INVALID', // great
   'ibm72n08.xml': 'ENTITYDECL_NO_CLOSE', // great
   'ibm72n09.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok.
      message: /UNKNOWNDECL/,
   },

   // §4.2.0 EntityDef
   'ibm73n01.xml': 'LITERAL_NO_OPEN_QUOTE', // ok. better to note ndata not there
   'ibm73n03.xml': 'LITERAL_NO_OPEN_QUOTE', // ok. better to note ndata not there

   // §4.2.0 PEDef
   'ibm74n01.xml': 'ENTITYDECL_NO_CLOSE', // ok. idealy would be shouting that ndata isn't allowed here

   // §4.2.2 ExternalId
   'ibm75n01.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm75n02.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm75n03.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm75n04.xml': 'DOCTYPE_NO_CLOSE', // ok.
   'ibm75n05.xml': 'EXTERNALID_IDTYPE_NO_SPACE', // great
   'ibm75n06.xml': 'LITERAL_NO_OPEN_QUOTE', // ok. All these "no opn quotes" would be better as saying "no literal"
   'ibm75n07.xml': 'EXTERNALID_SYSTEM_NO_LEADING_SPACE', // great
   'ibm75n08.xml': 'DOCTYPE_NO_CLOSE', // ok a lack of PUBLIC would be better
   'ibm75n09.xml': 'EXTERNALID_IDTYPE_NO_SPACE', // great
   'ibm75n10.xml': 'EXTERNALID_PUBLIC_INVALID_CHARS', // great
   'ibm75n11.xml': 'EXTERNALID_INVALID_CASE', // great (though, test would like to complain about no system value
   'ibm75n12.xml': 'ENTITYDECL_NO_CLOSE', // ok. more than SYSTEM is misplace
   'ibm75n13.xml': 'DOCTYPE_NO_CLOSE', // ok. more than PUBLIC is missing

   // §4.2.2 ExternalId
   'ibm76n01.xml': 'ENTITYDECL_NDATA_INVALID_CASE', // great
   'ibm76n02.xml': 'ENTITYDECL_NDATA_INVALID_CASE', // great
   'ibm76n03.xml': 'ENTITYDECL_EXTERNALID_NO_SPACE', // great
   'ibm76n04.xml': 'ENTITYDECL_NO_CLOSE', // ok - better to notice that this is missing ndata
   'ibm76n05.xml': 'ENTITYDECL_NDATA_NO_NAME', // great
   'ibm76n06.xml': 'ENTITYDECL_NO_CLOSE', // ok - again would be better to note something isnt good
   'ibm76n07.xml': 'ENTITYDECL_NO_CLOSE', // ok - "

   // §4.3.1 textdecl
   'ibm77n01.xml': 'TEXTDECL_VERSION_INVALID_ORDER', // great
   'ibm77n02.xml': 'TEXTDECL_TARGET_INVALID_CASE', // great
   'ibm77n03.xml': 'TEXTDECL_NO_CLOSE', // great
   'ibm77n04.xml': 'TEXTDECL_NO_CLOSE', // great

   // §4.3.2 extParsedEnt
   'ibm78n01.xml': {
      id: 'CONTENT_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },
   'ibm78n02.xml': {
      id: 'CONTENT_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },

   // §4.3.2 extPE
   'ibm79n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },
   'ibm79n02.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /TEXTDECL_PTOKEN/,
   },

   // §4.3.3 EncodingDecl
   'ibm80n01.xml': 'XMLDECL_NO_SPACE_BETWEEN_PARAMS', // great
   'ibm80n02.xml': 'XMLDECL_ENCODING_NO_EQUAL', // great
   'ibm80n03.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm80n04.xml': 'XMLDECL_NO_CLOSE', // ok
   'ibm80n05.xml': 'XMLDECL_NO_CLOSE', // ok
   'ibm80n06.xml': 'XMLDECL_PARAM_INVALID_CASE', // great

   // §4.3.3 EncName
   'ibm81n01.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n02.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n03.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n04.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n05.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n06.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n07.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n08.xml': 'XMLDECL_ENCODING_INVALID', // great
   'ibm81n09.xml': 'XMLDECL_ENCODING_INVALID', // great

   // §4.7.0 NotationDecl
   'ibm82n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /UNKNOWNDECL/,
   },
   'ibm82n02.xml': 'NOTATIONDECL_NO_EXTERNALID', // ok
   'ibm82n03.xml': 'NOTATIONDECL_NO_EXTERNALID', // great
   'ibm82n04.xml': 'NOTATIONDECL_NO_EXTERNALID', // great
   'ibm82n05.xml': 'NOTATIONDECL_DECLTYPE_INVALID', // great
   'ibm82n06.xml': 'NOTATIONDECL_NO_CLOSE', // great
   'ibm82n07.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // great
      message: /ELEMENT_START_PTOKEN/,
   },
   'ibm82n08.xml': 'NOTATIONDECL_NO_CLOSE', // great

   // §4.7.0 PublicID
   'ibm83n01.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm83n02.xml': 'EXTERNALID_INVALID_CASE', // great
   'ibm83n03.xml': 'NOTATIONDECL_NO_EXTERNALID', // ok
   'ibm83n04.xml': 'EXTERNALID_IDTYPE_NO_SPACE', // great
   'ibm83n05.xml': 'LITERAL_NO_OPEN_QUOTE', // great
   'ibm83n06.xml': 'NOTATIONDECL_NO_EXTERNALID', // great

   // §B.0.0 BaseChar
   'ibm85n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n13.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n14.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n15.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n16.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n17.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n18.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n19.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n20.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n21.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n22.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n23.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n24.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n25.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n26.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n27.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n28.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n29.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n30.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n31.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n32.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n33.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n34.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n35.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n36.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n37.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n38.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n39.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n40.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n41.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n42.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n43.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n44.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n45.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n46.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n47.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n48.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n49.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n50.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n51.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n52.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n53.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n54.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n55.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n56.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n57.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n58.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n59.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n60.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n61.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n62.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n63.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n64.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n65.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n66.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n67.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n68.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n69.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n70.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n71.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n72.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n73.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n74.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n75.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n76.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n77.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n78.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n79.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n80.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n81.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n82.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n83.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n84.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n85.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n86.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n87.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n88.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n89.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n90.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n91.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n92.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n93.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n94.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n95.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n96.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n97.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n98.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n99.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n100.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n101.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n102.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n103.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n104.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n105.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n106.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n107.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n108.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n109.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n110.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n111.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n112.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n113.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n114.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n115.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n116.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n117.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n118.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n119.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n120.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n121.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n122.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n123.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n124.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n125.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n126.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n127.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n128.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n129.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n130.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n131.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n132.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n133.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n134.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n135.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n136.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n137.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n138.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n139.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n140.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n141.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n142.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n143.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n144.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n145.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n146.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n147.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n148.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n149.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n150.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n151.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n152.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n153.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n154.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n155.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n156.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n157.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n158.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n159.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n160.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n161.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n162.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n163.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n164.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n165.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n166.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n167.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n168.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n169.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n170.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n171.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n172.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n173.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n174.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n175.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n176.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n177.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n178.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n179.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n180.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n181.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n182.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n183.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n184.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n185.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n186.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n187.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n188.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n189.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n190.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n191.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n192.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n193.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n194.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n195.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n196.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n197.xml': 'PI_TARGET_NAME_INVALID',
   'ibm85n198.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 Ideographic
   'ibm86n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm86n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm86n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm86n04.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 CombiningChar
   'ibm87n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n13.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n14.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n15.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n16.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n17.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n18.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n19.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n20.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n21.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n22.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n23.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n24.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n25.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n26.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n27.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n28.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n29.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n30.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n31.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n32.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n33.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n34.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n35.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n36.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n37.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n38.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n39.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n40.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n41.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n42.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n43.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n44.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n45.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n46.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n47.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n48.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n49.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n50.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n51.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n52.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n53.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n54.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n55.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n56.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n57.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n58.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n59.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n60.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n61.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n62.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n63.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n64.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n66.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n67.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n68.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n69.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n70.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n71.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n72.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n73.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n74.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n75.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n76.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n77.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n78.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n79.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n80.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n81.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n82.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n83.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n84.xml': 'PI_TARGET_NAME_INVALID',
   'ibm87n85.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 Digit
   'ibm88n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n12.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n13.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n14.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n15.xml': 'PI_TARGET_NAME_INVALID',
   'ibm88n16.xml': 'PI_TARGET_NAME_INVALID',

   // §B.0.0 Extender
   'ibm89n01.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n02.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n03.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n04.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n05.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n06.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n07.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n08.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n09.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n10.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n11.xml': 'PI_TARGET_NAME_INVALID',
   'ibm89n12.xml': 'PI_TARGET_NAME_INVALID',
}

const invalidErrorCodes: TestToErrorMap = {
   'ibm28i01.xml': 'MISMATCH_ROOT_ELEMENT_TYPE', // great
   'ibm32i01.xml': 'ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED', // great
   'ibm32i03.xml': 'ATTLISTDECL_TYPE_EXTERNAL_DECLARED', // great
   'ibm32i04.xml': 'CHILDREN_SPACE_EXTERNAL_DECLARED', // great
   'ibm39i01.xml': 'CONTENT_IN_EMPTY_ELEMENT', // great
   'ibm39i02.xml': 'CHILDREN_XTRA_CONTENT', // good
   'ibm39i03.xml': 'UNDECLARED_ELEMENT_IN_MIXED', // great
   'ibm39i04.xml': 'ANY_UNDECLARED_ELEMENT', // great
   'ibm41i01.xml': 'ELEMENTSTART_UNDECLARED_ATTRIBUTE', // great
   'ibm41i02.xml': 'ELEMENTSTART_FIXED_NOT_RIGHT', // great
   'ibm45i01.xml': 'ELEMENT_EXTRA_DECLARATION', // great
   'ibm49i01.xml': 'ELEMENTDECL_PEREF_PARENS_UNBALANCED', // OK
   'ibm50i01.xml': 'ELEMENTDECL_PEREF_PARENS_UNBALANCED', // OK
   'ibm51i01.xml': 'ELEMENTDECL_PEREF_PARENS_UNBALANCED', // OK
   'ibm51i03.xml': 'ELEMENTDECL_MIXED_DUPLICATE_NAME', // great
   'ibm56i01.xml': 'ELEMENTSTART_ID_NAME_INVALID', // great
   'ibm56i02.xml': 'ELEMENTSTART_ID_DUPLICATE', // great
   'ibm56i03.xml': 'ATTLISTDECL_ID_BAD_DEFAULT', // good
   'ibm56i05.xml': 'ATTLISTDECL_ID_BAD_DEFAULT', // good
   'ibm56i06.xml': 'ATTLISTDECL_EXTRA_ID', // good
   'ibm56i07.xml': 'ELEMENTSTART_IDREF_NOT_NAME', // good
   'ibm56i08.xml': 'ELEMENTSTART_IDREF_NO_ID', // great
   'ibm56i09.xml': 'ELEMENTSTART_IDREFS_NOT_NAME', // good
   'ibm56i10.xml': 'ELEMENTSTART_IDREF_NO_ID', // great
   'ibm56i11.xml': 'ELEMENTSTART_ENTITY_NO_ENTITY', // ok
   'ibm56i12.xml': 'ELEMENTSTART_ENTITY_NO_ENTITY', // ok
   'ibm56i13.xml': 'ELEMENTSTART_ENTITY_PARSED_ENTITY', // great
   'ibm56i14.xml': 'ELEMENTSTART_ENTITIES_NOT_NAME', // great
   'ibm56i15.xml': 'ELEMENTSTART_ENTITIES_NO_ENTITY', // great
   'ibm56i16.xml': 'ELEMENTSTART_ENTITIES_PARSED_ENTITY', // ok
   'ibm56i17.xml': 'ELEMENTSTART_NMTOKEN_NOT_NMTOKEN',
   'ibm56i18.xml': 'ELEMENTSTART_NMTOKENS_NOT_NMTOKEN', // great
   'ibm58i01.xml': 'ELEMENTSTART_NOTATION_NOT_DECLARED', // great
   'ibm58i02.xml': 'ATTLISTDECL_BAD_NOTATION', // great
   'ibm59i01.xml': 'ELEMENTSTART_ENUMERATION_NOT_DECLARED', // great
   'ibm60i01.xml': 'ELEMENTSTART_NO_REQUIRED', // great
   'ibm60i02.xml': 'ELEMENTSTART_FIXED_NOT_RIGHT', // great
   'ibm60i03.xml': 'ATTLISTDECL_BAD_ENUMERATION_DEFAULT', // great
   'ibm60i04.xml': 'ATTLISTDECL_BAD_NMTOKEN_DEFAULT', //great
   'ibm68i01.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge2" was/,
   },
   'ibm68i02.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge1" was/,
   },
   'ibm68i03.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge2" was/,
   },
   'ibm68i04.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge1" was/,
   },
   'ibm69i01.xml': {
      id: 'PEREF_UNDEFINED',
      message: /named "pe2" was/,
   },
   'ibm69i02.xml': {
      id: 'PEREF_UNDEFINED',
      message: /named "pe1" was/,
   },
   'ibm69i03.xml': {
      id: 'PEREF_UNDEFINED',
      message: /named "pe3" was/,
   },
   'ibm69i04.xml': 'PEREF_UNDEFINED',
   'ibm76i01.xml' : 'ENTITYDECL_UNDECLARED_NOTATION',
};


export { notWellFormedCodes, invalidErrorCodes };
