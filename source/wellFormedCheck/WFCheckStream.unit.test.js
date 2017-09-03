/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ErrorCollector, EntityMetaData } from '../basic';
import { makeLToken } from '../lToken/test';
import {
   declaration,
   docTypeEnd,
   docTypeStart,
   entityDeclaration,
   xmlDeclaration,
} from '../token';

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream (unit)', () => {
   let checker;
   let metaData;

   beforeEach(() => {
      checker = new WFCheckStream();
      metaData = new EntityMetaData();
   });

   it('passes unknown values through unchanged', () => {
      checker.write({
         type: 'BOGUS',
      });

      expect(checker.read()).toEqual({
         type: 'BOGUS',
      });
   });

   it('calls declaration.checkWellFormed() when encountering an declaration parsing', () => {
      spyOn(declaration, 'checkWellFormed');
      const parsed = {
         type: declaration.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = declaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1] instanceof ErrorCollector).toEqual(true);
      expect(args[2]).toEqual(metaData);
   });

   it('calls xmlDeclaration.checkWellFormed() when encountering an XML Declaration parsing', () => {
      spyOn(xmlDeclaration, 'checkWellFormed');
      const parsed = {
         type: xmlDeclaration.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = xmlDeclaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1] instanceof ErrorCollector).toEqual(true);
      expect(args[2]).toEqual(metaData);
   });

   it('calls docTypeStart.checkWellFormed() when encountering an DOCTYPE start parsing', () => {
      spyOn(docTypeStart, 'checkWellFormed');
      const parsed = {
         type: docTypeStart.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = docTypeStart.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1] instanceof ErrorCollector).toEqual(true);
      expect(args[2]).toEqual(metaData);
   });

   it('calls docTypeEnd.checkWellFormed() when encountering a doctype end parsing', () => {
      spyOn(docTypeEnd, 'checkWellFormed');
      const parsed = {
         type: docTypeEnd.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = docTypeEnd.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[2] instanceof ErrorCollector).toEqual(true);
      expect(args[3]).toEqual(metaData);
   });

   it('calls docTypeEnd.checkWellFormed() when encountering a DOCTYPE end after a start', () => {
      spyOn(docTypeStart, 'checkWellFormed');
      spyOn(docTypeEnd, 'checkWellFormed');
      const parsed = {
         type: docTypeEnd.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write({
         type: docTypeStart.TYPE,
         open: makeLToken('<'),
      });
      checker.write(parsed);

      const args = docTypeEnd.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[2] instanceof ErrorCollector).toEqual(true);
      expect(args[3]).toEqual(metaData);
   });

   it('calls entityDeclaration.checkWellFormed() when encountering an ENTITY declaation parsing', () => {
      spyOn(entityDeclaration, 'checkWellFormed');
      const parsed = {
         type: entityDeclaration.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write(parsed);

      const args = entityDeclaration.checkWellFormed.calls.argsFor(0);
      expect(args[0]).toEqual(parsed);
      expect(args[1] instanceof ErrorCollector).toEqual(true);
      expect(args[2]).toEqual(metaData);
   });

});
