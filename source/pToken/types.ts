import {
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   TextPToken,
} from 'token';

type UnexpandedToken = TextPToken | ParameterEntityReferencePToken;

// Why would these ever be in an UNEXPANDED set?
// | ParameterEntityStartPToken
// | ParameterEntityEndPToken;

interface UnexpandedDetails {
   tokens: Array<UnexpandedToken>;
   propName: string;
}

export { UnexpandedDetails, UnexpandedToken };
