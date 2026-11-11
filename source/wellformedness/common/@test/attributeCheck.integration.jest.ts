/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ProblemCollector } from 'basic';
import { SToken, STokenSource, toSToken } from 'basic';
import { parseAttribute } from 'token';

import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes, WellFormedError } from '../../error/wellFormedError';
import { attributeCheck } from '../attributeCheck';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('attributeCheck (integration)', () => {
   let source: STokenSource;
   let preSpace: SToken;
   let collector: ProblemCollector;

   beforeEach(() => {
      source = new STokenSource();
      preSpace = toSToken(' ');
      collector = new ProblemCollector(toSToken('x'), WellFormedError);
   });

   it('asks nameCheck() to complain if the name is bad', (done) => {
      source.addText('na\u0000me="value">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, collector, new ConformanceVersion(), preSpace, 'x');

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.ATTRIBUTE_INVALID_NAME);
         done();
      });
   });

   it('asks checkXmlLangWellFormed() to complain if the xml:lang value is bad', (done) => {
      source.addText('xml:lang="99">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(
            parsing!,
            collector,
            new ConformanceVersion(),
            preSpace,
            WFEID.NOUN_ATTRIBUTE,
         );

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.ATTRIBUTE_LANG_BAD_CODE);
         done();
      });
   });

   it('asks nameXmlCheck() to complain if the name is bad', (done) => {
      const confVer = new ConformanceVersion(1.0, 6);
      source.addText('xml:foo="value">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, collector, confVer, preSpace, WFEID.NOUN_ATTRIBUTE);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WID.ATTRIBUTE_NAME_XMLCOLON_RESERVED);
         done();
      });
   });

   it('asks queuedValue.checkWellFormed() to complain if the "=" is missing', (done) => {
      source.addText('name "value">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, collector, new ConformanceVersion(), preSpace, 'x');

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.ATTRIBUTE_NO_EQUAL);
         done();
      });
   });

   it('asks charCheck() to complain if the value has an illegal value', (done) => {
      source.addText('name="v\u0000alue">');
      source.endText();

      parseAttribute(source, { terminators: ['>'] }, (parsing) => {
         attributeCheck(parsing!, collector, new ConformanceVersion(), preSpace, 'x');

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
         done();
      });
   });
});
