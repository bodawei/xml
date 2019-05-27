/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { toSToken } from 'sToken';
import {
   CdataPToken,
   CommentPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ProcessingInstructionPToken,
   TextDeclarationPToken,
   InternalSubsetStartToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   InternalSubsetEndToken,
   ParameterEntityReferencePToken,
   SpacePToken,
   TextPToken,
   ParameterEntityDeclarationPToken,
   XmlDeclarationPToken,

   attListDeclaration,
   elementDeclaration,
   CharDataPToken,
   CharRefPToken,
} from 'token';

const makeAttListDeclaration = () => new attListDeclaration.PToken({
   open: toSToken('<!'),
   elementName: toSToken('elementName'),
   postElementNameSpace: toSToken(' '),
   attDefs: [ {
      name: toSToken('att1'),
      postNameSpace: toSToken(' '),
      type: toSToken('CDATA'),
      postTypeSpace: toSToken(' '),
      defaultType: toSToken('#REQUIRED'),
      postDefaultTypeSpace: toSToken(' '),
      value: [],
   } ],
   close: toSToken('>'),
});

const makeCharData = () => new CharDataPToken({
   text: toSToken('test text'),
});

const makeCdata = () => new CdataPToken({
   open: toSToken('<!['),
   sectionType: toSToken('CDATA'),
   bracket: toSToken('['),
   text: toSToken('test text'),
   close: toSToken(']]>'),
});

const makeCharRef = () => new CharRefPToken({
   open: toSToken('&#'),
   digits: toSToken('68'),
   close: toSToken(';'),
   charCode: 68,
});

const makeComment = () => new CommentPToken({
   open: toSToken('<!--'),
   text: [ toSToken('commentText') ],
   close: toSToken('-->'),
});

const makeDocTypeStart = () => new DocTypeStartPToken({
   open: toSToken('<!'),
   declType: toSToken('DOCTYPE'),
   name: toSToken('root'),
   openSubset: toSToken('['),
});

const makeDocTypeEnd = () => new DocTypeEndPToken({
   docTypeStartPToken: makeDocTypeStart(),
   closeSubset: toSToken(']'),
   close: toSToken('>'),
});

const makeNotationDeclaration = () => new NotationDeclarationPToken({
   open: toSToken('<!'),
   openSpace: undefined,
   declType: toSToken('NOTATION'),
   declTypeSpace: toSToken(' '),
   name: toSToken('notationName'),
   nameSpace: toSToken(' '),
   externalId: { externalId: true },
   externalIdSpace: toSToken(' '),
   close: toSToken('>'),
});

const makeElementEmpty = () => new ElementEmptyPToken({
   open: toSToken('<'),
   name: toSToken('elStart'),
   close: toSToken('/>'),
});

const makeElementEnd = () => new ElementEndPToken({
   open: toSToken('</'),
   name: toSToken('elStart'),
   close: toSToken('>'),
});

const makeElementStart = () => new ElementStartPToken({
   open: toSToken('<'),
   name: toSToken('elStart'),
   close: toSToken('>'),
});

const makeElementDeclaration = () => new elementDeclaration.PToken({
   open: toSToken('<!'),
   postOpenSpace: undefined,
   declType: toSToken('ELEMENT'),
   postDeclTypeSpace: toSToken(' '),
   name: toSToken('elementName'),
   postNameSpace: toSToken(' '),
   contentSpec: toSToken('ANY'),
   postContentSpecSpace: toSToken(' '),
   close: toSToken('>'),
});

const makeExternalSubsetEnd = () => new ExternalSubsetEndToken();
const makeExternalSubsetStart = () => new ExternalSubsetStartToken();

const makeGeneralEntityDeclaration = () => new GeneralEntityDeclarationPToken({
   open: toSToken('<!'),
   name: toSToken('genDecl'),
   close: toSToken('>'),
});

const makeGeneralEntityReference = () => new GeneralEntityReferencePToken({
   open: toSToken('&'),
   name: toSToken('testRef'),
   close: toSToken(';'),
});

const makeInternalSubsetEnd = () => new InternalSubsetEndToken();
const makeInternalSubsetStart = () => new InternalSubsetStartToken();

const makeParameterEntityDeclaration = () => new ParameterEntityDeclarationPToken({
   parameter: toSToken('%'),
   parameterSpace: toSToken(' '),
   name: toSToken('entityName'),
   nameSpace: toSToken(' '),
   openQuote: toSToken('"'),
   value: [ toSToken('value') ],
   closeQuote: toSToken('"'),
   close: toSToken('>'),
});

const makeParameterExternalEntityDeclaration = () => new ParameterEntityDeclarationPToken({
   parameter: toSToken('%'),
   parameterSpace: toSToken(' '),
   name: toSToken('entityName'),
   nameSpace: toSToken(' '),
   externalId: {
      type: 'EXTERNAL_ID',
      idType: toSToken('PUBLIC'),
      postIdTypeSpace: toSToken(' '),
      public: {
         openQuote: toSToken('"'),
         value: [ new TextPToken({ text: toSToken('pub.xml') }) ],
         closeQuote: toSToken('"'),
      },
   },
   close: toSToken('>'),
});

const makeParameterEntityReference = () => new ParameterEntityReferencePToken({
   open: toSToken('&'),
   name: toSToken('entityName'),
   close: toSToken(';'),
});

const makeProcessingInstruction = () => new ProcessingInstructionPToken({
   open: toSToken('<?'),
   target: toSToken('foo'),
   targetSpace: toSToken(' '),
   instruction: toSToken('blah'),
   close: toSToken('?>'),
});

const makeSpace = () => new SpacePToken({
   text: toSToken(' '),
});

const makeTextDecl = () => new TextDeclarationPToken({
   open: toSToken('<?'),
   openSpace: undefined,
   target: toSToken('xml'),
   targetSpace: toSToken(' '),
   params: [{
      name: toSToken('version'),
      nameSpace: undefined,
      equal: toSToken('='),
      equalSpace: undefined,
      value: toSToken('1.1'),
   }],
   close: toSToken('?>'),
});

const makeXmlDecl = () => new XmlDeclarationPToken({
   open: toSToken('<?'),
   openSpace: undefined,
   target: toSToken('xml'),
   targetSpace: toSToken(' '),
   params: [{
      name: toSToken('version'),
      nameSpace: undefined,
      equal: toSToken('='),
      equalSpace: undefined,
      value: toSToken('1.1'),
   }],
   close: toSToken('?>'),
});

export {
   makeAttListDeclaration,
   makeCharData,
   makeCdata,
   makeCharRef,
   makeComment,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeInternalSubsetEnd,
   makeInternalSubsetStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterExternalEntityDeclaration,
   makeParameterEntityReference,
   makeProcessingInstruction,
   makeSpace,
   makeTextDecl,
   makeXmlDecl,
};
