/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { STokenSource, toSToken } from 'basic';
import { TextPToken } from 'pToken';

// ick
import { WordListPToken, WordListType } from '../../../token/common/wordList';
import {
   AttListDeclarationPToken,
   parseAttListDeclaration,
   resumeParseAttListDeclaration,
} from '../attListDeclaration';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';

describe('attListDeclaration (integration)', () => {
   describe('parseAttListDeclaration()', () => {
      it('parses an ATTLIST with a couple attributes', (done) => {
         const source = new STokenSource();
         source.addText('elName one CDATA two IDREFS #IMPLICIT>');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        enumeration: undefined,
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: undefined,
                        value: [],
                        closeQuote: undefined,
                        valueSpace: undefined,
                     },
                     {
                        name: toSToken('two'),
                        nameSpace: toSToken(' '),
                        type: toSToken('IDREFS'),
                        typeSpace: toSToken(' '),
                        defaultType: toSToken('#IMPLICIT'),
                        enumeration: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: undefined,
                        value: [],
                        closeQuote: undefined,
                        valueSpace: undefined,
                     },
                  ],
                  close: toSToken('>'),
               }),
            );
            done?.();
         });
      });

      it('parses an ATTLIST with a couple attributes with default values', (done) => {
         const source = new STokenSource();
         source.addText('elName one CDATA "1"    two CDATA \'2\'three CDATA "3"    >');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        enumeration: undefined,
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: toSToken('"'),
                        value: [new TextPToken({ text: toSToken('1') })],
                        closeQuote: toSToken('"'),
                        valueSpace: toSToken('    '),
                     },
                     {
                        name: toSToken('two'),
                        nameSpace: toSToken(' '),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        enumeration: undefined,
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: toSToken("'"),
                        value: [new TextPToken({ text: toSToken('2') })],
                        closeQuote: toSToken("'"),
                        valueSpace: undefined,
                     },
                     {
                        name: toSToken('three'),
                        nameSpace: toSToken(' '),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        enumeration: undefined,
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: toSToken('"'),
                        value: [new TextPToken({ text: toSToken('3') })],
                        closeQuote: toSToken('"'),
                        valueSpace: toSToken('    '),
                     },
                  ],
                  close: toSToken('>'),
               }),
            );
            done?.();
         });
      });

      it('parses an ATTLIST with a NOTATION by calling parseWordList()', (done) => {
         const source = new STokenSource();
         source.addText('elName one NOTATION ( one | two) >');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        type: toSToken('NOTATION'),
                        typeSpace: toSToken(' '),
                        enumeration: new WordListPToken(WordListType.NOTATION, {
                           open: toSToken('('),
                           openSpace: toSToken(' '),
                           words: [
                              {
                                 word: toSToken('one'),
                                 wordSpace: toSToken(' '),
                                 connector: toSToken('|'),
                                 connectorSpace: toSToken(' '),
                              },
                              {
                                 word: toSToken('two'),
                                 wordSpace: undefined,
                                 connector: undefined,
                                 connectorSpace: undefined,
                              },
                           ],
                           close: toSToken(')'),
                           closeSpace: toSToken(' '),
                        }),
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: undefined,
                        value: [],
                        closeQuote: undefined,
                        valueSpace: undefined,
                     },
                  ],
                  close: toSToken('>'),
               }),
            );
            done?.();
         });
      });

      it('parses an ATTLIST with an ENUMERATION by calling wordList.parse()', (done) => {
         const source = new STokenSource();
         source.addText('elName one ( one ) >');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        enumeration: new WordListPToken(WordListType.ENUMERATION, {
                           open: toSToken('('),
                           openSpace: toSToken(' '),
                           words: [
                              {
                                 word: toSToken('one'),
                                 wordSpace: toSToken(' '),
                                 connector: undefined,
                                 connectorSpace: undefined,
                              },
                           ],
                           close: toSToken(')'),
                           closeSpace: toSToken(' '),
                        }),
                        type: undefined,
                        typeSpace: undefined,
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: undefined,
                        value: [],
                        closeQuote: undefined,
                        valueSpace: undefined,
                     },
                  ],
                  close: toSToken('>'),
               }),
            );
            done?.();
         });
      });

      it('parses a PERef in the intial position (check unexpanded calls)', (done) => {
         const source = new STokenSource();
         source.addText('%foo;>');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            const expected = new AttListDeclarationPToken({
               open: toSToken('<!'),
               unexpanded: {
                  propName: 'elementName',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            });

            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(expected);
            done?.();
         });
      });

      it('parses a PERef in the attribute name definition (check unexpanded calls)', (done) => {
         const source = new STokenSource();
         source.addText('elName one CDATA #IMPLICIT %foo;>');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            const expected = new AttListDeclarationPToken({
               open: toSToken('<!'),
               elementName: toSToken('elName'),
               elementNameSpace: toSToken(' '),
               attDefs: [
                  {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     defaultType: toSToken('#IMPLICIT'),
                     defaultTypeSpace: toSToken(' '),
                     enumeration: undefined,
                     openQuote: undefined,
                     value: [],
                     closeQuote: undefined,
                     valueSpace: undefined,
                  },
               ],
               unexpanded: {
                  propName: 'name',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            });

            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(expected);
            done?.();
         });
      });

      it('parses a PERef in the attribute type location (check unexpanded calls)', (done) => {
         const source = new STokenSource();
         source.addText('elName one CDATA #IMPLICIT two%foo;>');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            const expected = new AttListDeclarationPToken({
               open: toSToken('<!'),
               elementName: toSToken('elName'),
               elementNameSpace: toSToken(' '),
               attDefs: [
                  {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     defaultType: toSToken('#IMPLICIT'),
                     defaultTypeSpace: toSToken(' '),
                     enumeration: undefined,
                     openQuote: undefined,
                     value: [],
                     closeQuote: undefined,
                     valueSpace: undefined,
                  },
                  {
                     name: toSToken('two'),
                     nameSpace: undefined,
                     type: undefined,
                     typeSpace: undefined,
                     enumeration: undefined,
                     defaultType: undefined,
                     defaultTypeSpace: undefined,
                     openQuote: undefined,
                     value: [],
                     closeQuote: undefined,
                     valueSpace: undefined,
                  },
               ],
               unexpanded: {
                  propName: 'type',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            });

            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(expected);
            done?.();
         });
      });

      it('parses a PERef in the attribute default type location (check unexpanded calls)', (done) => {
         const source = new STokenSource();
         source.addText('elName one CDATA #IMPLICIT two ID %foo;>');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            const expected = new AttListDeclarationPToken({
               open: toSToken('<!'),
               elementName: toSToken('elName'),
               elementNameSpace: toSToken(' '),
               attDefs: [
                  {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     defaultType: toSToken('#IMPLICIT'),
                     defaultTypeSpace: toSToken(' '),
                     enumeration: undefined,
                     openQuote: undefined,
                     value: [],
                     closeQuote: undefined,
                     valueSpace: undefined,
                  },
                  {
                     name: toSToken('two'),
                     nameSpace: toSToken(' '),
                     type: toSToken('ID'),
                     typeSpace: toSToken(' '),
                     enumeration: undefined,
                     defaultType: undefined,
                     defaultTypeSpace: undefined,
                     openQuote: undefined,
                     value: [],
                     closeQuote: undefined,
                     valueSpace: undefined,
                  },
               ],
               unexpanded: {
                  propName: 'defaultType',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            });

            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(expected);
            done?.();
         });
      });

      it('parses a PERef in the trailing position (could be just blank spaces)', (done) => {
         const source = new STokenSource();
         source.addText('elName one ID "value" %foo; >');
         source.endText();

         parseAttListDeclaration(source, { open: toSToken('<!') }, (result) => {
            const expected = new AttListDeclarationPToken({
               open: toSToken('<!'),
               elementName: toSToken('elName'),
               elementNameSpace: toSToken(' '),
               attDefs: [
                  {
                     name: toSToken('one'),
                     nameSpace: toSToken(' '),
                     type: toSToken('ID'),
                     typeSpace: toSToken(' '),
                     enumeration: undefined,
                     defaultType: undefined,
                     defaultTypeSpace: undefined,
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken('value'))],
                     closeQuote: toSToken('"'),
                     valueSpace: toSToken(' '),
                  },
               ],
               unexpanded: {
                  propName: 'name',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                     new TextPToken(toSToken(' ')),
                  ],
               },
               close: toSToken('>'),
            });

            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(expected);
            done?.();
         });
      });
   });

   describe('resumeParseAttListDeclaration()', () => {
      it('inserts the remainder of one attdef, and adds a second', (done) => {
         const source = new STokenSource();
         source.addText("\tCDATA #IMPLICIT two IDREFS #FIXED ''");
         source.endText();
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            elementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  type: undefined,
                  typeSpace: undefined,
                  enumeration: undefined,
                  defaultType: undefined,
                  defaultTypeSpace: undefined,
                  openQuote: undefined,
                  value: [],
                  closeQuote: undefined,
                  valueSpace: undefined,
               },
            ],
            unexpanded: {
               tokens: [],
               propName: 'type',
            },
            close: toSToken('>'),
         });

         resumeParseAttListDeclaration(source, attListDecl, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('one'),
                        nameSpace: toSToken(' \t'),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        enumeration: undefined,
                        defaultType: toSToken('#IMPLICIT'),
                        defaultTypeSpace: toSToken(' '),
                        openQuote: undefined,
                        value: [],
                        closeQuote: undefined,
                        valueSpace: undefined,
                     },
                     {
                        name: toSToken('two'),
                        nameSpace: toSToken(' '),
                        type: toSToken('IDREFS'),
                        typeSpace: toSToken(' '),
                        defaultType: toSToken('#FIXED'),
                        enumeration: undefined,
                        defaultTypeSpace: toSToken(' '),
                        openQuote: toSToken("'"),
                        value: [],
                        closeQuote: toSToken("'"),
                        valueSpace: undefined,
                     },
                  ],
                  unexpanded: {
                     tokens: [],
                     propName: 'type',
                  },
                  close: toSToken('>'),
               }),
            );
            done?.();
         });
      });

      it('insets trailing space after the last attribute', (done) => {
         const source = new STokenSource();
         source.addText('\t');
         source.endText();
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            elementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('one'),
                  nameSpace: toSToken(' '),
                  type: toSToken('ID'),
                  typeSpace: toSToken(' '),
                  enumeration: undefined,
                  defaultType: undefined,
                  defaultTypeSpace: undefined,
                  openQuote: toSToken('"'),
                  value: [new TextPToken(toSToken('value'))],
                  closeQuote: toSToken('"'),
                  valueSpace: toSToken(' '),
               },
            ],
            unexpanded: {
               tokens: [],
               propName: 'name',
            },
            close: toSToken('>'),
         });

         resumeParseAttListDeclaration(source, attListDecl, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('one'),
                        nameSpace: toSToken(' '),
                        type: toSToken('ID'),
                        typeSpace: toSToken(' '),
                        enumeration: undefined,
                        defaultType: undefined,
                        defaultTypeSpace: undefined,
                        openQuote: toSToken('"'),
                        value: [new TextPToken(toSToken('value'))],
                        closeQuote: toSToken('"'),
                        valueSpace: toSToken(' \t'),
                     },
                  ],
                  unexpanded: {
                     tokens: [],
                     propName: 'name',
                  },
                  close: toSToken('>'),
               }),
            );
            done?.();
         });
      });
   });
});
