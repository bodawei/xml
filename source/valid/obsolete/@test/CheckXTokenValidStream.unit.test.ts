/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { gatherStreamResults } from 'basic-test';
import { ConformanceVersion } from 'basic';
import {
   AttDefinitionType,
   AttDefaultType,
   AttListDeclarationXToken,
   ContentSpecType,
   DocTypeStartXToken,
   ElementDeclarationXToken,
   ElementStartXToken,
   NotationDeclarationXToken,
   XmlDeclarationXToken,
} from 'xToken';

import CheckXTokenValidStream from '../CheckXTokenValidStream';

describe('CheckXTokenValidStream (unit)', () => {
   let validator: CheckXTokenValidStream;

   beforeEach(() => {
      validator = new CheckXTokenValidStream();
   });

   function expectNoErrorsOrWarnings(validator: CheckXTokenValidStream, done: () => void) {
      gatherStreamResults<any>(validator, (tokens) => {
         (expect(tokens) as any).toBeErrorAndWarningFree(); // typeHack
         done();
      });
   }

   describe('_transform', () => {
      it('passes initial tokens through', () => {
         const xmlDecl = new XmlDeclarationXToken(1.0);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl as any); // typeHack
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new DocTypeStartXToken('foo', undefined as any);
         const elStart = new ElementStartXToken('foo', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(elStart as any); // typeHack
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new DocTypeStartXToken('foo', undefined as any);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart as any); // typeHack
      });

      it('adds no error if the NOTATION name shows up more than once and this is version 1.0/1', (done) => {
         const nOne = new NotationDeclarationXToken('one');
         const nTwo = new NotationDeclarationXToken('one');

         validator.write(new ConformanceVersion(1.0, 1));
         validator.write(nOne);
         validator.write(nTwo);
         validator.end();

         expectNoErrorsOrWarnings(validator, done);
      });
   });

   describe('write()', () => {
      describe('ElementStart tokens', () => {
         let attListDecl: AttListDeclarationXToken;

         beforeEach(() => {
            attListDecl = new AttListDeclarationXToken('one', [
               {
                  name: 'first',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: undefined,
               },
            ]);
         });

         it('reports no error if the attribute is in the ATTLIST', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            const startToken = new ElementStartXToken('one', [
               {
                  name: 'first',
                  value: [],
               },
            ]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('allows for the start token to have no attributes', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
            const startToken = new ElementStartXToken('one', []);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('allows for there not being an ATTLIST', (done) => {
            const startToken = new ElementStartXToken('one', [
               {
                  name: 'notPresent',
                  value: [],
               },
            ]);

            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports no error if a required attribute was specified', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            attListDecl = new AttListDeclarationXToken(attListDecl.elementName, [
               ...attListDecl.attDefs,
               {
                  name: 'needed',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.REQUIRED,
               },
            ]);
            const startToken = new ElementStartXToken('one', [
               {
                  name: 'needed',
                  value: [],
               },
            ]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });
      });

      describe('EmptyElement tokens', () => {
         let attlist: AttListDeclarationXToken;
         let element;

         beforeEach(() => {
            attlist = new AttListDeclarationXToken('one', [
               {
                  name: 'first',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: undefined,
               },
            ]);
         });
      });
   });
});
