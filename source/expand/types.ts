import { EntityMetaData } from 'basic';
import { STokenSource } from 'sToken';

import {
   EntityValuePToken,

   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,

   PToken,
} from 'token';
import { ExternalId } from 'source/token/common/externalId';

import { LoadingEmitter } from './utils/LoadingEmitter';

type GeneralEntityInfo = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   valueCache?: EntityValuePToken
   loading?: LoadingEmitter;
};

type ParameterEntityInfo = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   valueCache?: EntityValuePToken;
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
type ProcessBody = (sTokenSource: STokenSource, inContent: boolean, expandToken: ExpandToken, done: STokenSourceProcessed) => void;
type ProcessForEntityValue = (sTokenSource: STokenSource, done: (results: EntityValuePToken) => void) => void;
type STokenSourceProcessed = () => void;
type RetrievalError = Error;
type RetrieveResults = {
   sTokenSource: STokenSource,
   getErrors: () => Array<RetrievalError>,
}
type EntityProcessors = {
   parseBody: ProcessBody,
   parseEntityValue: ProcessForEntityValue,
   retrieveExternalEntity: (externalId: ExternalId, entityMetaData: EntityMetaData) => RetrieveResults,
};


type ExpandParams = {
   peDeclCache: ParameterEntityMap,
   geDeclCache: GeneralEntityMap,
   utils: EntityProcessors,
   emd: EntityMetaData,
};



export {
   ExpandParams,
   RetrievalError,
   EntityProcessors,

   ParameterEntityInfo,
   GeneralEntityMap,
   ParameterEntityMap
};