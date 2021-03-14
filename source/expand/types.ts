import { EntityId, ConformanceVersion } from 'basic';
import { ContextType, ParseToken } from 'pToken';
import { STokenSource, SToken } from 'sToken';
import { AttributeValuePToken, EntityValuePToken, ErrorToken } from 'token';

import { EntityDetails } from './utils/EntityDetails';

type ExpandToken = (token: ParseToken | undefined, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;

interface ConditionalInfo {
   source?: STokenSource | undefined;
   textIsFinished?: () => void;
   sectionType?: SToken;
}

interface RetrieveResults {
   sTokenSource: STokenSource;
   getErrors: () => Array<ErrorToken>;
}
interface AttributeValueResults {
   newValue: AttributeValuePToken | undefined;
   errors: Array<ErrorToken>;
}

type OpaqueEntityLoc = string | EntityId | any;

interface EntityProcessors {
   parseBody: (sTokenSource: STokenSource, context: ContextType, expandToken: ExpandToken) => void;
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
   conditionalStack: Array<ConditionalInfo>;
   utils: EntityProcessors;
}

export {
   AttributeValueResults,
   ConditionalInfo,
   ExpandParams,
   RetrieveResults,
   EntityProcessors,
   ExpandToken,
   OpaqueEntityLoc,
};
