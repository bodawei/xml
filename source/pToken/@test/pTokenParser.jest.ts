/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { CONFORMANCE_VERSION, ENTITY_ID, EntityId, Range } from 'basic';
import { ELEMENT_DECLARATION_PTOKEN, TEXT_PTOKEN, ParseToken, ParseType } from 'pToken';
import { SToken, STokenSource } from 'basic';
import {
   CONDITIONAL_START_PTOKEN,
   CONDITIONAL_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_END_PTOKEN,
   DOCTYPE_END_PTOKEN,
   CHARDATA_PTOKEN,
} from 'token';

import * as tokenStuff from 'token';
import * as instruction from '../bridge/instruction';
import * as charRef from '../token/charRef';
import * as geRef from '../token/generalEntityReference';
import * as peRef from '../token/parameterEntityReference';

import * as declaration from '../../token/bridge/declaration';
import * as section from '../../token/bridge/section';
import * as space from '../../token/space';
import * as elementEnd from '../../token/elementEnd';
import * as elementStart from '../../token/elementStart';
import * as comment from '../../token/comment';
import * as charData from '../../token/charData';

import { PTokenParser } from '../pTokenParser';

describe('pTokenParser (unit)', () => {
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

         pTokenParser.parse((results) => {
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

         pTokenParser.parse((results) => {
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

         pTokenParser.parse((results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toBeUndefined();
            done();
         });
      });
   });

   it('calls parseDeclaration() when encountering an ATTLIST', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!ATTLIST something bar CDATA #REQUIRED>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls charRef.parse()', (done) => {
      const parseSpy = jest.spyOn(charRef, 'parseCharRef');
      sTokenSource.addText('&#foo;');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toEqual(expect.any(SToken));
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls charData.parse()', (done) => {
      const parseSpy = jest.spyOn(charData, 'parseCharData');
      sTokenSource.addText('asdf</foo>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toEqual([]);
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls charData.parse() in the internal subset', (done) => {
      const parseSpy = jest.spyOn(charData, 'parseCharData');
      sTokenSource.addText('<!DOCTYPE foo [ asdf</foo>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toEqual(['%', ']']);
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls comment.parse()', (done) => {
      jest.spyOn(comment, 'parseComment');
      sTokenSource.addText('<!--asdf-->');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(tokenStuff.parseComment).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseElementStart()', (done) => {
      jest.spyOn(elementStart, 'parseElementStart');
      sTokenSource.addText('<foo>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(tokenStuff.parseElementStart).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!DOCTYPE theType>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!docType theType>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls parseElementEnd()', (done) => {
      jest.spyOn(elementEnd, 'parseElementEnd');
      sTokenSource.addText('</foo>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(tokenStuff.parseElementEnd).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ELEMENT', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!ELEMENT something "foo">');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ENTITY', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!ENTITY something "foo">');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls parseGeneralEntityReference()', (done) => {
      const parseSpy = jest.spyOn(geRef, 'parseGeneralEntityReference');
      sTokenSource.addText('&foo;');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toEqual(
            new SToken('&', '&', new Range(new EntityId(), 0, 0, 0, 1, 0, 1)),
         );
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls parseParameterEntityReference()', (done) => {
      const parseSpy = jest.spyOn(peRef, 'parseParameterEntityReference');
      sTokenSource.addText('%foo;');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toEqual(expect.any(Function));
         done();
      });
   });

   it('does not call parseParameterEntityReference() if already in content', (done) => {
      const parseSpy = jest.spyOn(peRef, 'parseParameterEntityReference');
      sTokenSource.addText('<one>');
      sTokenSource.addText('%foo;');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy).not.toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering a notation', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!NOTATION something>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls parseInstruction()', (done) => {
      const parseSpy = jest.spyOn(instruction, 'parseInstruction');
      sTokenSource.addText('<?something foo?>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<?' });
         expect(parseSpy.mock.calls[0][2]).toEqual(true);
         expect(parseSpy.mock.calls[0][3]).toEqual(expect.any(Function));
         done();
      });
   });

   it('calls space.parse()', (done) => {
      jest.spyOn(space, 'parseSpace');
      sTokenSource.addText('   x');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(tokenStuff.parseSpace).toHaveBeenCalled();
         done();
      });
   });

   it('does not call space.parse() if an element start has been found (whitebox)', (done) => {
      const parseSpy = jest.spyOn(space, 'parseSpace');
      sTokenSource.addText('<foo>   ');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls.length).toEqual(1);
         done();
      });
   });

   it('call space.parse() after the topmost element start and end have been found (whitebox)', (done) => {
      const parseSpy = jest.spyOn(space, 'parseSpace');
      sTokenSource.addText('<foo></foo>   ');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls.length).toEqual(3);
         done();
      });
   });

   it('does not call space.parse() after the topmost element start and end have been found in a general entity (whitebox)', (done) => {
      pTokenParser = new PTokenParser(sTokenSource, {
         parseType: ParseType.GENERAL_ENTITY,
      });
      const parseSpy = jest.spyOn(space, 'parseSpace');
      sTokenSource.addText('<foo></foo>   ');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls.length).toEqual(0);
         done();
      });
   });

   it('call space.parse() after nameless start and end have been found (whitebox)', (done) => {
      const parseSpy = jest.spyOn(space, 'parseSpace');
      sTokenSource.addText('<></>   ');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls.length).toEqual(3);
         done();
      });
   });

   it('call space.parse() after a misbalaned end has been found (whitebox)', (done) => {
      const parseSpy = jest.spyOn(space, 'parseSpace');
      sTokenSource.addText('<foo></bar></foo>   ');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls.length).toEqual(3);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an unknown declaration', (done) => {
      const parseSpy = jest.spyOn(declaration, 'parseDeclaration');
      sTokenSource.addText('<!FOO >');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<!' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('returns the undefined declaration if none provided', (done) => {
      sTokenSource.addText('<!');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, (pTokens) => {
         const result = findToken(pTokens, 'UNKNOWNDECL');
         expect(result).not.toBeUndefined();
         done();
      });
   });

   it('calls parseSection()', (done) => {
      const parseSpy = jest.spyOn(section, 'parseSection');
      sTokenSource.addText('<![FOO [');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, () => {
         expect(parseSpy.mock.calls[0][0]).toEqual(expect.any(STokenSource));
         expect(parseSpy.mock.calls[0][1]).toMatchObject({ str: '<![' });
         expect(parseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
         done();
      });
   });

   it('parses a single "]" as a charData', (done) => {
      sTokenSource.addText('<?xml version="1.0"?><one>]</one>');
      sTokenSource.endText();

      gatherParseResults(pTokenParser, (pTokens) => {
         const result = findToken(pTokens, CHARDATA_PTOKEN);
         expect(result).toMatchObject({
            text: expect.objectContaining({
               str: ']',
            }),
         });
         done();
      });
   });

   describe('conditional sections', () => {
      it('parses an IGNORE conditional section as a start and end token with text between', (done) => {
         sTokenSource.addText('<![IGNORE[foo bar]]>');
         sTokenSource.endText();

         gatherParseResults(pTokenParser, (pTokens) => {
            const tokenTypes = pTokens.map((token) => token.type);
            expect(tokenTypes).toEqual([
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

         gatherParseResults(pTokenParser, (pTokens) => {
            const tokenTypes = pTokens.map((token) => token.type);

            expect(tokenTypes).toEqual([
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

         gatherParseResults(pTokenParser, (pTokens) => {
            const tokenTypes = pTokens.map((token) => token.type);

            expect(tokenTypes).toEqual([
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
