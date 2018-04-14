/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic/index';
import { XmlWarning } from '../../error/index';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken/index';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError } from '../../error/index';

import { STokenArray } from '../base';
import declaration from '../bridge/declaration';
import elementDeclaration, { ElementDeclarationPToken } from '../elementDeclaration';
import misc from '../common/misc.js';
import nameList from '../common/nameList';
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

      describe('getSTokenArray()', () => {

         it('returns all the STokens', () => {
            elementPToken.postOpenSpace = elementPToken.postNameSpace;
            const expectedArray = [
               elementPToken.open,
               elementPToken.postOpenSpace,
               elementPToken.declType,
               elementPToken.postDeclTypeSpace,
               elementPToken.name,
               elementPToken.postNameSpace,
               elementPToken.contentSpec,
               elementPToken.postContentSpecSpace,
               elementPToken.close,
            ];

            const result = elementPToken.getSTokenArray();

            expect(result.length).toEqual(expectedArray.length);
            for (let index = 0; index < result.length; index++) {
               expect(result[index]).toEqual(expectedArray[index]);
            }
         });

         it('gets the tokens from a children set', () => {
            elementPToken.children = new nameList.PToken();
            spyOn(elementPToken.children, 'getSTokenArray');

            elementPToken.getSTokenArray();

            expect(elementPToken.children.getSTokenArray).toHaveBeenCalled();
         });
      });

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

         makeCheckCallbackSpy.and.callFake((_1: any, name: string, cb1: () => {}, cb2: () => {}) => {
            nonPeRefCallback = cb2;
         });
         checkForPERefSpy.and.callFake(() => {
            nonPeRefCallback();
         });
      });

      it('does a parse of an element declaration with a non-list content spec', () => {
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

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementPToken);
      });

      it('does a parse of an element declaration that ends early', () => {
         // delete the things that our mocking of declaration will not return
         delete elementPToken.open;
         delete elementPToken.postOpenSpace;
         delete elementPToken.declType;
         delete elementPToken.postDeclTypeSpace;
         delete elementPToken.contentSpec;
         delete elementPToken.postContentSpecSpace;
         delete elementPToken.close;
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            undefined,
            undefined,
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementPToken);
      });

      it('hands off parsing of the children to nameList', () => {
         const nameListParseSpy = spyOn(nameList, 'parse')
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('('),
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(nameListParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(nameListParseSpy.calls.argsFor(0)[1]).toEqual('ANY');
         expect(nameListParseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('delivers children and end of list', () => {
         spyOn(nameList, 'parse').and.callFake((_1: any, _2: any, callback: (nl: any) => void) => {
            callback({ nameList: true });
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('('),
            MockSTokenSource.PEEK('>'),
            [ '>', 'match', '>' ],
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            children: { nameList: true },
            close: new SToken('>', '>', new Range(new EntityLocation(), 22, 0, 22, 23, 0, 23)),
         });
      });

      it('sets up to let unassigned handle checking for a PE Reference instead of the name', () => {
         const checkCallbackSpy = jasmine.createSpy('checkCallback Spy');
         makeCheckCallbackSpy.and.returnValue(checkCallbackSpy);
         checkForPERefSpy.and.callFake(() => {});
         const mockSource = new MockSTokenSource([]);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(makeCheckCallbackSpy.calls.argsFor(0)[0].type).toEqual(elementDeclaration.PTYPE);
         expect(makeCheckCallbackSpy.calls.argsFor(0)[1]).toEqual('name');
         expect(makeCheckCallbackSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         expect(makeCheckCallbackSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
      });

      it('sets up to let unassigned handle checking for a PE Reference instead of the content spec', () => {
         let checkCallback: (arg?: any) => void;
         makeCheckCallbackSpy.and.callFake((_1: any, name: string, foundPeRef: () => {}, foundData: () => {}) => {
            if (name === 'name') {
               checkCallback = foundData;
               return;
            }
            checkCallback = foundPeRef;
         });
         checkForPERefSpy.and.callFake((arg: any) => {
            checkCallback(arg);
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('%'),
            [ '>', 'match', '>' ],
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(makeCheckCallbackSpy.calls.argsFor(1)[0].type).toEqual(elementDeclaration.PTYPE);
         expect(makeCheckCallbackSpy.calls.argsFor(1)[1]).toEqual('contentSpec');
         expect(makeCheckCallbackSpy.calls.argsFor(1)[2]).toBeInstanceOf(Function);
         expect(makeCheckCallbackSpy.calls.argsFor(1)[3]).toBeInstanceOf(Function);
      });

      it('uses unassigned to parse any values after the nameList', () => {
         const unassignedParseSpy = spyOn(unassigned, 'parseAllValues');
         spyOn(nameList, 'parse').and.callFake((_1: any, _2: any, callback: (nl: any) => void) => {
            callback({ nameList: true });
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('('),
            MockSTokenSource.PEEK('%'),
            [ '>', 'match', '>' ],
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(unassignedParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(unassignedParseSpy.calls.argsFor(0)[1]).toEqual(true);
         expect(unassignedParseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('extracts the unassigned values after the nameList', () => {
         spyOn(unassigned, 'parseAllValues').and.callFake((_1: any, _2: any, cb: (vals: any) => void) => {
            cb({ values: true });
         });
         spyOn(nameList, 'parse').and.callFake((_1: any, _2: any, callback: (nl: any) => void) => {
            callback({ nameList: true });
         });
         const mockSource = new MockSTokenSource([
            [ 'elementName', 'word', [ '>', '(' ] ],
            [ ' ', 'space' ],
            MockSTokenSource.PEEK('('),
            MockSTokenSource.PEEK('%'),
            [ '>', 'match', '>' ],
         ], 10, 0, 10);

         elementDeclaration.parse(mockSource, new elementDeclaration.PToken(), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            nextPropName: 'midContentSpec',
            unassigned: { values: true },
            close: new SToken('>', '>', new Range(new EntityLocation(), 22, 0, 22, 23, 0, 23)),
         });
      });

   });

   describe('assignUnassigned()', () => {
      let unassignedAssignSpy: jasmine.Spy;

      beforeEach(() => {
         unassignedAssignSpy = spyOn(unassigned, 'assignToProps');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         elementDeclaration.assignUnassigned(elementPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('deletes the unassigned property if it is empty', () => {
         elementPToken.unassigned = [];
         elementPToken.nextPropName = 'name';
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(elementPToken.unassigned).toBeUndefined();
         expect(elementPToken.nextPropName).toBeUndefined();
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         elementPToken.unassigned = [ {
            type: entityReference.PARAM_PTYPE,
         } ];
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls unassigned.assignToProps() if the nextPropName is "name"', () => {
         elementPToken = new elementDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'foo' ],
            elementPToken,
            'name', [
               { name: 'postDeclTypeSpace', type: 'space' },
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
            ]);
      });

      it('calls unassigned.assignToProps() with the contentSpec if the nextPropName is "name"', () => {
         elementPToken = new elementDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'foo' ],
            elementPToken,
            'contentSpec', [
               { name: 'contentSpec', type: 'word' },
               { name: 'postContentSpecSpace', type: 'space' },
            ]);
      });

      it('calls unassigned.assignToProps() with the contentSpec if the nextPropName is "contentSpec"', () => {
         elementPToken = new elementDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'contentSpec',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'foo' ],
            elementPToken,
            'contentSpec', [
               { name: 'contentSpec', type: 'word' },
               { name: 'postContentSpecSpace', type: 'space' },
            ]);
      });

      it('calls nameList.assignToProps() if we are mid-contentSpec', () => {
         spyOn(nameList, 'assignUnassigned');
         elementPToken = new elementDeclaration.PToken({
            children: new nameList.PToken(),
            unassigned: [ 'foo' ],
            nextPropName: 'midContentSpec',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(nameList.assignUnassigned).toHaveBeenCalledWith(elementPToken.children, [ 'foo' ]);
      });

      it('calls nameList.assignToProps() if we left off with a contentSpec, and the first value is "("', () => {
         spyOn(nameList, 'assignUnassigned');
         const unassignedValues = [ {
            type: 'TEXT',
            subType: 'word',
            text: SToken.fromString('('),
         } ];
         elementPToken = new elementDeclaration.PToken({
            children: new nameList.PToken(),
            unassigned: unassignedValues,
            nextPropName: 'contentSpec',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(nameList.assignUnassigned).toHaveBeenCalledWith(elementPToken.children, unassignedValues);
      });

      it('adds an "extra" property if the unassigned values are not consumed', () => {
         elementPToken = new elementDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(elementPToken.extra).toEqual([ 'foo' ]);
      });

      it('adds no "extra" property if the unassigned values are consumed', () => {
         elementPToken = new elementDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });
         unassignedAssignSpy.and.callFake(() => elementPToken.unassigned.pop());
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(elementPToken.extra).toBeUndefined();
      });

      it('removes all unassigned and nextPropName values', () => {
         elementPToken = new elementDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });
         
         elementDeclaration.assignUnassigned(elementPToken);

         expect(elementPToken).toEqual(new elementDeclaration.PToken({
            extra: [ 'foo' ],
         }));
      });

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

      it('reports an error if there was no content spec at all', () => {
         delete elementPToken.contentSpec;

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_NO_SPEC,
            params: [ elementPToken.name.str ],
            position: undefined,
            lastPosition: elementPToken.postNameSpace,
         });
      });

      it('reports an error if the content spec was an invalid value', () => {
         elementPToken.contentSpec.str = 'XYZ';

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_SPEC_UNKNOWN,
            params: [ elementPToken.name.str, 'XYZ' ],
            position: elementPToken.contentSpec,
         });
      });

      it('reports an error if the content spec was cased wrong', () => {
         elementPToken.contentSpec.str = 'any';

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_SPEC_INVALID_CASE,
            params: [ elementPToken.name.str, 'ANY', 'any' ],
            position: elementPToken.contentSpec,
         });
      });

      it('reports an error if there was no closing', () => {
         delete elementPToken.close;

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENTDECL_NO_CLOSE,
            params: [ elementPToken.name.str ],
            position: undefined,
            lastPosition: elementPToken.postContentSpecSpace,
         });
      });

      it('calls nameList.checkWellFormed() if there are children', () => {
         const nameListCWFSpy = spyOn(nameList, 'checkWellFormed');
         elementPToken.children = new nameList.PToken();

         elementDeclaration.checkWellFormed(elementPToken, mockErrorCollector, new EntityMetaData());

         expect(nameListCWFSpy).toHaveBeenCalledWith(elementPToken.children,
            mockErrorCollector, new EntityMetaData(), 'children', 'ANY');
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

         expect(token).toEqual(new elementDeclaration.XToken('elementName', 'ANY',
            undefined, elementPToken));
      });

      it('returns an element declaration with a blank name if there is no name', () => {
         delete elementPToken.name;
         const token = elementDeclaration.pTokenToXToken(elementPToken);

         expect(token.name).toEqual('');
      });

      it('sets the content spec to "BOGUS" if that is what was parsed', () => {
         elementPToken.contentSpec = SToken.fromString('BOGUS');

         const token = elementDeclaration.pTokenToXToken(elementPToken);

         expect(token.contentSpecType).toEqual('BOGUS');
      });

      it('sets the content spec to "CHILDREN" if there are children', () => {
         const nameListMakeSpy = spyOn(nameList, 'makeXTokenCompatible');
         elementPToken.children = new nameList.PToken();
         
         const token = elementDeclaration.pTokenToXToken(elementPToken);

         expect(token.contentSpecType).toEqual('CHILDREN');
      });

      it('uses nameList to populate the children portion if there are children', () => {
         const nameListMakeSpy = spyOn(nameList, 'makeXTokenCompatible');
         elementPToken.children = new nameList.PToken();
         
         elementDeclaration.pTokenToXToken(elementPToken);

         expect(nameListMakeSpy).toHaveBeenCalledWith(elementPToken.children, 'ANY');
      });

   });

});
