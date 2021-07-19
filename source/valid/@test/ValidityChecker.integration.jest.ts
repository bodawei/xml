/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ErrorCollector, XmlErrorToken } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ContextType, ParseToken } from 'pToken';
import { PTokenStream } from '../../pTokenStream';
import { toSToken } from 'sToken';
import { STokenSource } from 'sToken';
import { AttFixerStream, EntityExpanderStream } from 'node';

import { ValidityChecker } from '../ValidityChecker';
import { ValidityError } from '../error/ValidityError';
import { validityConstraint } from '../error/validityConstraint';

const VID = validityConstraint.id;

describe('ValidityChecker (integration)', () => {
   let ec: ErrorCollector;
   let checker: ValidityChecker;
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      checker = new ValidityChecker();
   });

   function expectError(input: string, errorCode: string, done: () => void): void {
      const finalResults: Array<XmlErrorToken> = [];

      pTokenStream = new PTokenStream(new STokenSource(), {
         context: ContextType.DOCUMENT,
      });
      pTokenStream.addText(input);
      pTokenStream.endText();
      const entityExpander = new EntityExpanderStream(true);
      const attFixer = new AttFixerStream();

      pTokenStream.pipe(entityExpander).pipe(attFixer);

      gatherStreamResults<ParseToken>(attFixer, (results) => {
         for (const result of results) {
            ec = new ErrorCollector(
               'open' in result ? result.open : toSToken('foo'),
               ValidityError,
            );

            checker.checkPToken(result, ec);

            finalResults.push(...(ec.errors as any));
         }

         const targetError = finalResults.find((err) => err.id === errorCode);

         expect(targetError?.id).toEqual(errorCode || 'Unknown error code passed');
         done();
      });
   }

   it('reports an error the current context is a ELEMENT context, but we are not at the end', (done) => {
      expectError(
         `<?xml version="1.0"?>
      <!DOCTYPE root [
         <!ELEMENT one ANY>
         <!ELEMENT two ANY>
         <!ENTITY % CM '(one | two'>
         <!ELEMENT root %CM;>
      ]>
      <root/>`,
         ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
         done!,
      );
   });

   it('reports an Element Start error', (done) => {
      expectError(
         `<?xml version="1.0" standalone="yes"?>
         <!DOCTYPE root SYSTEM "./source/valid/@test/@entities/defaultAttributes.xml" [
            <!ELEMENT root ANY>
         ]>
         <root>
         </root>`,
         ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
         done!,
      );
   });

   it('reports a general entity reference error', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
         ]>
         <root>
           &I-Am-Not-Defined;
         </root>`,
         ValidityError.ID.GEREF_UNDEFINED,
         done!,
      );
   });

   it('reports a parameter entity reference error', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            %I-Am-Not-Defined;
         ]>
         <root/>`,
         ValidityError.ID.PEREF_UNDEFINED,
         done!,
      );
   });

   it('reports an error when the doctype does not match the root element (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT bar ANY>
         ]>
         <bar/>`,
         VID.ELEMENT_MISMATCH_ROOT_TYPE,
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

   it('reports an error when a parameter entity value does not include the whole of a conditional section (§2.8.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ENTITY % problem "<![INCLUDE[ foo> ">
            %problem; ]]>
         ]>
         <root/>`,
         VID.PEREF_INVALID_CONDITIONAL_START_NESTING,
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
         VID.ENTITYDECL_UNDECLARED_NOTATION,
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

   it('reports an error when a MIXED element declaration (§3.2.0)', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT root ANY>
            <!ELEMENT root ANY>
         ]>
         <root />`,
         VID.ELEMENT_EXTRA_DECLARATION,
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
         VID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
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
         VID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
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
         VID.ELEMENTSTART_ID_NAME_INVALID,
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
         VID.ELEMENTSTART_ID_DUPLICATE,
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
         VID.ELEMENTSTART_ID_DUPLICATE,
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
         VID.ATTLISTDECL_EXTRA_ID,
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
         VID.ATTLISTDECL_ID_BAD_DEFAULT,
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
         VID.ELEMENTSTART_IDREF_NOT_NAME,
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
         VID.ELEMENTSTART_IDREF_NO_ID,
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
         VID.ELEMENTSTART_ENTITIES_PARSED_ENTITY,
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
         VID.ATTLISTDECL_EMPTY_NOTATION,
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
         VID.ATTLISTDECL_BAD_NOTATION,
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
         VID.ELEMENTSTART_NOTATION_NOT_DECLARED,
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
         VID.ATTLISTDECL_DUPLICATE_NOTATION,
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
         VID.ATTLISTDECL_DUPLICATE_ENUMERATION,
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
         VID.ATTLISTDECL_EXTRA_NOTATION,
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
         VID.ELEMENTSTART_ENUMERATION_NOT_DECLARED,
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
         VID.ATTLISTDECL_BAD_IDREF_DEFAULT,
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
         VID.ATTLISTDECL_BAD_ENTITY_DEFAULT,
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
         VID.ATTLISTDECL_BAD_IDREFS_DEFAULT,
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
         VID.ATTLISTDECL_BAD_ENTITIES_DEFAULT,
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
         VID.ATTLISTDECL_BAD_NMTOKEN_DEFAULT,
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
         VID.ATTLISTDECL_BAD_NMTOKENS_DEFAULT,
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
         VID.ATTLISTDECL_BAD_NOTATION_DEFAULT,
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
         VID.ATTLISTDECL_BAD_ENUMERATION_DEFAULT,
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
         VID.ELEMENTSTART_INVALID_FIXED,
         done!,
      );
   });
});
