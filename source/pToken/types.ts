import {
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   TextPToken,
} from 'token';

type UnexpandedMarkupToken = TextPToken | ParameterEntityReferencePToken;
type ExpandedMarkupToken =
   | TextPToken
   | ParameterEntityReferencePToken
   | ParameterEntityStartPToken
   | ParameterEntityEndPToken;

interface UnexpandedMarkupDetails {
   tokens: Array<UnexpandedMarkupToken>;
   propName: string;
}

export { ExpandedMarkupToken, UnexpandedMarkupDetails, UnexpandedMarkupToken };
