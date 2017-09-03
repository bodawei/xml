/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ErrorCollector, EntityMetaData } from '../basic';
import { WellFormedError } from '../error';

import { makeLToken } from '../lToken/test';
import {
   declaration,
   docTypeEnd,
   docTypeStart,
   elementStart,
   entityDeclaration,
   xmlDeclaration,
} from '../xToken';

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

   it('calls docTypeStart.checkWellFormed() after an xml declaration', () => {
      spyOn(docTypeStart, 'checkWellFormed');
      const parsed = {
         type: docTypeStart.TYPE,
         open: makeLToken('<'),
      };
      checker.write(metaData);
      checker.write({
         type: xmlDeclaration.TYPE,
         open: makeLToken('<?'),
         params: [],
      });
      checker.write(parsed);

      expect(docTypeStart.checkWellFormed).toHaveBeenCalled();
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

   describe('elementStart', () => {
      let parsed;

      beforeEach(() => {
         spyOn(elementStart, 'checkWellFormed');
         parsed = {
            type: elementStart.TYPE,
            open: makeLToken('<'),
         };
      });

      it('calls elementStart.checkWellFormed() when encountering an element start', () => {
         checker.write(metaData);
         checker.write(parsed);

         const args = elementStart.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed);
         expect(args[1] instanceof ErrorCollector).toEqual(true);
         expect(args[2]).toEqual(metaData);
      });

      it('changes the state to be in content if in PROLOG state', () => {
         checker._state = 'PROLOG';
         checker.write(parsed);

         expect(checker._state).toEqual('IN_CONTENT');
      });

      it('changes the state to be in content if in PROLOG_PREDOCTYPE state', () => {
         checker._state = 'PROLOG_PREDOCTYPE';
         checker.write(parsed);

         expect(checker._state).toEqual('IN_CONTENT');
      });

      it('reports an error if in the DTD', () => {
         checker._state = 'IN_DTD';
         spyOn(checker, 'push');
         checker.write(parsed);

         expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT);
      });

      it('reports an error if in some other state', () => {
         checker._state = 'START';
         spyOn(checker, 'push');
         checker.write(parsed);

         expect(checker.push.calls.argsFor(0)[0].id).toEqual(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT);
      });

      it('reports no error if in content', () => {
         checker._state = 'IN_CONTENT';
         spyOn(checker, 'push');
         checker.write(parsed);

         expect(checker.push.calls.count()).toEqual(1);
      });

      it('errors include the element name if present', () => {
         parsed.name = makeLToken('bogusName')
         checker._state = 'START';
         spyOn(checker, 'push');
         checker.write(parsed);

         expect(checker.push.calls.argsFor(0)[0].message).toContain('bogusName')
      });

   });

});
