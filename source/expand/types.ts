import { EntityMetaData } from 'basic';
import { STokenSource } from 'sToken';

import { AttributeValuePToken, EntityValuePToken, ExternalId, PToken, XmlError } from 'token';

import { EntityDetails } from './utils/EntityDetails';

type ExpandToken = (token: PToken | void, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;

type RetrieveResults = {
   sTokenSource: STokenSource;
   getErrors: () => Array<XmlError>;
};
type AttributeValueResults = {
   newValue: AttributeValuePToken | void;
   errors: Array<XmlError>;
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
      done: (results: AttributeValueResults) => void,
   ) => void;
};

type ExpandParams = {
   emd: EntityMetaData;
   entityDetails: EntityDetails;
   utils: EntityProcessors;
};

export { AttributeValueResults, ExpandParams, RetrieveResults, EntityProcessors, ExpandToken };
