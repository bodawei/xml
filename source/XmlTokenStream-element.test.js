/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');

const makeLaxStream = require('./XmlTokenStream-util.test.js').makeLaxStream;
const makeLaxExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeLaxExternalSubsetStream;
const makeLaxExternalEntityStream = require('./XmlTokenStream-util.test.js').makeLaxExternalEntityStream;
const expectSyntaxError = require('./XmlTokenStream-util.test.js').expectSyntaxError;
const expectTokenType = require('./XmlTokenStream-util.test.js').expectTokenType;

describe('XmlTokenStream (element)', () => {
   let defaultLoc;
   let entityMetaData1dot1;
   let entityMetaData1dot0rev4;
   let entityMetaData1dot0rev5;

   /*
    * This set of tests validates whether our name validation code
    * works approximately correctly. This is assuming we do the same
    * validity checks for all names, so we only test it for elements
    */
   describe('name validity checks (whitebox)', () => {

      beforeEach(() => {
         defaultLoc = new EntityLocation();
         entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.1, 2, defaultLoc);
         entityMetaData1dot0rev4 = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 4, defaultLoc);
         entityMetaData1dot0rev5 = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, defaultLoc);
      });

      it('accepts an element name as a legal name if it is just letters', () => {
         const s = makeLaxExternalEntityStream('<one></one>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has a hyphen, period or digit in it', () => {
         const s = makeLaxExternalEntityStream('<on.-8></on.-8>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has the allowable chars above ascii in it', () => {
         const s = makeLaxExternalEntityStream('<o\u00B7\u0310\u2040e></o\u00B7\u0310\u2040e>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has an astral character in it (e.g. an emoji)', () => {
         const s = makeLaxExternalEntityStream('<o\uD83D\uDC04e></o\uD83D\uDC04e>');  // cow emoji

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name starts with an astral character (e.g. an emoji)', () => {
         const s = makeLaxExternalEntityStream('<\uD83D\uDC04moo></\uD83D\uDC04moo>');  // cow emoji

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has a bunch of the name chars in it', () => {
         const s = makeLaxExternalEntityStream('<ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1>' +
               '</ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has a uFDF1 in it', () => {
         const s = makeLaxExternalEntityStream('<o\uFDF1e></o\uFDF1e>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('rejects an element name if it has a $ in it', () => {
         expectSyntaxError('<o$e></o$e>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "o$e".');
      });

      it('rejects an element name if it starts with a digit', () => {
         expectSyntaxError('<9ne></9ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9ne".');
      });

      it('rejects an element name if it starts with a hyphen', () => {
         expectSyntaxError('<-ne></-ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "-ne".');
      });

      it('rejects an element name if it starts with a period', () => {
         expectSyntaxError('<.ne></.ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: ".ne".');
      });

      it('rejects an element name if it starts with a u00B7', () => {
         expectSyntaxError('<\u00B7ne></\u00B7ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u00B7ne".');
      });

      it('rejects an element name if it starts with a u0320', () => {
         expectSyntaxError('<\u0320ne></\u0320ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u0320ne".');
      });

      it('rejects an element name if it starts with a u2040', () => {
         expectSyntaxError('<\u2040></\u2040>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u2040".');
      });

      it('rejects an element name as a legal name if it has u03F4 in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<\u03F4ne></\u03F4ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u03F4ne".');
      });

      it('accepts an element name if it starts with a u03F4 in version 1.0/5', () => {
         const s = makeLaxStream('<\u03F4ne></\u03F4ne>', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name if it starts with a u03F4 in version 1.1', () => {
         const s = makeLaxStream('<\u03F4ne></\u03F4ne>', entityMetaData1dot1);

         expectTokenType(s, tokens.ElementStart);
      });

      it('rejects an element name as a legal name if it has u03F4 in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<\u03F4ne></\u03F4ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u03F4ne".');
      });

      it('rejects an element name that starts with some bad 1.0 characters in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<f\u0eceb></f\u0eceb>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "f\u0eceb".');
      });

      it('accepts an element name if it starts with a some bad 1.0 chars in version 1.0/5', () => {
         const s = makeLaxStream('<f\u0eceb></f\u0eceb>', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name if it starts with a some bad 1.0 chars in version 1.1', () => {
         const s = makeLaxStream('<f\u0eceb></f\u0eceb>', entityMetaData1dot1);

         expectTokenType(s, tokens.ElementStart);
      });

   });

   describe('nameToken validity checks (whitebox)', () => {

      beforeEach(() => {
         defaultLoc = new EntityLocation();
         entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2, defaultLoc);
         entityMetaData1dot0rev4 = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4, defaultLoc);
         entityMetaData1dot0rev5 = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5, defaultLoc);
      });

      it('accepts a nmToken as valid if it is just letters', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( name ) #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if it has a hyphen, period or digit in it', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( on.-8 )  #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with allowable chars above ascii in it', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u00B7\u0310\u2040e ) #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with an astral character in it (e.g. an emoji)', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \uD83D\uDC04e ) #IMPLIED>'); // emoji

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if it has a bunch of the name chars in it', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName NOTATION ( ' +
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_\u00CE' +
            '\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1 ) #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a uFDF1', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \uFDF1e ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('marks a word as a non-name token if it has a $ in it', () => {
         expectSyntaxError('<!ATTLIST e attrName ( o$e ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
            'The value in the enumeration in the attribute declaration must ' +
               'match the syntax for nmtokens. Found "o$e".');
      });

      it('accepts a nmToken as valid if starts with a digit', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9ne ) #REQUIRED >',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4, defaultLoc));

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a hyphen', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( -ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a period', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( .ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u00B7', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u00B7ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u0320', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u0320ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u2040', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u03F4 in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
            'The value in the enumeration in the attribute declaration must ' +
               'match the syntax for nmtokens. Found "\u2040ne".');
      });

      it('accepts a nmToken as valid if starts with a u03F4 in version 1.0/5', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u03F4 in version 1.1', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >', entityMetaData1dot1);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.0/4', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2Afoo ) #REQUIRED >', entityMetaData1dot0rev4);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.0/5', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2Afoo ) #REQUIRED >', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.1', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2Afoo ) #REQUIRED >', entityMetaData1dot1);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if it has some bad 1.0 chars in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<!ATTLIST e attrName ( 9._-:你\u0A2A\u0ecefoo ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
            'The value in the enumeration in the attribute declaration must ' +
               'match the syntax for nmtokens. Found "9._-:你\u0A2A\u0ecefoo".');
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.0/5', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2A\u0ecefoo ) #REQUIRED>', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.1', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2A\u0ecefoo ) #REQUIRED >', entityMetaData1dot1);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

   });

});
