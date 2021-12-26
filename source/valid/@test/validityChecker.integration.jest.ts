/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, XmlErrorToken } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { AttFixerStream, EntityExpanderStream, PTokenStream } from 'node';
import { ParseType, ParseToken } from 'pToken';
import { STokenSource } from 'sToken';

import { ValidityChecker } from '../validityChecker';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

describe('ValidityChecker (integration)', () => {
   let checker: ValidityChecker;

   beforeEach(() => {
      checker = new ValidityChecker();
   });

   function expectError(
      input: string,
      errorCode: string,
      done: () => void,
      confVer?: ConformanceVersion,
   ): void {
      const sTokenSource = new STokenSource();
      const finalResults: Array<XmlErrorToken> = [];
      const pTokenStream = new PTokenStream(sTokenSource, {
         confVer,
         parseType: ParseType.DOCUMENT,
      });
      const entityExpander = new EntityExpanderStream(true);
      const attFixer = new AttFixerStream();

      sTokenSource.addText(input);
      sTokenSource.endText();
      pTokenStream.pipe(entityExpander).pipe(attFixer);

      gatherStreamResults<ParseToken>(attFixer, (results) => {
         for (const result of results) {
            const errors = checker.check(result);

            finalResults.push(...errors);
         }

         const targetError = finalResults.find((err) => err.id === errorCode);

         expect(targetError?.id).toEqual(errorCode);
         done();
      });
   }

   it('reports an error when the doctype does not match the root element (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
         VID.ELEMENT_DOCTYPE_MISMATCH,
         done!,
      );
   });

   it('reports an error when a peref includes the closing of an attlist declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem "att CDATA>">
            <!ATTLIST root %problem;
         ]>
         <root/>`,
         VID.PEREF_INVALID_END_NESTING,
         done!,
      );
   });

   it('reports an error when a peref includes the closing of an element declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "ANY >">
            <!ELEMENT root %problem;
         ]>
         <root/>`,
         VID.PEREF_INVALID_END_NESTING,
         done!,
      );
   });

   it('reports an error when a peref includes the closing of an entity declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem " 'foo'> ">
            <!ENTITY bar %problem;
         ]>
         <root/>`,
         VID.PEREF_INVALID_END_NESTING,
         done!,
      );
   });

   it('reports an error when a peref includes the closing of a notation declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem " SYSTEM 'http://somewhere.com'> ">
            <!NOTATION bar %problem;
         ]>
         <root/>`,
         VID.PEREF_INVALID_END_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a ATTLIST declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem "<!ATTLIST root ">
            %problem; att1 CDATA > 
         ]>
         <root/>`,
         VID.PEREF_INVALID_START_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a ELEMENT declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem "<!ELEMENT other ">
            %problem; EMPTY > 
         ]>
         <root/>`,
         VID.PEREF_INVALID_START_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a ENTITY declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem "<!ENTITY other ">
            %problem; "some value"" > 
         ]>
         <root/>`,
         VID.PEREF_INVALID_START_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a NOTATION declaration (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % problem "<!NOTATION bar ">
            %problem; SYSTEM 'http://somewhere.com'> 
         ]>
         <root/>`,
         VID.PEREF_INVALID_START_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a processing instruction (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "<?foo bar">
            %problem; baz?>
         ]>
         <root/>`,
         VID.PEREF_INVALID_START_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a comment (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "<!-- this is a ">
            %problem; comment -->
         ]>
         <root/>`,
         VID.PEREF_INVALID_START_NESTING,
         done!,
      );
   });

   it('reports an error when a document marked as standalone has an element with element content, that element is declaraed with an external markup declaration, and whitespace appears in the element (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ENTITY % elementDecl "<!ELEMENT root (other)>">
            <!ELEMENT other ANY>
            %elementDecl;
         ]>
         <root><other></other> </root>`,
         VID.CONTENTELEMENT_AMBIGUOUS_SPACE,
         done!,
      );
   });

   it('reports an error when a document marked as standalone has an element with element content, that element is declaraed in the external subset, and whitespace appears in the element (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root SYSTEM "./source/valid/@test/@entities/externalElementDeclaration.xml" [
            <!ELEMENT other ANY>
         ]>
         <root><other></other> </root>`,
         VID.CONTENTELEMENT_AMBIGUOUS_SPACE,
         done!,
      );
   });

   it('reports an Element Start with an attribute added through defaulting, but the element declaration was external markup and the document is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root SYSTEM "./source/valid/@test/@entities/defaultAttributes.xml" [
            <!ELEMENT root ANY>
         ]>
         <root>
         </root>`,
         VID.ELEMENTSTART_ATT_DEFAULT_EXTERNAL,
         done!,
      );
   });

   it('reports an Element Start with an attribute that changed due to normalization, but the element declaration was external markup and the document is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % foo "<!ATTLIST root attr1 NMTOKENS >">
            %foo;
         ]>
         <root attr1="  one   two three  ">
         </root>`,
         VID.ATTLISTDECL_ATT_EXTERNAL,
         done!,
      );
   });

   it('reports when a general entity is externally declared and is referenced in a document that is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % foo "<!ENTITY external "blah" >">
            %foo;
         ]>
         <root>
         &external;
         </root>`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports when a parameter entity is externally declared and is referenced in a document that is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % foo "<!ENTITY &#37; external '<!ELEMENT blah ANY>' >">
            %foo;
            %external;
         ]>
         <root>
         </root>`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error when an entity in an attribute is declared with an external markup declaration, and is referenced in the document (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root SYSTEM "./source/valid/@test/@entities/externalGeneralEntity.xml" [
            <!ELEMENT root ANY>
            <!ATTLIST root
               att1 CDATA
            >
         ]>
         <root att1="foo &external; foo">
         </root>`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error when an entity in an attribute is declared with an external markup declaration, and is referenced in the document (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % stuff "
               <!ENTITY external 'this is an external markup declartion'>
               <!ATTLIST root
                  att1 CDATA 'foo &external; foo'
               >
            ">
            %stuff;
         ]>
         <root>
         </root>`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error when a general entity references another general entity which was declared in an external markup declartion and the document is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % stuff "
               <!ENTITY external 'this is an external markup declartion'>
            ">
            %stuff;
            <!ENTITY level2 '&external;'>
            <!ENTITY level1 '[&level2;]'>
         ]>
         <root>
         &level1;
         </root>`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error when an attribute has a general entity that references another general entity which was declared in an external markup declartion and the document is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % stuff "
               <!ENTITY external 'this is an external markup declartion'>
            ">
            %stuff;
            <!ATTLIST root
               att1 CDATA
             >
            <!ENTITY level2 '&external;'>
            <!ENTITY level1 '[&level2;]'>
         ]>
         <root att1="&level1;" />`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error when a general entity references an external parameter entity (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % stuff "
               <!ENTITY &#37; external 'this is an external markup declartion'>
            ">
            %stuff;
            <!ENTITY % level2 '%external;'>
            <!ENTITY level1 '[%level2;]'>
         ]>
         <root>
         &level1;
         </root>`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error when an attribute has a general entity that references a parameter entity which was declared in an external markup declartion and the document is standalone (§2.9.0)', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % stuff "
               <!ENTITY &#37; external 'this is an external markup declartion'>
            ">
            %stuff;
            <!ATTLIST root
               att1 CDATA
             >
            <!ENTITY % level2 '%external;'>
            <!ENTITY level1 '[%level2;]'>
         ]>
         <root att1="&level1;" />`,
         VID.ENTITYREF_EXTERNAL,
         done!,
      );
   });

   it('reports an error an element start named an element that has not been declared (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
         ]>
         <root><a/></root>`,
         VID.ELEMENT_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when anything, even a comment, appears between the start and end tags of an element declared to be empty (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root EMPTY>
         ]>
         <root><!-- not even this! --></root>`,
         VID.CONTENTEMPTY_INVALID_SYNTAX,
         done!,
      );
   });

   it('reports an error when the sequence of child elements does not match the syntax for child elements in an element decalred with element content (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (a,a,b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root><a/><b/></root>`,
         VID.CONTENTELEMENT_CHILD_UNEXPECTED,
         done!,
      );
   });

   it('reports an error when a char ref (or other syntax) appears between child elements in an element with element content (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (a,a,b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root><a/>&#20;<a/><b/></root>`,
         VID.CONTENTELEMENT_INVALID_SYNTAX,
         done!,
      );
   });

   it('reports an error when a space appears before the element close in 1.0/1 (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (a,a,b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root><a/><a/><b/> </root>`,
         VID.CONTENTELEMENT_XTRA_SPACE,
         done!,
         new ConformanceVersion(1.0, 1),
      );
   });

   it('reports an error when a space appears after the element open in 1.0/1 (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (a,a,b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root> <a/><a/><b/></root>`,
         VID.CONTENTELEMENT_XTRA_SPACE,
         done!,
         new ConformanceVersion(1.0, 1),
      );
   });

   it('reports an error a MIXED element contains an element type not in its declaration (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (#PCDATA|a|b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
            <!ELEMENT c EMPTY>
         ]>
         <root><a/><b/><c/></root>`,
         VID.CONTENTMIXED_CHILD_UNEXPECTED,
         done!,
      );
   });

   it('reports an error a CDATA section is found in a MIXED element 1.0/1 (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (#PCDATA|a|b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root> <a/><a/><![CDATA[wow]]><b/></root>`,
         VID.CONTENTMIXED_INVALID_SYNTAX,
         done!,
         new ConformanceVersion(1.0, 1),
      );
   });

   it('reports an error a CDATA section is found in an ANY element 1.0/1 (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root> <a/><a/><![CDATA[wow]]><b/></root>`,
         VID.CONTENTANY_INVALID_SYNTAX,
         done!,
         new ConformanceVersion(1.0, 1),
      );
   });

   it('reports an error when an element ends before its content modal says it may (§3.0.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (a,a,b)>
            <!ELEMENT a EMPTY>
            <!ELEMENT b EMPTY>
         ]>
         <root><a/><a/></root>`,
         VID.CONTENT_PREMATURE_END,
         done!,
      );
   });

   it('reports an error when an attribute has not been declared (§3.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
         ]>
         <root foo="bar"/>`,
         VID.ELEMENTSTART_ATT_UNDECLARED,
         done!,
      );
   });

   it('reports an error when a MIXED element declaration (§3.2.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
            <!DOCTYPE root [
               <!ELEMENT root ANY>
               <!ELEMENT root ANY>
            ]>
            <root />`,
         VID.ELEMENT_XTRA_DECLARATION,
         done!,
      );
   });

   it('reports an error the current context is a ELEMENT context, but we are not at the end (§3.2.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
      <!DOCTYPE root [
         <!ELEMENT one ANY>
         <!ELEMENT two ANY>
         <!ENTITY % CM '(one | two'>
         <!ELEMENT root %CM;>
      ]>
      <root/>`,
         VID.PEREF_PARENS_UNBALANCED,
         done!,
      );
   });

   it('reports an error when a MIXED element declaration (§3.2.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root (#PCDATA one two three four one five)>
         ]>
         <root />`,
         VID.ELEMENTDECL_XTRA_MIXED_NAME,
         done!,
      );
   });

   it('reports an error when an ID attribute value does not match the Name production (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root EMPTY>
            <!ATTLIST root
               id ID #REQUIRED
            >
         ]>
         <root id="$BAD"  />`,
         VID.ELEMENTSTART_ATT_INVALID_ID_NAME,
         done!,
      );
   });

   it('reports an error when an ID attribute value is used more than once in a document (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               id ID #REQUIRED
            >
            <!ELEMENT body EMPTY>
            <!ATTLIST body
               id ID #REQUIRED
            >
         ]>
         <root id="one">
            <body id="one">
         </root>`,
         VID.ELEMENTSTART_ATT_XTRA_ID,
         done!,
      );
   });

   it('reports an error when an ID attribute value is used more than once in a document (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               id ID #REQUIRED
            >
            <!ELEMENT body EMPTY>
            <!ATTLIST body
               id ID #REQUIRED
            >
         ]>
         <root id="one">
            <body id="one">
         </root>`,
         VID.ELEMENTSTART_ATT_XTRA_ID,
         done!,
      );
   });

   it('reports an error when an element type has more than one id attribute defined (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               id ID #REQUIRED
            >
            <!ATTLIST root
               secondary ID #REQUIRED
            >
         ]>
         <root />`,
         VID.ATTLISTDECL_ATT_XTRA_ID,
         done!,
      );
   });

   it('reports an error when an ID attribute is declared with neither #REQIRED or #IMPLICIT as a default type (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               id ID
            >
         ]>
         <root />`,
         VID.ATTLISTDECL_ATT_INVALID_ID_DEFAULT,
         done!,
      );
   });

   it('reports an error when an IDREF attribute is not a name (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               ref IDREF
            >
         ]>
         <root ref="$BAD"/>`,
         VID.ELEMENTSTART_ATT_INVALID_IDREF_NAME,
         done!,
      );
   });

   it('reports an error when an IDREF does not reference a known ID (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               ref IDREF
            >
         ]>
         <root ref="OTHER"/>`,
         VID.ELEMENTSTART_ATT_IDREF_NO_ID,
         done!,
      );
   });

   it('reports an error when an ENTITIES value matches a parsed entity (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root EMPTY>
            <!ATTLIST root
               unparsed ENTITIES
            >
            <!ENTITY foo "hi">
         ]>
         <root unparsed="  foo bar   "  />`,
         VID.ELEMENTSTART_ATT_PARSED_ENTITIES,
         done!,
      );
   });

   it('reports an error when a NOTATION is on an empty element (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT emptyElement EMPTY>
            <!NOTATION aNotation SYSTEM 'http://somewhere.in.time'>
            <!ATTLIST emptyElement
               whatever NOTATION (aNotation)
            >
         ]>
         <emptyElement/>`,
         VID.ATTLISTDECL_ATT_INVALID_NOTATION_ON_EMPTY,
         done!,
      );
   });

   it('reports an error when a NOTATION value has not been declared (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               whatever NOTATION (aNotation)
            >
         ]>
         <root/>`,
         VID.ATTLISTDECL_ATT_NOTATION_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when an attribute has a notation value that was not in the ATTLIST declaration (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               notationAttr NOTATION (aNotation)
            >
         ]>
         <root notationAttr="bad"/>`,
         VID.ELEMENTSTART_ATT_NOTATION_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a notation name is repeated in the ATTLIST declaration (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               notationAttr NOTATION (one | two | one)
            >
            <!NOTATION one SYSTEM 'http://somewhere.in.time'>
            <!NOTATION two SYSTEM 'http://somewhere.in.time'>
         ]>
         <root/>`,
         VID.ATTLISTDECL_ATT_XTRA_NOTATION_VALUE,
         done!,
      );
   });

   it('reports an error when an enumeration name is repeated in the ATTLIST declaration (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               notationAttr (one | two | one)
            >
            <!NOTATION one SYSTEM 'http://somewhere.in.time'>
            <!NOTATION two SYSTEM 'http://somewhere.in.time'>
         ]>
         <root/>`,
         VID.ATTLISTDECL_ATT_XTRA_ENUMERATION_VALUE,
         done!,
      );
   });

   it('reports an error when an element has multiple notation attributes (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               notationAttr NOTATION (one | two) #IMPLIED
               other CDATA #IMPLIED
            >
            <!NOTATION one SYSTEM 'http://somewhere.in.time'>
            <!NOTATION two SYSTEM 'http://somewhere.in.time'>
            <!ATTLIST root
               secondNotation NOTATION (one | two)
            >
         ]>
         <root/>`,
         VID.ATTLISTDECL_ATT_XTRA_NOTATION,
         done!,
      );
   });

   it('reports an error when an element has an enumerated attribute value that is not among the declared values for that attribute (§3.3.1)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               enumerationAtt (one | two)
            >
         ]>
         <root enumerationAtt= 'bad' />`,
         VID.ELEMENTSTART_ATT_ENUMERATION_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a required attribute is not present (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               requiredAttribute CDATA #REQUIRED
            >
         ]>
         <root />`,
         VID.ELEMENTSTART_NO_REQUIRED,
         done!,
      );
   });

   it('reports an error when an IDREF does not match the Name production (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               idref IDREF "$FOO"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_IDREF_DEFAULT,
         done!,
      );
   });

   it('reports an error when an ENTITY does not match the Name production (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               entity ENTITY "$FOO"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT,
         done!,
      );
   });

   it('reports an error when an IDREFS does not match the Name production (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               idref IDREFS "$FOO bar"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_IDREFS_DEFAULT,
         done!,
      );
   });

   it('reports an error when an ENTITIES does not match the Name production (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               entity ENTITIES "$FOO BAZ"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_ENTITIES_DEFAULT,
         done!,
      );
   });

   it('reports an error when an NMTOKEN defaultdoes not match the NmToken production (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               entity NMTOKEN "$FOO"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT,
         done!,
      );
   });

   it('reports an error when an NMTOKENS default does not match the NmToken production (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               entity NMTOKENS "$FOO BAR"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_NMTOKENS_DEFAULT,
         done!,
      );
   });

   it('reports an error when a NOTATION default does not match one of the defined values (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               notation NOTATION (a b c) "d"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_NOTATION_DEFAULT,
         done!,
      );
   });

   it('reports an error when an ENUMERATION default does not match one of the defined values (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               enumeration (a b c) "d"
            >
         ]>`,
         VID.ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT,
         done!,
      );
   });

   it('reports an error when an attribute declared with a #FIXED default is given a different value on an element start (§3.3.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE emptyElement [
            <!ELEMENT root ANY>
            <!ATTLIST root
               attr1 CDATA #FIXED "d"
            >
         ]>
         <root attr1="bad" />`,
         VID.ELEMENTSTART_ATT_INVALID_FIXED,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include the whole of a conditional section (§3.4.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "<![INCLUDE[ foo> ">
            %problem; ]]>
         ]>
         <root/>`,
         VID.PEREF_INVALID_CONDITIONALSECTION_START_NESTING,
         done!,
      );
   });

   it('reports an error when a parameter entity value does not include only the close of a conditional section (§3.4.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "<![INCLUDE ">
            %problem; [ foo ]]>
         ]>
         <root/>`,
         VID.PEREF_INVALID_CONDITIONALSECTION_START_NESTING,
         done!,
      );
   });

   it('reports an error when the "[" of a conditional section start is in a parameter entity reference (§3.4.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "[ foo ]]>">
            <![INCLUDE %problem; 
         ]>
         <root/>`,
         VID.CONDITIONALSECTION_PEREF_INVALID_BRACKET,
         done!,
      );
   });

   it('reports an error when the PE reference in a conditional section start includes the "[" and the "]]>" (§3.4.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "INCLUDE [ foo ]]>">
            <![ %problem; 
         ]>
         <root/>`,
         VID.CONDITIONALSECTION_PEREF_INVALID_BRACKET,
         done!,
      );
   });

   it('reports an error when the PE reference in a conditional section start includes the "[" (§3.4.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "INCLUDE [ foo ">
            <![ %problem; ]]>
         ]>
         <root/>`,
         VID.CONDITIONALSECTION_PEREF_INVALID_BRACKET,
         done!,
      );
   });

   it('reports an error when a general entity is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % forceAPeRef "">
            %forceAPeRef;
         ]>
         <root>
           &I-Am-Not-Defined;
         </root>`,
         VID.GENERALENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a general entity referenced from an attribute is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               att1 CDATA>
            <!ENTITY % forceAPeRef "">
            %forceAPeRef;
         ]>
         <root att1="&I-Am-Not-Defined;" />`,
         VID.GENERALENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a general entity referenced from an ATTLIST is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ATTLIST root
               att1 CDATA "&I-Am-Not-Defined;">
            <!ENTITY % forceAPeRef "">
            %forceAPeRef;
            ]>
         <root/>`,
         VID.GENERALENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a parameter entity is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            %I-Am-Not-Defined;
         ]>
         <root/>`,
         VID.PARAMETERENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a PE referenced from another PE is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % I-Am-Declared "%I-Am-NOT;">
            %I-Am-Declared;
         ]>
         <root/>`,
         VID.PARAMETERENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a PE referenced from a GE declaration is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY I-Am-Declared "%I-Am-NOT;">
         ]>
         <root>&I-Am-Declared;</root>`,
         VID.PARAMETERENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a PE referenced from a PE from a GE declaration is not declared (§4.1.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ENTITY % I-Am-Also "%I-Am-NOT;">
            <!ENTITY I-Am-Declared "%I-Am-Also;">
         ]>
         <root>&I-Am-Declared;</root>`,
         VID.PARAMETERENTITY_NO_DECLARATION,
         done!,
      );
   });

   it('reports an error when a general entity declaration has a NDATA name that has not been declared (§4.2.2)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!NOTATION bar SYSTEM "http://somewhere.com">
            <!ENTITY bar SYSTEM "http://somewhere-else.com" NDATA baz>
         ]>
         <root/>`,
         VID.ENTITYDECL_NO_NOTATION_DECLARATION,
         done!,
      );
   });

   it('reports an error when a notation name is declared more than once (§4.7.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!NOTATION bar SYSTEM "http://somewhere.com">
            <!NOTATION bar SYSTEM "http://somewhere-else.com">
         ]>
         <root/>`,
         VID.NOTATION_XTRA_DECLARATION,
         done!,
      );
   });
});
