/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const TextChunk = require('./TextChunk.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlToken = require('./XmlToken.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlEntityManager = require('./XmlEntityManager.js');

describe('XmlTokenStream', () => {

   function makeStringTokenArray(values, offset = 0) {
      const results = [];

      for (let index = 0; index < values.length; index++) {
         const length = values[index].text.length;
         values[index].startOffset = new Offset(0, offset, offset);
         values[index].endOffset = new Offset(0, offset + length, offset + length);

         results.push(values[index]);
         offset += length;
      }

      return results;
   }

   function makeLaxStream(str) {
      return makeStream(str, new XmlEntityManager(), { lax: true });
   }

   function makeStrictStream(str) {
      return makeStream(str, new XmlEntityManager(), {});
   }

   function makeStream(str, entityManager, options) {
      return new XmlTokenStream(new XmlStringCursor(str), entityManager, options);
   }

   function ignoreError(stream, errorCode) {
      const token = stream.getNext();
      expect(token.code).toEqual(errorCode);
   }

   function ignoreToken(stream, tokenType) {
      const token = stream.getNext();
      expect(token.type).toEqual(tokenType);
   }

   function compareXmlDeclAttribute(attr, name, value) {
      expect(attr.name).toEqual(name);
      if (value) {
         expect(attr.value).toEqual(value);
      } else {
         expect(attr.value).toBeUndefined();
      }
   }

   function compareAttribute(attr, name, value) {
      expect(attr.name).toEqual(name);
      expect(attr.value).toEqual(value ? [ new XmlToken(XmlToken.TEXT, value) ] : []);
   }

   function expectSyntaxError(input, code, message) {
      const strictS = makeStrictStream(input);
      const laxS = makeLaxStream(input);

      expect(() => {
         strictS.getNext();
      }).toThrowError(message);

      expect(laxS.getNext()).toBeSyntaxError(code);
   }

   describe('construction', () => {

      it('can be constructed with a cursor', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager());
         }).not.toThrow();
      });

      it('throws an error if called with no entity manager', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'));
         }).toThrowError('Must provide an XmlEntityManager instance.');
      });

      it('if passed no options, the defaults are used (whitebox)', () => {
         const s = new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager());

         expect(s._options).toEqual({
            lax: false,
            'lax:allowOpenAngleBracketsInAttributeValues': false
         });
      });

      it('stores the option if passed an option', () => {
         const s = new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager(), { lax: true });

         expect(s._options.lax).toEqual(true);

      });

      it('throws an error if passed an unknown option', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager(), { fish: true });
         }).toThrowError('"fish" is not a supported option name.');

      });

   });

   describe('hasNext()', () => {

      it('returns true if there is a token', () => {
         const s = makeStrictStream('<?two?>');

         expect(s.hasNext()).toEqual(true);
      });

      it('can ask multiple times', () => {
         const s = makeStrictStream('<?two?> ');

         expect(s.hasNext()).toEqual(true);
         expect(s.hasNext()).toEqual(true);
      });

      it('returns false if there is none', () => {
         const s = makeStrictStream('');

         expect(s.hasNext()).toEqual(false);
      });

   });

   describe('parsing whitespace', () => {

      it('retrieves a token of type SPACE', () => {
         const s = makeStrictStream(' \n  ');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SPACE);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream(' \t ');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.WithSpaceChunk(' \t ', ' \t ')
         ]));
      });

   });

   describe('parsing CharData', () => {

      it('retrieves a token of type CHARDATA', () => {
         const s = makeStrictStream('wow zowie ');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CHARDATA);
      });

      it('retrieves a token with the specified data', () => {
         const s = makeStrictStream('wow zowie ');

         const t = s.getNext();
         expect(t.data).toEqual('wow zowie ');
      });

      it('retrieves a token with the specified data up to the markup', () => {
         const s = makeStrictStream('wow <zowie> ');

         const t = s.getNext();
         expect(t.data).toEqual('wow ');
      });

      it('retrieves a token with the specified data up to a reference', () => {
         const s = makeStrictStream('wow &amp; ');

         const t = s.getNext();
         expect(t.data).toEqual('wow ');
      });

      it('throws an error if there is a ]]> in the CharData', () => {
         const s = makeStrictStream('blah blah ]]> blah');

         expect(() => {
            s.getNext();
         }).toThrowError('Found unexpected "]]>" in chardata.');
      });

      it('generates an error token if there is a ]]> in the CharData', () => {
         const s = makeLaxStream('testing testing ]]> testing');

         const t = s.getNext();
         expect(t).toEqualProps({
            type: XmlToken.SYNTAX_ERROR,
            code: XmlErrorToken.ERROR.CHARDATA_BAD_DATA
         });
      });

      it('includes the "]]>" as char data in lax mode', () => {
         const s = makeLaxStream('testing testing ]]>testing');
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_BAD_DATA);

         expect(s.getNext().data).toEqual('testing testing ');
         expect(s.getNext().data).toEqual(']]>');
         expect(s.getNext().data).toEqual('testing');
      });

      it('can read CharData not at the beginning of the cursor', () => {
         const s = makeStrictStream('<start>testing testing </start>');
         s.getNext();

         const t = s.getNext();
         expect(t.data).toEqual('testing testing ');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('wow zowie ');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.WithSpaceChunk('wow zowie ', 'wow zowie ')
         ]));
      });

   });

   describe('parsing character reference', () => {

      it('retrieves a token of type CHAR_REF', () => {
         const s = makeStrictStream('&#65;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CHAR_REF);
      });

      it('produces a token with the specified character using a decimal reference', () => {
         const s = makeStrictStream('&#65;');

         const t = s.getNext();
         expect(t.data).toEqual('A');
      });

      it('produces a token with the specified character using a hex reference', () => {
         const s = makeStrictStream('&#x4E;');

         const t = s.getNext();
         expect(t.data).toEqual('N');
      });

      it('reports an error if there is a space after the &', () => {
         const s = makeStrictStream('& #65;');

         expect(() => {
            s.getNext();
         }).toThrowError('Unexpected space after & in reference.');
      });

      it('generates an error token in lax mode if there is a space after the &', () => {
         const s = makeLaxStream('& #65;');

         const t = s.getNext();
         expect(t).toEqualProps({
            type: XmlToken.SYNTAX_ERROR,
            code: XmlErrorToken.ERROR.REFERENCE_ILLEGAL_SPACE
         });
      });

      it('reports an error if there is a space after the #', () => {
         const s = makeStrictStream('&# 65;');

         expect(() => {
            s.getNext();
         }).toThrowError('Unexpected space after # in character entity reference.');
      });

      it('generates an error token in lax mode if there is a space after the #', () => {
         const s = makeLaxStream('&# 65;');

         const t = s.getNext();
         expect(t).toBeSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_ILLEGAL_SPACE);
      });

      it('reports an error if the "x" in a hex reference is the wrong case', () => {
         const s = makeStrictStream('&#X41;');

         expect(() => {
            s.getNext();
         }).toThrowError('Case of the "x" in a hexadecimal character entity reference is wrong.');
      });

      it('generates an error token in lax mode if the "x" in a hex reference is the wrong case', () => {
         const s = makeLaxStream('&#X41;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CHAR_REFERENCE_HEX_CASE_WRONG);
      });

      it('reports an error if a space is found after the  "x" in a hex reference', () => {
         const s = makeStrictStream('&#x 41;');

         expect(() => {
            s.getNext();
         }).toThrowError('Unexpected space before digits in a character entity reference.');
      });

      it('generates an error token in lax mode if a space is found after the  "x" in a hex reference', () => {
         const s = makeLaxStream('&#x 41;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CHAR_REFERENCE_SPACE_BEFORE_DIGITS);
      });

      it('reports an error if no digits found in a character entity reference', () => {
         const s = makeStrictStream('&#;');

         expect(() => {
            s.getNext();
         }).toThrowError('No digits found in a character entity reference.');
      });

      it('generates an error token in lax mode if no digits found in a character entity reference', () => {
         const s = makeLaxStream('&#;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CHAR_REFERENCE_NO_DIGITS);
      });

      it('reports an error if space is found after digits in a character entity reference', () => {
         const s = makeStrictStream('&#12 ;');

         expect(() => {
            s.getNext();
         }).toThrowError('Unexpected spaces found after the digits of a character entity reference.');
      });

      it('generates an error token in lax mode if space is found after digits in a character entity reference', () => {
         const s = makeLaxStream('&#12 ;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CHAR_REFERENCE_SPACE_AFTER_DIGITS);
      });

      it('reports an error if space is found after digits in a character entity reference', () => {
         const s = makeStrictStream('&#12</end>');

         expect(() => {
            s.getNext();
         }).toThrowError('Semicolon missing from character entity reference.');
      });

      it('generates an error token in lax mode if space is found after digits in a character entity reference', () => {
         const s = makeLaxStream('&#12</end>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CHAR_REFERENCE_MISSING_SEMICOLON);
      });

      it('reports an error if hex digits found in a decimal character entity reference', () => {
         const s = makeStrictStream('&#4e;');

         expect(() => {
            s.getNext();
         }).toThrowError('A character entity reference was specified as decimal (&#digits;) but included hex digits.');
      });

      it('generates an error token in lax mode if space is found after digits in a character entity reference', () => {
         const s = makeLaxStream('&#4e;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF);
      });

      it('recognizes hex digits even if specified as decimal', () => {
         const s = makeLaxStream('&#4e;');
         ignoreError(s, XmlErrorToken.ERROR.CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF);

         expect(s.getNext().data).toEqual('N');
      });

      it('can read when not at the beginning of the cursor', () => {
         const s = makeStrictStream('<start>&#65;</start>');
         s.getNext();

         const t = s.getNext();
         expect(t.data).toEqual('A');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('&#x42;');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.PlainChunk('#'),
            new TextChunk.PlainChunk('x'),
            new TextChunk.DigitChunk('42', true),
            new TextChunk.PlainChunk(';')
         ]));
      });

   });

   describe('parsing entity reference', () => {

      it('throws an error if there is no entity name', () => {
         const s = makeStrictStream('&;');

         expect(() => {
            s.getNext();
         }).toThrowError('No entity name found.');
      });

      it('generates an error token in lax mode if there is no entity name', () => {
         const s = makeLaxStream('&;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.REFERENCE_NO_NAME);
      });

      it('throws an error if there is a space after the entity name', () => {
         const s = makeStrictStream('&frog ;');

         expect(() => {
            s.getNext();
         }).toThrowError('A space was found after the entity name "frog".');
      });

      it('generates an error token in lax mode if space is found after entity name', () => {
         const s = makeLaxStream('&frog ;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.REFERENCE_ILLEGAL_TRAILING_SPACE);
      });

      it('throws an error if there is no closing semicolon', () => {
         const s = makeStrictStream('&frog');

         expect(() => {
            s.getNext();
         }).toThrowError('A reference was found without a closing semicolon.');
      });

      it('generates an error token in lax mode if there is no closing semicolon', () => {
         const s = makeLaxStream('&frog ');
         ignoreError(s, XmlErrorToken.ERROR.REFERENCE_ILLEGAL_TRAILING_SPACE);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.REFERENCE_NO_SEMICOLON);
      });

      it('expands entitys', () => {
         const s = makeStrictStream('&quot;');
         const startToken = new XmlToken(XmlToken.ENTITY_START, 'quot');
         startToken.haveEntityData = true;

         let token = s.getNext();
         token.chunks = undefined;
         expect(token).toEqual(startToken);
         token = s.getNext();
         token.chunks = undefined;
         expect(token).toEqual(new XmlToken(XmlToken.CHARDATA, '"'));
         token = s.getNext();
         token.chunks = undefined;
         expect(token).toEqual(new XmlToken(XmlToken.ENTITY_END, 'quot'));

      });

      it('recognizes entities within entities', () => {
         const s = makeStrictStream('<root>&level1;</root>');
         s._entityManager.addEntity('level1', '<child>&level2;</child>');   // WHITE BOX
         s._entityManager.addEntity('level2', '&quot;&#x41;');

         let token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(token.name).toEqual('root');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('level1');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(token.name).toEqual('child');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('level2');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('quot');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.CHARDATA);
         expect(token.data).toEqual('"');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('quot');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.CHAR_REF);
         expect(token.data).toEqual('A');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('level2');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_END);
         expect(token.name).toEqual('child');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('level1');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_END);
         expect(token.name).toEqual('root');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('&lt;');

         let t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.WordChunk('lt', true),
            new TextChunk.PlainChunk(';')
         ]));

         t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.PlainChunk('#'),
            new TextChunk.DigitChunk('60', true),
            new TextChunk.PlainChunk(';')
         ]));

         t = s.getNext();
         expect(t.chunks).toEqual([]);
      });

   });

   describe('parsing CDATA', () => {

      it('retrieves a token of type CDATA', () => {
         const s = makeStrictStream('<![CDATA[ blah ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CDATA);
      });

      it('retrieves the content of the CDATA ', () => {
         const s = makeStrictStream('<![CDATA[ test data ]]>');

         expect(s.getNext().data).toEqual(' test data ');
      });

      it('retrieves the content of the CDATA, ignoring any embedded markup', () => {
         const s = makeStrictStream('<![CDATA[ test <?foo bar?> <!-- data --> <start></end> ]]>');

         expect(s.getNext().data).toEqual(' test <?foo bar?> <!-- data --> <start></end> ');
      });

      it('retrieves undefined as the value for an empty CDATA block', () => {
         const s = makeStrictStream('<![CDATA[]]>');

         expect(s.getNext().data).toBeUndefined();
      });

      it('throws an error if EOF found in middle', () => {
         const s = makeStrictStream('<![CDATA[junk comment');

         expect(() => {
            s.getNext();
         }).toThrowError('Closing ]]> not found for CDATA section.');
      });

      it('generates an error token in lax mode if EOF found in middle', () => {
         const s = makeLaxStream('<![CDATA[junk comment');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CDATA_MISSING_CLOSE);
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxStream('<![CDATA[ junk cdata');
         ignoreError(s, XmlErrorToken.ERROR.CDATA_MISSING_CLOSE);

         expect(s.getNext().data).toEqual(' junk cdata');
      });

      it('throws an error if space found before first square bracket', () => {
         const s = makeStrictStream('<! [CDATA[junk comment ]]>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before opening "[".');
      });

      it('generates an error token in lax mode if EOF found in middle', () => {
         const s = makeLaxStream('<! [CDATA[junk comment ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.SPACE_BEFORE_SQUARE_BRACKET);
      });

      it('throws an error if space found before CDATA', () => {
         const s = makeStrictStream('<![   CDATA[junk comment ]]>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before CDATA.');
      });

      it('generates an error token in lax mode if space found CDATA', () => {
         const s = makeLaxStream('<![ CDATA[junk comment ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CDATA_SPACE_BEFORE_NAME);
      });

      it('throws an error if space found after CDATA', () => {
         const s = makeStrictStream('<![CDATA    [junk comment ]]>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after CDATA.');
      });

      it('generates an error token in lax mode if space found after CDATA', () => {
         const s = makeLaxStream('<![CDATA   [junk comment ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CDATA_SPACE_AFTER_NAME);
      });

      it('throws an error if CDATA has wrong case', () => {
         const s = makeStrictStream('<![cDaTa[junk comment ]]>');

         expect(() => {
            s.getNext();
         }).toThrowError('"CDATA" must be all capital. found "cDaTa".');
      });

      it('generates an error token in lax mode if space found after CDATA', () => {
         const s = makeLaxStream('<![cdata[junk comment ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.CDATA_NOT_CAPITALIZED);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<![CDATA[ one ]]>');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('['),
            new TextChunk.WordChunk('CDATA', true),
            new TextChunk.PlainChunk('['),
            new TextChunk.WithSpaceChunk(' one ', ' one '),
            new TextChunk.PlainChunk(']]>')
         ]));
      });

   });

   describe('parsing BangItem', () => {

      it('reports an error if an unknown bang item found', () => {
         const s = makeStrictStream('<!FISH ');

         expect(() => {
            s.getNext();
         }).toThrowError('Unsupported "<!" item.');
      });

      it('reports an error if an unknown name appears in a <![xxx[ construction', () => {
         const s = makeStrictStream('<![Test[');

         expect(() => {
            s.getNext();
         }).toThrowError('Unknown Bang-bracket item. Found "Test".');
      });

      it('generates an error token in lax mode if an unknown name appears in a <![xxx[ construction', () => {
         const s = makeLaxStream('<![Testing[ ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.BANGITEM_UNKNOWN_BRACKET_NAME);
      });

      it('reports an error if there is no name provided', () => {
         const s = makeStrictStream('<![[');

         expect(() => {
            s.getNext();
         }).toThrowError('No target name provided in the <![name[ construction.');
      });

      it('generates an error token in lax mode if there is no name provided', () => {
         const s = makeLaxStream('<![[ ]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.BANGITEM_NO_NAME);
      });

      it('generates an error token in lax mode if EOF in the middle of the constructon', () => {
         const s = makeLaxStream('<![');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.BANGITEM_NO_NAME);
      });

      it('reports an error if there is no second square bracket', () => {
         const s = makeStrictStream('<![Name ]]>');

         expect(() => {
            s.getNext();
         }).toThrowError('Second square bracket missing.');
      });

      it('generates an error token in lax mode if there is no second square bracket', () => {
         const s = makeLaxStream('<![Testing]]>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.BANGITEM_MISSING_SECOND_SQUARE);
      });

      it('generates an error token in lax mode if there is an EOF before the second [', () => {
         const s = makeLaxStream('<![Testing');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.BANGITEM_MISSING_SECOND_SQUARE);
      });

      it('reports an error if a space is found before the name', () => {
         const s = makeStrictStream('<! NAME>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before name in a <!...> declaration.');
      });

      it('generates an error token in lax mode if there is no second square bracket', () => {
         const s = makeLaxStream('<! NAME>');

         expect(s.getNext()).toBeSyntaxError(XmlErrorToken.ERROR.BANGITEM_EXTRA_LEADING_SPACE);
      });

      it('reports an error if there is no name for the bang item', () => {
         const s = makeStrictStream('<!>');

         expect(() => {
            s.getNext();
         }).toThrowError('No declaration found in an <!...> declaration.');
      });

      it('generates an error token in lax mode if there is no name for the bang item', () => {
         const s = makeLaxStream('<!>');

         expect(s.getNext()).toBeSyntaxError(XmlErrorToken.ERROR.BANGITEM_NO_TYPE);
      });

      it('reports an error if the type name is the wrong case', () => {
         const s = makeStrictStream('<!docType >');

         expect(() => {
            s.getNext();
         }).toThrowError('Expected to find "DOCTYPE" but found "docType".');
      });

      it('generates an error token in lax mode if the type name is the wrong case', () => {
         const s = makeLaxStream('<!doctype>');

         expect(s.getNext()).toBeSyntaxError(XmlErrorToken.ERROR.BANGITEM_WRONG_CASE);
      });

      it('reports a syntax error if no space after the declaration name', () => {
         expectSyntaxError('<!DOCTYPE>',
            XmlErrorToken.ERROR.DECLARATION_MISSING_SPACE_AFTER_NAME,
            'No space found after the declaration name "DOCTYPE".');
      });

   });

   describe('parsing DOCTYPE', () => {

      it('retrieves a token of type DOCTYPE', () => {
         const s = makeStrictStream('<!DOCTYPE one >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.DOCTYPE);
      });

      it('retrieves the name of the doctype', () => {
         const s = makeStrictStream('<!DOCTYPE testType >');

         expect(s.getNext().name).toEqual('testType');
      });

      it('retrieves an empty internal subset if there is none specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType >');

         expect(s.getNext().internalDtd).toEqual([]);
      });

      it('retrieves an empty internal subset if an empty one is specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType [ ] >');

         expect(s.getNext().internalDtd).toEqual([]);
      });

      it('reports a syntax error if the actual type name is not a name', () => {
         expectSyntaxError('<!DOCTYPE $frog [ ] >',
            XmlErrorToken.ERROR.DOCTYPE_TYPE_NOT_NAME,
            'The name of the DOCTYPE does not match the syntax for names. Found: "$frog".');
      });

      it('reports a syntax error if there is no DOCTYPE name', () => {
         expectSyntaxError('<!DOCTYPE [ ] >',
            XmlErrorToken.ERROR.DOCTYPE_NO_NAME, 'There was no name name for the DOCTYPE.');
      });

      it('reports a syntax error if there is no closing > for the DOCTYPE', () => {
         expectSyntaxError('<!DOCTYPE foo ',
            XmlErrorToken.ERROR.DOCTYPE_MISSING_CLOSE_BRACKET,
            'The closing "<" for the DOCTYPE could not be found.');
      });

      it('includes junk tokens in DocType token', () => {
         const s = makeLaxStream('<!DOCTYPE foo fish>');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_UNKNOWN_ID);
         ignoreError(s, XmlErrorToken.ERROR.DOCTYPE_EXTRA_JUNK);

         const t = s.getNext();
         expect(t.junk.length).toEqual(1);
         expect(t.junk[0].text).toEqual('fish');
      });

      it('includes junk tokens in DocType token when there is more than one word', () => {
         const s = makeLaxStream('<!DOCTYPE foo fish are fun>');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_UNKNOWN_ID);
         ignoreError(s, XmlErrorToken.ERROR.DOCTYPE_EXTRA_JUNK);

         const t = s.getNext();
         expect(t.junk.length).toEqual(2);
         expect(t.junk[0].text).toEqual('fish');
         expect(t.junk[1].text).toEqual(' are fun');
      });

   });

   describe('parsing NOTATION', () => {

      it('retrieves a token of type NOTATION', () => {
         const s = makeStrictStream('<!NOTATION notationName PUBLIC "foo" >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.NOTATION);
      });

      it('retrieves the name of the notation', () => {
         const s = makeStrictStream('<!NOTATION notationName PUBLIC "foo">');

         expect(s.getNext().name).toEqual('notationName');
      });

      it('retrieves the name of the notation', () => {
         const s = makeStrictStream('<!NOTATION notationName PUBLIC "foo">');

         expect(s.getNext().name).toEqual('notationName');
      });

      it('reports a syntax error if there is no space after the notation name', () => {
         expectSyntaxError('<!NOTATION >',
            XmlErrorToken.ERROR.NOTATION_MISSING_NAME,
            'No name found for a notation declaration.');
      });

      it('gives the notation token an empty name if none is specified', () => {
         const s = makeLaxStream('<!NOTATION >');
         ignoreError(s, XmlErrorToken.ERROR.NOTATION_MISSING_NAME);
         ignoreError(s, XmlErrorToken.ERROR.NOTATION_MISSING_SPACE_AFTER_NAME);
         ignoreError(s, XmlErrorToken.ERROR.NOTATION_MISSING_EXTERNALID);
         ignoreError(s, XmlErrorToken.ERROR.NOTATION_NAME_NOT_NAME);

         expect(s.getNext().name).toEqual('');
      });

      it('includes junk tokens in notation token', () => {
         const s = makeLaxStream('<!NOTATION myNotation fish>');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_UNKNOWN_ID);
         ignoreError(s, XmlErrorToken.ERROR.NOTATION_EXTRA_JUNK);

         const t = s.getNext();
         expect(t.junk.length).toEqual(1);
         expect(t.junk[0].text).toEqual('fish');
      });

      it('includes junk tokens in notation token when there is more than one word', () => {
         const s = makeLaxStream('<!NOTATION myNotation fish are fun>');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_UNKNOWN_ID);
         ignoreError(s, XmlErrorToken.ERROR.NOTATION_EXTRA_JUNK);

         const t = s.getNext();
         expect(t.junk.length).toEqual(2);
         expect(t.junk[0].text).toEqual('fish');
         expect(t.junk[1].text).toEqual(' are fun');
      });

      it('reports a syntax error if there is no space after the notation name', () => {
         expectSyntaxError('<!NOTATION frog>',
            XmlErrorToken.ERROR.NOTATION_MISSING_SPACE_AFTER_NAME,
            'No space found after the notation name "frog".');
      });

      it('reports a syntax error if the actual type name is not a name', () => {
         expectSyntaxError('<!NOTATION $frog PUBLIC "foo">',
            XmlErrorToken.ERROR.NOTATION_NAME_NOT_NAME,
            'The name of the NOTATION does not match the syntax for names. Found: "$frog".');
      });

      it('reports a syntax error if no externalId or publicId is provided', () => {
         expectSyntaxError('<!NOTATION notationName >',
            XmlErrorToken.ERROR.NOTATION_MISSING_EXTERNALID,
            'The ExternalID or PublicId for the notation "notationName" declaration is missing.');
      });

      it('reports a syntax error if there is no name', () => {
         expectSyntaxError('<!NOTATION PUBLIC "foo">',
            XmlErrorToken.ERROR.NOTATION_MISSING_EXTERNALID,
            'The ExternalID or PublicId for the notation "PUBLIC" declaration is missing.');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!NOTATION notationName PUBLIC "foo" ',
            XmlErrorToken.ERROR.NOTATION_MISSING_CLOSE_BRACKET,
            'The closing ">" for the notation "notationName" could not be found.');
      });

   });

   describe('parsing ExternalId', () => {

      it('retrieves only a systemLiteral when SYSTEM is specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType SYSTEM "./system.xml" [ ] >');

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('./system.xml');
         expect(t.pubidLiteral).toBeUndefined();
      });

      it('retrieves both a systemLiteral and a pubidLiteral when PUBLIC specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC "public" "./system.xml" [ ] >');

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('public');
         expect(t.systemLiteral).toEqual('./system.xml');
      });

      it('retrieves a systemLiteral in single quotes', () => {
         const s = makeStrictStream('<!DOCTYPE testType SYSTEM \'./system.xml\' [ ] >');

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('./system.xml');
         expect(t.pubidLiteral).toBeUndefined();
      });

      it('retrieves both a systemLiteral and a pubidLiteral in single quotes', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC \'public\' \'./system.xml\' [ ] >');

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('public');
         expect(t.systemLiteral).toEqual('./system.xml');
      });

      it('retrieves zero length publicID and system literals', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC "" "" [ ] >');

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('');
         expect(t.systemLiteral).toEqual('');
      });

      it('reports a syntax error if the pubidLiteral is not quoted', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC pubid "system" [ ] >',
            XmlErrorToken.ERROR.PUBIDLITERAL_NOQUOTE,
            'The pubidLiteral was not quoted.');
      });

      it('reports a syntax error if the systemLiteral is not quoted', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid" system [ ] >',
            XmlErrorToken.ERROR.SYSTEMLITERAL_NOQUOTE,
            'The systemLiteral was not quoted.');
      });

      it('retrieves the publicID and system literals even when unquoted', () => {
         const s = makeLaxStream('<!DOCTYPE testType PUBLIC one two [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.PUBIDLITERAL_NOQUOTE);
         ignoreError(s, XmlErrorToken.ERROR.SYSTEMLITERAL_NOQUOTE);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('one');
         expect(t.systemLiteral).toEqual('two');
      });

      it('reports a syntax error if the public id has illegal characters', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC \'"\' "system" [ ] >',
            XmlErrorToken.ERROR.PUBIDLITERAL_BAD_CHARS,
            'The public id had """ which is not a legal character.');
      });

      it('reports a syntax error if the public id has some legal and some illegal characters', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "ABCDE{" "system" [ ] >',
            XmlErrorToken.ERROR.PUBIDLITERAL_BAD_CHARS,
            'The public id had "{" which is not a legal character.');
      });

      it('retrieves the publicID literal even when it has illegal characters', () => {
         const s = makeLaxStream('<!DOCTYPE testType PUBLIC "ABCDE{" "two" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.PUBIDLITERAL_BAD_CHARS);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('ABCDE{');
      });

      it('throws no error if the public id has all legal characters', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC " \n\r-\'()+,./:=?;!*#@$_%' +
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"  "system" [ ] >');

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('reports a syntax error if PUBLIC is the wrong case', () => {
         expectSyntaxError('<!DOCTYPE testType PuBliC "pubid" "system" [ ] >',
            XmlErrorToken.ERROR.DOCTYPE_PARAM_BAD_CASE,
            'The PUBLIC label on a DOCTYPE was not all upper case ("PuBliC").');
      });

      it('retrieves the publicID literal even when PUBLIC is the wrong case', () => {
         const s = makeLaxStream('<!DOCTYPE testType public "ABCDE" "two" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.DOCTYPE_PARAM_BAD_CASE);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('ABCDE');
      });

      it('reports a syntax error if SYSTEM is the wrong case', () => {
         expectSyntaxError('<!DOCTYPE testType SYStem "system" [ ] >',
            XmlErrorToken.ERROR.DOCTYPE_PARAM_BAD_CASE,
            'The SYSTEM label on a DOCTYPE was not all upper case ("SYStem").');
      });

      it('retrieves the systemLiteral literal even when SYSTEM is the wrong case', () => {
         const s = makeLaxStream('<!DOCTYPE testType system "ABCDE" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.DOCTYPE_PARAM_BAD_CASE);

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('ABCDE');
      });

      it('reports a syntax error if no space between the pubid and system', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid""system" [ ] >',
            XmlErrorToken.ERROR.PUBLIC_NO_SPACE,
            'No space was found beteen the publidLiteral and the systemLiteral.');
      });

      it('reports a syntax error if no space between SYSTEM and the literal', () => {
         expectSyntaxError('<!DOCTYPE testType SYSTEM"system" [ ] >',
            XmlErrorToken.ERROR.SYSTEM_NO_LEADING_SPACE,
            'No space was found beteen SYSTEM and the systemLiteral.');
      });

      it('reports a syntax error if no space between PUBLIC and the literal', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC"pubid" "system" [ ] >',
            XmlErrorToken.ERROR.PUBLIC_NO_LEADING_SPACE,
            'No space was found beteen PUBLIC and the pubidLiteral.');
      });

      it('retrieves the systemLiterals even when spaces missing', () => {
         const s = makeLaxStream('<!DOCTYPE testType SYSTEM"one" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.SYSTEM_NO_LEADING_SPACE);

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('one');
      });

      it('retrieves the publicID and system literals even when spaces missing', () => {
         const s = makeLaxStream('<!DOCTYPE testType PUBLIC"one""two" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.PUBLIC_NO_LEADING_SPACE);
         ignoreError(s, XmlErrorToken.ERROR.PUBLIC_NO_SPACE);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('one');
         expect(t.systemLiteral).toEqual('two');
      });

      it('reports a syntax error if there is an unknown type of external id', () => {
         expectSyntaxError('<!DOCTYPE testType FOO [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_UNKNOWN_ID,
            'The ExternalID on a DOCTYPE had an unknown source type ("FOO").');
      });

      it('reports a syntax error if systemLiteral is missing from a PUBLIC externalId', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid" [ ] >',
            XmlErrorToken.ERROR.SYSTEMLITERAL_MISSING,
            'No systemLiteral was found.');
      });

      it('reports no syntax error if systemLiteral is missing, but this is a PublicID', () => {
         const s = makeStrictStream('<!NOTATION testType PUBLIC "pubid" >');

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('reports a syntax error if systemLiteral is missing from a SYSTEM externalId', () => {
         expectSyntaxError('<!DOCTYPE testType SYSTEM [ ] >',
            XmlErrorToken.ERROR.SYSTEMLITERAL_MISSING,
            'No systemLiteral was found.');
      });

      it('reports a syntax error if pubIdLiteral is missing from a PUBLIC externalId', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC [ ] >',
            XmlErrorToken.ERROR.PUBIDLITERAL_MISSING,
            'No pubIdLiteral was found.');
      });

   });

   describe('parsing comments', () => {

      it('retrieves a token of type COMMENT', () => {
         const s = makeStrictStream('<!-- one -->');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.COMMENT);
      });

      it('retrieves the content of the comment', () => {
         const s = makeStrictStream('<!-- one -->');

         expect(s.getNext().content).toEqual(' one ');
      });

      it('retrieves undefined as the value for an empty comment', () => {
         const s = makeStrictStream('<!---->');

         expect(s.getNext().content).toBeUndefined();
      });

      it('throws an error if no --> found', () => {
         const s = makeStrictStream('<!--junk comment');

         expect(() => {
            s.getNext();
         }).toThrowError('Closing --> not found for comment.');
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxStream('<!--junk comment');

         ignoreError(s, XmlErrorToken.ERROR.COMMENT_MISSING_END);
         expect(s.getNext().content).toEqual('junk comment');
      });

      it('throws an error if comment ends with a -', () => {
         const s = makeStrictStream('<!--junk comment--->');

         expect(() => {
            s.getNext();
         }).toThrowError('Comment should not end with a hyphen.');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<!-- one -->');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!--'),
            new TextChunk.WithSpaceChunk(' one ', ' one '),
            new TextChunk.PlainChunk('-->')
         ]));
      });

   });

   describe('parsing processing instruction', () => {

      it('retrieves a token of type PI', () => {
         const s = makeStrictStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.PI);
      });

      it('retrieves a token with the right target name', () => {
         const s = makeStrictStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         const t = s.getNext();
         expect(t.target).toEqual('foo');
      });

      it('retrieves a token with the right target content', () => {
         const s = makeStrictStream('<?foo blah blah boo boo !@#$%^&^*()_+ ?>');

         const t = s.getNext();
         expect(t.content).toEqual('blah blah boo boo !@#$%^&^*()_+ ');
      });

      it('retrieves one with no content', () => {
         const s = makeStrictStream('<?foo?>');

         const t = s.getNext();
         expect(t.content).toBeUndefined();
      });

      it('allows whitespace but no content', () => {
         const s = makeStrictStream('<?foo    ?>');

         const t = s.getNext();
         expect(t.content).toBeUndefined();
      });

      it('throws an error if no ?> found', () => {
         const s = makeStrictStream('<?foo glorky');

         expect(() => {
            s.getNext();
         }).toThrowError('Closing ?> not found for processing instruction.');
      });

      it('returns the content up to EOF if no ?> found in lax mode', () => {
         const s = makeLaxStream('<?foo glorky');
         ignoreError(s, XmlErrorToken.ERROR.PI_NO_TERMINATOR);

         expect(s.getNext().content).toEqual('glorky');
      });

      it('throws an error if a space is between the <? and the target', () => {
         const s = makeStrictStream('<? foo glorky?>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before processing intruction target.');
      });

      it('throws an error if the name does not match the name syntax', () => {
         const s = makeStrictStream('<?frog$ glorky?>');

         expect(() => {
            s.getNext();
         }).toThrowError('The target name does not match the syntax for names. Found: "frog$".');
      });

      it('throws an error if there is no target', () => {
         const s = makeStrictStream('<??>');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing target name in processing instruction.');
      });

      it('generates an error token if a there is no target', () => {
         const s = makeLaxStream('<??>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.PI_NO_TARGET);
      });

   });

   describe('parsing XML Declaration', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('retrieves the number of parameters in the declaration', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t.params.length).toEqual(3);
      });

      it('retrieves parameters in order', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii');
         compareXmlDeclAttribute(t.params[2], 'standalone', 'yes');
      });

      it('allows a space between the <? and the target if in lax mode', () => {
         const s = makeLaxStream('<? xml version="1.1"?>');

         let t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('throws an error if a space is between the <? and the target if in strict mode', () => {
         const s = makeStrictStream('<? xml version="1.1"?>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before processing intruction target.');
      });

      it('allows the xml after <? to be any case in lax mode', () => {
         const s = makeLaxStream('<?XmL version="1.1"?>');

         let t = s.getNext();
         expect(t.code).toEqual(XmlErrorToken.ERROR.XML_NOT_LOWERCASE);
         t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('throws an error the xml after <? is in mixed case if in strict mode', () => {
         const s = makeStrictStream('<?XmL version="1.1"?>');

         expect(() => {
            s.getNext();
         }).toThrowError('The xml target name was not all lower case (XmL).');
      });

      it('allows < in a values even if lax:allowOpenAngleBracketsInAttributeValues is false', () => {
         const s = makeStream('<?xml version="1.1" encoding="frog<"?>', new XmlEntityManager(), {
            lax: true,
            'lax:allowOpenAngleBracketsInAttributeValues': false
         });

         expect(s.getNext().code).toEqual(XmlErrorToken.ERROR.BAD_ENCODING);
      });

      describe('"attribute" equal signs', () => {

         it('accepts spaces around the equal signs, as per the spec', () => {
            const s = makeStrictStream('<?xml version =         "1.1"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no equal sign', () => {
            const s = makeStrictStream('<?xml version "1.1"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('No equal sign found for an attribute.');
         });

         it('accepts the lack of an equal sign in lax mode', () => {
            const s = makeLaxStream('<?xml version "1.1"?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

      });

      describe('"attribute" quotes', () => {

         it('accepts single quotes', () => {
            const s = makeStrictStream('<?xml version =\'1.1\'?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('accepts double quotes', () => {
            const s = makeStrictStream('<?xml version ="1.1"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no quote', () => {
            const s = makeStrictStream('<?xml version=1.1 ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('No quote found for an attribute.');
         });

         it('throws no error in lax mode', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');

            const t = s.getNext();

            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
         });

         it('makes the best guess for the attr value if no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no equal and no quotes', () => {
            const s = makeLaxStream('<?xml version 1.1?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.BAD_VERSION);
            ignoreError(s, XmlErrorToken.ERROR.UNKNOWN_ATTR);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', undefined);
         });

      });

      it('throws an error if there is no space after a value', () => {
         const s = makeStrictStream('<?xml version="1.1"encoding="usascii" standalone="yes"?>');

         expect(() => {
            s.getNext();
         }).toThrowError('There must be a space before an attribute name.');
      });

      it('throws an error if no parameters are included', () => {
         const s = makeStrictStream('<?xml ?>');

         expect(() => {
            s.getNext();
         }).toThrowError('There must be at least a version specified for an XML Declaration.');
      });

      it('throws an error if an unknown parameter is provided', () => {
         const s = makeStrictStream('<?xml bogus="frog"?>');

         expect(() => {
            s.getNext();
         }).toThrowError('Unknown XML Declaration parameter "bogus".');
      });

      it('throws an error if the close is missing and not lax', () => {
         const s = makeStrictStream('<?xml version="1.0"');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing ?> on XML Declaration.');
      });

      it('reports an error if the close is missing and lax', () => {
         const s = makeLaxStream('<?xml version="1.0"');

         const token = s.getNext();
         expect(token.code).toEqual(XmlErrorToken.ERROR.MISSING_XMLDECL_CLOSE);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii"  ?>');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<?'),
            new TextChunk.WordChunk('xml', true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.WordChunk('version', true),
            new TextChunk.PlainChunk('='),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('1.1', '1.1'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.WordChunk('encoding', true),
            new TextChunk.PlainChunk('='),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('usascii', 'usascii'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('  ', '  '),
            new TextChunk.PlainChunk('?>')
         ]));
      });

      describe('version parameter', () => {

         it('accepts a value of "1.0"', () => {
            const s = makeStrictStream('<?xml version="1.0"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.0');
         });

         it('accepts a value of "1.1"', () => {
            const s = makeStrictStream('<?xml version="1.1"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws a syntax error if version is not a supported value', () => {
            const s = makeStrictStream('<?xml version="1.2" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"version" must be "1.0" or "1.1" but found "1.2".');
         });

         it('reports version in wrong position as second syntax error', () => {
            const s = makeLaxStream('<?xml encoding="usascii" version="1.1" ?>');

            s.getNext();
            const second = s.getNext();

            expect(second.message).toEqual('"version" attribute should be at position #0 but was at #1.');
         });

         it('throws a syntax error if version is not the right case', () => {
            const s = makeStrictStream('<?xml VeRsIoN="1.1" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"version" must be lower case, but found "VeRsIoN".');
         });

         it('accepts the wrong case for version if lax', () => {
            const s = makeLaxStream('<?xml  VERSION="1.1" ?>');

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE);
         });

      });

      describe('encoding parameter', () => {

         it('accepts a value of "usascii0"', () => {
            const s = makeStrictStream('<?xml version="1.1"   encoding="usascii0"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii0');
         });

         it('throws a syntax error if encoding is not rightly encoded', () => {
            const s = makeStrictStream('<?xml version="1.1" encoding="bogus$"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"encoding" must be alphanumerics, but found "bogus$".');
         });

         it('throws a syntax error if encoding starts with a bad character', () => {
            const s = makeStrictStream('<?xml version="1.1" encoding="0usascii"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"encoding" must be alphanumerics, but found "0usascii".');
         });

         it('throws an error if encoding found in the wrong position', () => {
            const s = makeStrictStream('<?xml encoding="frog" version="1.1" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('encoding attribute in the wrong position. Should be after version, but was #0.');
         });

         it('throws a syntax error if is not the right case', () => {
            const s = makeStrictStream('<?xml version="1.1" EnCoDiNG="bogys" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"encoding" must be lower case, but found "EnCoDiNG".');
         });

         it('accepts the wrong case if lax', () => {
            const s = makeLaxStream('<?xml  version="1.1" ENCODING="usascii" ?>');

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE);
         });

      });

      describe('standalone parameter', () => {

         it('accepts a value of "no"', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="no"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[1], 'standalone', 'no');
         });

         it('accepts a value of "yes"', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="yes"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[1], 'standalone', 'yes');
         });

         it('throws an error if standalone in the wrong position', () => {
            const s = makeStrictStream('<?xml standalone="frog" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('standalone attribute in the wrong position. Should be #1 or #2, but was #0.');
         });

         it('throws a syntax error if standalone is not yes or no', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="bogus"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"standalone" must be "yes" or "no" but found "bogus".');
         });

         it('throws a syntax error if is not the right case', () => {
            const s = makeStrictStream('<?xml version="1.1" STANDaLoNE="yes" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"standalone" must be lower case, but found "STANDaLoNE".');
         });

         it('accepts the wrong case if lax', () => {
            const s = makeLaxStream('<?xml  version="1.1" STANDALONE="no" ?>');

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE);
         });

         it('accepts the wrong case for parameter if lax', () => {
            const s = makeLaxStream('<?xml  version="1.1" standalone="NO" ?>');

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_STANDALONE_WRONG_CASE);
         });

         it('produces a useful message if parameter is the wrong case', () => {
            const s = makeLaxStream('<?xml  version="1.1" standalone="yEs" ?>');

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.message).toEqual('"yes" must be lower case, but found "yEs".');
         });

      });

   });

   describe('parsing start element tags', () => {

      it('retrieves a token of type START_ELEMENT', () => {
         const s = makeStrictStream('<name>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_START);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictStream('<name>');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves the name with a slash in it in lax mode', () => {
         const s = makeLaxStream('<n/ame>');
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_BAD_NAME);

         const t = s.getNext();
         expect(t.name).toEqual('n/ame');
      });

      it('retrieves an empty name if there is no name in the start tag', () => {
         const s = makeLaxStream('<>');

         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows S after the name', () => {
         const s = makeStrictStream('<name     >');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if a space is found after the <', () => {
         const s = makeStrictStream('< name>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after opening of an element tag.');
      });

      it('generates an error token if a space is found after the <', () => {
         const s = makeLaxStream('< name>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      });

      it('throws an error if the name is not a name', () => {
         const s = makeStrictStream('<9name>');

         expect(() => {
            s.getNext();
         }).toThrowError('The element name does not match the syntax for names. Found: "9name".');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeLaxStream('<9name>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_BAD_NAME);
      });

      it('generates an error token if > is missing', () => {
         const s = makeLaxStream('<name');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      });

      it('throws an error if name is missing', () => {
         const s = makeStrictStream('<>');

         expect(() => {
            s.getNext();
         }).toThrowError('Name missing in element tag.');
      });

      it('generates an error token if name is missing', () => {
         const s = makeLaxStream('<>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      });

      describe('with attributes', () => {

         it('can parse basic attributes', () => {
            const s = makeLaxStream('<elemName attr1="one" attr2="two">');

            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'one') ],
               quoteType: '"'
            }, {
               name: 'attr2',
               value: [ new XmlToken(XmlToken.TEXT, 'two') ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes using single quotes', () => {
            const s = makeLaxStream('<elemName attr1=\'one\' attr2=\'two\'>');

            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'one') ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new XmlToken(XmlToken.TEXT, 'two') ],
               quoteType: '\''
            } ]);
         });

         it('can parse attributes with whitespace around the equals', () => {
            const s = makeLaxStream('<elemName\n\tattr1\t\n=   \'one\' attr2   =\r\n\t "two">');

            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'one') ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new XmlToken(XmlToken.TEXT, 'two') ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference in the value', () => {
            const s = makeStrictStream('<elemName attr1="tw&#x41;o">');

            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  new XmlToken(XmlToken.CHAR_REF, 'A'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference at the start of the value', () => {
            const s = makeStrictStream('<elemName attr1="&#x41; test">');

            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [
                  new XmlToken(XmlToken.CHAR_REF, 'A'),
                  new XmlToken(XmlToken.TEXT, ' test')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference at the end of the value', () => {
            const s = makeStrictStream('<elemName attr1="tw&#x41;">');

            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  new XmlToken(XmlToken.CHAR_REF, 'A')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with an entity reference in the value', () => {
            const s = makeStrictStream('<elemName attr1="tw&quot;o">');
            const start = new XmlToken(XmlToken.ENTITY_START, 'quot');
            start.haveEntityData = true;

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  start,
                  new XmlToken(XmlToken.TEXT, '"'),
                  new XmlToken(XmlToken.ENTITY_END, 'quot'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with an entity references in entity references', () => {
            const s = makeStrictStream('<elemName attr1="tw&foo;o">');
            s._entityManager.addEntity('foo', '<bar>&one;</bar>');   // WHITE BOX
            s._entityManager.addEntity('one', '&quot;&#x41;');
            const t = s.getNext();
            const startFoo = new XmlToken(XmlToken.ENTITY_START, 'foo');
            startFoo.haveEntityData = true;
            const startOne = new XmlToken(XmlToken.ENTITY_START, 'one');
            startOne.haveEntityData = true;
            const startQuot = new XmlToken(XmlToken.ENTITY_START, 'quot');
            startQuot.haveEntityData = true;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  startFoo,
                  new XmlToken(XmlToken.TEXT, '<bar>'),
                  startOne,
                  startQuot,
                  new XmlToken(XmlToken.TEXT, '"'),
                  new XmlToken(XmlToken.ENTITY_END, 'quot'),
                  new XmlToken(XmlToken.CHAR_REF, 'A'),
                  new XmlToken(XmlToken.ENTITY_END, 'one'),
                  new XmlToken(XmlToken.TEXT, '</bar>'),
                  new XmlToken(XmlToken.ENTITY_END, 'foo'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('will accept a reference to an unknown entity', () => {
            const s = makeStrictStream('<elemName attr1="tw&test;o">');
            const t = s.getNext();
            const startTest = new XmlToken(XmlToken.ENTITY_START, 'test');
            startTest.haveEntityData = false;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  startTest,
                  new XmlToken(XmlToken.ENTITY_END, 'test'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('throws an error if there is a < in the attribute value', () => {
            const s = makeStrictStream('<elementName attr1="value<">');

            expect(() => {
               s.getNext();
            }).toThrowError('An "<" was found in the value for attribute "attr1".');
         });

         it('generates an error token if there is a < in the attribute value', () => {
            const s = makeLaxStream('<elementName attr1="value<">');

            const t = s.getNext();
            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE);
         });

         it('throws an error if the attribute name is not a legal XML name', () => {
            const s = makeStrictStream('<elementName 1attr="value">');

            expect(() => {
               s.getNext();
            }).toThrowError('The attribute name does not match the syntax for names. Found: "1attr".');
         });

         it('generates an error token if name is missing', () => {
            const s = makeLaxStream('<elementName 1attr="value">');

            const t = s.getNext();
            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);
         });

         it('throws an error if there is no space between attributes', () => {
            const s = makeStrictStream('<elementName attr1="value"attr2="value2">');

            expect(() => {
               s.getNext();
            }).toThrowError('There must be a space before an attribute name.');
         });

         it('generates an error token if there is no space between attributes', () => {
            const s = makeLaxStream('<elementName attr1="value"attr2="value2">');

            const t = s.getNext();
            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.NO_SPACE_BEFORE_ATTR);
         });

         it('throws an error if there is no quote around the attribute value', () => {
            const s = makeStrictStream('<elementName attr1=value>');

            expect(() => {
               s.getNext();
            }).toThrowError('No quote found for an attribute.');
         });

         it('generates an error token if there is no space between attributes', () => {
            const s = makeLaxStream('<elementName attr1=value>');

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
         });

         it('reads a single word if there is no quote', () => {
            const s = makeLaxStream('<elementName attr1= value>');

            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            const t = s.getNext();

            compareAttribute(t.attributes[0], 'attr1', 'value');
         });

         it('throws an error if there is no equal sign', () => {
            const s = makeStrictStream('<elementName attr1 "value">');

            expect(() => {
               s.getNext();
            }).toThrowError('No equal sign found for an attribute.');
         });

         it('generates an error token if there is no equal sign', () => {
            const s = makeLaxStream('<elementName attr1 "value">');

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
         });

         it('throws an error if there is no value', () => {
            const s = makeStrictStream('<elementName attr1= >');

            expect(() => {
               s.getNext();
            }).toThrowError('Missing value for an attribute.');
         });

         it('generates an error token if there is no value', () => {
            const s = makeLaxStream('<elementName attr1= >');

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
         });

         it('throws an error if there is no closing quote', () => {
            const s = makeStrictStream('<elementName attr1="one>');

            expect(() => {
               s.getNext();
            }).toThrowError('No closing quote for an attribute.');
         });

         it('generates an error token if there is no closing quote', () => {
            const s = makeLaxStream('<elementName attr1="one>');

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
         });

         it('infers an equal sign and reads the value if in lax mode and equal missing', () => {
            const s = makeLaxStream('<elementName attr1 "value one">');

            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            const t = s.getNext();

            compareAttribute(t.attributes[0], 'attr1', 'value one');
         });

         it('reads a new name if both equal and quote are missing', () => {
            const s = makeLaxStream('<elementName attr1  value one>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
            compareAttribute(t.attributes[2], 'one', undefined);
         });

         it('returns undefined for values when they are not present', () => {
            const s = makeLaxStream('<elementName attr1  value>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
         });

         it('considers quotes in a name to be part of the name', () => {
            const s = makeLaxStream('<elementName attr1"boo"  two=value>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'attr1"boo"', undefined);
            compareAttribute(t.attributes[1], 'two', 'value');
         });

         it('does not consider a close angle bracket to be part of the name', () => {
            const s = makeLaxStream('<elementName one>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('does not consider a close angle bracket to be part of the value in a bad value', () => {
            const s = makeLaxStream('<elementName one=two>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'one', 'two');
         });

         it('does not consider a close angle bracket to be part of the value when no equal', () => {
            const s = makeLaxStream('<elementName one >');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('considers quotes at the start of the name to be part of the name', () => {
            const s = makeLaxStream('<elementName "one="vone"  \'two=vtwo>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], '"one', 'vone');
            compareAttribute(t.attributes[1], '\'two', 'vtwo');
         });

         it('handles eof in middle of name', () => {
            const s = makeLaxStream('<elementName nam');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'nam', undefined);
         });

         it('handles eof after equal', () => {
            const s = makeLaxStream('<elementName name=');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('handles eof in value', () => {
            const s = makeLaxStream('<elementName name="one');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('handles eof at start of value', () => {
            const s = makeLaxStream('<elementName name="');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('throws an error if a < is found in an attribute', () => {
            const s = makeStrictStream('<elementName name="myvalue<one">');

            expect(() => {
               s.getNext();
            }).toThrowError('An "<" was found in the value for attribute "name".');
         });

         it('terminates start tag and continues processing if an < in an attribute value in lax mode', () => {
            const s = makeLaxStream('<elementName name="one<two">');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            let t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_BAD_NAME);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('considers < part of attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeStream('<elementName name="one<two">', new XmlEntityManager(), {
               lax: true,
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one<two');
         });

         it('terminates start tag if an < in a quoteless attribute value in lax mode', () => {
            const s = makeLaxStream('<elementName name=one<two">');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            let t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_BAD_NAME);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('terminates gracefully even when EOF at end of quoteless attribute value', () => {
            const s = makeLaxStream('<elementName name=one');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('considers < part of quoteless attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeStream('<elementName name=one<two">', new XmlEntityManager(), {
               lax: true,
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one<two"');
         });

      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<one >');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<'),
            new TextChunk.WordChunk('one', true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ]));
      });

   });

   describe('parsing empty element tags', () => {

      it('retrieves a token of type ELEMENT_EMPTY', () => {
         const s = makeStrictStream('<name/>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_EMPTY);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictStream('<name/>');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('allows S after the name', () => {
         const s = makeStrictStream('<name     />');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves attributes, if present', () => {
         const s = makeStrictStream('<name attr="one">');

         expect(s.getNext().attributes[0].name).toEqual('attr');
      });

      it('throws an error if a space is found after the <', () => {
         const s = makeStrictStream('< name>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after opening of an element tag.');
      });

      it('generates an error token if a space is found after the <', () => {
         const s = makeLaxStream('< name/>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      });

      it('throws an error if the name is not a name', () => {
         const s = makeStrictStream('<9name/>');

         expect(() => {
            s.getNext();
         }).toThrowError('The element name does not match the syntax for names. Found: "9name".');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeLaxStream('<9name/>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_BAD_NAME);
      });

      it('throws an error if /> is missing', () => {
         const s = makeStrictStream('<name  ');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing of element tag.');
      });

      it('generates an error token if the end /> is missing', () => {
         const s = makeLaxStream('<name');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      });

      it('generates an error token if name is missing', () => {
         const s = makeLaxStream('< />'); // </> looks like a malformed end tag!

         s.getNext();
         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<one />');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<'),
            new TextChunk.WordChunk('one', true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('/>')
         ]));
      });

   });

   describe('parsing end element tags', () => {

      it('retrieves a token of type ELEMENT_END', () => {
         const s = makeStrictStream('<name></name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_END);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictStream('<name></name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves an empty name if there is no name in the end tag', () => {
         const s = makeLaxStream('<name></>');
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_UNBALANCED);

         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows S after the name', () => {
         const s = makeStrictStream('<name></name     >');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if attributs found in the tag', () => {
         const s = makeStrictStream('<name></name attr1="one">');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing of element tag.');
      });

      it('throws an error if a space is found after the </', () => {
         const s = makeStrictStream('<name></ name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after opening of an element tag.');
      });

      it('generates an error token if a space is found after the </', () => {
         const s = makeLaxStream('<name></ name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      });

      it('throws an error if a it finds the wrong close', () => {
         const s = makeStrictStream('<name></name/>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Got the wrong close of an end element tag.');
      });

      it('generates an error token if it finds the wrong close', () => {
         const s = makeLaxStream('<name></name/>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_END_BAD_CLOSE);
      });

      it('throws an error if the name is not a name', () => {
         const s = makeStrictStream('</9name>');

         expect(() => {
            s.getNext();
         }).toThrowError('The element name does not match the syntax for names. Found: "9name".');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeLaxStream('</9name>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_BAD_NAME);
      });

      it('throws an error if > is missing', () => {
         const s = makeStrictStream('</name  <');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing of element tag.');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeLaxStream('</name');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      });

      it('throws an error if name is missing', () => {
         const s = makeStrictStream('</>');

         expect(() => {
            s.getNext();
         }).toThrowError('Name missing in element tag.');
      });

      it('generates an error token if name is missing', () => {
         const s = makeLaxStream('</>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      });

      it('throws no error if the tag names match', () => {
         const s = makeStrictStream('<one><two></two></one>');

         expect(() => {
            s.getNext();
            s.getNext();
            s.getNext();
            s.getNext();
         }).not.toThrowError();
      });

      it('throws an error if the end element name does not match the start', () => {
         const s = makeStrictStream('<one></two>');

         expect(() => {
            s.getNext();
            s.getNext();
         }).toThrowError('Element end tag does not match. Expected "one" but found "two".');
      });

      it('throws an error if the end element name does not match the start, even on deeper trees', () => {
         const s = makeStrictStream('<one><two><one></one></one></one>');

         expect(() => {
            s.getNext();
            s.getNext();
            s.getNext();
            s.getNext();
            s.getNext();
            s.getNext();
         }).toThrowError('Element end tag does not match. Expected "two" but found "one".');
      });

      it('generates an error token if the end element name does not match the start', () => {
         const s = makeLaxStream('<one></two>');

         s.getNext();
         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_UNBALANCED);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<one></one >');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('</'),
            new TextChunk.WordChunk('one', true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ], 5));
      });

   });

   describe('_reportSyntaxError()', () => {

      it('throws an error if in strict mode', () => {
         const s = makeStrictStream('');

         expect(() => {
            s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
               'Found a space before the xml target name.');
         }).toThrowError('Found a space before the xml target name.');
      });

      it('includes an error token in the error', () => {
         const s = makeStrictStream('');
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
            'Found a space before the xml target name.');

         try {
            s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
               'Found a space before the xml target name.');
         } catch (error) {
            expect(error.details).toEqual(expected);
         }
      });

      it('throws no error if in lax mode', () => {
         const s = makeLaxStream('');

         expect(() => {
            s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
            'Found a space before the xml target name.');
         }).not.toThrow();
      });

      it('queues a syntax error token if in lax mode', () => {
         const s = makeLaxStream('');
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
            'Found a space before the xml target name.');

         s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
         'Found a space before the xml target name.');

         expect(s.getNext()).toEqual(expected);
      });

   });

   describe('general parsing()', () => {

      it('does not generate a S token between tags', () => {
         const s = makeStrictStream(' <one> UNO </one> ');

         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().type).toEqual(XmlToken.ELEMENT_START);
         expect(s.getNext().type).toEqual(XmlToken.CHARDATA);
         expect(s.getNext().type).toEqual(XmlToken.ELEMENT_END);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
      });

   });

});
