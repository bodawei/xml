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

type ExpandToken = (token: PToken, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;
type ProcessBody = (
   sTokenSource: STokenSource,
   inContent: boolean,
   expandToken: ExpandToken,
   done: STokenSourceProcessed,
) => void;

// This always returns an entityValeuePToken, even if sTokenSource has no content (e.g. has errors)
type ProcessForEntityValue = (
   sTokenSource: STokenSource,
   done: (results: EntityValuePToken | void) => void,
) => void;
type STokenSourceProcessed = () => void;
type RetrieveResults = {
   sTokenSource: STokenSource;
   getErrors: () => Array<XmlError>;
};
type EntityProcessors = {
   parseBody: ProcessBody;
   parseEntityValue: ProcessForEntityValue;
   retrieveExternalEntity: (
      externalId: ExternalId,
      entityMetaData: EntityMetaData,
   ) => RetrieveResults;
   parseAttributeValue: (
      sTokenSource: STokenSource,
      done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
   ) => void;
};

type ExternalSubsetPToken = {
   type: 'EXTERNAL_SUBSET';
   externalId: ExternalId;
};

type ExpandParams = {
   externalSubset?: ExternalSubsetPToken;
   peDeclCache: ParameterEntityMap;
   geDeclCache: GeneralEntityMap;
   utils: EntityProcessors;
   emd: EntityMetaData;
};

export {
   ExternalSubsetPToken,
   ExpandParams,
   RetrieveResults,
   EntityProcessors,
   GeneralEntityInfo,
   ParameterEntityInfo,
   GeneralEntityMap,
   ParameterEntityMap,
   ExpandToken,
};
