import { EntityMetaData } from 'basic';
import { STokenSource } from 'sToken';

import {
   AttributeValuePToken,
   EntityValuePToken,
   ExternalId,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   PToken,
   XmlError,
} from 'token';

import { ExternalDtdSubsetPseudoToken } from './utils/ExternalDtdSubsetPseudoToken';
import { LoadingEmitter } from './utils/LoadingEmitter';

type GeneralEntityInfo = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   valueCache?: EntityValuePToken;
   loading?: LoadingEmitter;
};

type ParameterEntityInfo = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   valueCache?: EntityValuePToken; // This must be filled in if this is internal when the token is found. It must be filled in for external when asked
   loading?: LoadingEmitter;
};

type GeneralEntityMap = {
   [entityName: string]: GeneralEntityInfo;
};

type ParameterEntityMap = {
   [entityName: string]: ParameterEntityInfo;
};

type ExpandToken = (token: PToken | void, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;

// This always returns an entityValeuePToken, even if sTokenSource has no content (e.g. has errors)
type STokenSourceProcessed = () => void;
type RetrieveResults = {
   sTokenSource: STokenSource;
   getErrors: () => Array<XmlError>;
};
type EntityProcessors = {
   parseBody: (sTokenSource: STokenSource, inContent: boolean, expandToken: ExpandToken) => void;
   parseEntityValue: (
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken | void) => void,
   ) => void;
   retrieveExternalEntity: (
      externalId: ExternalId,
      entityMetaData: EntityMetaData,
   ) => RetrieveResults;
   parseAttributeValue: (
      sTokenSource: STokenSource,
      done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
   ) => void;
};

type ExpandParams = {
   externalSubset?: ExternalDtdSubsetPseudoToken;
   peDeclCache: ParameterEntityMap;
   geDeclCache: GeneralEntityMap;
   utils: EntityProcessors;
   emd: EntityMetaData;
};

export {
   ExpandParams,
   RetrieveResults,
   EntityProcessors,
   GeneralEntityInfo,
   ParameterEntityInfo,
   GeneralEntityMap,
   ParameterEntityMap,
   ExpandToken,
};
