/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from '../../basic/index';
import { XmlWarning } from '../../error/index';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken/index';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError } from '../../error/index';

import declaration from '../bridge/declaration';
import elementDeclaration, { ElementDeclarationPToken } from '../elementDeclaration';
import externalId from '../common/externalId.js';
import misc from '../common/misc.js';
import entityReference from '../entityReference.js';
import unassigned from '../unassigned';

describe('elementDeclaration (unit)', () => {
   let elementPToken: ElementDeclarationPToken;
   let makeSToken: (foo:string) => SToken;

   beforeEach(() => {
      makeSToken = makeSTokenMaker();
      elementPToken = new elementDeclaration.PToken({
         open: makeSToken('<!'),
         postOpenSpace: undefined,
         declType: makeSToken('ELEMENT'),
         postDeclTypeSpace: makeSToken(' '),
         name: makeSToken('elementName'),
         postNameSpace: makeSToken(' '),
         contentSpec: makeSToken('ANY'),
         postContentSpecSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('PToken', () => {

      // describe('getSTokenStream()', () => {

      //    it('returns all the STokens', () => {
      //       elementPToken.postOpenSpace = elementPToken.postNameSpace;
      //       expect(elementPToken.getSTokenArray()).toEqual([
      //          elementPToken.open,
      //          elementPToken.postOpenSpace,
      //          elementPToken.declType,
      //          elementPToken.postDeclTypeSpace,
      //          elementPToken.name,
      //          elementPToken.postNameSpace,
      //          elementPToken.postExternalIdSpace,
      //          elementPToken.close,
      //       ]);
      //    });

      // });

      // it('asks the attribute to provide the STokens', () => {
      //    spyOn(externalId, 'getSTokens');

      //    elementPToken.getSTokenArray();

      //    expect(externalId.getSTokens).toHaveBeenCalledWith(elementPToken.externalId);
      // });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let makeCheckCallbackSpy: jasmine.Spy;
      let checkForPERefSpy: jasmine.Spy;
      let nonPeRefCallback: Function;

      beforeEach(() => {
         nonPeRefCallback = undefined;

         callback = jasmine.createSpy('callbackSpy');
         makeCheckCallbackSpy = spyOn(unassigned, 'makeCheckCallback');
         checkForPERefSpy = spyOn(unassigned, 'checkForPERef');

         makeCheckCallbackSpy.and.callFake((_1, name, cb1, cb2) => {
            nonPeRefCallback = cb2;
         });
         checkForPERefSpy.and.callFake(() => {
            nonPeRefCallback();
         });
      });

      it('does a simple parse', () => {
         // delete the things that our mocking of declaration will not return
         delete elementPToken.open;
         delete elementPToken.postOpenSpace;
         delete elementPToken.declType;
         delete elementPToken.postDeclTypeSpace;
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('A'),
            [ 'ANY', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, {
            type: elementPToken.type,
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementPToken);
      });

      it('sets up to let unassigned handle checking for a PE Reference', () => {
         const checkCallbackSpy = jasmine.createSpy('checkCallback Spy');
         makeCheckCallbackSpy.and.returnValue(checkCallbackSpy);
         checkForPERefSpy.and.callFake(() => {});
         const mockSource = new MockSTokenSource([]);

         elementDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(makeCheckCallbackSpy.calls.argsFor(0)[0].type).toEqual(elementDeclaration.PTYPE);
         expect(makeCheckCallbackSpy.calls.argsFor(0)[1]).toEqual('name');
         expect(makeCheckCallbackSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         expect(makeCheckCallbackSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
      });

   });

   describe('assignUnassigned()', () => {

      beforeEach(() => {
         spyOn(unassigned, 'assignToProps');
         spyOn(externalId, 'assignUnassigned');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         elementDeclaration.assignUnassigned(elementPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      // it('deletes the unassigned property if it is empty', () => {
      //    elementPToken.unassigned = [];
      //    elementPToken.nextPropName = 'name';
         
      //    elementDeclaration.assignUnassigned(elementPToken);

      //    expect(elementPToken.unassigned).toBeUndefined();
      //    expect(elementPToken.nextPropName).toBeUndefined();
      // });

      // it('does not call assignToProps() if there is still an unexpanded param ref', () => {
      //    elementPToken.unassigned = [ {
      //       type: entityReference.PARAM_PTYPE,
      //    } ];
         
      //    elementDeclaration.assignUnassigned(elementPToken);

      //    expect(unassigned.assignToProps).not.toHaveBeenCalled();
      // });

      // it('calls unassigned.assignToProps() if the nextPropName is "name"', () => {
      //    elementPToken = new elementDeclaration.PToken({
      //       unassigned: [ 'foo' ],
      //       nextPropName: 'name',
      //    });
         
      //    elementDeclaration.assignUnassigned(elementPToken);

      //    expect(unassigned.assignToProps).toHaveBeenCalledWith(
      //       [ 'foo' ],
      //       elementPToken,
      //       'name', [
      //          { name: 'postDeclTypeSpace', type: 'space' },
      //          { name: 'name', type: 'word' },
      //          { name: 'postNameSpace', type: 'space' },
      //       ]);
      // });

      // it('adds an "extra" property if the unassigned values are not consumed', () => {
      //    elementPToken = new elementDeclaration.PToken({
      //       unassigned: [ 'foo' ],
      //    });
         
      //    elementDeclaration.assignUnassigned(elementPToken);

      //    expect(elementPToken.extra).toEqual([ 'foo' ]);
      // });

      // it('removes all unassigned and nextPropName values', () => {
      //    elementPToken = new elementDeclaration.PToken({
      //       unassigned: [ 'foo' ],
      //       nextPropName: 'name',
      //       externalId: {
      //          unassigned: [ 'different' ],
      //          nextPropName: 'idType',
      //       },
      //    });
         
      //    elementDeclaration.assignUnassigned(elementPToken);

      //    expect(elementPToken).toEqual(new elementDeclaration.PToken({
      //       extra: [ 'foo' ],
      //       externalId: {},
      //    }));
      // });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();

         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(elementPToken, mockErrorCollector, emd);
      });

      it('reports no errors if the notationPToken is undefined', () => {
         elementDeclaration.checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no errors if there are unassigned values', () => {
         delete elementPToken.name;
         elementPToken.unassigned = [];

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if there is no name', () => {
         delete elementPToken.name;

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // this would be the space after NOTATION, but it is mocked out
         });
      });

      it('calls misc.checkName() to report on bad names', () => {
         const emd = new EntityMetaData();

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(elementPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.ELEMENTDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         const emd = new EntityMetaData();

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(elementPToken.name,
            mockErrorCollector, emd, XmlWarning.ID.ELEMENTDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete elementPToken.postNameSpace;

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_NAME_NO_SPACE,
            params: [ 'elementName' ],
            position: undefined,
            lastPosition: elementPToken.name,
         });
      });

      it('reports an error if there was no closing', () => {
         delete elementPToken.close;

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_NO_CLOSE,
            params: [ elementPToken.name.str ],
            position: undefined,
            lastPosition: elementPToken.postNameSpace,
         });
      });

      it('calls unassigned.checkExtra() with extras', () => {
         spyOn(unassigned, 'checkExtra');
         const startSToken = new SToken('one', 'one', new Range(undefined, 0, 0, 0, 0, 0, 0));
         elementPToken.extra = [
            unassigned.wordFromSToken(startSToken),
         ];

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(unassigned.checkExtra).toHaveBeenCalledWith(elementPToken.extra,
            mockErrorCollector,
            WellFormedError.ID.ELEMENTDECL_EXTRA_TEXT);
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns an element declaration token with the name from the parsing', () => {
         const token = elementDeclaration.pTokenToXToken(elementPToken);

         expect(token).toEqual(new elementDeclaration.XToken('elementName', undefined, elementPToken));
      });

      it('returns an element declaration with a blank name if there is no name', () => {
         delete elementPToken.name;
         const token = elementDeclaration.pTokenToXToken(elementPToken);

         expect(token.name).toEqual('');
      });

   });

});
