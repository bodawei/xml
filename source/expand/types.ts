import { EntityMetaData } from 'basic';
import { STokenSource } from 'sToken';

import {
   EntityValuePToken,

   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,

   PToken,
} from 'token';
import { ExternalId } from 'source/token/common/externalId';

type GeneralEntityInfo = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   cache?: EntityValuePToken
};

type ParameterEntityInfo = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   valueCache?: EntityValuePToken
   name: string,
   // // Below are drek
   // ppEntityValue?: EntityValuePToken,
   // cache?: EntityValuePToken
   // unssignedCache?: UnassignedArray,
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

type EntityProcessors = {
   processBody: ProcessBody,
   processForEntityValue: ProcessForEntityValue,
   retrieveExternalEntity: (externalId: ExternalId, entityMetaData: EntityMetaData) => STokenSource,
};


export {
   EntityProcessors,

   ParameterEntityInfo,
   GeneralEntityMap,
   ParameterEntityMap
};