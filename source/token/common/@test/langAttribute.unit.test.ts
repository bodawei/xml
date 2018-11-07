/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityKind, EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { SToken } from 'sToken';

import entityReference from '../../entityReference';
import { TextPToken, TextXToken } from '../../text';
import { EntityReferencePToken } from '../../entityReference';
import { GeneralEntityEndPToken } from '../../marker/generalEntityEnd';
import { GeneralEntityStartPToken } from '../../marker/generalEntityStart';

import { checkXmlLangWellFormed } from '../langAttribute';

describe('langAttribute (unit)', () => {
   let startSToken: SToken;
   let emd10_1: EntityMetaData;
   let emd: EntityMetaData;
   let ec: ErrorCollector;

   beforeEach(() => {
      startSToken = SToken.fromString('x');
      ec = new ErrorCollector(startSToken, WellFormedError);
      emd10_1 = new EntityMetaData(EntityKind.DOCUMENT, 1, 1);
      emd = new EntityMetaData();
   });

   describe('checkXmlLangWellFormed()', () => {

      it('reports no errors on an empty attribute value', () => {
         checkXmlLangWellFormed([], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports no errors on an attribute value that has no problems', () => {
         checkXmlLangWellFormed([ new TextPToken({ text: SToken.fromString('wh') }) ], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports no errors on an attribute xtoken values', () => {
         checkXmlLangWellFormed([ new TextXToken('wh') ], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('allows for a value to be broken up across strings', () => {
         checkXmlLangWellFormed([
            new TextPToken({ text: SToken.fromString('w') }),
            new TextPToken({ text: SToken.fromString('h') }),
         ], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports no errors on an attribute value that has entity start and end values', () => {
         checkXmlLangWellFormed([
            new GeneralEntityStartPToken(new EntityReferencePToken()),
            new TextPToken({ text: SToken.fromString('wh') }),
            new GeneralEntityEndPToken(new EntityReferencePToken()),
         ], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports an error if the attribute value is not a proper language code', () => {
         const textToken = new TextPToken({ text: SToken.fromString('99') });
         const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            [ '99' ], textToken.text, textToken.text);

         checkXmlLangWellFormed([ textToken ], ec, emd);

         expect(ec.errors).toEqual([ expected ]);
      });

      it('does no checks if there are unexpanded references in the value', () => {
         const textToken = new TextPToken({ text: SToken.fromString('99') });
         const refToken = new entityReference.PToken();

         checkXmlLangWellFormed([ textToken, refToken ], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports no errors with an empty value if rev >= 3', () => {
         checkXmlLangWellFormed([ new TextPToken({ text: SToken.fromString('') }) ], ec, emd);

         expect(ec.errors.length).toEqual(0);
      });

      it('reports an errors with an empty value if rev < 3', () => {
         const textToken = new TextPToken({ text: SToken.fromString('') });
         const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            [ '' ], textToken.text, textToken.text);

         checkXmlLangWellFormed([ textToken ], ec, new EntityMetaData(EntityKind.DOCUMENT, 1.0, 2));

         expect(ec.errors).toEqual([ expected ]);
      });

      it('reports an errors with a completely value if rev < 3', () => {
         const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
            [ '' ], startSToken, startSToken);

         checkXmlLangWellFormed([ ], ec, new EntityMetaData(EntityKind.DOCUMENT, 1.0, 2));

         expect(ec.errors).toEqual([ expected ]);
      });

      describe('in 1.0/1', () => {

         it('allows en as a code', () => {
            const textToken = new TextPToken({ text: SToken.fromString('en') });

            checkXmlLangWellFormed([ textToken ], ec, emd10_1);

            expect(ec.errors.length).toEqual(0);
         });

         it('allows "x-blah-blah" as a code', () => {
            const textToken = new TextPToken({ text: SToken.fromString('x-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz') });

            checkXmlLangWellFormed([ textToken ], ec, emd10_1);

            expect(ec.errors.length).toEqual(0);
         });

         it('allows "X-blah-blah" as a code', () => {
            const textToken = new TextPToken({ text: SToken.fromString('X-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz') });

            checkXmlLangWellFormed([ textToken ], ec, emd10_1);

            expect(ec.errors.length).toEqual(0);
         });

         it('allows "i-blah-blah" as a code', () => {
            const textToken = new TextPToken({ text: SToken.fromString('i-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz') });

            checkXmlLangWellFormed([ textToken ], ec, emd10_1);

            expect(ec.errors.length).toEqual(0);
         });

         it('allows "I-blah-blah" as a code', () => {
            const textToken = new TextPToken({ text: SToken.fromString('I-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz') });

            checkXmlLangWellFormed([ textToken ], ec, emd10_1);

            expect(ec.errors.length).toEqual(0);
         });

         it('allows "zh-blah-blah" as a code', () => {
            const textToken = new TextPToken({ text: SToken.fromString('zh-ABC-a-abcd-abcdefghijklmnopqrstuvwxyz') });

            checkXmlLangWellFormed([ textToken ], ec, emd10_1);

            expect(ec.errors.length).toEqual(0);
         });

         it('reports an error with a three letter langcode', () => {
            const textToken = new TextPToken({ text: SToken.fromString('abc') });
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'abc' ], textToken.text, textToken.text);
   
            checkXmlLangWellFormed([ textToken ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });

         it('reports an error with a six letter langcode split across multiple ptokens', () => {
            const textToken1 = new TextPToken({ text: SToken.fromString('abc') });
            const textToken2 = new TextPToken({ text: SToken.fromString('def') });
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'abcdef' ], textToken1.text, textToken1.text);
   
            checkXmlLangWellFormed([ textToken1, textToken2 ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });

         it('reports an error with a three letter langcode in an XToken', () => {
            const textToken = new TextPToken({ text: SToken.fromString('abc') });
            const textXToken = new TextXToken('abc', textToken);
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'abc' ], textToken.text, textToken.text);
   
            checkXmlLangWellFormed([ textXToken ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });

         it('reports an error with a three letter langcode in an XToken taht has no pToken', () => {
            const textXToken = new TextXToken('abc');
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'abc' ], startSToken, startSToken);
   
            checkXmlLangWellFormed([ textXToken ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });

         it('reports an error with a one letter langcode', () => {
            const textToken = new TextPToken({ text: SToken.fromString('A') });
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'A' ], textToken.text, textToken.text);
   
            checkXmlLangWellFormed([ textToken ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });

         it('reports an error with a letter+digit letter langcode', () => {
            const textToken = new TextPToken({ text: SToken.fromString('e9') });
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'e9' ], textToken.text, textToken.text);
   
            checkXmlLangWellFormed([ textToken ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });

         it('reports an error with an empty subcode', () => {
            const textToken = new TextPToken({ text: SToken.fromString('en-') });
            const expected = new WellFormedError(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE,
               [ 'en-' ], textToken.text, textToken.text);
   
            checkXmlLangWellFormed([ textToken ], ec, emd10_1);
   
            expect(ec.errors).toEqual([ expected ]);
         });
   
      });

   });

});
