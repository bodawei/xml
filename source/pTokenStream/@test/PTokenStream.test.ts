/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { CONFORMANCE_VERSION, ENTITY_ID, EntityId, Range } from 'basic';
import { defaultExtractors } from 'extractor';
import { gatherPTokens } from 'pToken-test';
import { SToken, STokenSource } from 'sToken';
import { DOCTYPE_START_PTOKEN, ELEMENT_START_PTOKEN, ELEMENT_END_PTOKEN, DOCTYPE_END_PTOKEN, CHARDATA_PTOKEN, CharDataPToken } from 'token';

import * as pTokenStuff from 'pToken';
import * as tokenStuff from 'token';

import PTokenStream from '../PTokenStream';
import { ParseValue, PToken, ContextType } from 'pToken';
import { CONDITIONAL_PTOKEN, ELEMENT_DECLARATION_PTOKEN, TEXT_PTOKEN, CONDITIONAL_CLOSE_PTOKEN } from 'token';

type TokenArray = Array<ParseValue>;

describe('PTokenStream (unit)', () => {
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
         context: ContextType.DOCUMENT,
      });
   });

   function findToken(tokens: Array<ParseValue>, type: string): ParseValue | undefined {
      return tokens.find(t => t.type == type);
   }

   describe('unusual read() situation', () => {

      it('ignores a second _read() if one is already in progress', () => {
         const parseSpy = spyOn(pTokenStream, '_parseGeneral');
         pTokenStream.addText(']');
         pTokenStream.endText();

         pTokenStream._read();
         pTokenStream._read();

         expect(parseSpy.calls.count()).toEqual(1);
      });

   });

   describe('ConformanceVersion', () => {

      it('delivers a default version of 1.0/5 if nothing else is specified', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
            context: ContextType.DOCUMENT,
         });
         pTokenStream.addText('<?xml version="1.0"?>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toEqual(
               jasmine.objectContaining({
               type: CONFORMANCE_VERSION,
               version: 1,
               revision: 5,
            }));
            done();
         });
      });

      it('delivers a default version of 1.1/2 if nothing specified and XML Declaration is 1.1', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors));
         pTokenStream.addText('<?xml version="1.1"?>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toEqual(
               jasmine.objectContaining({
               type: CONFORMANCE_VERSION,
               version: 1.1,
               revision: 2,
            }));
            done();
         });
      });

      it('delivers a conformance version using the version specified in the options, regardless of what is in the document', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
            confVer: {
               type: CONFORMANCE_VERSION,
               version: 1.0,
               revision: 3,
            },
         });
         pTokenStream.addText('<?xml version="1.1"?>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toEqual(jasmine.objectContaining({
               type: CONFORMANCE_VERSION,
               version: 1.0,
               revision: 3,
            }));
            done();
         });
      });

      it('delivers a conformance version using the default version when neither dor not options set', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors));
         pTokenStream.addText('<one></one>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toEqual(jasmine.objectContaining({
               type: CONFORMANCE_VERSION,
               version: 1.0,
               revision: 5,
            }));
            done();
         });
      });

      it('does not deliver a conformance version when the contxt is not document', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
            context: ContextType.EXTERNAL_SUBSET,
         });
         pTokenStream.addText('<one></one>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, CONFORMANCE_VERSION);

            expect(result).toBeUndefined();
            done();
         });
      });

   });

   describe('entity id', () => {

      it('delivers a generic EntityId Token when none provided at construction time', (done) => {
         pTokenStream.addText('<?xml version="1.0"?>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toEqual(
               jasmine.objectContaining({
               type: ENTITY_ID,
               systemId: './document.xml',
            }));
            done();
         });
      });

      it('delivers an EntityId with the option specified in the construction options', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
            context: ContextType.DOCUMENT,
            entityId: new EntityId('http://foo.com/bar.xml', 'baz - boo'),
         });
         pTokenStream.addText('<?xml version="1.0"?>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toEqual(
               jasmine.objectContaining({
                  type: ENTITY_ID,
                  systemId: 'http://foo.com/bar.xml',
                  publicId: 'baz - boo',
               })
            );
            done();
         });
      });

      it('delivers no EntityId when this is not a document type', (done) => {
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
            context: ContextType.EXTERNAL_SUBSET,
            entityId: new EntityId('http://foo.com/bar.xml', 'baz - boo'),
         });
         pTokenStream.addText('<?xml version="1.0"?>');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, (results) => {
            const result = findToken(results, ENTITY_ID);

            expect(result).toBeUndefined();
            done();
         });
      });

   });

   describe('weird parse situation', () => {

      it('does not try to parse a close if encountering a "]" but no start was found', (done) => {
         spyOn(pTokenStream, '_parseClose').and.callThrough();
         pTokenStream.addText(']');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, () => {
            expect(pTokenStream._parseClose).not.toHaveBeenCalled();
            done();
         });
      });

   });

   it('calls parseDeclaration() when encountering an ATTLIST', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!ATTLIST something bar CDATA #REQUIRED>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charRef.parse()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseCharRef').and.callThrough();
      pTokenStream.addText('&#foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(SToken);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charData.parse()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseCharData').and.callThrough();
      pTokenStream.addText('asdf</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual([]);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charData.parse() in the internal subset', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseCharData').and.callThrough();
      pTokenStream.addText('<!DOCTYPE foo [ asdf</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '%' ]);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls comment.parse()', (done) => {
      spyOn(tokenStuff, 'parseComment').and.callThrough();
      pTokenStream.addText('<!--asdf-->');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(tokenStuff.parseComment).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseElementStart()', (done) => {
      spyOn(tokenStuff, 'parseElementStart').and.callThrough();
      pTokenStream.addText('<foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(tokenStuff.parseElementStart).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!DOCTYPE theType>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!docType theType>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseElementEnd()', (done) => {
      spyOn(tokenStuff, 'parseElementEnd').and.callThrough();
      pTokenStream.addText('</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(tokenStuff.parseElementEnd).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ELEMENT', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!ELEMENT something "foo">');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ENTITY', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!ENTITY something "foo">');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseGeneralEntityReference()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseGeneralEntityReference').and.callThrough();
      pTokenStream.addText('&foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual(new SToken('&', '&', new Range(new EntityId(), 0, 0, 0, 1, 0, 1)));
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseParameterEntityReference()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseParameterEntityReference').and.callThrough();
      pTokenStream.addText('%foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a notation', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!NOTATION something>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseInstruction()', (done) => {
      const parseSpy = spyOn(pTokenStuff, 'parseInstruction').and.callThrough();
      pTokenStream.addText('<?something foo?>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<?');
         expect(parseSpy.calls.argsFor(0)[2]).toEqual(true);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls space.parse()', (done) => {
      spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('   x');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(tokenStuff.parseSpace).toHaveBeenCalled();
         done();
      });
   });

   it('does not call space.parse() if an element start has been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<foo>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(1);
         done();
      });
   });

   it('call space.parse() after the topmost element start and end have been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<foo></foo>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(3);
         done();
      });
   });

   it('call space.parse() after nameless start and end have been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<></>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(3);
         done();
      });
   });

   it('call space.parse() after a misbalaned end has been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<foo></bar></foo>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(3);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an unknown declaration', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!FOO >');
      pTokenStream.endText();

      
      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('returns the undefined declaration if none provided', (done) => {
      pTokenStream.addText('<!');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, (pTokens) => {
         const result = findToken(pTokens, 'UNKNOWNDECL');
         expect(result).not.toBeUndefined();
         done();
      });
   });

   it('calls parseSection()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSection').and.callThrough();;
      pTokenStream.addText('<![FOO [');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<![');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('parses a single "]" as a charData', (done) => {
      pTokenStream.addText('<?xml version="1.0"?><one>]</one>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, (pTokens) => {
         const result = findToken(pTokens, CHARDATA_PTOKEN) as CharDataPToken;
         expect(result.text.str).toEqual(']'); // typeHack
         done();
      });
   });

   describe('conditional sections', () => {

      it('parses an IGNORE conditional section as a start and end token with text between', (done) => {
         pTokenStream.addText('<![IGNORE[foo bar]]>');
         pTokenStream.endText();
   
         gatherPTokens(pTokenStream, (pTokens) => {
            const tokenTypes = pTokens.map(token => token.type);
            expect(tokenTypes).toEqual([CONFORMANCE_VERSION, ENTITY_ID, CONDITIONAL_PTOKEN, TEXT_PTOKEN, CONDITIONAL_CLOSE_PTOKEN]);
            done();
         });
      });

      it('parses an INCLUDE conditional section within an IGNORE as just as text', (done) => {
         pTokenStream.addText('<![IGNORE[foo <![INCLUDE[bar]]>]]>');
         pTokenStream.endText();
   
         gatherPTokens(pTokenStream, (pTokens) => {
            const strings: Array<String> = [];
            pTokens.forEach(token => {
               if (token.type === TEXT_PTOKEN) {
                  strings.push(token.text.str);
               }
            });

            expect(strings).toEqual(['foo ', '<![', 'INCLUDE[bar', ']]>']);
            done();
         });
      });

      it('parses an IGNORE conditional section within an INCLUDE as just as text', (done) => {
         pTokenStream.addText('<![INCLUDE[<!ELEMENT foo ANY><![IGNORE[bar]]>]]>');
         pTokenStream.endText();
   
         gatherPTokens(pTokenStream, (pTokens) => {
            const tokenTypes = pTokens.map(token => token.type);

            expect(tokenTypes).toEqual([
               CONFORMANCE_VERSION,
               ENTITY_ID,
               CONDITIONAL_PTOKEN,
               ELEMENT_DECLARATION_PTOKEN,
               CONDITIONAL_PTOKEN,
               TEXT_PTOKEN,
               CONDITIONAL_CLOSE_PTOKEN,
               CONDITIONAL_CLOSE_PTOKEN,
            ]);
            done();
         });
      });

      it('terminates an incomplete INCLUDE conditional section inside of the internal subset (this is an illegal use of conditional sections)', (done) => {
         pTokenStream.addText('<!DOCTYPE one [<![INCLUDE[<!ELEMENT one ANY><![IGNORE[bar]]>]><one></one>');
         pTokenStream.endText();
   
         gatherPTokens(pTokenStream, (pTokens) => {
            const tokenTypes = pTokens.map(token => token.type);

            expect(tokenTypes).toEqual([
               CONFORMANCE_VERSION,
               ENTITY_ID,
               DOCTYPE_START_PTOKEN,
               CONDITIONAL_PTOKEN,
               ELEMENT_DECLARATION_PTOKEN,
               CONDITIONAL_PTOKEN,
               TEXT_PTOKEN,
               CONDITIONAL_CLOSE_PTOKEN,
               DOCTYPE_END_PTOKEN,
               ELEMENT_START_PTOKEN,
               ELEMENT_END_PTOKEN,
            ]);
            done();
         });
      });

   });

});
