/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { CharRefPToken, TextPToken } from 'token';

import { lookupPredefinedValue } from '../predefinedEntities';

fdescribe('lookupPredefinedValue() (unit)', () => {
    it('returns no value if not given one of the predefined entity name', () => {
        const result = lookupPredefinedValue('foo');

        expect(result).toBeUndefined();
    });

    it('returns a value if given "lt"', () => {
        const result = lookupPredefinedValue('lt');

        expect(result).toEqual([
            new CharRefPToken({
                open: toSToken('&#'),
                digits: toSToken('38'),
            }),
            new TextPToken({ text: toSToken('#60;') }),
        ]);
    });

    it('returns a value if given "amp"', () => {
        const result = lookupPredefinedValue('amp');

        expect(result).toEqual([
            new CharRefPToken({
                open: toSToken('&#'),
                digits: toSToken('38'),
            }),
            new TextPToken({ text: toSToken('#38;') }),
        ]);
    });

    it('returns a value if given "gt"', () => {
        const result = lookupPredefinedValue('gt');

        expect(result).toEqual([
            new CharRefPToken({
                open: toSToken('&#'),
                digits: toSToken('62'),
            }),
        ]);
    });

    it('returns a value if given "apos"', () => {
        const result = lookupPredefinedValue('apos');

        expect(result).toEqual([
            new CharRefPToken({
                open: toSToken('&#'),
                digits: toSToken('39'),
            }),
        ]);
    });

    it('returns a value if given "quot"', () => {
        const result = lookupPredefinedValue('quot');

        expect(result).toEqual([
            new CharRefPToken({
                open: toSToken('&#'),
                digits: toSToken('34'),
            }),
        ]);
    });
});
