/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration (integration)', () => {
   let parsedXmlDecl;

   beforeEach(() => {
      const makeToken = makeLTokenMaker();
      parsedXmlDecl = {
         open: makeToken('<?'),
         postOpenSpace: undefined,
         target: makeToken('xml'),
         postTargetSpace: makeToken(' '),
         params: [],
         close: makeToken('?>'),
      };
   });

   describe('parse()', () => {

      it('asks the attributes module to parse the attributes', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         xmlDeclaration.parse(source, {}, (parsing) => {
            expect(parsing.params[0].name.text).toEqual('version');
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let source;
      let parsedInstruction;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
         parsedInstruction = parsedXmlDecl;

         delete parsedInstruction.params;
         delete parsedInstruction.close;
      });

      it('reports errors in the PI initial part (instruction.checkWellFormed())', (done) => {
         parsedInstruction.postOpenSpace = parsedInstruction.postTargetSpace;
         source.addText('version="1.1"?>');
         xmlDeclaration.parse(source, parsedInstruction, (result) => {
            const ec = new ErrorCollector(parsedInstruction.open, WellFormedError);

            xmlDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
            done();
         });
      });

      it('reports an error when a param is malformed (check attribute.checkWellFormed())', (done) => {
         source.addText('version "1.0" encoding="usascii"?>');
         xmlDeclaration.parse(source, parsedInstruction, (result) => {
            const ec = new ErrorCollector(parsedInstruction.open, WellFormedError);

            xmlDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

   });

   describe('makeToken()', () => {

      it('relies on attribute module to prepare the parameters', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.3" standalone="yes" ?>');
         source.endText();

         xmlDeclaration.parse(source, {}, (pToken) => {
            const token = xmlDeclaration.makeToken(pToken);

            expect(token.params).toEqual([ {
               name: 'version',
               value: '1.3',
            }, {
               name: 'standalone',
               value: 'yes',
            } ]);
            done();
         });
      });

      it('relies on attribute module to prepare the lTokens', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.3" standalone="yes" ?>');
         source.endText();

         xmlDeclaration.parse(source, {}, (pToken) => {
            const token = xmlDeclaration.makeToken(pToken);

            expect(token.lTokens[0].text).toEqual('version');
            done();
         });
      });

   });

});
