/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');
const ValueStream = require('./ValueStream.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlWarning = require('./error/XmlWarning.js');

function pipeAndTest(inputString, done, endHandler, other = {}) {
   const errorHandler = other.errorHandler;

   const vs = new ValueStream(new XmlStringCursor(inputString), other);
   const results = [];

   vs.on('data', (token) => {
      results.push(token);
   });
   vs.on('error', errorHandler || function errHandler(error) { throw error; });
   vs.on('end', () => {
      try {
         endHandler(results);
      } finally {
         done();
      }
   });
}

describe('ValueStream', () => {

   describe('construction', () => {

      it('can be constructed with a cursor', () => {
         expect(() => {
            new ValueStream(new XmlStringCursor('hi'));
         }).not.toThrow();
      });

      it('throws an error if called with no cursor', () => {
         expect(() => {
            new ValueStream();
         }).toThrowError('Must provide a cursor instance to ValueStream().');
      });

      it('if passed no options, the defaults are used (whitebox)', () => {
         const s = new ValueStream(new XmlStringCursor('hi'));

         expect(s._options).toEqual({
            geRef: false,
            peRef: false,
            attributeName: ''
         });
      });

      it('stores the option if passed an option', () => {
         const s = new ValueStream(new XmlStringCursor('hi'), {
            peRef: true, geRef: true, isAttribute: true, attributeName: 'foo' });

         expect(s._options).toEqual({
            geRef: true,
            peRef: true,
            attributeName: 'foo'
         });
      });

   });

   describe('on("data")', () => {

      it('retrieves a single Text token if the input has no relevant markup', (done) => {
         pipeAndTest('This is some stuff', done, (results) => {
            expect(results).toMatchClasses([
               tokens.Text
            ]);

            expect(results[0].text).toEqual('This is some stuff');
         });
      });

      it('retrieves a single Text token while ignoring things that could look like markup', (done) => {
         pipeAndTest('This <begin> is</begin> <!-- some --> <?stuff?>', done, (results) => {
            expect(results).toMatchClasses([
               tokens.Text
            ]);

            expect(results[0].text).toEqual('This <begin> is</begin> <!-- some --> <?stuff?>');
         });
      });

      it('retrieves a character reference from the input', (done) => {
         pipeAndTest('This <begin> is</&#65;> <!-- some --> <?stuff?>', done, (results) => {
            expect(results).toMatchClasses([
               tokens.Text,
               tokens.CharRef,
               tokens.Text
            ]);

            expect(results[0].text).toEqual('This <begin> is</');
            expect(results[1].text).toEqual('A');
            expect(results[2].text).toEqual('> <!-- some --> <?stuff?>');
         });
      });

      it('does not retrieve a general entity reference with the default parameters', (done) => {
         pipeAndTest('a &bird; flew through the sky', done, (results) => {
            expect(results).toMatchClasses([
               tokens.Text
            ]);

            expect(results[0].text).toEqual('a &bird; flew through the sky');
         });
      });

      it('does not retrieve a parameter entity reference with the default parameters', (done) => {
         pipeAndTest('a %bird; flew through the sky', done, (results) => {
            expect(results).toMatchClasses([
               tokens.Text
            ]);

            expect(results[0].text).toEqual('a %bird; flew through the sky');
         });
      });

      it('retrieves a general entity reference when geRef is set to true', (done) => {
         pipeAndTest('&#65; &bird; flew through the sky', done, checkResults, { geRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               tokens.CharRef,
               tokens.Text,
               tokens.EntityReference,
               tokens.Text
            ]);

            expect(results[1].text).toEqual(' ');
            expect(results[2].name).toEqual('bird');
            expect(results[3].text).toEqual(' flew through the sky');
         }
      });

      it('does not retrieve a parameter entity reference when geRef set to true', (done) => {
         pipeAndTest('&#65; %bird; flew through the sky', done, checkResults, { geRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               tokens.CharRef,
               tokens.Text
            ]);

            expect(results[1].text).toEqual(' %bird; flew through the sky');
         }
      });

      it('retrieves a parameter entity reference when peRef is set to true', (done) => {
         pipeAndTest('&#65; %bird; flew through the sky', done, checkResults, { peRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               tokens.CharRef,
               tokens.Text,
               tokens.ParameterEntityReference,
               tokens.Text
            ]);

            expect(results[1].text).toEqual(' ');
            expect(results[2].name).toEqual('bird');
            expect(results[3].text).toEqual(' flew through the sky');
         }
      });

      it('does not retrieve a general entity reference when peRef set to true', (done) => {
         pipeAndTest('&#65; &bird; flew through the sky', done, checkResults, { peRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               tokens.CharRef,
               tokens.Text
            ]);

            expect(results[1].text).toEqual(' &bird; flew through the sky');
         }
      });

      // test chunks
      // test validation
   });

   describe('errors', () => {

      it('reports an error if there is a space after the & for a char ref', (done) => {
         pipeAndTest('&# 65;', done, checkResults, { geRef: true });

         function checkResults(results) {
            expect(results[0]).toEqualProps({
               id: SyntaxError.ID.CHARREF_XTRA_SPACE,
               message: 'Must not have a space after the "#" in a character reference.'
            });
         }
      });

      it('reports an error if there is a space after the & for an entity ref', (done) => {
         pipeAndTest('& foo;', done, checkResults, { geRef: true });

         function checkResults(results) {
            expect(results[0]).toEqualProps({
               id: SyntaxError.ID.REFERENCE_XTRA_SPACE,
               message: 'Must not have space in an entity reference.'
            });
         }
      });

      it('reports an error if there is a space after the % for a parameter entity ref', (done) => {
         pipeAndTest('% frog;', done, checkResults, { peRef: true });

         function checkResults(results) {
            expect(results[0]).toEqualProps({
               id: SyntaxError.ID.REFERENCE_XTRA_SPACE,
               message: 'Must not have space in an entity reference.'
            });
         }
      });

      it('reports an error if there is an angle bracket and this is an attribute', (done) => {
         pipeAndTest('foo < bar', done, checkResults, { attributeName: 'myAttr' });

         function checkResults(results) {
            expect(results[0]).toEqualProps({
               id: SyntaxError.ID.ATTRIBUTE_INVALID_VALUE,
               message: 'The value of attribute "myAttr" must not contain "<".'
            });
         }
      });

      it('reports invalid and discouraged characters in the content', (done) => {
         pipeAndTest('b\u0001x\u0000x\uFDD1x\uFDD2xx', done, checkResults);

         function checkResults(results) {
            expect(results[0]).toEqualProps({
               id: SyntaxError.ID.CHARDATA_INVALID_CHAR,
               message: 'Characters that do not match the syntax for XML document found at: 1, 3.'
            });
            expect(results[1]).toEqualProps({
               id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
               message: 'Characters that are disouraged in XML documents found at: 5, 7.'
            });
         }
      });

   });

   describe('whitebox tests', () => {

      it('handles an entity reference at the end of the input string', (done) => {
         pipeAndTest('%bird;', done, checkResults, { peRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               tokens.ParameterEntityReference
            ]);
         }
      });

      it('handles a no-name general entity reference', (done) => {
         pipeAndTest('&;', done, checkResults, { geRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               SyntaxError,
               tokens.EntityReference
            ]);
         }
      });

      it('handles a no-name parameter entity reference', (done) => {
         pipeAndTest('%;', done, checkResults, { peRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
               SyntaxError,
               tokens.ParameterEntityReference
            ]);
         }
      });

      it('handles opening with a non-reference markup character', (done) => {
         pipeAndTest('<one></one>', done, checkResults);

         function checkResults(results) {
            expect(results).toMatchClasses([
               tokens.Text
            ]);
         }
      });

   });
});
