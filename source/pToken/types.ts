import {
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   TextPToken,
} from 'token';

type UnexpandedToken =
   | TextPToken
   | ParameterEntityReferencePToken
   | ParameterEntityStartPToken
   | ParameterEntityEndPToken;

interface UnexpandedDetails {
   tokens: Array<UnexpandedToken>;
   propName: string;
}

export { UnexpandedDetails, UnexpandedToken };
