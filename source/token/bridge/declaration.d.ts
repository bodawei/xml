import { EntityMetaData } from '../../basic';
import { ErrorCollector } from '../../error';

type DeclPToken = {
};

type PToken = {
};

declare function checkWellFormed(pToken: any, ec: ErrorCollector, entityMetaData: EntityMetaData): void;

export {
   PToken,
   DeclPToken,
   checkWellFormed,
};