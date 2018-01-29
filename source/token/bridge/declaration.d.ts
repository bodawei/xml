import { EntityMetaData } from '../../basic';
import { ErrorCollector } from '../../error';

type DeclPToken = {
};

declare function checkWellFormed(pToken: any, ec: ErrorCollector, entityMetaData: EntityMetaData): void;

export {
   DeclPToken,
   checkWellFormed,
};