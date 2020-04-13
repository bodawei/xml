/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { LoadingEmitter } from '../LoadingEmitter';

fdescribe('LoadingEmitter (unit)', () => {
    it('can be constructed', () => {
        const le = new LoadingEmitter();

        expect(le).toBeInstanceOf(LoadingEmitter);
    });

    it('can have a listener attched', () => {
        const le = new LoadingEmitter();

        expect(() => le.once('foo', () => {})).not.toThrow();
    });

    it('listener will be called when an event is emitted', () => {
        const le = new LoadingEmitter();
        const spy = jasmine.createSpy('listenerSpy');
        le.once('foo', spy);

        le.emit('foo', { data: true });

        expect(spy).toHaveBeenCalledWith({ data: true });
    });
});
