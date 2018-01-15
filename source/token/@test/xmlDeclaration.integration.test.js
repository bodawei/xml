/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import * as xmlDeclaration from '../xmlDeclaration.js';

describe('xmlDeclaration (integration)', () => {
   let xmlDeclPToken;

   beforeEach(() => {
      const makeToken = makeSTokenMaker();
      xmlDeclPToken = {
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
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         xmlDeclaration.parse(source, {}, (parsing) => {
            expect(parsing.params[0].name.str).toEqual('version');
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let source;
      let instructionPToken;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
         instructionPToken = xmlDeclPToken;

         delete instructionPToken.params;
         delete instructionPToken.close;
      });

      it('reports errors in the PI initial part (instruction.checkWellFormed())', (done) => {
         instructionPToken.postOpenSpace = instructionPToken.postTargetSpace;
         source.addText('version="1.1"?>');
         xmlDeclaration.parse(source, instructionPToken, (result) => {
            const ec = new ErrorCollector(instructionPToken.open, WellFormedError);

            xmlDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
            done();
         });
      });

      it('reports an error when a param is malformed (check attribute.checkWellFormed())', (done) => {
         source.addText('version "1.0" encoding="usascii"?>');
         xmlDeclaration.parse(source, instructionPToken, (result) => {
            const ec = new ErrorCollector(instructionPToken.open, WellFormedError);

            xmlDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('relies on attribute module to prepare the parameters', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.3" standalone="yes" ?>');
         source.endText();

         xmlDeclaration.parse(source, {}, (pToken) => {
            const token = xmlDeclaration.pTokenToXToken(pToken);

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

      it('relies on attribute module to prepare the STokens', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.3" standalone="yes" ?>');
         source.endText();

         xmlDeclaration.parse(source, {}, (pToken) => {
            const token = xmlDeclaration.pTokenToXToken(pToken);

            expect(token.pToken.params[0].name.str).toEqual('version');
            done();
         });
      });

   });

});
