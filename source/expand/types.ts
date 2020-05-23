import { EntityMetaData } from 'basic';
import { STokenSource } from 'sToken';

import { AttributeValuePToken, EntityValuePToken, ExternalId, PToken, XmlError } from 'token';

import { EntityDetails } from './utils/EntityDetails';
import { ExternalDtdSubsetPseudoToken } from './utils/ExternalDtdSubsetPseudoToken';

type ExpandToken = (token: PToken | void, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;

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
   emd: EntityMetaData;
   externalSubset?: ExternalDtdSubsetPseudoToken;
   entityDetails: EntityDetails;
   utils: EntityProcessors;
};

export { ExpandParams, RetrieveResults, EntityProcessors, ExpandToken };
