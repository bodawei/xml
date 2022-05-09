import { EntityId, ConformanceVersion, XmlErrorToken } from 'basic';
import { ParseType, ParseToken } from 'pToken';
import { STokenSource } from 'sToken';
import { AttributeValuePToken, EntityValuePToken } from 'token';

import { EntityDetails } from './utils/EntityDetails';

type ExpandToken = (token: ParseToken | undefined, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;

interface RetrieveResults {
   sTokenSource: STokenSource;
   getErrors: () => Array<XmlErrorToken>;
}
interface AttributeValueResults {
   newValue: AttributeValuePToken | undefined;
   errors: Array<XmlErrorToken>;
}

type OpaqueEntityLoc = string | EntityId | any;

interface EntityProcessors {
   parseBody: (sTokenSource: STokenSource, context: ParseType, expandToken: ExpandToken) => void;
   parseEntityValue: (
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken | undefined) => void,
   ) => void;
   retrieveExternalEntity: (entityLoc: OpaqueEntityLoc) => RetrieveResults;
   resolveEntityId: (
      baseEntity: EntityId | OpaqueEntityLoc,
      relativeEntity: EntityId,
   ) => OpaqueEntityLoc;
   parseAttributeValue: (
      sTokenSource: STokenSource,
      done: (results: AttributeValueResults) => void,
   ) => void;
}

interface ExpandParams {
   entityId: EntityId;
   confVer: ConformanceVersion;
   entityDetails: EntityDetails;
   loadExternalEntities: boolean;
   utils: EntityProcessors;
}

export {
   AttributeValueResults,
   ExpandParams,
   RetrieveResults,
   EntityProcessors,
   ExpandToken,
   OpaqueEntityLoc,
};
