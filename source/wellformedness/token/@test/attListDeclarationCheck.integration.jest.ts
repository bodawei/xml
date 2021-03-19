/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { defaultExtractors } from 'extractor';
import { parseAttListDeclaration } from 'pToken';
import { SToken, STokenSource, toSToken } from 'sToken';
import { DeclarationStart } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { attListDeclarationCheck } from '../attListDeclarationCheck';

describe('checkWellFormed()', () => {
   let ec: ErrorCollector;
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

      declarationStart = {
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ATTLIST'),
         declTypeSpace: toSToken(' '),
      };
   });

   // it('asks the declaration module to look for problems in the declaration part', (done) => {
   //    declarationStart.openSpace = toSToken(' ');
   //    const source = new STokenSource(defaultExtractors);
   //    source.addText('foo>');
   //    source.endText();

   //    parseAttListDeclaration(source, declarationStart, (parsing) => {
   //       attListDeclarationCheck(parsing, ec, new ConformanceVersion());

   //       expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
   //       done?.();
   //    });
   // });

   it('calls nameCheck() to report on invalid names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('$foo>');
      source.endText();
      parseAttListDeclaration(source, declarationStart, (result) => {
         attListDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_INVALID);
         done?.();
      });
   });

   it('calls nameCheck() to report on invalid attribute names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('elName $foo>');
      source.endText();
      parseAttListDeclaration(source, declarationStart, (result) => {
         attListDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTLISTDECL_ATTR_NAME_INVALID);
         done?.();
      });
   });

   it('calls nameXmlCheck() to report on invalid attribute names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('elName xml:foo>');
      source.endText();
      parseAttListDeclaration(source, declarationStart, (result) => {
         attListDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);
         done?.();
      });
   });

   it('calls wordList.checkWellFormed() on an enumerated list', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('elName attr ( $badName ) >');
      source.endText();
      parseAttListDeclaration(source, declarationStart, (result) => {
         attListDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.WORDLIST_INVALID_NMTOKEN);
         done?.();
      });
   });

   it('calls wordList.checkWellFormed() on a NOTATION list', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('elName attr2 NOTATION ( goodName | $badName ) >');
      source.endText();
      parseAttListDeclaration(source, declarationStart, (result) => {
         attListDeclarationCheck(result, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.WORDLIST_INVALID_NAME);
         done?.();
      });
   });
});
