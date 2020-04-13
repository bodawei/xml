/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import {
    EntityValuePToken,
    ParameterEntityReferencePToken,
    GeneralEntityReferencePToken,
} from 'token';

import { LoadingEmitter } from './LoadingEmitter';
import { expandEntityValue } from '../expandEntityValue';
import { ExpandParams } from '../types';

type DoneInfo = { errors: Array<Error> };
type Done = (result: DoneInfo) => void;

/*
 * Given an entity reference, make sure the referenced entity is in the cache,
 * and recursively retrieve any PE entities it's value references.
 */
function setupReferencedEntity(
    reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
    expandParams: ExpandParams,
    done: Done,
): void {
    const { geDeclCache, peDeclCache, utils, emd } = expandParams;
    const isPERef = reference instanceof ParameterEntityReferencePToken;
    const cache = isPERef ? peDeclCache : geDeclCache;
    const entityName = strOrBlank(reference.name);
    const entityInfo = entityName !== '' && cache[entityName];

    if (!entityInfo || entityInfo.valueCache || entityInfo.loading) {
        const results = { errors: [] };

        if (entityInfo && entityInfo.loading) {
            entityInfo.loading.once('done', (localResults) => done(localResults as DoneInfo));
        } else {
            done(results);
        }

        return;
    }

    const loading = new LoadingEmitter();
    const { sTokenSource, getErrors } = utils.retrieveExternalEntity(
        entityInfo.token.externalId!,
        emd,
    );

    entityInfo.loading = loading;

    utils.parseEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken) => {
        expandEntityValue(
            entityValuePToken,
            expandParams,
            (expandedEntityValue: EntityValuePToken) => {
                const results = {
                    errors: getErrors(),
                };
                entityInfo.valueCache = expandedEntityValue;
                delete entityInfo.loading;

                done(results);
                loading.emit('done', results);
            },
        );
    });
}

export { setupReferencedEntity };
