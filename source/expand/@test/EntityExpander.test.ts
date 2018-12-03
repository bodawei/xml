/* Copyright ® 2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from "sToken";
import {
   GeneralEntityReferencePToken,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   ParameterEntityReferencePToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   ENTITY_DECLARATION_PTOKEN
} from "token";
import { EntityDeclarationPToken } from "source/token/entityDeclaration"; // @@@ TEMP

import { EntityExpander } from "../EntityExpander";

import { gatherStream } from "./utils";
import { TextPToken, TEXT_PTOKEN } from "source/token/text";

describe('EntityExpander (unit)', () => {

   describe('entity declaration', () => {

      it('ignores the declaration if it has no name (whitebox)', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(ENTITY_DECLARATION_PTOKEN);
         }, done);
      });

      it('ignores a second declaration with the same name (whitebox)', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
         }));
         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(2);
            expect(results[0].type).toEqual(ENTITY_DECLARATION_PTOKEN);
            expect(results[1].type).toEqual(ENTITY_DECLARATION_PTOKEN);
         }, done);
      });

   });

   describe('general entity reference', () => {

      it('does not replace the reference if there is no corresponding declaration', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
         }, done);
      });

      it('does not replace the reference if that reference has no name', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
         }, done);
      });

      it('does not replace the reference if that reference is an unparsed entity', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('foo'),
            nDataName: SToken.fromString('notation'),
         }));
         entityExpander.write(new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(2);
            expect(results[1].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
         }, done);
      });

      it('does not replace the reference if that reference is to an external entity and this is not validating', (done) => {
         let entityExpander = new EntityExpander(false);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('foo'),
            externalId: {},
         }));
         entityExpander.write(new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(2);
            expect(results[1].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
         }, done);
      });

      it('replaces an entity reference to an internal entity', (done) => {
         let entityExpander = new EntityExpander(false);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('foo'),
            value: [ new TextPToken({ text: SToken.fromString('test') }) ],
         }));
         entityExpander.write(new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual('CHARDATA');
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
         }, done);
      });

      it('replaces an entity reference to an external entity if validating', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('foo'),
            externalId: {},
         }));
         entityExpander.write(new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(3);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
         }, done);
      });

   });

   describe('parameter entity reference', () => {

      it('does not replace the reference if there is no corresponding declaration', (done) => {
        let entityExpander = new EntityExpander(true);

         entityExpander.write(new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
         }, done);
      });

     it('does not replace the reference if it has no name', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
          }, done);
      });

     it('does not replace the reference if that reference is to an external entity and this is not validating', (done) => {
         let entityExpander = new EntityExpander(false);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('foo'),
            externalId: {},
         }));
         entityExpander.write(new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(2);
           expect(results[1].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
          }, done);
      });

      it('replaces the reference if it is an internal entity', (done) => {
         let entityExpander = new EntityExpander(false);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('foo'),
            value: [],
         }));
         entityExpander.write(new ParameterEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(3);
            expect(results[1].type).toEqual(PARAMETER_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
          }, done);
      });

     it('replaces the reference if it is an external entity and this is validating', (done) => {
         let entityExpander = new EntityExpander(true);

         entityExpander.write(new EntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('foo'),
            externalId: {},
         }));
         entityExpander.write(new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('foo'),
         }));
         entityExpander.end();

         gatherStream(entityExpander, (results) => {
            expect(results.length).toEqual(3);
            expect(results[1].type).toEqual(PARAMETER_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
          }, done);
      });

   });

});
