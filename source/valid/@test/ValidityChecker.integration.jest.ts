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

         expect(targetError?.id).toEqual(errorCode);
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

   it('reports an Element End error if children of an element end before the context model says it should', (done) => {
      expectError(
         `<?xml version="1.0"?>
         <!DOCTYPE root [
            <!ELEMENT one ANY>
            <!ELEMENT two ANY>
            <!ELEMENT root (one , two)>
         ]>
         <root>
            <one>
            </one>
         </root>`,
         ValidityError.ID.ELEMENT_UNEXPECTED_END,
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

   it('reports an error when an ID attribute value does not match the name production (§3.3.1)', (done) => {
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
});
