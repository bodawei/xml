/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'error';
import { defaultExtractors } from 'extractor';
import { ContextType } from 'pToken';
import { toSToken } from 'sToken';
import { STokenSource } from 'sToken';
import { gatherPTokens } from 'pToken-test';
import { EntityExpanderStream } from 'nodeStream';

import { ValidityChecker } from '../ValidityChecker';
import { ValidityError } from '../../error/ValidityError';

// ick
import { PTokenStream } from '../../pTokenStream';
import { XmlError } from 'token';

describe('ValidityChecker (integration)', () => {
   let ec: ErrorCollector;
   let checker: ValidityChecker;
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      checker = new ValidityChecker();
      // elementEnd = new ElementEndPToken({ open: toSToken('</'), name: toSToken('elementName') });
      // graph = {
      //    startId: 0,
      //    endId: 0,
      //    states: {
      //       '4': {
      //          id: 4,
      //          trans: {
      //             one: {
      //                ref: '/1/2',
      //                stateId: 5,
      //             },
      //             two: {
      //                ref: '/3/4',
      //                stateId: 6,
      //             },
      //          },
      //          done: false,
      //       },
      //    },
      // };
      // const currentContext: ElementContext = {
      //    declDetails: {
      //       token: elementDeclaration,
      //       type: ElDeclType.CHILDREN,
      //       graph,
      //    },
      //    parentName: 'elementName',
      //    stateId: 4,
      // };
      // state = {
      //    elementDeclarations: {
      //       elementName: {
      //          type: ElDeclType.CHILDREN,
      //          token: new ElementDeclarationPToken({
      //             open: toSToken('<!'),
      //             declType: toSToken('ELEMENT'),
      //             name: toSToken('elementName'),
      //             close: toSToken('>'),
      //          }),
      //          graph,
      //       },
      //    },
      //    parameterEntities: {},
      //    elementContext: {
      //       contextStack: [currentContext],
      //       activeContext: currentContext,
      //       pastEnd: false,
      //    },
      // };
   });

   fit('reports an error the current context is a CHILDREN context, but we are not at the end', (done) => {
      const finalResults: Array<XmlError> = [];

      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
         context: ContextType.DOCUMENT,
      });
      pTokenStream.addText(`<?xml version="1.0"?>
      <!DOCTYPE root [
         <!ELEMENT one ANY>
         <!ELEMENT two ANY>
         <!ENTITY % CM '(one | two'>
         <!ELEMENT root %CM;>
      ]>
      <root/>`);
      pTokenStream.endText();
      const entityExpander = new EntityExpanderStream(true);

      pTokenStream.pipe(entityExpander);

      gatherPTokens(entityExpander, (results) => {
         for (const result of results) {
            ec = new ErrorCollector(
               'open' in result ? result.open : toSToken('foo'),
               ValidityError,
            );

            checker.checkPToken(result, ec);

            finalResults.push(...(ec.errors as any));
         }

         // console.log('resultx', results);
         expect(finalResults[0].id).toEqual(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED);
         done();
      });

      // const pDecl = new ParameterEntityDeclarationPToken({
      //    open: toSToken('<!'),
      // });
      // const peRef = new ParameterEntityReferencePToken({
      //    open: toSToken('%'),
      //    name: toSToken('foo'),
      // });
      // // new ParameterEntityStartPToken(peRef),
      // // new TextPToken({ text: toSToken('( foo | bar') }),
      // // new ParameterEntityEndPToken(peRef),

      // elementDeclaration = new ElementDeclarationPToken({
      //    open: toSToken('<!'),
      //    openSpace: undefined,
      //    declType: toSToken('ELEMENT'),
      //    declTypeSpace: toSToken(' '),
      //    name: toSToken('elementName'),
      //    nameSpace: toSToken(' '),
      //    close: toSToken('>'),
      //    unexpanded: {
      //       tokens: [peRef],
      //       propName: 'contentSpec',
      //    },
      // });
      // ec = new ErrorCollector(elementDeclaration.open, ValidityError);
      // checker.checkPToken(elementDeclaration, ec);

      // expect(ec.errors).toEqual([]);
   });

   // it('reports an error if a non-deterministic content model is found', (done) => {
   //    const error = new WellFormedError(WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
   //       ['b (/1/1,/2/1)'], new Offset(new EntityId(), 100, 0, 100));

   //    parser.addText('<?xml version="1.0"?><!DOCTYPE one [');
   //    parser.addText('  <!ELEMENT a ANY > ');
   //    parser.addText('  <!ELEMENT b ANY > ');
   //    parser.addText('  <!ELEMENT c ANY > ');
   //    parser.addText('  <!ELEMENT one ((b , a) | ( b, c)) > ');
   //    parser.addText(']>');
   //    parser.addText('<one>');
   //    parser.addText('</one>');
   //    parser.endText();

   //    expectStream(validator, error, done);
   // });

   // it('reports an error when the an element type appears at an invalid place in the content', (done) => {
   //    const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, ['one', 'two'],
   //       new Offset(new EntityId(), 226, 0, 226));

   //    parser.addText('<?xml version="1.0"?><!DOCTYPE one [');
   //    parser.addText('  <!ELEMENT two ANY >');
   //    parser.addText('  <!ELEMENT three ANY >');
   //    parser.addText('  <!ELEMENT four ANY >');
   //    parser.addText('  <!ELEMENT five ANY >');
   //    parser.addText('  <!ELEMENT one ( two+, ( three | four), five) > ');
   //    parser.addText(']>');
   //    parser.addText('<one>');
   //    parser.addText('  <two></two>');
   //    parser.addText('  <two></two>');
   //    parser.addText('  <three></three>');
   //    parser.addText('  <two></two>');
   //    parser.addText('  <five></five>');
   //    parser.addText('</one>');
   //    parser.endText();

   //    expectStream(validator, error, done);
   // });

   // it('reports an error when the an element type appears at an invalid place in child content', (done) => {
   //    const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, ['three', 'one'],
   //       new Offset(new EntityId(), 243, 0, 243));

   //    parser.addText('<?xml version="1.0"?><!DOCTYPE one [');
   //    parser.addText('  <!ELEMENT two ANY >');
   //    parser.addText('  <!ELEMENT four ANY >');
   //    parser.addText('  <!ELEMENT five ANY >');
   //    parser.addText('  <!ELEMENT three ( four+ | two | five)  >');
   //    parser.addText('  <!ELEMENT one ( two+, ( three | four), five) > ');
   //    parser.addText(']>');
   //    parser.addText('<one>');
   //    parser.addText('  <two></two>');
   //    parser.addText('  <three>');
   //    parser.addText('     <two></two>');
   //    parser.addText('     <one></one>');
   //    parser.addText('  </three>');
   //    parser.addText('  <five></five>');
   //    parser.addText('</one>');
   //    parser.endText();

   //    expectStream(validator, error, done);
   // });
});
