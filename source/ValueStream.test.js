/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlStringCursor = require('./XmlStringCursor.js');
const tokens = require('./XmlToken.js');
const ValueStream = require('./ValueStream.js');

// @@@ Similar to EntityExpandingStream
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
            peRef: false
         });
      });

      it('stores the option if passed an option', () => {
         const s = new ValueStream(new XmlStringCursor('hi'), { peRef: true, geRef: true });

         expect(s._options).toEqual({
            geRef: true,
            peRef: true
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
               tokens.EntityReference
            ]);
         }
      });

      it('handles a no-name parameter entity reference', (done) => {
         pipeAndTest('%;', done, checkResults, { peRef: true });

         function checkResults(results) {
            expect(results).toMatchClasses([
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
