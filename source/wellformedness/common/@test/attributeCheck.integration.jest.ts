/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource, toSToken } from 'sToken';
import { parseAttribute } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { attributeCheck } from '../attributeCheck';

describe('attributeCheck (integration)', () => {
   let source: STokenSource;
   let preSpace: SToken;
   let ec: ErrorCollector;

   beforeEach(() => {
      source = new STokenSource(defaultExtractors);
      preSpace = toSToken(' ');
      ec = new ErrorCollector(toSToken('x'), WellFormedError);
   });

   it('asks nameCheck() to complain if the name is bad', (done) => {
      source.addText('na\u0000me="value">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, ec, new ConformanceVersion(), preSpace, 'x');

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_INVALID_NAME);
         done();
      });
   });

   it('asks checkXmlLangWellFormed() to complain if the xml:lang value is bad', (done) => {
      source.addText('xml:lang="99">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(
            parsing!,
            ec,
            new ConformanceVersion(),
            preSpace,
            WellFormedError.ID.NOUN_ATTRIBUTE,
         );

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE);
         done();
      });
   });

   it('asks nameXmlCheck() to complain if the name is bad', (done) => {
      const confVer = new ConformanceVersion(1.0, 6);
      source.addText('xml:foo="value">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, ec, confVer, preSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

         expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ATTRIBUTE_NAME_XMLCOLON_RESERVED);
         done();
      });
   });

   it('asks queuedValue.checkWellFormed() to complain if the "=" is missing', (done) => {
      source.addText('name "value">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, ec, new ConformanceVersion(), preSpace, 'x');

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
         done();
      });
   });

   it('asks charCheck() to complain if the value has an illegal value', (done) => {
      source.addText('name="v\u0000alue">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, ec, new ConformanceVersion(), preSpace, 'x');

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
