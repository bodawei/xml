import { ExternalIdP } from 'pToken';

const EXTERNAL_DTD_PSEUDO_TOKEN = 'EXTERNAL_DTD_PSEUDO_TOKEN';

class ExternalDtdSubsetPseudoToken {
   public readonly type: 'EXTERNAL_DTD_PSEUDO_TOKEN' = EXTERNAL_DTD_PSEUDO_TOKEN;

   public readonly externalId: ExternalIdP;

   constructor(externalId: ExternalIdP) {
      this.externalId = externalId;
   }
}

export { EXTERNAL_DTD_PSEUDO_TOKEN, ExternalDtdSubsetPseudoToken };
