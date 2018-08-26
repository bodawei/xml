/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, util } from '../../basic';
import { ValidityError, WellFormedError, XmlError, XmlWarning } from '../../error';
import { SToken } from '../../sToken';
import nameList from '../../token/common/nameList';
import {
   attListDeclaration,
   charData,
   cdata,
   comment,
   docTypeEnd,
   docTypeStart,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityEnd,
   entityDeclaration,
   entityReference,
   entityStart,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,
} from '../../token';

import CheckXTokenValidStream from '../CheckXTokenValidStream';

function toHaveError(util) {
   return {
      compare: (actual, expected) => {
         let Constructor = expected instanceof XmlWarning ? XmlWarning : ValidityError;
         let pass = false;
         let message;

         actual.forEach((token) => {
            if (token instanceof Constructor) {
               pass = pass || util.equals(token, expected);
            }
         });

         if (pass) {
            message = `Expected not to find "${JSON.stringify(expected, undefined, 2)}".`;
         } else {
            message = `Expected to find "${JSON.stringify(expected, undefined, 2)}". Instead found ${JSON.stringify(actual)}.`;
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

function toBeErrorFree() {
   return {
      compare: (actual, expected) => {
         let error;
         let message;

         actual.forEach((token) => {
            if (token instanceof XmlWarning || token instanceof ValidityError) {
               error = token;
            }
         });

         if (!error) {
            message = `Expected to find one or more XmlErrors.`;
         } else {
            message = `Expected to find no XmlErrors, but found ${error.message}.`;
         }

         return {
            pass: !error,
            message: message,
         };
      },
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toHaveError,
      toBeErrorFree,
   });
});

describe('CheckXTokenValidStream (unit)', () => {
   let validator;
   let fakeEntityManager;

   beforeEach(() => {
      fakeEntityManager = {
         getEntityToken() {},
      };
      validator = new CheckXTokenValidStream(fakeEntityManager);
   });

   function gatherTokens(stream, cb) {
      const tokens = [];

      stream.on('data', (item) => {
         tokens.push(item);
      });
      stream.on('end', () => {
         cb(tokens);
      });
   }

   function expectStream(validator, expected, done) {
      gatherTokens(validator, (tokens) => {
         expect(tokens).toHaveError(expected);
         done();
      });
   }

   function expectNoErrors(validator, done) {
      gatherTokens(validator, (tokens) => {
         expect(tokens).toBeErrorFree();
         done();
      });
   }

   describe('_transform', () => {

      beforeEach(() => {
      });

      it('passes initial tokens through', () => {
         const xmlDecl = new xmlDeclaration.XToken([], []);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl);
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         const elStart = new elementStart.XToken('foo', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(elStart);
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart);
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.XToken('docTypeName', undefined, false, []);
         const elStart = new elementStart.XToken('elementName', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
      });

      it('adds an error if the NOTATION name shows up more than once', () => {
         const nOne = new notationDeclaration.XToken('one', undefined, []);
         const nTwo = new notationDeclaration.XToken('one', undefined, []);

         validator.write(nOne);
         validator.write(nTwo);

         expect(validator.read()).toEqual(nOne);
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ]));
         expect(validator.read()).toEqual(nTwo);
      });
   
   });

   describe('write()', () => {

      describe('ElementStart tokens', () => {
         let attListDecl;

         beforeEach(() => {
            attListDecl = new attListDeclaration.XToken('one', [{
               name: 'first',
               type: 'CDATA',
               defaultType: 'yoiks',
            }], {});
         });

         it('reports no error if the attribute is in the ATTLIST', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined, {});
            const startToken = new elementStart.XToken('one', [{
               name: 'first',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if an attribute in the token was not declared in the corresponding ATTLIST', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ], startToken.pToken.open, startToken.pToken.open);
            expectStream(validator, expected, done);
         });

         it('allows for the start token to have no attributes', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined, {});
            const startToken = new elementStart.XToken('one', undefined, { open: new SToken('foo', 'foo')});

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for there not being an ATTLIST', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for the attribute not having a name', (done) => {
            const startToken = new elementStart.XToken('one', [{
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', '' ]);
            expectStream(validator, expected, done);
         });

         it('allows for an empty pToken', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }], {});

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ]);
            expectStream(validator, expected, done);
         });
   
         it('reports a warning if an empty element tag is used for an element not declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined, {});
            const emptyTag = new elementStart.EmptyToken('one', [], {});

            validator.write(elementDecl);
            validator.write(emptyTag);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         describe('ID', () => {

            it('reports an error if an ID value is not a name', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined, {});
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('$$BAD', {})
                  ]
               }], {});
               spyOn(util, 'isName').and.returnValue(false);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_NAME_INVALID,
                  [ '$$BAD', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });

            it('it calls util.isName() with the entity meta data', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined, {});
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('$$BAD', {})
                  ]
               }], {});
               spyOn(util, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$$BAD', 1.1, 2);
                  done();
               });
            });

            it('reports an error if an ID value is used twice', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined, {});
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
               }]);
               const elDecl2 = new elementDeclaration.XToken('two', 'ANY', undefined, {});
               const attListDecl2 = new attListDeclaration.XToken('two', [{
                  name: 'id',
                  type: 'ID',
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('test', {})
                  ]
               }], {});
               const startToken2 = new elementStart.XToken('two', [{
                  name: 'id',
                  value: [
                     new text.XToken('test', {})
                  ]
               }], {});

               validator.write(elDecl1);
               validator.write(elDecl2);
               validator.write(attListDecl1);
               validator.write(attListDecl2);
               validator.write(startToken1);
               validator.write(startToken2);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
                  [ 'test', 'two', 'id', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ID value built from an entity reference is used twice', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined, {});
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
               }]);
               const elDecl2 = new elementDeclaration.XToken('two', 'ANY', undefined, {});
               const attListDecl2 = new attListDeclaration.XToken('two', [{
                  name: 'id',
                  type: 'ID',
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('test', {})
                  ]
               }], {});
               const startToken2 = new elementStart.XToken('two', [{
                  name: 'id',
                  value: [
                     new entityStart.XToken('ref', {}),
                     new text.XToken('test', {}),
                     new entityEnd.XToken('ref', {}),
                  ]
               }], {});

               validator.write(elDecl1);
               validator.write(elDecl2);
               validator.write(attListDecl1);
               validator.write(attListDecl2);
               validator.write(startToken1);
               validator.write(startToken2);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
                  [ 'test', 'two', 'id', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });
         });

         describe('IDREF', () => {
            let elDecl;
            let attListDecl;
            let startToken;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('one', 'ANY', undefined, {});
               attListDecl = new attListDeclaration.XToken('one', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('one', [{
                  name: 'idRefAttr',
                  value: [
                     new text.XToken('goodName', {})
                  ]
               }], {});
            });

            it('it calls util.isName() with the entity meta data (whitebox)', (done) => {
               spyOn(util, 'isName');
   
               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports no error when an IDREF attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if an IDREF value is not a name', (done) => {
               startToken = new elementStart.XToken('one', [{
                  name: 'idRefAttr',
                  value: [
                     new text.XToken('$badName', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREF_NOT_NAME,
                  [ '$badName', 'one', 'idRefAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an IDREFS values are not all names', (done) => {
               attListDecl = new attListDeclaration.XToken('elName', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('elName', [{
                  name: 'idRefsAttr',
                  value: [
                     new text.XToken('goodName $badName         $anotherBadName', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREFS_NOT_NAME,
                  [ '$badName, $anotherBadName', 'elName', 'idRefsAttr' ]);
               expectStream(validator, expected, done);
            });
   
         });

         describe('ENTITY', () => {
            let elDecl;
            let attListDecl;
            let startToken;

            beforeEach(() => {
               fakeEntityManager.getEntityToken = () => {
                  return new entityDeclaration.XToken('goodName', [], undefined, 'notation', {});
               };

               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined, {});
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entityAttr',
                  type: 'ENTITY',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entityAttr',
                  value: [
                     new text.XToken('goodName', {})
                  ]
               }], {});
            });

            it('reports no error when an ENTITY attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('it calls util.isName() with the entity meta data (whitebox)', (done) => {   
               spyOn(util, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports an error if an ENTITY value is not a name', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entityAttr',
                  value: [
                     new text.XToken('$badName', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_NOT_NAME,
                  [ '$badName', 'testElement', 'entityAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITIES values are not all names', (done) => {
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new text.XToken('goodName $badName      $anotherBadName', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_NOT_NAME,
                  [ '$badName, $anotherBadName', 'testElement', 'entitiesAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITY value names an unknown entity', (done) => {
               fakeEntityManager.getEntityToken = () => undefined;

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_NO_ENTITY,
                  [ 'goodName', 'testElement', 'entityAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITY value names a parsed entity', (done) => {
               fakeEntityManager.getEntityToken = () => {
                  return new entityDeclaration.XToken('goodName', [], undefined, undefined, {});
               };

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_PARSED_ENTITY,
                  [ 'goodName', 'testElement', 'entityAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if one or more ENTITIES names are unknown entities', (done) => {
               fakeEntityManager.getEntityToken = () => undefined;
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new text.XToken('one two   three', {})
                  ]
               }], {});

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_NO_ENTITY,
                  [ 'one, two, three', 'testElement', 'entitiesAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITIES value names a parsed entity', (done) => {
               fakeEntityManager.getEntityToken = () => {
                  return new entityDeclaration.XToken('goodName', [], undefined, undefined, {});
               };
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new text.XToken('one two   three', {})
                  ]
               }], {});

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_PARSED_ENTITY,
                  [ 'one, two, three', 'testElement', 'entitiesAttr' ]);
               expectStream(validator, expected, done);
            });
   
         });

         describe('NMTOKEN', () => {
            let elDecl;
            let attListDecl;
            let startToken;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined, {});
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKEN',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new text.XToken('goodName', {})
                  ]
               }], {});
            });

            it('it calls util.isNmToken() with the entity meta data (whitebox)', (done) => {
               spyOn(util, 'isNmToken');
   
               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               gatherTokens(validator, () => {
                  expect(util.isNmToken).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports no error when an the attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if a the attribute value is not an Nmtoken', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new text.XToken('$badName', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN,
                  [ '$badName', 'testElement', 'nmTokenAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an NMTOKENS attribute has values that are not all Nmtokens', (done) => {
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKENS',
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new text.XToken('goodName $badName         $anotherBadName', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN,
                  [ '$badName, $anotherBadName', 'testElement', 'nmTokenAttr' ]);
               expectStream(validator, expected, done);
            });
   
         });

         describe('NOTATION', () => {
            let elDecl;
            let attListDecl;
            let startToken;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined, {});
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  enumeration: {
                     names: [{
                        name: 'first',
                        repeat: 'ONE',
                     }, {
                        name: 'second',
                        repeat: 'ONE',
                     }],
                     listType: 'CHOICE',
                     repeat: 'ONE',
                  },
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'notationAttr',
                  value: [
                     new text.XToken('first', {})
                  ]
               }], {});
            });

            it('reports no error when an the attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if a the attribute value not among the declared values', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'notationAttr',
                  value: [
                     new text.XToken('third', {})
                  ]
               }], {});
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
                  [ 'third', 'testElement', 'notationAttr', 'first, second' ]);
               expectStream(validator, expected, done);
            });

         });

      });

      describe('EmptyElement tokens', () => {
         let attlist;
         let element;

         beforeEach(() => {
            attlist = new attListDeclaration.XToken('one', [{
               name: 'first',
               type: 'CDATA',
               defaultType: 'yoiks',
            }], {});
         });

         it('reports an error if an attribute in the token was not declared in the corresponding ATTLIST', (done) => {
            const startToken = new elementStart.EmptyToken('one', [{
               name: 'notPresent',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(attlist);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ], startToken.pToken.open, startToken.pToken.open);
            expectStream(validator, expected, done);
         });

         it('reports a warning if the ELEMENT declaration indicates that this element does not need to be EMPTY', (done) => {
            element = new elementDeclaration.XToken('one', 'ANY', undefined, {});
            const startToken = new elementStart.EmptyToken('one', [], { open: new SToken('foo', 'foo') });

            validator.write(element);
            validator.write(startToken);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
               [ 'one' ], startToken.pToken.open, startToken.pToken.open);
            expectStream(validator, expected, done);
         });

         it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('ATTLIST', () => {

         it('adds an error if the ATTLIST name shows up more than once', (done) => {
            const aOne = new attListDeclaration.XToken('one', [], {});
            const aTwo = new attListDeclaration.XToken('one', [], {});
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('doe snot blow up if the ATTLIST has no pToken', (done) => {
            const aOne = new attListDeclaration.XToken('one', []);
            const aTwo = new attListDeclaration.XToken('one', []);
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('does not blow up if the ATTLIST has no element name', (done) => {
            const aOne = new attListDeclaration.XToken(undefined, []);
            const aTwo = new attListDeclaration.XToken(undefined, []);
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ '' ]);
            expectStream(validator, expected, done);
         });
   
         it('reports no warnings if the related ELEMENT declaration is already present', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
            const attDecl = new attListDeclaration.XToken('elementType', [], {});

            validator.write(elDecl);
            validator.write(attDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports a warning if the related ELEMENT declaration is not present', (done) => {
            const attListDecl = new attListDeclaration.XToken('elementType', [], {});

            validator.write(attListDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL,
               [ 'elementType', ], attListDecl.pToken.open, attListDecl.pToken.open);
            expectStream(validator, expected, done);
         });

         it('has no problems if the PToken is not provided', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports no errors if an ID attribute is well defined', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }], {});

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if an attribute is of type ID but does not have value #IMPLIED or #REQUIRED', (done) => {
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '',
            }], {});

            validator.write(attListDecl);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               [ 'elementType',  'idAttr', '' ], attListDecl.pToken.open);
            expectStream(validator, expected, done);
         });

         it('reports an error if an ATTLIST for an element type has more than one attribute of type ID', (done) => {
            const endOfDocType = new docTypeEnd.XToken();
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }, {
               name: 'ref',
               type: 'IDREF',
               defaultType: '#REQUIRED',
            }, {
               name: 'second',
               type: 'ID',
               defaultType: '#REQUIRED',
            }], {});

            validator.write(attListDecl);
            validator.write(endOfDocType);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID,
               [ 'elementType',  'second' ]);
            expectStream(validator, expected, done);
         });

         describe('NOTATION', () => {

            function setup(emd) {
               const endOfDocType = new docTypeEnd.XToken();
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'notation1',
                  type: 'NOTATION',
                  defaultType: '#IMPLIED',
               }, {
                  name: 'ref',
                  type: 'IDREF',
                  defaultType: '#REQUIRED',
               }, {
                  name: 'notation2',
                  type: 'NOTATION',
                  defaultType: '#REQUIRED',
               }], {});

               validator.write(emd);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            it('reports an error if an 1.0/>1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new EntityMetaData('DOCUMENT', 1.0, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                  [ 'elementType',  'notation2' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an 1.1/* ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new EntityMetaData('DOCUMENT', 1.1, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                  [ 'elementType',  'notation2' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an 1.0/1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new EntityMetaData('DOCUMENT', 1.0, 1));

               expectNoErrors(validator, done);
            });
         });

         it('ignores attribute declarations after the first encountered', (done) => {
            const endOfDocType = new docTypeEnd.XToken();
            const attListDecl1 = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }, {
               name: 'anAttribute',
               type: 'CDATA',
               defaultType: '#REQUIRED',
            }], {});
            const attListDecl2 = new attListDeclaration.XToken('elementType', [{
               name: 'anAttribute',
               type: 'ID', // This would cause us to have two ID's, if this were honored
               defaultType: '#REQUIRED',
            }], {});

            validator.write(attListDecl1);
            validator.write(attListDecl2);
            validator.write(endOfDocType);
            validator.end();

            const notExpected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID,
               [ 'elementType',  'anAttribute' ]);
            gatherTokens(validator, (tokens) => {
               expect(tokens).not.toHaveError(notExpected);
               done();
            });
         });

         it('reports a warning if more than one attribute definition is provided for an attribute', (done) => {
            const endOfDocType = new docTypeEnd.XToken();
            const attListDecl1 = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }, {
               name: 'anAttribute',
               type: 'CDATA',
               defaultType: '#REQUIRED',
            }], {});
            const attListDecl2 = new attListDeclaration.XToken('elementType', [{
               name: 'anAttribute',
               type: 'ID', // This would cause us to have two ID's, if this were honored
               defaultType: '#REQUIRED',
            }], {});

            validator.write(attListDecl1);
            validator.write(attListDecl2);
            validator.write(endOfDocType);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ATTR_EXTRA_DECLARATION,
               [ 'elementType',  'anAttribute' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('ELEMENT', () => {

         it('reports no errors if multiple ELEMENT declarations are provided', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elDecl2 = new elementDeclaration.XToken('two', 'EMPTY', undefined, {});

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports no errors if the element has no pToken', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined);
            const elDecl2 = new elementDeclaration.XToken('two', 'EMPTY', undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if there is more than one ELEMENT declaration for the same element type', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elDecl2 = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
               [ 'one' ], elDecl1.pToken.open, elDecl1.pToken.open);
            expectStream(validator, expected, done);
         });

         describe('mixed content', () => {
            it('reports no warning all children have been declared', (done) => {
               const elDecl1 = new elementDeclaration.XToken('foo', 'EMPTY', undefined, {});
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#pcdata',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }, {});

               validator.write(elDecl1);
               validator.write(elDecl);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error if content spec has a duplicate name', (done) => {
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }, {});

               validator.write(elDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
                  [ 'one', 'foo' ], elDecl.pToken.open);
               expectStream(validator, expected, done);
            });

            it('reports a warning if a Mixed content spec has an undeclared child type', (done) => {
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#pcdata',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }, {});

               validator.write(elDecl);
               validator.end();

               const expected = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
                  [ 'one', 'foo' ], elDecl.pToken.open, elDecl.pToken.open);
               expectStream(validator, expected, done);
            });

            it('reports no warning if an element declaration has itself as a child', (done) => {
               const elementDecl1 = new elementDeclaration.XToken('two', 'ANY', undefined, {});
               const elementDecl2 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'two',
                     repeat: 'ONE'
                  }]
               }, {});
   
               validator.write(elementDecl1);
               validator.write(elementDecl2);
               validator.end();
   
               expectNoErrors(validator, done);
            });
         });

         it('reports a warning if a children content spec has an undeclared child type', (done) => {
            const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
               names: [{
                  names: [{
                     name: 'badChild',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }],
               listType: 'CHOICE',
               repeat: 'ZEROPLUS',
            }, {});

            validator.write(elDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
               [ 'one', 'badChild' ], elDecl.pToken.open, elDecl.pToken.open);
            expectStream(validator, expected, done);
         });

      });

      describe('Error tokens', () => {

         it('ignores Errors when doing overall contextual checking', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined, {});
            const startToken = new elementStart.XToken('one', [], { open: new SToken('foo', 'foo')});

            validator.write(elDecl1);
            validator.write(startToken);
            validator.write(new WellFormedError(WellFormedError.ID.ELEMENTDECL_NO_NAME, [ 'x' ]));
            validator.end();

            gatherTokens(validator, (tokens) => {
               const errors = tokens.filter((token) => token instanceof XmlError);

               expect(errors.length).toBe(1);
               done();
            });
         });

      });

      describe('content', () => {
         describe('ANY', () => {
            const commentToken = new comment.XToken('testComment', {});
            const piToken = new processingInstruction.XToken('test', 'pi', {});
            const cDataToken = new cdata.XToken('testCData', {});
            const elementStartToken = new elementStart.XToken('one', [], {});

            [
               [ commentToken, 1, 1, true],
               [ commentToken, 1, 2, true],
               [ commentToken, 1, 3, true],
               [ commentToken, 1, 4, false ],
               [ commentToken, 1, 5, false ],
               [ commentToken, 1, 6, false ],
               [ commentToken, 1.1, 1, true],
               [ commentToken, 1.1, 2, false ],
               [ commentToken, 1.1, 3, false ],
               [ piToken, 1, 1, true],
               [ piToken, 1, 2, true],
               [ piToken, 1, 3, true],
               [ piToken, 1, 4, false ],
               [ piToken, 1, 5, false ],
               [ piToken, 1, 6, false ],
               [ piToken, 1.1, 1, true],
               [ piToken, 1.1, 2, false ],
               [ piToken, 1.1, 3, false ],
               [ cDataToken, 1, 1, true],
               [ cDataToken, 1, 2, true],
               [ cDataToken, 1, 3, true],
               [ cDataToken, 1, 4, false ],
               [ cDataToken, 1, 5, false ],
               [ cDataToken, 1, 6, false ],
               [ cDataToken, 1.1, 1, true],
               [ cDataToken, 1.1, 2, false ],
               [ cDataToken, 1.1, 3, false ],
               [ elementStartToken, 1, 1, false],
               [ elementStartToken, 1, 2, false],
               [ elementStartToken, 1, 3, false],
               [ elementStartToken, 1, 4, false ],
               [ elementStartToken, 1, 5, false ],
               [ elementStartToken, 1, 6, false ],
               [ elementStartToken, 1.1, 1, false ],
               [ elementStartToken, 1.1, 2, false ],
               [ elementStartToken, 1.1, 3, false ],
            ].forEach(([token, version, rev, causesError]) => {
               let errorToken;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_COMMENT, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_PI, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === cDataToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_CDATA, [ 'one', version.toString(), rev.toString() ]);
                  }
               }
                     
               it(`${ causesError ? 'reports an error' : 'accepts'} if a ${token.type} token appears in an ANY element in XML ${version}/${rev}`, (done) => {
                  const emd = new EntityMetaData('DOCUMENT', version, rev);
                  const elementDecl = new elementDeclaration.XToken('one', 'ANY');
                  const startToken = new elementStart.XToken('one', [], {});
      
                  validator.write(emd);
                  validator.write(elementDecl);
                  validator.write(startToken);
                  validator.write(token);
                  validator.end();
      
                  if (causesError) {
                     expectStream(validator, errorToken, done);
                  } else {
                     expectNoErrors(validator, done);
                  }
               });
            });

            it('reports an error if an element is used that was not declared', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new elementStart.XToken('one', [], {});
               const undeclaredToken = new elementStart.XToken('two', [], {});
   
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(undeclaredToken);
               validator.end();
   
               const errorToken = new ValidityError(ValidityError.ID.ANY_UNDECLARED_ELEMENT, [ 'one', 'two' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports an error if a completely unsupported bit of markup shows up', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new elementStart.XToken('one', [], {});
   
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();
   
               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports errors even when no ptoken is present', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new elementStart.XToken('one', [], {});
   
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();
   
               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports no errors when passing char data through it', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const characters = new charData.XToken('one', {});
   
               validator.write(elementDecl);
               validator.write(characters);
               validator.end();
   
               expectNoErrors(validator, done);
            });

         });

         describe('EMPTY', () => {

            it('reports an error if anything appears in an element declared to be EMPTY', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
               const elStart = new elementStart.XToken('one', [], {});
               const elTwo = new elementStart.XToken('one', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elTwo);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);
               expectStream(validator, expected, done);
            });
   
            it('reports no error if only an empty tag appears in an EMPTY element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
               const elStart = new elementStart.EmptyToken('one', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(2);
                  done();
               });
            });
   
            it('reports no error if only a start and end tag are used an EMPTY element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
               const elStart = new elementStart.XToken('one', [], {});
               const elEnd = new elementEnd.XToken('one', {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elEnd);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(4);
                  done();
               });
            });
   
         });
   
         describe('MIXED', () => {

            it('reports an error if any element start appears in a PCDATA-only element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const child = new elementStart.XToken('sub', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(child);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED, [ 'one', 'sub' ]);
               expectStream(validator, expected, done);
            });


            it('reports an error if one child element does not match any of the defined ones', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'one',
                     repeat: 'ONE'
                  }, {
                     name: 'two',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const elEnd = new elementEnd.XToken('one', [], {});
               const child = new elementStart.XToken('two', [], {});
               const childEnd = new elementEnd.XToken('two', [], {});
               const thirdStart = new elementStart.XToken('three', [], {});

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elStart);
               validator.write(elEnd);
               validator.write(child);
               validator.write(childEnd);
               validator.write(thirdStart);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED, [ 'one', 'three' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is a comment found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});

               const commentToken = new comment.XToken('stuff', {});
               const elStart = new elementStart.XToken('one', [], {});

               validator.write(new EntityMetaData(undefined, 1.0, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is a processing instruction found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const pi = new processingInstruction.XToken('stuff', undefined, {});
               const elStart = new elementStart.XToken('one', [], {});

               validator.write(new EntityMetaData(undefined, 1.0, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if there is a comment found in mixed content in newer version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const commentToken = new comment.XToken('stuff', {});
               const elStart = new elementStart.XToken('one', [], {});

               validator.write(new EntityMetaData(undefined, 1.0, 3));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if there is a processing instruction found in mixed content in an newer version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const pi = new processingInstruction.XToken('stuff', undefined, {});
               const elStart = new elementStart.XToken('one', [], {});

               validator.write(new EntityMetaData(undefined, 1.1, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if all the character data types are found in mixed content', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});

               validator.write(elementDecl);
               validator.write(new elementStart.XToken('one', [], {}));
               validator.write(new charData.XToken('test charData', {}));
               validator.write(new cdata.XToken('test CDATA', {}));
               validator.write(new space.XToken(' ', {}));
               validator.write(new elementEnd.XToken('one', [], {}));
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if entity start and end pseudo markers are found in the stream', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});

               validator.write(elementDecl);
               validator.write(new elementStart.XToken('one', [], {}));
               validator.write(new entityStart.XToken('testEntityStart', {}));
               validator.write(new entityEnd.XToken('testEntityEnd', {}));
               validator.write(new elementEnd.XToken('one', [], {}));
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error other markup is found in mixed content', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});

               validator.write(elementDecl);
               validator.write(new elementStart.XToken('one', [], {}));
               validator.write(new entityReference.XToken('testEntiyReference', {}));
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('CHILDREN', () => {
            const commentToken = new comment.XToken('testComment', {});
            const piToken = new processingInstruction.XToken('test', 'pi', {});
            const cDataToken = new cdata.XToken('testCData', {});
            const nonWhiteChars = new charData.XToken('one', [], {});
            const whiteChars = new charData.XToken(' \t\n', [], {});

            [
               [ commentToken, 1, 1, true ],
               [ commentToken, 1, 2, true ],
               [ commentToken, 1, 3, false ],
               [ commentToken, 1, 4, false ],
               [ commentToken, 1, 5, false ],
               [ commentToken, 1, 6, false ],
               [ commentToken, 1.1, 1, false],
               [ commentToken, 1.1, 2, false ],
               [ commentToken, 1.1, 3, false ],
               [ piToken, 1, 1, true ],
               [ piToken, 1, 2, true ],
               [ piToken, 1, 3, false ],
               [ piToken, 1, 4, false ],
               [ piToken, 1, 5, false ],
               [ piToken, 1, 6, false ],
               [ piToken, 1.1, 1, false ],
               [ piToken, 1.1, 2, false ],
               [ piToken, 1.1, 3, false ],
               [ cDataToken, 1, 5, true ],
               [ cDataToken, 1.1, 2, true ],
               [ nonWhiteChars, 1, 5, true ],
               [ nonWhiteChars, 1.1, 2, true ],
               [ whiteChars, 1, 5, false ],
               [ whiteChars, 1.1, 2, false ],
               [ new space.XToken('  ', {}), 1.0, 1, false ],
               [ new entityReference.XToken('x', {}), 1.0, 1, false ],
               [ new entityStart.XToken('y'), 1.0, 1, false ],
               [ new entityEnd.XToken('z'), 1.0, 1, false ],
            ].forEach(([token, version, rev, causesError]) => {
               let errorToken;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_COMMENT, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_PI, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === cDataToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === nonWhiteChars) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, [ 'one', version.toString(), rev.toString() ]);
                  }
               }

               it(`${ causesError ? 'reports an error' : 'accepts'} if a ${token.type} token appears in an element in XML ${version}/${rev}`, (done) => {
                  const emd = new EntityMetaData('DOCUMENT', version, rev);
                  const elementDecl2 = new elementDeclaration.XToken('two', 'ANY');
                  const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                     names: [{
                        name: 'two',
                        repeatType: 'ONE',
                     }],
                     repeatType: 'ONE',
                     listType: 'CHOICE',  
                  });
                  const startToken = new elementStart.XToken('one', [], {});
      
                  validator.write(emd);
                  validator.write(elementDecl2);
                  validator.write(elementDecl1);
                  validator.write(startToken);
                  validator.write(token);
                  validator.end();
      
                  if (causesError) {
                     expectStream(validator, errorToken, done);
                  } else {
                     expectNoErrors(validator, done);
                  }
               });
            });

            it('copes with an XToken with no namelist', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', undefined);
               const elStart = new elementStart.XToken('one', [], {});
               const child = new elementStart.XToken('sub', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(child);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'sub' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an end is encountered but the graph is not done', (done) => {
               const nameListGraph = spyOn(nameList, 'graphFromNameList');
               nameListGraph.and.returnValue({
                  startId: 0,
                  endId: 9,
                  states: {
                     0: {
                        id: 0,
                        trans: {
                           two: {
                              ref: 'x1',
                              stateId: 1
                           },
                           three: {
                              ref: 'x2',
                              stateId: 1
                           },
                        },
                        done: false,
                     },
                     1: {
                        id: 1,
                        trans: {
                        },
                        done: true,
                     },
                  }
               });
               const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [],
                  repeatType: 'ONE',
                  listType: 'CHOICE',
               });
               const elStart = new elementStart.XToken('one', [], {});
               const elEnd = new elementEnd.XToken('one', {});
   
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elEnd);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.CHILDREN_UNEXPECTED_END, [ 'one', 'two, three' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an end is encountered when done transitioning through the graph', (done) => {
               const nameListGraph = spyOn(nameList, 'graphFromNameList');
               nameListGraph.and.returnValue({
                  startId: 0,
                  endId: 9,
                  states: {
                     0: {
                        id: 0,
                        trans: {
                           two: {
                              ref: 'x1',
                              stateId: 1
                           },
                           three: {
                              ref: 'x2',
                              stateId: 1
                           },
                        },
                        done: false,
                     },
                     1: {
                        id: 1,
                        trans: {
                        },
                        done: true,
                     },
                  }
               });
               const elementDecl2 = new elementDeclaration.XToken('two', 'EMPTY');
               const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [],
                  repeatType: 'ONE',
                  listType: 'CHOICE',
               });
               const elStart = new elementStart.XToken('one', [], {});
               const elMiddle = new elementStart.EmptyToken('two', [], {});
               const elEnd = new elementEnd.XToken('one', {});
   
               validator.write(elementDecl2);
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elMiddle);
               validator.write(elEnd);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if one tries to make an illegal transition in the graph', (done) => {
               const nameListGraph = spyOn(nameList, 'graphFromNameList');
               nameListGraph.and.returnValue({
                  startId: 0,
                  endId: 9,
                  states: {
                     0: {
                        id: 0,
                        trans: {
                           two: {
                              ref: 'x1',
                              stateId: 1
                           },
                           three: {
                              ref: 'x2',
                              stateId: 1
                           },
                        },
                        done: false,
                     },
                     1: {
                        id: 1,
                        trans: {
                        },
                        done: true,
                     },
                  }
               });
               const elementDecl2 = new elementDeclaration.XToken('four', 'EMPTY');
               const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [],
                  repeatType: 'ONE',
                  listType: 'CHOICE',
               });
               const elStart = new elementStart.XToken('one', [], {});
               const elMiddle = new elementStart.EmptyToken('four', [], {});
               const elEnd = new elementEnd.XToken('one', {});
   
               validator.write(elementDecl2);
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elMiddle);
               validator.write(elEnd);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'four' ]);
               expectStream(validator, expected, done);
            });

         });
      });
   });

});
