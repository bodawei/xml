/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface ErrorDetails {
   id: string;
   message?: RegExp;
}

interface IdToErrorMap {
   [testName: string]: string | ErrorDetails;
}

const expectedNotWfCodes: IdToErrorMap = {
   'ibm-not-wf-P01-ibm01n01.xml': 'DOC_END_EARLY',
   'ibm-not-wf-P01-ibm01n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /ELEMENT_START_PTOKEN/,
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
      message: /DOCTYPE_START_PTOKEN/,
   },
   'ibm-not-wf-P22-ibm22n02.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /COMMENT_PTOKEN/,
   },
   'ibm-not-wf-P22-ibm22n03.xml': {
      id: 'TOKEN_INVALID_CONTEXT',
      message: /COMMENT_PTOKEN/,
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
      message: /ELEMENTDECL/,
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
      id: 'TOKEN_INVALID_CONTEXT',
      message: /DOCTYPE_START_PTOKEN/,
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
      message: /ELEMENTDECL/,
   },
   'ibm-not-wf-P43-ibm43n04.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /GENERAL_ENTITY_DECLARATION_PTOKEN/,
   },
   'ibm-not-wf-P43-ibm43n05.xml': {
      id: 'CONTENT_INVALID_TOKEN',
      message: /ATTLISTDECL_PTOKEN_TYPE/,
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
   'ibm-not-wf-P45-ibm45n08.xml': 'DECL_DECLTYPE_INVALID_CASE',
   'ibm-not-wf-P45-ibm45n09.xml': 'DECL_DECLTYPE_INVALID_CASE',

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
   'ibm-not-wf-P48-ibm48n01.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P48-ibm48n02.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P48-ibm48n03.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P48-ibm48n04.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P48-ibm48n05.xml': 'NAMELIST_NO_DELIM',
   'ibm-not-wf-P48-ibm48n06.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P48-ibm48n07.xml': 'NAMELIST_NAME_INVALID',

   // §3.2.1 choice
   'ibm-not-wf-P49-ibm49n01.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P49-ibm49n02.xml': 'NAMELIST_EXTRA_DELIM',
   'ibm-not-wf-P49-ibm49n03.xml': 'NAMELIST_NAME_INVALID',
   'ibm-not-wf-P49-ibm49n04.xml': 'NAMELIST_NO_DELIM',
   'ibm-not-wf-P49-ibm49n05.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P49-ibm49n06.xml': 'NAMELIST_NAME_EXTRA_SPACE',

   // §3.2.1 seq
   'ibm-not-wf-P50-ibm50n01.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P50-ibm50n02.xml': 'NAMELIST_EXTRA_DELIM',
   'ibm-not-wf-P50-ibm50n03.xml': 'NAMELIST_NAME_INVALID',
   'ibm-not-wf-P50-ibm50n04.xml': 'NAMELIST_NO_DELIM',
   'ibm-not-wf-P50-ibm50n05.xml': 'NAMELIST_NO_NAME',
   'ibm-not-wf-P50-ibm50n06.xml': 'NAMELIST_NO_DELIM',
   'ibm-not-wf-P50-ibm50n07.xml': 'NAMELIST_NAME_INVALID',

   // §3.2.2 Mixed
   'ibm-not-wf-P51-ibm51n01.xml': 'NAMELIST_PCDATA_INVALID_CASE',
   'ibm-not-wf-P51-ibm51n02.xml': 'NAMELIST_NAME_INVALID',
   'ibm-not-wf-P51-ibm51n03.xml': 'NAMELIST_NO_DELIM',
   'ibm-not-wf-P51-ibm51n04.xml': 'NAMELIST_NAME_INVALID',
   'ibm-not-wf-P51-ibm51n05.xml': 'NAMELIST_MIXED_INVALID_REPEAT',
   'ibm-not-wf-P51-ibm51n06.xml': 'NAMELIST_NO_DELIM',
   'ibm-not-wf-P51-ibm51n07.xml': 'NAMELIST_NO_CLOSE',

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
   'ibm-not-wf-P66-ibm66n03.xml': 'OK',
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
   'ibm-not-wf-P72-ibm72n01.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok
      message: /UNKNOWNDECL/,
   },
   'ibm-not-wf-P72-ibm72n02.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P72-ibm72n03.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // great
   'ibm-not-wf-P72-ibm72n04.xml': 'ENTITYDECL_NAME_NO_TRAILING_SPACE', // ok. better state no value
   'ibm-not-wf-P72-ibm72n05.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P72-ibm72n06.xml': 'ENTITYDECL_NO_NAME', // great
   'ibm-not-wf-P72-ibm72n07.xml': 'ENTITYDECL_DECLTYPE_INVALID', // great
   'ibm-not-wf-P72-ibm72n08.xml': 'ENTITYDECL_NO_CLOSE', // great
   'ibm-not-wf-P72-ibm72n09.xml': {
      id: 'MARKUPDECL_INVALID_TOKEN', // ok.
      message: /UNKNOWNDECL/,
   },

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
   'ibm-not-wf-P75-ibm75n06.xml': 'LITERAL_NO_OPEN_QUOTE', // ok. All these "no opn quotes" would be better as saying "no literal"
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
   'ibm-1-1-not-wf-P04-ibm04n21.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n22.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n23.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04-ibm04n24.xml': 'ELEMENT_NAME_INVALID',
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
   'ibm-1-1-not-wf-P04a-ibm04an21.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an22.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an23.xml': 'ELEMENT_NAME_INVALID',
   'ibm-1-1-not-wf-P04a-ibm04an24.xml': 'ELEMENT_NAME_INVALID',
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
};

const expectedInvalidCodes: IdToErrorMap = {
   'ibm-invalid-P28-ibm28i01.xml': 'MISMATCH_ROOT_ELEMENT_TYPE', // great
   'ibm-invalid-P32-ibm32i01.xml': 'ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED', // great
   'ibm-invalid-P32-ibm32i03.xml': 'ATTLISTDECL_TYPE_EXTERNAL_DECLARED', // great
   'ibm-invalid-P32-ibm32i04.xml': 'CHILDREN_SPACE_EXTERNAL_DECLARED', // great
   'ibm-invalid-P39-ibm39i01.xml': 'CONTENT_IN_EMPTY_ELEMENT', // great
   'ibm-invalid-P39-ibm39i02.xml': 'CHILDREN_XTRA_CONTENT', // good
   'ibm-invalid-P39-ibm39i03.xml': 'UNDECLARED_ELEMENT_IN_MIXED', // great
   'ibm-invalid-P39-ibm39i04.xml': 'ANY_UNDECLARED_ELEMENT', // great
   'ibm-invalid-P41-ibm41i01.xml': 'ELEMENTSTART_UNDECLARED_ATTRIBUTE', // great
   'ibm-invalid-P41-ibm41i02.xml': 'ELEMENTSTART_FIXED_NOT_RIGHT', // great
   'ibm-invalid-P45-ibm45i01.xml': 'ELEMENT_EXTRA_DECLARATION', // great
   'ibm-invalid-P49-ibm49i01.xml': 'ELEMENTDECL_PEREF_PARENS_UNBALANCED', // OK
   'ibm-invalid-P50-ibm50i01.xml': 'ELEMENTDECL_PEREF_PARENS_UNBALANCED', // OK
   'ibm-invalid-P51-ibm51i01.xml': 'ELEMENTDECL_PEREF_PARENS_UNBALANCED', // OK
   'ibm-invalid-P51-ibm51i03.xml': 'ELEMENTDECL_MIXED_DUPLICATE_NAME', // great
   'ibm-invalid-P56-ibm56i01.xml': 'ELEMENTSTART_ID_NAME_INVALID', // great
   'ibm-invalid-P56-ibm56i02.xml': 'ELEMENTSTART_ID_DUPLICATE', // great
   'ibm-invalid-P56-ibm56i03.xml': 'ATTLISTDECL_ID_BAD_DEFAULT', // good
   'ibm-invalid-P56-ibm56i05.xml': 'ATTLISTDECL_ID_BAD_DEFAULT', // good
   'ibm-invalid-P56-ibm56i06.xml': 'ATTLISTDECL_EXTRA_ID', // good
   'ibm-invalid-P56-ibm56i07.xml': 'ELEMENTSTART_IDREF_NOT_NAME', // good
   'ibm-invalid-P56-ibm56i08.xml': 'ELEMENTSTART_IDREF_NO_ID', // great
   'ibm-invalid-P56-ibm56i09.xml': 'ELEMENTSTART_IDREFS_NOT_NAME', // good
   'ibm-invalid-P56-ibm56i10.xml': 'ELEMENTSTART_IDREF_NO_ID', // great
   'ibm-invalid-P56-ibm56i11.xml': 'ELEMENTSTART_ENTITY_NO_ENTITY', // ok
   'ibm-invalid-P56-ibm56i12.xml': 'ELEMENTSTART_ENTITY_NO_ENTITY', // ok
   'ibm-invalid-P56-ibm56i13.xml': 'ELEMENTSTART_ENTITY_PARSED_ENTITY', // great
   'ibm-invalid-P56-ibm56i14.xml': 'ELEMENTSTART_ENTITIES_NOT_NAME', // great
   'ibm-invalid-P56-ibm56i15.xml': 'ELEMENTSTART_ENTITIES_NO_ENTITY', // great
   'ibm-invalid-P56-ibm56i16.xml': 'ELEMENTSTART_ENTITIES_PARSED_ENTITY', // ok
   'ibm-invalid-P56-ibm56i17.xml': 'ELEMENTSTART_NMTOKEN_NOT_NMTOKEN',
   'ibm-invalid-P56-ibm56i18.xml': 'ELEMENTSTART_NMTOKENS_NOT_NMTOKEN', // great
   'ibm-invalid-P58-ibm58i01.xml': 'ELEMENTSTART_NOTATION_NOT_DECLARED', // great
   'ibm-invalid-P58-ibm58i02.xml': 'ATTLISTDECL_BAD_NOTATION', // great
   'ibm-invalid-P59-ibm59i01.xml': 'ELEMENTSTART_ENUMERATION_NOT_DECLARED', // great
   'ibm-invalid-P60-ibm60i01.xml': 'ELEMENTSTART_NO_REQUIRED', // great
   'ibm-invalid-P60-ibm60i02.xml': 'ELEMENTSTART_FIXED_NOT_RIGHT', // great
   'ibm-invalid-P60-ibm60i03.xml': 'ATTLISTDECL_BAD_ENUMERATION_DEFAULT', // great
   'ibm-invalid-P60-ibm60i04.xml': 'ATTLISTDECL_BAD_NMTOKEN_DEFAULT', //great
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i01.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge2" was/,
   },
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i02.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge1" was/,
   },
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i03.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge2" was/,
   },
   'ibm-invalid-P68-ibm-not-wf-P67-ibm68i04.xml': {
      id: 'ATTLISTDECL_REFERENCE_UNDEFINED',
      message: /entity "ge1" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i01.xml': {
      id: 'PEREF_UNDEFINED',
      message: /named "pe2" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i02.xml': {
      id: 'PEREF_UNDEFINED',
      message: /named "pe1" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i03.xml': {
      id: 'PEREF_UNDEFINED',
      message: /named "pe3" was/,
   },
   'ibm-invalid-P69-ibm-not-wf-P69-ibm69i04.xml': 'PEREF_UNDEFINED',
   'ibm-invalid-P76-ibm76i01.xml': 'ENTITYDECL_UNDECLARED_NOTATION',
};

const expectedErrorCodes: IdToErrorMap = {};

export { IdToErrorMap, expectedErrorCodes, expectedNotWfCodes, expectedInvalidCodes };
