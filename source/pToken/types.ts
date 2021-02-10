import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import { TextPToken } from './token/text';
import { ParameterEntityReferencePToken } from './token/parameterEntityReference';

type UnexpandedMarkupToken = TextPToken | ParameterEntityReferencePToken;
type ExpandedMarkupToken =
   | TextPToken
   | ParameterEntityReferencePToken
   | ParameterEntityStartPToken
   | ParameterEntityEndPToken;

interface UnexpandedMarkupDetails {
   tokens: ReadonlyArray<UnexpandedMarkupToken>;
   propName: string;
}

export { ExpandedMarkupToken, UnexpandedMarkupDetails, UnexpandedMarkupToken };
