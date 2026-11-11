/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { toSToken, STokenSource } from 'basic';
import { parseAttListDeclaration } from 'pToken';
import { DeclarationStart } from 'token';
import { describe, expect, it } from 'vitest';

import { warningCodes } from '../../error/warningCodes';
import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';
import { attListDeclarationCheck } from '../attListDeclarationCheck';

const WFEID = wellFormedErrorCodes.id;

describe('attListDeclarationCheck()', () => {
   let collector: ProblemCollector;
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      collector = new ProblemCollector(toSToken('x'), WellFormedError);

      declarationStart = {
         declType: toSToken('ATTLIST'),
         declTypeSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
      };
   });

   // it('asks the declaration module to look for problems in the declaration part', (done) => {
   //    declarationStart.openSpace = toSToken(' ');
   //    const source = new STokenSource();
   //    source.addText('foo>');
   //    source.endText();

   //    parseAttListDeclaration(source, declarationStart, (parsing) => {
   //       attListDeclarationCheck(parsing, ec, new ConformanceVersion());

   //       expect(collector.getProblems()[0].id).toEqual(WFEID.DECL_OPEN_XTRA_SPACE_AFTER);
   //       done?.();
   //    });
   // });

   it('calls nameCheck() to report on invalid names', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         source.addText('$foo>');
         source.endText();
         parseAttListDeclaration(source, declarationStart, (result) => {
            attListDeclarationCheck(result, collector, new ConformanceVersion());

            expect(collector.getProblems()[0].id).toEqual(WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);
            done();
         });
      }));

   it('calls nameCheck() to report on invalid attribute names', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         source.addText('elName $foo>');
         source.endText();
         parseAttListDeclaration(source, declarationStart, (result) => {
            attListDeclarationCheck(result, collector, new ConformanceVersion());

            expect(collector.getProblems()[0].id).toEqual(WFEID.ATTLISTDECL_ATTR_NAME_INVALID);
            done();
         });
      }));

   it('calls nameXmlCheck() to report on invalid attribute names', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         source.addText('elName xml:foo>');
         source.endText();
         parseAttListDeclaration(source, declarationStart, (result) => {
            attListDeclarationCheck(result, collector, new ConformanceVersion());

            expect(collector.getProblems()[0].id).toEqual(
               warningCodes.id.ATTLISTDECL_ATTR_NAME_XML_RESERVED,
            );
            done();
         });
      }));

   it('calls wordList.checkWellFormed() on an enumerated list', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         source.addText('elName attr ( $badName ) >');
         source.endText();
         parseAttListDeclaration(source, declarationStart, (result) => {
            attListDeclarationCheck(result, collector, new ConformanceVersion());

            expect(collector.getProblems()[0].id).toEqual(WFEID.WORDLIST_INVALID_NMTOKEN);
            done();
         });
      }));

   it('calls wordList.checkWellFormed() on a NOTATION list', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         source.addText('elName attr2 NOTATION ( goodName | $badName ) >');
         source.endText();
         parseAttListDeclaration(source, declarationStart, (result) => {
            attListDeclarationCheck(result, collector, new ConformanceVersion());

            expect(collector.getProblems()[0].id).toEqual(WFEID.WORDLIST_INVALID_NAME);
            done();
         });
      }));
});
