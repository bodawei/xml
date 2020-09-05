import { EntityId } from 'basic';
import { ContextType } from 'pToken';
import { STokenSource, SToken } from 'sToken';
import { AttributeValuePToken, EntityValuePToken, PToken, XmlError } from 'token';

import { EntityDetails } from './utils/EntityDetails';

type ExpandToken = (token: PToken | void, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;

type ConditionalInfo = {
   source?: STokenSource | undefined;
   textIsFinished?: () => void;
   sectionType?: SToken;
};

type RetrieveResults = {
   sTokenSource: STokenSource;
   getErrors: () => Array<XmlError>;
};
type AttributeValueResults = {
   newValue: AttributeValuePToken | void;
   errors: Array<XmlError>;
};

type EntityProcessors = {
   parseBody: (sTokenSource: STokenSource, context: ContextType, expandToken: ExpandToken) => void;
   parseEntityValue: (
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken | void) => void,
   ) => void;
   retrieveExternalEntity: (baseEntity: EntityId, relativeEntity: EntityId) => RetrieveResults;
   parseAttributeValue: (
      sTokenSource: STokenSource,
      done: (results: AttributeValueResults) => void,
   ) => void;
};

type ExpandParams = {
   entityId: EntityId;
   entityDetails: EntityDetails;
   loadExternalEntities: boolean;
   conditionalStack: Array<ConditionalInfo>;
   utils: EntityProcessors;
};

export {
   AttributeValueResults,
   ConditionalInfo,
   ExpandParams,
   RetrieveResults,
   EntityProcessors,
   ExpandToken,
};
