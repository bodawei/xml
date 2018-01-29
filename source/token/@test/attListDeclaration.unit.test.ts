/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from '../../basic';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError, XmlWarning } from '../../error';

import * as declaration from '../bridge/declaration.js';
import attListDeclaration from '../attListDeclaration.js';
import entityReference from '../entityReference.js'
import unassigned from '../unassigned.js';
import misc from '../common/misc.js';

describe('attListDeclaration (unit)', () => {
   let aldPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      aldPToken = new attListDeclaration.PToken({
         elementName: makeSToken('elementName'),
         postElementNameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('AttListXToken()', () => {

      it('is defined', () => {
         expect(attListDeclaration.XToken).toBeInstanceOf(Function);
      });

      it('constructs an instance', () => {
         const xToken = new attListDeclaration.XToken('foo', new attListDeclaration.PToken());

         expect(xToken.elementName).toEqual('foo');
      });

   });

   describe('XTYPE', () => {

      it('is defined', () => {
         expect(attListDeclaration.XTYPE).toEqual('ATTLIST_XTOKEN_TYPE');
      });

   });

   describe('parse()', () => {
      let callback;
      let checkForPERefCallback;
      let makeCheckCallbackSpy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');

         makeCheckCallbackSpy = spyOn(unassigned, 'makeCheckCallback'); // TS
         makeCheckCallbackSpy.and.callFake((_1, _2, _3, other) => {
            checkForPERefCallback = other;
         });

         spyOn(unassigned, 'checkForPERef').and.callFake(() => checkForPERefCallback());
      });

      it('does a parse of a basic attribute list declaration', () => {
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '%' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ]);

         attListDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(aldPToken);
      });

      it('returns nothing if at EOF. That is: <!ATTLIST', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
         ]);

         attListDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ new attListDeclaration.PToken({
            elementName: undefined,
            postElementNameSpace: undefined,
            close: undefined,
         }) ] ]);
      });

      describe('parameter entity reference', () => {

         it('returns an unassigned value when finding a PE Ref at the start', () => {
            makeCheckCallbackSpy.and.callFake((pToken, prop, foundRef, other) => {
               foundRef();
            });
            const mockSource = new MockSTokenSource([
               '>',
            ]);
   
            attListDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();
   
            const pToken = callback.calls.argsFor(0)[0];
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual(new attListDeclaration.PToken({
               close: makeSToken('>'),
            }));
         });
   
      });

   });

   describe('assignUnassigned()', () => {

      beforeEach(() => {
         spyOn(unassigned, 'assignToProps');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         attListDeclaration.assignUnassigned({});

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('deletes the unassigned property if it is empty', () => {
         const declPToken = {
            unassigned: [],
            nextPropName: 'elementName',
         };
         
         attListDeclaration.assignUnassigned(declPToken);

         expect(attListDeclaration.unassigned).toBeUndefined();
         expect(attListDeclaration.nextPropName).toBeUndefined();
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         const declPToken = {
            unassigned: [ {
               type: entityReference.PARAM_PTYPE,
            } ],
         };
         
         attListDeclaration.assignUnassigned(declPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      describe('unassigned in elementName', () => {

         it('calls unassigned.assignToProps() when the match is in the el name', () => {
            const unassignedValue = [ 'foo' ];
            const declPToken = new attListDeclaration.PToken({
               unassigned: unassignedValue,
               nextPropName: 'elementName',
            });
            
            attListDeclaration.assignUnassigned(declPToken);
   
            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'elementName', [
                  { name: 'postDeclTypeSpace', type: 'space' },
                  { name: 'elementName', type: 'word' },
                  { name: 'postElementNameSpace', type: 'space' },
               ]);
         });
   
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
      });

      it('reports no errors if no pToken provided', () => {
         attListDeclaration.checkWellFormed(undefined, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no errors if there are unassigned values', () => {
         delete aldPToken.elementName;
         aldPToken.unassigned = [];

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(aldPToken, mockErrorCollector, emd);
      });

      it('reports an error if there is no name', () => {
         delete aldPToken.elementName;

         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTLISTDECL_NO_ELEMENT_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // space after ATTLIST was mocked out
         });
      });

      it('calls misc.checkName() to report on name validity', () => {
         attListDeclaration.checkWellFormed(aldPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(aldPToken.elementName,
            mockErrorCollector, emd, WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_INVALID);
      });

   });

   describe('pTokenToXToken()', () => {

      it('creates an XToken', () => {
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: aldPToken.elementName.str,
            pToken: aldPToken,
         });
      });

      it('creates an XToken with a blank name when pToken has no name', () => {
         delete aldPToken.elementName;
         const xToken = attListDeclaration.pTokenToXToken(aldPToken);

         expect(xToken).toEqualProps({
            type: attListDeclaration.XTYPE,
            elementName: '',
            pToken: aldPToken,
         });
      });

   });

});
