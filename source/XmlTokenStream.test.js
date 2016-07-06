/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const XmlStringToken = require('./XmlStringToken.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlToken = require('./XmlToken.js');
const XmlErrorToken = require('./XmlErrorToken.js');

describe('XmlTokenStream', () => {

   function makeStringTokenArray(values, offset = 0) {
      const results = [];

      for (let index = 0; index < values.length; index++) {
         const length = values[index].text.length;
         const stringToken = new XmlStringToken(values[index].text, values[index].type,
            new Offset(0, offset, offset), new Offset(0, offset + length, offset + length));

         if (values[index].type === XmlStringToken.WORD) {
            stringToken.couldBeName = true;
         }

         results.push(stringToken);
         offset += length;
      }

      return results;
   }

   function makeStream(str, options) {
      return new XmlTokenStream(new XmlStringCursor(str), options);
   }

   function ignoreError(stream, errorCode) {
      const token = stream.getNext();
      expect(token.code).toEqual(errorCode);
   }

   function ignoreToken(stream, tokenType) {
      const token = stream.getNext();
      expect(token.type).toEqual(tokenType);
   }

   function compareAttribute(attr, name, value) {
      expect(attr.name).toEqual(name);
      expect(attr.value).toEqual(value);
   }

   describe('construction', () => {

      it('can be constructed with a cursor', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'));
         }).not.toThrow();
      });

      it('if passed no options, the defaults are used (whitebox)', () => {
         const s = new XmlTokenStream(new XmlStringCursor('hi'));

         expect(s._options).toEqual({
            lax: false,
            'lax:allowOpenAngleBracketsInAttributeValues': false
         });
      });

      it('stores the option if passed an option', () => {
         const s = new XmlTokenStream(new XmlStringCursor('hi'), { lax: true });

         expect(s._options.lax).toEqual(true);

      });

      it('throws an error if passed an unknown option', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'), { fish: true });
         }).toThrowError('"fish" is not a supported option name.');

      });

   });

   describe('hasNext()', () => {

      it('returns true if there is a token', () => {
         const s = makeStream('<?two?>');

         expect(s.hasNext()).toEqual(true);
      });

      it('can ask multiple times', () => {
         const s = makeStream('<?two?> ');

         expect(s.hasNext()).toEqual(true);
         expect(s.hasNext()).toEqual(true);
      });

      it('returns false if there is none', () => {
         const s = new XmlTokenStream(new XmlStringCursor(''));

         expect(s.hasNext()).toEqual(false);
      });

   });

   describe('parsing whitespace', () => {

      it('retrieves a token of type SPACE', () => {
         const s = makeStream(' \n  ');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SPACE);
      });

      it('retrieves the expected tokens', () => {
         const s = makeStream(' \t ');

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: ' \t ',
            type: XmlStringToken.SPACE
         } ]));
      });

   });

   describe('parsing CharData', () => {

      it('retrieves a token of type CHARDATA', () => {
         const s = makeStream('wow zowie ');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CHARDATA);
      });

      it('retrieves a token with the specified data', () => {
         const s = makeStream('wow zowie ');

         const t = s.getNext();
         expect(t.data).toEqual('wow zowie ');
      });

      it('retrieves a token with the specified data up to the markup', () => {
         const s = makeStream('wow <zowie> ');

         const t = s.getNext();
         expect(t.data).toEqual('wow ');
      });

      it('retrieves the expected tokens', () => {
         const s = makeStream('wow zowie ');

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: 'wow zowie ',
            type: XmlStringToken.STRING
         } ]));
      });

   });

   describe('parsing comments', () => {

      it('retrieves a token of type COMMENT', () => {
         const s = makeStream('<!-- one -->');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.COMMENT);
      });

      it('retrieves the content of the comment', () => {
         const s = makeStream('<!-- one -->');

         expect(s.getNext().data).toEqual(' one ');
      });

      it('retrieves undefined as the value for an empty comment', () => {
         const s = makeStream('<!---->');

         expect(s.getNext().data).toBeUndefined();
      });

      it('throws an error if no --> found', () => {
         const s = makeStream('<!--junk comment');

         expect(() => {
            s.getNext();
         }).toThrowError('Closing --> not found for comment.');
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeStream('<!--junk comment', { lax: true });

         ignoreError(s, XmlErrorToken.ERROR.COMMENT_MISSING_END);
         expect(s.getNext().data).toEqual('junk comment');
      });

      it('throws an error if comment ends with a -', () => {
         const s = makeStream('<!--junk comment--->');

         expect(() => {
            s.getNext();
         }).toThrowError('Comment should not end with a hyphen.');
      });

      it('retrieves the expected tokens', () => {
         const s = makeStream('<!-- one -->');

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: '<!--',
            type: XmlStringToken.MARKUP
         }, {
            text: ' one ',
            type: XmlStringToken.STRING
         }, {
            text: '-->',
            type: XmlStringToken.STRING
         } ]));
      });

   });

   describe('parsing processing instruction', () => {

      it('retrieves a token of type PI', () => {
         const s = makeStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.PI);
      });

      it('retrieves a token with the right target name', () => {
         const s = makeStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         const t = s.getNext();
         expect(t.data).toEqual('foo');
      });

      it('retrieves a token with the right target content', () => {
         const s = makeStream('<?foo blah blah boo boo !@#$%^&^*()_+ ?>');

         const t = s.getNext();
         expect(t.content).toEqual('blah blah boo boo !@#$%^&^*()_+ ');
      });

      it('retrieves one with no content', () => {
         const s = makeStream('<?foo?>');

         const t = s.getNext();
         expect(t.content).toBeUndefined();
      });

      it('allows whitespace but no content', () => {
         const s = makeStream('<?foo    ?>');

         const t = s.getNext();
         expect(t.content).toBeUndefined();
      });

      it('throws an error if no ?> found', () => {
         const s = makeStream('<?foo glorky');

         expect(() => {
            s.getNext();
         }).toThrowError('Closing ?> not found for processing instruction.');
      });

      it('returns the content up to EOF if no ?> found in lax mode', () => {
         const s = makeStream('<?foo glorky', { lax: true });
         ignoreError(s, XmlErrorToken.ERROR.PI_NO_TERMINATOR);

         expect(s.getNext().content).toEqual('glorky');
      });

      it('throws an error if a space is between the <? and the target', () => {
         const s = makeStream('<? foo glorky?>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before processing intruction target.');
      });

      it('throws an error if the name does not match the name syntax', () => {
         const s = makeStream('<?frog$ glorky?>');

         expect(() => {
            s.getNext();
         }).toThrowError('The target name does not match the syntax for names. Found: "frog$".');
      });

      it('throws an error if there is no target', () => {
         const s = makeStream('<??>');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing target name in processing instruction.');
      });

      it('generates an error token if a there is no target', () => {
         const s = makeStream('<??>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.PI_NO_TARGET);
      });

   });

   describe('parsing XML Declaration', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('retrieves the number of parameters in the declaration', () => {
         const s = makeStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t.params.length).toEqual(3);
      });

      it('retrieves parameters in order', () => {
         const s = makeStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         compareAttribute(t.params[0], 'version', '1.1');
         compareAttribute(t.params[1], 'encoding', 'usascii');
         compareAttribute(t.params[2], 'standalone', 'yes');
      });

      it('allows a space between the <? and the target if in lax mode', () => {
         const s = makeStream('<? xml version="1.1"?>', { lax: true });

         let t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('throws an error if a space is between the <? and the target if in strict mode', () => {
         const s = makeStream('<? xml version="1.1"?>', { lax: false });

         expect(() => {
            s.getNext();
         }).toThrowError('Space found before processing intruction target.');
      });

      it('allows the xml after <? to be any case in lax mode', () => {
         const s = makeStream('<?XmL version="1.1"?>', { lax: true });

         let t = s.getNext();
         expect(t.code).toEqual(XmlErrorToken.ERROR.XML_NOT_LOWERCASE);
         t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('throws an error the xml after <? is in mixed case if in strict mode', () => {
         const s = makeStream('<?XmL version="1.1"?>', { lax: false });

         expect(() => {
            s.getNext();
         }).toThrowError('The xml target name was not all lower case (XmL).');
      });

      it('allows < in a values even if lax:allowOpenAngleBracketsInAttributeValues is false', () => {
         const s = makeStream('<?xml version="1.1" encoding="frog<"?>', {
            lax: true,
            'lax:allowOpenAngleBracketsInAttributeValues': false
         });

         expect(s.getNext().code).toEqual(XmlErrorToken.ERROR.BAD_ENCODING);
      });

      describe('"attribute" equal signs', () => {

         it('accepts spaces around the equal signs, as per the spec', () => {
            const s = makeStream('<?xml version =         "1.1"?>');

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no equal sign', () => {
            const s = makeStream('<?xml version "1.1"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('No equal sign found for an attribute.');
         });

         it('accepts the lack of an equal sign in lax mode', () => {
            const s = makeStream('<?xml version "1.1"?>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

      });

      describe('"attribute" quotes', () => {

         it('accepts single quotes', () => {
            const s = makeStream('<?xml version =\'1.1\'?>');

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

         it('accepts double quotes', () => {
            const s = makeStream('<?xml version ="1.1"?>');

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no quote', () => {
            const s = makeStream('<?xml version=1.1 ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('No quote found for an attribute.');
         });

         it('throws no error in lax mode', () => {
            const s = makeStream('<?xml version=1.1 ?>', { lax: true });

            const t = s.getNext();

            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
         });

         it('makes the best guess for the attr value if no quotes', () => {
            const s = makeStream('<?xml version=1.1 ?>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no quotes', () => {
            const s = makeStream('<?xml version=1.1?>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no equal and noquotes', () => {
            const s = makeStream('<?xml version 1.1?>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.BAD_VERSION);
            ignoreError(s, XmlErrorToken.ERROR.UNKNOWN_ATTR);

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', undefined);
         });

      });

      it('throws an error if there is no space after a value', () => {
         const s = makeStream('<?xml version="1.1"encoding="usascii" standalone="yes"?>');

         expect(() => {
            s.getNext();
         }).toThrowError('There must be a space before an attribute name.');
      });

      it('throws an error if no parameters are included', () => {
         const s = makeStream('<?xml ?>');

         expect(() => {
            s.getNext();
         }).toThrowError('There must be at least a version specified for an XML Declaration.');
      });

      it('throws an error if an unknown parameter is provided', () => {
         const s = makeStream('<?xml bogus="frog"?>', { lax: false });

         expect(() => {
            s.getNext();
         }).toThrowError('Unknown XML Declaration parameter "bogus".');
      });

      it('throws an error if the close is missing and not lax', () => {
         const s = makeStream('<?xml version="1.0"', { lax: false });

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing ?> on XML Declaration.');
      });

      it('reports an error if the close is missing and lax', () => {
         const s = makeStream('<?xml version="1.0"', { lax: true });

         const token = s.getNext();
         expect(token.code).toEqual(XmlErrorToken.ERROR.MISSING_XMLDECL_CLOSE);
      });

      it('retrieves the expected tokens', () => {
         const s = makeStream('<?xml version="1.1" encoding="usascii"  ?>');

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: '<?',
            type: XmlStringToken.MARKUP
         }, {
            text: 'xml',
            type: XmlStringToken.WORD
         }, {
            text: ' ',
            type: XmlStringToken.SPACE
         }, {
            text: 'version',
            type: XmlStringToken.WORD
         }, {
            text: '=',
            type: XmlStringToken.STRING
         }, {
            text: '"',
            type: XmlStringToken.CHAR
         }, {
            text: '1.1',
            type: XmlStringToken.STRING
         }, {
            text: '"',
            type: XmlStringToken.CHAR
         }, {
            text: ' ',
            type: XmlStringToken.SPACE
         }, {
            text: 'encoding',
            type: XmlStringToken.WORD
         }, {
            text: '=',
            type: XmlStringToken.STRING
         }, {
            text: '"',
            type: XmlStringToken.CHAR
         }, {
            text: 'usascii',
            type: XmlStringToken.STRING
         }, {
            text: '"',
            type: XmlStringToken.CHAR
         }, {
            text: '  ',
            type: XmlStringToken.SPACE
         }, {
            text: '?>',
            type: XmlStringToken.STRING
         } ]));
      });

      describe('version parameter', () => {

         it('accepts a value of "1.0"', () => {
            const s = makeStream('<?xml version="1.0"?>');

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.0');
         });

         it('accepts a value of "1.1"', () => {
            const s = makeStream('<?xml version="1.1"?>');

            const t = s.getNext();
            compareAttribute(t.params[0], 'version', '1.1');
         });

         it('throws a syntax error if version is not a supported value', () => {
            const s = makeStream('<?xml version="1.2" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"version" must be "1.0" or "1.1" but found "1.2".');
         });

         it('reports version in wrong position as second syntax error', () => {
            const s = makeStream('<?xml encoding="usascii" version="1.1" ?>', {lax: true});

            s.getNext();
            const second = s.getNext();

            expect(second.message).toEqual('"version" attribute should be at position #0 but was at #1.');
         });

         it('throws a syntax error if version is not the right case', () => {
            const s = makeStream('<?xml VeRsIoN="1.1" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"version" must be lower case, but found "VeRsIoN".');
         });

         it('accepts the wrong case for version if lax', () => {
            const s = makeStream('<?xml  VERSION="1.1" ?>', {lax: true});

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE);
         });

      });

      describe('encoding parameter', () => {

         it('accepts a value of "usascii0"', () => {
            const s = makeStream('<?xml version="1.1"   encoding="usascii0"?>');

            const t = s.getNext();
            compareAttribute(t.params[1], 'encoding', 'usascii0');
         });

         it('throws a syntax error if encoding is not rightly encoded', () => {
            const s = makeStream('<?xml version="1.1" encoding="bogus$"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"encoding" must be alphanumerics, but found "bogus$".');
         });

         it('throws a syntax error if encoding starts with a bad character', () => {
            const s = makeStream('<?xml version="1.1" encoding="0usascii"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"encoding" must be alphanumerics, but found "0usascii".');
         });

         it('throws an error if encoding found in the wrong position', () => {
            const s = makeStream('<?xml encoding="frog" version="1.1" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('encoding attribute in the wrong position. Should be after version, but was #0.');
         });

         it('throws a syntax error if is not the right case', () => {
            const s = makeStream('<?xml version="1.1" EnCoDiNG="bogys" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"encoding" must be lower case, but found "EnCoDiNG".');
         });

         it('accepts the wrong case if lax', () => {
            const s = makeStream('<?xml  version="1.1" ENCODING="usascii" ?>', {lax: true});

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE);
         });

      });

      describe('standalone parameter', () => {

         it('accepts a value of "no"', () => {
            const s = makeStream('<?xml version="1.1" standalone="no"?>');

            const t = s.getNext();
            compareAttribute(t.params[1], 'standalone', 'no');
         });

         it('accepts a value of "yes"', () => {
            const s = makeStream('<?xml version="1.1" standalone="yes"?>');

            const t = s.getNext();
            compareAttribute(t.params[1], 'standalone', 'yes');
         });

         it('throws an error if standalone in the wrong position', () => {
            const s = makeStream('<?xml standalone="frog" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('standalone attribute in the wrong position. Should be #1 or #2, but was #0.');
         });

         it('throws a syntax error if standalone is not yes or no', () => {
            const s = makeStream('<?xml version="1.1" standalone="bogus"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"standalone" must be "yes" or "no" but found "bogus".');
         });

         it('throws a syntax error if is not the right case', () => {
            const s = makeStream('<?xml version="1.1" STANDaLoNE="yes" ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"standalone" must be lower case, but found "STANDaLoNE".');
         });

         it('accepts the wrong case if lax', () => {
            const s = makeStream('<?xml  version="1.1" STANDALONE="no" ?>', {lax: true});

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE);
         });

         it('accepts the wrong case for parameter if lax', () => {
            const s = makeStream('<?xml  version="1.1" standalone="NO" ?>', {lax: true});

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.code).toEqual(XmlErrorToken.ERROR.XMLDECL_STANDALONE_WRONG_CASE);
         });

         it('produces a useful message if parameter is the wrong case', () => {
            const s = makeStream('<?xml  version="1.1" standalone="yEs" ?>', {lax: true});

            const syntaxErrorToken = s.getNext();

            expect(syntaxErrorToken.message).toEqual('"yes" must be lower case, but found "yEs".');
         });

      });

   });

   describe('parsing start element tags', () => {

      it('retrieves a token of type START_ELEMENT', () => {
         const s = makeStream('<name>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_START);
      });

      it('retrieves the name of the element', () => {
         const s = makeStream('<name>');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves the name with a slash in it in lax mode', () => {
         const s = makeStream('<n/ame>', { lax: true });
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_BAD_NAME);

         const t = s.getNext();
         expect(t.name).toEqual('n/ame');
      });

      it('retrieves an empty name if there is no name in the start tag', () => {
         const s = makeStream('<>', { lax: true });

         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows S after the name', () => {
         const s = makeStream('<name     >');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if a space is found after the <', () => {
         const s = makeStream('< name>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after opening of an element tag.');
      });

      it('generates an error token if a space is found after the <', () => {
         const s = makeStream('< name>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      });

      it('throws an error if the name is not a name', () => {
         const s = makeStream('<9name>');

         expect(() => {
            s.getNext();
         }).toThrowError('The element name does not match the syntax for names. Found: "9name".');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeStream('<9name>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_BAD_NAME);
      });

      it('generates an error token if > is missing', () => {
         const s = makeStream('<name', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      });

      it('throws an error if name is missing', () => {
         const s = makeStream('<>');

         expect(() => {
            s.getNext();
         }).toThrowError('Name missing in element tag.');
      });

      it('generates an error token if name is missing', () => {
         const s = makeStream('<>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      });

      describe('with attributes', () => {

         it('can parse basic attributes', () => {
            const s = makeStream('<elemName attr1="one" attr2="two">', { lax: true });

            const t = s.getNext();

            const name1 = new XmlStringToken('attr1', XmlStringToken.WORD,
                  new Offset(0, 10, 10), new Offset(0, 15, 15));
            name1.couldBeName = true;
            const name2 = new XmlStringToken('attr2', XmlStringToken.WORD,
                     new Offset(0, 22, 22), new Offset(0, 27, 27));
            name2.couldBeName = true;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: 'one',
               nameToken: name1,
               valueToken: new XmlStringToken('one', XmlStringToken.STRING,
                  new Offset(0, 17, 17), new Offset(0, 20, 20)),
               quoteType: '"'
            }, {
               name: 'attr2',
               value: 'two',
               nameToken: name2,
               valueToken: new XmlStringToken('two', XmlStringToken.STRING,
                  new Offset(0, 29, 29), new Offset(0, 32, 32)),
               quoteType: '"'
            } ]);
         });

         it('can parse attributes using single quotes', () => {
            const s = makeStream('<elemName attr1=\'one\' attr2=\'two\'>', { lax: true });

            const t = s.getNext();

            const name1 = new XmlStringToken('attr1', XmlStringToken.WORD,
                  new Offset(0, 10, 10), new Offset(0, 15, 15));
            name1.couldBeName = true;
            const name2 = new XmlStringToken('attr2', XmlStringToken.WORD,
                     new Offset(0, 22, 22), new Offset(0, 27, 27));
            name2.couldBeName = true;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: 'one',
               nameToken: name1,
               valueToken: new XmlStringToken('one', XmlStringToken.STRING,
                  new Offset(0, 17, 17), new Offset(0, 20, 20)),
               quoteType: '\''
            }, {
               name: 'attr2',
               value: 'two',
               nameToken: name2,
               valueToken: new XmlStringToken('two', XmlStringToken.STRING,
                  new Offset(0, 29, 29), new Offset(0, 32, 32)),
               quoteType: '\''
            } ]);
         });

         it('can parse attributes with whitespace around the equals', () => {
            const s = makeStream('<elemName\n\tattr1\t\n=   \'one\' attr2   =\r\n\t "two">', { lax: true });

            const t = s.getNext();

            const name1 = new XmlStringToken('attr1', XmlStringToken.WORD,
                  new Offset(1, 1, 11), new Offset(1, 6, 16));
            name1.couldBeName = true;
            const name2 = new XmlStringToken('attr2', XmlStringToken.WORD,
                     new Offset(2, 10, 28), new Offset(2, 15, 33));
            name2.couldBeName = true;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: 'one',
               nameToken: name1,
               valueToken: new XmlStringToken('one', XmlStringToken.STRING,
                  new Offset(2, 5, 23), new Offset(2, 8, 26)),
               quoteType: '\''
            }, {
               name: 'attr2',
               value: 'two',
               nameToken: name2,
               valueToken: new XmlStringToken('two', XmlStringToken.STRING,
                  new Offset(3, 3, 42), new Offset(3, 6, 45)),
               quoteType: '"'
            } ]);
         });

         it('throws an error if there is a < in the attribute value', () => {
            const s = makeStream('<elementName attr1="value<">');

            expect(() => {
               s.getNext();
            }).toThrowError('An "<" was found in the value for attribute "attr1".');
         });

         it('generates an error token if there is a < in the attribute value', () => {
            const s = makeStream('<elementName attr1="value<">', { lax: true });

            const t = s.getNext();
            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE);
         });

         it('throws an error if the attribute name is not a legal XML name', () => {
            const s = makeStream('<elementName 1attr="value">');

            expect(() => {
               s.getNext();
            }).toThrowError('The attribute name does not match the syntax for names. Found: "1attr".');
         });

         it('generates an error token if name is missing', () => {
            const s = makeStream('<elementName 1attr="value">', { lax: true });

            const t = s.getNext();
            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);
         });

         it('throws an error if there is no space between attributes', () => {
            const s = makeStream('<elementName attr1="value"attr2="value2">');

            expect(() => {
               s.getNext();
            }).toThrowError('There must be a space before an attribute name.');
         });

         it('generates an error token if there is no space between attributes', () => {
            const s = makeStream('<elementName attr1="value"attr2="value2">', { lax: true });

            const t = s.getNext();
            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.NO_SPACE_BEFORE_ATTR);
         });

         it('throws an error if there is no quote around the attribute value', () => {
            const s = makeStream('<elementName attr1=value>');

            expect(() => {
               s.getNext();
            }).toThrowError('No quote found for an attribute.');
         });

         it('generates an error token if there is no space between attributes', () => {
            const s = makeStream('<elementName attr1=value>', { lax: true });

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
         });

         it('reads a single word if there is no quote', () => {
            const s = makeStream('<elementName attr1= value>', { lax: true });

            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            const t = s.getNext();

            expect(t.attributes[0].value).toEqual('value');
         });

         it('throws an error if there is no equal sign', () => {
            const s = makeStream('<elementName attr1 "value">');

            expect(() => {
               s.getNext();
            }).toThrowError('No equal sign found for an attribute.');
         });

         it('generates an error token if there is no equal sign', () => {
            const s = makeStream('<elementName attr1 "value">', { lax: true });

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
         });

         it('throws an error if there is no value', () => {
            const s = makeStream('<elementName attr1= >');

            expect(() => {
               s.getNext();
            }).toThrowError('Missing value for an attribute.');
         });

         it('generates an error token if there is no value', () => {
            const s = makeStream('<elementName attr1= >', { lax: true });

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
         });

         it('throws an error if there is no closing quote', () => {
            const s = makeStream('<elementName attr1="one>');

            expect(() => {
               s.getNext();
            }).toThrowError('No closing quote for an attribute.');
         });

         it('generates an error token if there is no closing quote', () => {
            const s = makeStream('<elementName attr1="one>', { lax: true });

            const t = s.getNext();

            expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
         });

         it('infers an equal sign and reads the value if in lax mode and equal missing', () => {
            const s = makeStream('<elementName attr1 "value one">', { lax: true });

            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            const t = s.getNext();

            expect(t.attributes[0].value).toEqual('value one');
         });

         it('reads a new name if both equal and quote are missing', () => {
            const s = makeStream('<elementName attr1  value one>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('attr1');
            expect(t.attributes[1].name).toEqual('value');
            expect(t.attributes[2].name).toEqual('one');
         });

         it('returns undefined for values when they are not present', () => {
            const s = makeStream('<elementName attr1  value>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            expect(t.attributes[0].value).toBeUndefined();
            expect(t.attributes[1].value).toBeUndefined();
         });

         it('considers quotes in a name to be part of the name', () => {
            const s = makeStream('<elementName attr1"boo"  two=value>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('attr1"boo"');
            expect(t.attributes[1].name).toEqual('two');
         });

         it('does not consider a close angle bracket to be part of the name', () => {
            const s = makeStream('<elementName one>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('one');
         });

         it('does not consider a close angle bracket to be part of the value in a bad value', () => {
            const s = makeStream('<elementName one=two>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();

            expect(t.attributes[0].value).toEqual('two');
         });

         it('does not consider a close angle bracket to be part of the value when no equal', () => {
            const s = makeStream('<elementName one >', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);

            const t = s.getNext();

            expect(t.attributes[0].value).toBeUndefined();
         });

         it('considers quotes at the start of the name to be part of the name', () => {
            const s = makeStream('<elementName "one="vone"  \'two=vtwo>', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('"one');
            expect(t.attributes[1].name).toEqual('\'two');
         });

         it('handles eof in middle of name', () => {
            const s = makeStream('<elementName nam', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('nam');
         });

         it('handles eof after equal', () => {
            const s = makeStream('<elementName name=', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
         });

         it('handles eof in value', () => {
            const s = makeStream('<elementName name="one', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toEqual('one');
         });

         it('handles eof at start of value', () => {
            const s = makeStream('<elementName name="', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toBeUndefined();
         });

         it('throws an error if a < is found in an attribute', () => {
            const s = makeStream('<elementName name="myvalue<one">');

            expect(() => {
               s.getNext();
            }).toThrowError('An "<" was found in the value for attribute "name".');
         });

         it('terminates start tag and continues processing if an < in an attribute value in lax mode', () => {
            const s = makeStream('<elementName name="one<two">', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            let t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toEqual('one');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_BAD_NAME);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('considers < part of attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeStream('<elementName name="one<two">', {
               lax: true,
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toEqual('one<two');
         });

         it('terminates start tag if an < in an quoteless attribute value in lax mode', () => {
            const s = makeStream('<elementName name=one<two">', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            let t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toEqual('one');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_BAD_NAME);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('terminates gracefully even when EOF at end of quoteless attribute value', () => {
            const s = makeStream('<elementName name=one', { lax: true });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toEqual('one');
         });

         it('considers < part of quoteless attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeStream('<elementName name=one<two">', {
               lax: true,
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

            const t = s.getNext();

            expect(t.attributes[0].name).toEqual('name');
            expect(t.attributes[0].value).toEqual('one<two"');
         });

      });

      it('retrieves the expected tokens', () => {
         const s = makeStream('<one >');

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: '<',
            type: XmlStringToken.MARKUP
         }, {
            text: 'one',
            type: XmlStringToken.WORD
         }, {
            text: ' ',
            type: XmlStringToken.SPACE
         }, {
            text: '>',
            type: XmlStringToken.STRING
         } ]));
      });

   });

   describe('parsing empty element tags', () => {

      it('retrieves a token of type ELEMENT_EMPTY', () => {
         const s = makeStream('<name/>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_EMPTY);
      });

      it('retrieves the name of the element', () => {
         const s = makeStream('<name/>');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('allows S after the name', () => {
         const s = makeStream('<name     />');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves attributes, if present', () => {
         const s = makeStream('<name attr="one">');

         expect(s.getNext().attributes[0].name).toEqual('attr');
      });

      it('throws an error if a space is found after the <', () => {
         const s = makeStream('< name>');

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after opening of an element tag.');
      });

      it('generates an error token if a space is found after the <', () => {
         const s = makeStream('< name/>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      });

      it('throws an error if the name is not a name', () => {
         const s = makeStream('<9name/>');

         expect(() => {
            s.getNext();
         }).toThrowError('The element name does not match the syntax for names. Found: "9name".');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeStream('<9name/>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_BAD_NAME);
      });

      it('throws an error if /> is missing', () => {
         const s = makeStream('<name  ');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing of element tag.');
      });

      it('generates an error token if the end /> is missing', () => {
         const s = makeStream('<name', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      });

      it('generates an error token if name is missing', () => {
         const s = makeStream('< />', { lax: true }); // </> looks like a malformed end tag!

         s.getNext();
         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      });

      it('retrieves the expected tokens', () => {
         const s = makeStream('<one />');

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: '<',
            type: XmlStringToken.MARKUP
         }, {
            text: 'one',
            type: XmlStringToken.WORD
         }, {
            text: ' ',
            type: XmlStringToken.SPACE
         }, {
            text: '/>',
            type: XmlStringToken.STRING
         } ]));
      });

   });

   describe('parsing end element tags', () => {

      it('retrieves a token of type ELEMENT_END', () => {
         const s = makeStream('<name></name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_END);
      });

      it('retrieves the name of the element', () => {
         const s = makeStream('<name></name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves an empty name if there is no name in the end tag', () => {
         const s = makeStream('<name></>', { lax: true });
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_UNBALANCED);

         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows S after the name', () => {
         const s = makeStream('<name></name     >');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if attributs found in the tag', () => {
         const s = makeStream('<name></name attr1="one">');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing of element tag.');
      });

      it('throws an error if a space is found after the </', () => {
         const s = makeStream('<name></ name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Space found after opening of an element tag.');
      });

      it('generates an error token if a space is found after the </', () => {
         const s = makeStream('<name></ name>', { lax: true });
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      });

      it('throws an error if a it finds the wrong close', () => {
         const s = makeStream('<name></name/>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Got the wrong close of an end element tag.');
      });

      it('generates an error token if it finds the wrong close', () => {
         const s = makeStream('<name></name/>', { lax: true });
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_END_BAD_CLOSE);
      });

      it('throws an error if the name is not a name', () => {
         const s = makeStream('</9name>');

         expect(() => {
            s.getNext();
         }).toThrowError('The element name does not match the syntax for names. Found: "9name".');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeStream('</9name>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_BAD_NAME);
      });

      it('throws an error if > is missing', () => {
         const s = makeStream('</name  <');

         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing of element tag.');
      });

      it('generates an error token if the name is not a name', () => {
         const s = makeStream('</name', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      });

      it('throws an error if name is missing', () => {
         const s = makeStream('</>');

         expect(() => {
            s.getNext();
         }).toThrowError('Name missing in element tag.');
      });

      it('generates an error token if name is missing', () => {
         const s = makeStream('</>', { lax: true });

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      });

      it('throws no error if the tag names match', () => {
         const s = makeStream('<one><two></two></one>');

         expect(() => {
            s.getNext();
            s.getNext();
            s.getNext();
            s.getNext();
         }).not.toThrowError();
      });

      it('throws an error if the end element name does not match the start', () => {
         const s = makeStream('<one></two>');

         expect(() => {
            s.getNext();
            s.getNext();
         }).toThrowError('Element end tag does not match. Expected "one" but found "two".');
      });

      it('throws an error if the end element name does not match the start, even on deeper trees', () => {
         const s = makeStream('<one><two><one></one></one></one>');

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
         const s = makeStream('<one></two>', { lax: true });

         s.getNext();
         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENT_UNBALANCED);
      });

      it('retrieves the expected tokens', () => {
         const s = makeStream('<one></one >');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.tokens).toEqual(makeStringTokenArray([ {
            text: '</',
            type: XmlStringToken.MARKUP
         }, {
            text: 'one',
            type: XmlStringToken.WORD
         }, {
            text: ' ',
            type: XmlStringToken.SPACE
         }, {
            text: '>',
            type: XmlStringToken.STRING
         } ], 5));
      });

   });

   describe('_reportSyntaxError()', () => {

      it('throws an error if in strict mode', () => {
         const s = new XmlTokenStream(new XmlStringCursor(''), { lax: false });

         expect(() => {
            s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
               'Found a space before the xml target name.');
         }).toThrowError('Found a space before the xml target name.');
      });

      it('includes an error token in the error', () => {
         const s = new XmlTokenStream(new XmlStringCursor(''), { lax: false });
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
         const s = new XmlTokenStream(new XmlStringCursor(''), { lax: true });

         expect(() => {
            s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
            'Found a space before the xml target name.');
         }).not.toThrow();
      });

      it('queues a syntax error token if in lax mode', () => {
         const s = new XmlTokenStream(new XmlStringCursor(''), { lax: true });
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
            'Found a space before the xml target name.');

         s._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_TARGET,
         'Found a space before the xml target name.');

         expect(s.getNext()).toEqual(expected);
      });

   });

});
