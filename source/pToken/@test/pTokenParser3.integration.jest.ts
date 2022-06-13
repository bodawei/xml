/* Copyright ® 2017-2022 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { CONFORMANCE_VERSION, ENTITY_ID, EntityId } from 'basic';
import { ELEMENT_DECLARATION_PTOKEN, TEXT_PTOKEN, ParseToken, ParseType } from 'pToken';
import { STokenSource } from 'basic';
import {
   CONDITIONAL_START_PTOKEN,
   CONDITIONAL_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_END_PTOKEN,
   DOCTYPE_END_PTOKEN,
   CHARDATA_PTOKEN,
   COMMENT_PTOKEN,
   SPACE_PTOKEN,
   UNKNOWNDECL_PTOKEN,
} from 'token';

import { PTokenParser } from '../pTokenParser3';
import { ATTLIST_DECLARATION_PTOKEN } from '../token/attListDeclaration';
import { CHARREF_PTOKEN } from '../token/charRef';
import { GENERAL_ENTITY_DECLARATION_PTOKEN } from '../token/generalEntityDeclaration';
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from '../token/generalEntityReference';
import { NOTATION_DECLARATION_PTOKEN } from '../token/notationDeclaration';
import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../token/parameterEntityReference';
import { PROCESSING_INSTRUCTION_PTOKEN } from '../token/processingInstruction';
import { XMLDECL_PTOKEN } from '../token/xmlDeclaration';

describe('pTokenParser (integration)', () => {
   let sTokenSource: STokenSource;
   let pTokenParser: PTokenParser;

   beforeEach(() => {
      sTokenSource = new STokenSource();
      pTokenParser = new PTokenParser(sTokenSource, {
         parseType: ParseType.DOCUMENT,
      });
   });

   function gatherParseResults(
      parser: PTokenParser,
      expect: (results: Array<ParseToken>) => void,
   ): void {
      const cache: Array<ParseToken> = [];

      function doParse() {
         parser.parse((result) => {
            if (Array.isArray(result)) {
               cache.push(...result);
            } else if (result) {
               cache.push(result);
            }

            if (result) {
               doParse();
            } else {
               expect(cache);
            }
         });
      }

      doParse();
   }
   function gatherTypes(parser: PTokenParser, expect: (results: Array<string>) => void): void {
      gatherParseResults(parser, (tokens) => {
         expect(tokens.map((token) => token.type));
      });
   }

   function findToken(
      tokens: Array<ParseToken> | ParseToken | undefined,
      type: string,
   ): ParseToken | undefined {
      if (Array.isArray(tokens)) {
         return tokens.find((t) => t.type == type);
      } else if (tokens) {
         return tokens.type === type ? tokens : undefined;
      } else {
         return undefined;
      }
   }

   describe('ConformanceVersion', () => {
      it('delivers a default version of 1.0/5 if nothing else is specified', (done) => {
         pTokenParser = new PTokenParser(sTokenSource, {
            parseType: ParseType.DOCUMENT,
         });
         sTokenSource.addText('<?xml version="1.0"?>');
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toMatchObject({
               edition: 5,
               type: CONFORMANCE_VERSION,
               version: 1,
            });
            done();
         });
      });

      it('delivers a default version of 1.0/5 when that value is in single quotes', (done) => {
         pTokenParser = new PTokenParser(sTokenSource, {
            parseType: ParseType.DOCUMENT,
         });
         sTokenSource.addText("<?xml version='1.0'?>");
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toMatchObject({
               edition: 5,
               type: CONFORMANCE_VERSION,
               version: 1,
            });
            done();
         });
      });

      it('delivers a default version of 1.1/2 if nothing specified and XML Declaration is 1.1', (done) => {
         pTokenParser = new PTokenParser(sTokenSource);
         sTokenSource.addText('<?xml version="1.1"?>');
         sTokenSource.endText();

         pTokenParser.parse((results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toMatchObject({
               edition: 2,
               type: CONFORMANCE_VERSION,
               version: 1.1,
            });
            done();
         });
      });

      it('delivers a conformance version using the version specified in the options, regardless of what is in the document', (done) => {
         pTokenParser = new PTokenParser(sTokenSource, {
            confVer: {
               edition: 3,
               type: CONFORMANCE_VERSION,
               version: 1.0,
            },
         });
         sTokenSource.addText('<?xml version="1.1"?>');
         sTokenSource.endText();

         pTokenParser.parse((results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toMatchObject({
               edition: 3,
               type: CONFORMANCE_VERSION,
               version: 1.0,
            });
            done();
         });
      });

      it('delivers a conformance version using the default version when neither dor not options set', (done) => {
         pTokenParser = new PTokenParser(sTokenSource);
         sTokenSource.addText('<one></one>');
         sTokenSource.endText();

         pTokenParser.parse((results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toMatchObject({
               edition: 5,
               type: CONFORMANCE_VERSION,
               version: 1.0,
            });
            done();
         });
      });

      it('does not deliver a conformance version when the contxt is not document', (done) => {
         pTokenParser = new PTokenParser(sTokenSource, {
            parseType: ParseType.EXTERNAL_SUBSET,
         });
         sTokenSource.addText('<one></one>');
         sTokenSource.endText();

         pTokenParser.parse((results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toBeUndefined();
            done();
         });
      });
   });

   describe('entity id', () => {
      it('delivers a generic EntityId Token when none provided at construction time', (done) => {
         sTokenSource.addText('<?xml version="1.0"?>');
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toMatchObject({
               systemId: './document.xml',
               type: ENTITY_ID,
            });
            done();
         });
      });

      it('delivers an EntityId with the option specified in the construction options', (done) => {
         pTokenParser = new PTokenParser(sTokenSource, {
            entityId: new EntityId('http://foo.com/bar.xml', 'baz - boo'),
            parseType: ParseType.DOCUMENT,
         });
         sTokenSource.addText('<?xml version="1.0"?>');
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toMatchObject({
               publicId: 'baz - boo',
               systemId: 'http://foo.com/bar.xml',
               type: ENTITY_ID,
            });
            done();
         });
      });

      it('delivers no EntityId when this is not a document type', (done) => {
         pTokenParser = new PTokenParser(sTokenSource, {
            entityId: new EntityId('http://foo.com/bar.xml', 'baz - boo'),
            parseType: ParseType.EXTERNAL_SUBSET,
         });
         sTokenSource.addText('<?xml version="1.0"?>');
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toBeUndefined();
            done();
         });
      });
   });

   it('calls parseDeclaration() when encountering an ATTLIST', (done) => {
      sTokenSource.addText('<!ATTLIST something bar CDATA #REQUIRED>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, ATTLIST_DECLARATION_PTOKEN]);
         done();
      });
   });

   it('calls parseCharRef()', (done) => {
      sTokenSource.addText('&#foo;');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, CHARREF_PTOKEN, CHARDATA_PTOKEN]);
         done();
      });
   });

   it('calls parseCharData()', (done) => {
      sTokenSource.addText('asdf</foo>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            CHARDATA_PTOKEN,
            ELEMENT_END_PTOKEN,
         ]);
         done();
      });
   });

   it('calls parseCharData() in the internal subset', (done) => {
      sTokenSource.addText('<!DOCTYPE foo [ asdf</foo>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            DOCTYPE_START_PTOKEN,
            SPACE_PTOKEN,
            CHARDATA_PTOKEN,
            ELEMENT_END_PTOKEN,
         ]);
         done();
      });
   });

   it('calls comment.parse()', (done) => {
      sTokenSource.addText('<!--asdf-->');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, COMMENT_PTOKEN]);
         done();
      });
   });

   it('calls parseElementStart()', (done) => {
      sTokenSource.addText('<foo>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, ELEMENT_START_PTOKEN]);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      sTokenSource.addText('<!DOCTYPE theType>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            DOCTYPE_START_PTOKEN,
            DOCTYPE_END_PTOKEN,
         ]);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      sTokenSource.addText('<!docType theType>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            DOCTYPE_START_PTOKEN,
            DOCTYPE_END_PTOKEN,
         ]);
         done();
      });
   });

   it('calls parseElementEnd()', (done) => {
      sTokenSource.addText('</foo>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, ELEMENT_END_PTOKEN]);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ELEMENT', (done) => {
      sTokenSource.addText('<!ELEMENT something "foo">');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, ELEMENT_DECLARATION_PTOKEN]);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ENTITY', (done) => {
      sTokenSource.addText('<!ENTITY something "foo">');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, GENERAL_ENTITY_DECLARATION_PTOKEN]);
         done();
      });
   });

   it('calls parseGeneralEntityReference()', (done) => {
      sTokenSource.addText('&foo;');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, GENERAL_ENTITY_REFERENCE_PTOKEN]);
         done();
      });
   });

   it('calls parseParameterEntityReference()', (done) => {
      sTokenSource.addText('<!DOCTYPE foo [%foo;] >');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            DOCTYPE_START_PTOKEN,
            PARAMETER_ENTITY_REFERENCE_PTOKEN,
            DOCTYPE_END_PTOKEN,
         ]);
         done();
      });
   });

   it('does not call parseParameterEntityReference() if already in content', (done) => {
      sTokenSource.addText('<one>');
      sTokenSource.addText('%foo;');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            ELEMENT_START_PTOKEN,
            CHARDATA_PTOKEN,
         ]);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a notation', (done) => {
      sTokenSource.addText('<!NOTATION something>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, NOTATION_DECLARATION_PTOKEN]);
         done();
      });
   });

   it('calls parseInstruction()', (done) => {
      sTokenSource.addText('<?something foo?>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, PROCESSING_INSTRUCTION_PTOKEN]);
         done();
      });
   });

   it('calls space.parse()', (done) => {
      sTokenSource.addText('   x');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, SPACE_PTOKEN, CHARDATA_PTOKEN]);
         done();
      });
   });

   it('does not call space.parse() if an element start has been found (whitebox)', (done) => {
      sTokenSource.addText('<foo>   ');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            ELEMENT_START_PTOKEN,
            CHARDATA_PTOKEN,
         ]);
         done();
      });
   });

   it('call space.parse() after the topmost element start and end have been found (whitebox)', (done) => {
      sTokenSource.addText('<foo></foo>   ');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            ELEMENT_START_PTOKEN,
            ELEMENT_END_PTOKEN,
            SPACE_PTOKEN,
         ]);
         done();
      });
   });

   it('does not call space.parse() after the topmost element start and end have been found in a general entity (whitebox)', (done) => {
      pTokenParser = new PTokenParser(sTokenSource, {
         parseType: ParseType.GENERAL_ENTITY,
      });
      sTokenSource.addText('<foo></foo>   ');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([ELEMENT_START_PTOKEN, ELEMENT_END_PTOKEN, CHARDATA_PTOKEN]);
         done();
      });
   });

   it('call space.parse() after nameless start and end have been found (whitebox)', (done) => {
      sTokenSource.addText('<></>   ');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            ELEMENT_START_PTOKEN,
            ELEMENT_END_PTOKEN,
            SPACE_PTOKEN,
         ]);
         done();
      });
   });

   it('call space.parse() after a misbalaned end has been found (whitebox)', (done) => {
      sTokenSource.addText('<foo></bar></foo>   ');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            ELEMENT_START_PTOKEN,
            ELEMENT_END_PTOKEN,
            ELEMENT_END_PTOKEN,
            SPACE_PTOKEN,
         ]);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an unknown declaration', (done) => {
      sTokenSource.addText('<!FOO >');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            UNKNOWNDECL_PTOKEN,
            CHARDATA_PTOKEN,
         ]);
         done();
      });
   });

   it('returns the undefined declaration if none provided', (done) => {
      sTokenSource.addText('<!');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, UNKNOWNDECL_PTOKEN]);
         done();
      });
   });

   it('calls parseSection()', (done) => {
      sTokenSource.addText('<![FOO [');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, CONDITIONAL_START_PTOKEN]);
         done();
      });
   });

   it('parses a single "]" as a charData', (done) => {
      sTokenSource.addText('<?xml version="1.0"?><one>]</one>');
      sTokenSource.endText();

      gatherTypes(pTokenParser, (types) => {
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            XMLDECL_PTOKEN,
            ELEMENT_START_PTOKEN,
            CHARDATA_PTOKEN,
            ELEMENT_END_PTOKEN,
         ]);
         done();
      });
   });

   describe('conditional sections', () => {
      it('parses an IGNORE conditional section as a start and end token with text between', (done) => {
         sTokenSource.addText('<![IGNORE[foo bar]]>');
         sTokenSource.endText();

         gatherTypes(pTokenParser, (types) => {
            expect(types).toEqual([
               CONFORMANCE_VERSION,
               ENTITY_ID,
               CONDITIONAL_START_PTOKEN,
               TEXT_PTOKEN,
               CONDITIONAL_END_PTOKEN,
            ]);
            done();
         });
      });

      it('parses an INCLUDE conditional section within an IGNORE as just as text', (done) => {
         sTokenSource.addText('<![IGNORE[foo <![INCLUDE[bar]]>]]>');
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (pTokens) => {
            const strings = pTokens.reduce((acc: Array<string>, token) => {
               if (token.type === TEXT_PTOKEN) {
                  acc.push(token.text.str);
               }
               return acc;
            }, []);

            expect(strings).toEqual(['foo ', '<![', 'INCLUDE[bar', ']]>']);
            done();
         });
      });

      it('parses an IGNORE conditional section within an INCLUDE as just as text', (done) => {
         sTokenSource.addText('<![INCLUDE[<!ELEMENT foo ANY><![IGNORE[bar]]>]]>');
         sTokenSource.endText();

         gatherTypes(pTokenParser, (types) => {
            expect(types).toEqual([
               CONFORMANCE_VERSION,
               ENTITY_ID,
               CONDITIONAL_START_PTOKEN,
               ELEMENT_DECLARATION_PTOKEN,
               CONDITIONAL_START_PTOKEN,
               TEXT_PTOKEN,
               CONDITIONAL_END_PTOKEN,
               CONDITIONAL_END_PTOKEN,
            ]);
            done();
         });
      });

      it('terminates an incomplete INCLUDE conditional section inside of the internal subset (this is an illegal use of conditional sections)', (done) => {
         sTokenSource.addText(
            '<!DOCTYPE one [<![INCLUDE[<!ELEMENT one ANY><![IGNORE[bar]]>]><one></one>',
         );
         sTokenSource.endText();

         gatherTypes(pTokenParser, (types) => {
            expect(types).toEqual([
               CONFORMANCE_VERSION,
               ENTITY_ID,
               DOCTYPE_START_PTOKEN,
               CONDITIONAL_START_PTOKEN,
               ELEMENT_DECLARATION_PTOKEN,
               CONDITIONAL_START_PTOKEN,
               TEXT_PTOKEN,
               CONDITIONAL_END_PTOKEN,
               DOCTYPE_END_PTOKEN,
               ELEMENT_START_PTOKEN,
               ELEMENT_END_PTOKEN,
            ]);
            done();
         });
      });
   });
});
