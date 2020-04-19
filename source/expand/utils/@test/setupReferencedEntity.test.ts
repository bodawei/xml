/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { toSToken, STokenSource } from 'sToken';
import {
    EntityValuePToken,
    GeneralEntityDeclarationPToken,
    GeneralEntityReferencePToken,
    ParameterEntityDeclarationPToken,
    ParameterEntityReferencePToken,
    TextPToken,
} from 'token';

import { setupReferencedEntity } from '../setupReferencedEntity';
import { ExpandParams, RetrieveResults } from '../../types';

fdescribe('setupReferencedEntity() (unit)', () => {
    let params: ExpandParams;
    let textPToken: TextPToken;
    let peRefPToken: ParameterEntityReferencePToken;
    let geRefPToken: GeneralEntityReferencePToken;

    beforeEach(() => {
        textPToken = new TextPToken({ text: toSToken('foo') });
        peRefPToken = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('pe1'),
        });
        geRefPToken = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('ge1'),
        });

        params = {
            peDeclCache: {
                pe1: {
                    token: new ParameterEntityDeclarationPToken({ open: toSToken('<!') }),
                    isInternal: false,
                },
            },
            geDeclCache: {
                ge1: {
                    token: new GeneralEntityDeclarationPToken({ open: toSToken('<!') }),
                    isInternal: false,
                    isUnparsed: false,
                },
            },
            utils: {
                parseBody: (): void => {
                    return undefined;
                },
                parseEntityValue: (sTokenSource, done): void => {
                    done([textPToken]);
                },
                retrieveExternalEntity: (externalId, entityMetaData): RetrieveResults => {
                    return {
                        sTokenSource: new STokenSource({}, entityMetaData),
                        getErrors: (): Array<Error> => [],
                    };
                },
            },
            emd: new EntityMetaData(),
        };
    });

    it('calls back with no errors hwn asked to process a parameter entity token', (done) => {
        params.peDeclCache.pe1.valueCache = [];

        setupReferencedEntity(peRefPToken, params, (result) => {
            expect(result).toEqual([]);
            done();
        });
    });

    it('addds an expanded entity to the cache when called with a known entity', (done) => {
        setupReferencedEntity(peRefPToken, params, () => {
            expect(params.peDeclCache.pe1.valueCache).toEqual([textPToken]);
            done();
        });
    });

    it('addds an expanded general entity to the cache when called with a known general entity', (done) => {
        setupReferencedEntity(geRefPToken, params, () => {
            expect(params.geDeclCache.ge1.valueCache).toEqual([textPToken]);
            done();
        });
    });

    it('does not do any further processing when the entity has no name', (done) => {
        const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
        peRefPToken = new ParameterEntityReferencePToken({ open: toSToken('&') });

        setupReferencedEntity(peRefPToken, params, () => {
            expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('does not do any further processing when the entity was not declared', (done) => {
        const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
        delete params.peDeclCache.pe1;

        setupReferencedEntity(peRefPToken, params, () => {
            expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('does not do any further processing when the entity has a value cached', (done) => {
        const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
        params.peDeclCache.pe1.valueCache = [];

        setupReferencedEntity(peRefPToken, params, () => {
            expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('does not do any further processing when the entity is already being loaded', (done) => {
        let done1: (value: EntityValuePToken) => void;
        let callCount = 0;
        params.utils.parseEntityValue = (other, localDone): void => {
            done1 = localDone;
        };
        done1 = (): void => {
            return undefined;
        };

        // Make the first call.  This will store the done function, above wand wait for the second
        setupReferencedEntity(peRefPToken, params, () => {
            callCount++;
            expect(callCount).toEqual(1);
        });

        // make the second call. This will set up the second call back which will
        // be invoked below
        setupReferencedEntity(peRefPToken, params, () => {
            callCount++;
            expect(callCount).toEqual(2);
            done();
        });

        // Note that we have done no callbacks yet
        expect(callCount).toEqual(0);

        // Now, trigger the stored call, and both calls will happen
        done1([textPToken]);
    });

    it('does not do any further processing when the entity is already being loaded', (done) => {
        let done1: (value: EntityValuePToken) => void;
        let callCount = 0;
        done1 = (): void => {
            return undefined;
        };
        params.utils.parseEntityValue = (other, localDone): void => {
            done1 = localDone;
        };
        params.utils.retrieveExternalEntity = (externalId, entityMetaData): RetrieveResults => {
            const errors: Array<Error> = [];
            for (let index = 0; index < callCount; index++) {
                errors.push(new Error(`${index + 1}`));
            }
            return {
                sTokenSource: new STokenSource({}, entityMetaData),
                getErrors: (): Array<Error> => errors,
            };
        };

        callCount++;
        // Make a first call.  This will start to "retrieve" the sToken and the errors at this time
        setupReferencedEntity(peRefPToken, params, (results) => {
            expect(results).toEqual([new Error('1')]);
        });

        // make the second call. This will short circuit and not retrieve.
        callCount++;
        setupReferencedEntity(peRefPToken, params, (results) => {
            expect(results).toEqual([new Error('1')]);
            done();
        });

        // Now, trigger the stored call, and both callbacks will be invoked with the first's errors
        done1([textPToken]);
    });
});
