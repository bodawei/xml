import { TextPToken } from './token/text';
import {
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
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
