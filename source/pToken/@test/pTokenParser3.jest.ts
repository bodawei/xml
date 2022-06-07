/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { CONFORMANCE_VERSION, ENTITY_ID, EntityId, ConformanceVersion } from 'basic';
import { ELEMENT_DECLARATION_PTOKEN, TEXT_PTOKEN, ParseToken, ParseType } from 'pToken';
import { SToken, STokenSource } from 'sToken';
import {
   CONDITIONAL_START_PTOKEN,
   CONDITIONAL_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_END_PTOKEN,
   DOCTYPE_END_PTOKEN,
   CHARDATA_PTOKEN,
   parseDeclaration,
   parseCharData,
   parseComment,
   parseElementStart,
   parseElementEnd,
   parseSection,
   parseSpace,
} from 'token';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeElementEnd,
   makeElementStart,
   makeGeneralEntityReference,
   makeSpace,
} from 'token-test';

// import { SToken, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { parseXmlDecl, parsePlainInstruction } from '../bridge/instruction';
import { parseCharRef } from '../token/charRef';
import { parseGeneralEntityReference } from '../token/generalEntityReference';
import { parseParameterEntityReference } from '../token/parameterEntityReference';

import * as peRef from '../token/parameterEntityReference';

import { PTokenParser } from '../pTokenParser3';

jest.mock('../../token/comment');
jest.mock('../../token/elementStart');
jest.mock('../../token/elementEnd');
jest.mock('../../token/bridge/declaration');
jest.mock('../../token/bridge/section');
jest.mock('../../token/charData');
jest.mock('../../token/space');
jest.mock('../bridge/instruction');
jest.mock('../token/charRef');
jest.mock('../token/generalEntityReference');
jest.mock('../token/parameterEntityReference');

describe('pTokenParser (unit)', () => {
   let sTokenSource: STokenSource;
   let pTokenParser: PTokenParser;

   beforeEach(() => {
      sTokenSource = new STokenSource();
      pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.DOCUMENT });

      (parseSpace as jest.Mock).mockImplementation((source, cb) => {
         cb(undefined);
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

   it('returns the conformance version and entity id from the root document', () => {
      const mockSource = new MockSTokenSource([['version="1.1"', 'peekDecl']]);
      pTokenParser = new PTokenParser(mockSource, { parseType: ParseType.DOCUMENT });

      mockSource.respondInAsyncTime();

      gatherParseResults(pTokenParser, (results) => {
         expect(results).toEqual([
            {
               edition: 2,
               type: 'CONFORMANCE_VERSION',
               version: 1.1,
            },
            {
               publicId: undefined,
               systemId: './document.xml',
               type: 'ENTITY_ID',
            },
         ]);
      });
   });

   it('returns the conformance version and entity and id from the options if provided', () => {
      const mockSource = new MockSTokenSource([['version="1.0"', 'peekDecl']]);
      pTokenParser = new PTokenParser(mockSource, {
         confVer: new ConformanceVersion(1.1, 3),
         entityId: new EntityId('somewhere.xml', '-whatever-'),
         parseType: ParseType.DOCUMENT,
      });

      mockSource.respondInAsyncTime();

      gatherParseResults(pTokenParser, (results) => {
         expect(results).toEqual([
            {
               edition: 3,
               type: 'CONFORMANCE_VERSION',
               version: 1.1,
            },
            {
               publicId: '-whatever-',
               systemId: 'somewhere.xml',
               type: 'ENTITY_ID',
            },
         ]);
      });
   });

   it('returns a default conformance version and entity and id when none provided in options or in the document', () => {
      const mockSource = new MockSTokenSource([[undefined, 'peekDecl']]);
      pTokenParser = new PTokenParser(mockSource, {
         parseType: ParseType.DOCUMENT,
      });

      mockSource.respondInAsyncTime();

      gatherParseResults(pTokenParser, (results) => {
         expect(results).toEqual([
            {
               edition: 5,
               type: 'CONFORMANCE_VERSION',
               version: 1,
            },
            {
               publicId: undefined,
               systemId: './document.xml',
               type: 'ENTITY_ID',
            },
         ]);
      });
   });

   it('returns a @@@ ', () => {
      const mockSource = new MockSTokenSource([
         [undefined, 'peekDecl'],
         ['<', 'peekChar'],
         ['<!--', 'markup'],
      ]);
      pTokenParser = new PTokenParser(mockSource, {
         parseType: ParseType.DOCUMENT,
      });
      (parseComment as jest.Mock).mockImplementation((source, start, cb) => {
         console.log('in parseComment');
         cb(makeComment());
      });

      mockSource.respondInAsyncTime();

      gatherParseResults(pTokenParser, (results) => {
         expect(results).toEqual([
            {
               edition: 5,
               type: 'CONFORMANCE_VERSION',
               version: 1,
            },
            {
               publicId: undefined,
               systemId: './document.xml',
               type: 'ENTITY_ID',
            },
         ]);
      });
   });

   // xdescribe('ConformanceVersion', () => {
   //    it('delivers a default version of 1.0/5 if nothing else is specified', (done) => {
   //       sTokenSource.addText('<?xml version="1.0"?>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (results) => {
   //          const result = findToken(results, CONFORMANCE_VERSION);

   //          expect(result).toMatchObject({
   //             edition: 5,
   //             type: CONFORMANCE_VERSION,
   //             version: 1,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('delivers a default version of 1.0/5 when that value is in single quotes', (done) => {
   //       sTokenSource.addText("<?xml version='1.0'?>");
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (results) => {
   //          const result = findToken(results, CONFORMANCE_VERSION);

   //          expect(result).toMatchObject({
   //             edition: 5,
   //             type: CONFORMANCE_VERSION,
   //             version: 1,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('delivers a default version of 1.1/2 if nothing specified and XML Declaration is 1.1', (done) => {
   //       sTokenSource.addText('<?xml version="1.1"?>');
   //       sTokenSource.endText();

   //       pTokenParser.parse((results) => {
   //          const result = findToken(results, CONFORMANCE_VERSION);

   //          expect(result).toMatchObject({
   //             edition: 2,
   //             type: CONFORMANCE_VERSION,
   //             version: 1.1,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('delivers a conformance version using the version specified in the options, regardless of what is in the document', (done) => {
   //       pTokenParser = new PTokenParser(sTokenSource, {
   //          confVer: {
   //             edition: 3,
   //             type: CONFORMANCE_VERSION,
   //             version: 1.0,
   //          },
   //       });
   //       sTokenSource.addText('<?xml version="1.1"?>');
   //       sTokenSource.endText();

   //       pTokenParser.parse((results) => {
   //          const result = findToken(results, CONFORMANCE_VERSION);

   //          expect(result).toMatchObject({
   //             edition: 3,
   //             type: CONFORMANCE_VERSION,
   //             version: 1.0,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('delivers a conformance version using the default version when neither dor not options set', (done) => {
   //       sTokenSource.addText('<');
   //       sTokenSource.endText();

   //       pTokenParser.parse((results) => {
   //          const result = findToken(results, CONFORMANCE_VERSION);

   //          expect(result).toMatchObject({
   //             edition: 5,
   //             type: CONFORMANCE_VERSION,
   //             version: 1.0,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('does not deliver a conformance version when the contxt is not document', (done) => {
   //       pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.EXTERNAL_SUBSET });
   //       sTokenSource.addText('<!');
   //       sTokenSource.endText();

   //       pTokenParser.parse((results) => {
   //          const result = findToken(results, CONFORMANCE_VERSION);

   //          expect(result).toBeUndefined();
   //          done?.();
   //       });
   //    });
   // });

   // xdescribe('entity id', () => {
   //    it('delivers a generic EntityId Token when none provided at construction time', (done) => {
   //       sTokenSource.addText('<?xml version="1.0"?>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (results) => {
   //          const result = findToken(results, ENTITY_ID);

   //          expect(result).toMatchObject({
   //             systemId: './document.xml',
   //             type: ENTITY_ID,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('delivers an EntityId with the option specified in the construction options', (done) => {
   //       pTokenParser = new PTokenParser(sTokenSource, {
   //          entityId: new EntityId('http://foo.com/bar.xml', 'baz - boo'),
   //          parseType: ParseType.DOCUMENT,
   //       });
   //       sTokenSource.addText('<?xml version="1.0"?>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (results) => {
   //          const result = findToken(results, ENTITY_ID);

   //          expect(result).toMatchObject({
   //             publicId: 'baz - boo',
   //             systemId: 'http://foo.com/bar.xml',
   //             type: ENTITY_ID,
   //          });
   //          done?.();
   //       });
   //    });

   //    it('delivers no EntityId when this is not a document type', (done) => {
   //       pTokenParser = new PTokenParser(sTokenSource, {
   //          entityId: new EntityId('http://foo.com/bar.xml', 'baz - boo'),
   //          parseType: ParseType.EXTERNAL_SUBSET,
   //       });
   //       sTokenSource.addText('<?xml version="1.0"?>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (results) => {
   //          const result = findToken(results, ENTITY_ID);

   //          expect(result).toBeUndefined();
   //          done?.();
   //       });
   //    });
   // });

   // xit('calls parseDeclaration() when encountering a <!', (done) => {
   //    (parseDeclaration as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeAttListDeclaration());
   //    });
   //    sTokenSource.addText('<!');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseDeclaration).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseCharRef() when it encounters a &#', (done) => {
   //    (parseCharRef as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeCharRef());
   //    });
   //    sTokenSource.addText('&#');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseCharRef).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseCharData() when it encounters a charater', (done) => {
   //    (parseCharData as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeCharData());
   //    });
   //    sTokenSource.addText('a');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseCharData).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          [],
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseCharData() in the internal subset', (done) => {
   //    (parseCharData as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeCharData());
   //    });
   //    sTokenSource.addText('<!DOCTYPE foo [ asdf</foo>');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseCharData).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          ['%', ']'],
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseComment()', (done) => {
   //    (parseComment as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeComment());
   //    });
   //    sTokenSource.addText('<!--');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseComment).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseElementStart() when it encounters just a <', (done) => {
   //    (parseElementStart as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeElementStart());
   //    });
   //    sTokenSource.addText('<');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseElementStart).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseElementEnd() when it encountes just a </', (done) => {
   //    (parseElementEnd as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeElementEnd());
   //    });
   //    sTokenSource.addText('</');
   //    sTokenSource.endText();
   //    pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.DOCUMENT });

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseElementEnd).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseGeneralEntityReference()', (done) => {
   //    (parseGeneralEntityReference as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeGeneralEntityReference());
   //    });
   //    sTokenSource.addText('&');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseGeneralEntityReference).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parseParameterEntityReference() when encountering a % in the document type', (done) => {
   //    const resultsSpace = [{}];
   //    const parameterEntity = [{}];
   //    (parseSpace as jest.Mock).mockImplementation((source, cb) => {
   //       cb(resultsSpace.shift());
   //    });
   //    (parseParameterEntityReference as jest.Mock).mockImplementation((source, cb) => {
   //       cb(parameterEntity.shift());
   //    });
   //    sTokenSource.addText('%');
   //    sTokenSource.endText();
   //    pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.PARAMETER_ENTITY });

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseParameterEntityReference).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('does not call parseParameterEntityReference() if not in a DTD', (done) => {
   //    (parseParameterEntityReference as jest.Mock).mockImplementation((source, cb) => {
   //       cb({});
   //    });
   //    sTokenSource.addText('%');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseParameterEntityReference).not.toHaveBeenCalled();
   //       done();
   //    });
   // });

   // xit('calls parseXmlDecl() if encountering <? in a DOCUMENT ', (done) => {
   //    (parseXmlDecl as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb({});
   //    });
   //    sTokenSource.addText('<?');
   //    sTokenSource.endText();
   //    pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.DOCUMENT });

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseXmlDecl).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('calls parsePlainInstruction() if encountering <? in a non-DOCUMENT ', (done) => {
   //    (parsePlainInstruction as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb({});
   //    });
   //    sTokenSource.addText('<?');
   //    sTokenSource.endText();
   //    pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.GENERAL_ENTITY });

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parsePlainInstruction).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('does not call space.parse() when this is in element content (whitebox)', (done) => {
   //    (parseElementStart as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb({
   //          type: ELEMENT_START_PTOKEN,
   //       });
   //    });
   //    (parseSpace as jest.Mock).mockImplementation((source, cb) => {
   //       cb(makeSpace());
   //    });
   //    sTokenSource.addText('<');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseSpace).toHaveBeenCalledTimes(1);
   //       done();
   //    });
   // });

   // xit('call space.parse() when this is not in element content', (done) => {
   //    (parseSpace as jest.Mock).mockImplementation((source, cb) => {
   //       cb(makeSpace());
   //    });
   //    sTokenSource.addText('');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseSpace).toHaveBeenCalledWith(expect.any(STokenSource), expect.any(Function));
   //       done();
   //    });
   // });

   // xit('calls parseSection() when encountering <![', (done) => {
   //    (parseSection as jest.Mock).mockImplementation((source, start, cb) => {
   //       cb(makeCdata());
   //    });
   //    sTokenSource.addText('<![');
   //    sTokenSource.endText();
   //    pTokenParser = new PTokenParser(sTokenSource, { parseType: ParseType.DOCUMENT });

   //    gatherParseResults(pTokenParser, () => {
   //       expect(parseSection).toHaveBeenCalledWith(
   //          expect.any(STokenSource),
   //          expect.any(SToken),
   //          expect.any(Function),
   //       );
   //       done();
   //    });
   // });

   // xit('parses a single "]" as a charData', (done) => {
   //    sTokenSource.addText('<?xml version="1.0"?><one>]</one>');
   //    sTokenSource.endText();

   //    gatherParseResults(pTokenParser, (pTokens) => {
   //       const result = findToken(pTokens, CHARDATA_PTOKEN);
   //       expect(result).toMatchObject({
   //          text: expect.objectContaining({
   //             str: ']',
   //          }),
   //       });
   //       done();
   //    });
   // });

   // xdescribe('conditional sections', () => {
   //    it('parses an IGNORE conditional section as a start and end token with text between', (done) => {
   //       sTokenSource.addText('<![IGNORE[foo bar]]>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (pTokens) => {
   //          const tokenTypes = pTokens.map((token) => token.type);
   //          expect(tokenTypes).toEqual([
   //             CONFORMANCE_VERSION,
   //             ENTITY_ID,
   //             CONDITIONAL_START_PTOKEN,
   //             TEXT_PTOKEN,
   //             CONDITIONAL_END_PTOKEN,
   //          ]);
   //          done();
   //       });
   //    });

   //    it('parses an INCLUDE conditional section within an IGNORE as just as text', (done) => {
   //       sTokenSource.addText('<![IGNORE[foo <![INCLUDE[bar]]>]]>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (pTokens) => {
   //          const strings = pTokens.reduce((acc: Array<string>, token) => {
   //             if (token.type === TEXT_PTOKEN) {
   //                acc.push(token.text.str);
   //             }
   //             return acc;
   //          }, []);

   //          expect(strings).toEqual(['foo ', '<![', 'INCLUDE[bar', ']]>']);
   //          done();
   //       });
   //    });

   //    it('parses an IGNORE conditional section within an INCLUDE as just as text', (done) => {
   //       sTokenSource.addText('<![INCLUDE[<!ELEMENT foo ANY><![IGNORE[bar]]>]]>');
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (pTokens) => {
   //          const tokenTypes = pTokens.map((token) => token.type);

   //          expect(tokenTypes).toEqual([
   //             CONFORMANCE_VERSION,
   //             ENTITY_ID,
   //             CONDITIONAL_START_PTOKEN,
   //             ELEMENT_DECLARATION_PTOKEN,
   //             CONDITIONAL_START_PTOKEN,
   //             TEXT_PTOKEN,
   //             CONDITIONAL_END_PTOKEN,
   //             CONDITIONAL_END_PTOKEN,
   //          ]);
   //          done();
   //       });
   //    });

   //    it('terminates an incomplete INCLUDE conditional section inside of the internal subset (this is an illegal use of conditional sections)', (done) => {
   //       sTokenSource.addText(
   //          '<!DOCTYPE one [<![INCLUDE[<!ELEMENT one ANY><![IGNORE[bar]]>]]>]><one></one>',
   //       );
   //       sTokenSource.endText();

   //       gatherParseResults(pTokenParser, (pTokens) => {
   //          const tokenTypes = pTokens.map((token) => token.type);

   //          expect(tokenTypes).toEqual([
   //             CONFORMANCE_VERSION,
   //             ENTITY_ID,
   //             DOCTYPE_START_PTOKEN,
   //             CONDITIONAL_START_PTOKEN,
   //             ELEMENT_DECLARATION_PTOKEN,
   //             CONDITIONAL_START_PTOKEN,
   //             TEXT_PTOKEN,
   //             CONDITIONAL_END_PTOKEN,
   //             CONDITIONAL_END_PTOKEN,
   //             DOCTYPE_END_PTOKEN,
   //             ELEMENT_START_PTOKEN,
   //             ELEMENT_END_PTOKEN,
   //          ]);
   //          done();
   //       });
   //    });
   // });
});
