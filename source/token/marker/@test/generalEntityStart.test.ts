/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { SToken } from 'sToken';

import { GeneralEntityReferencePToken } from '../../generalEntityReference';
import { GeneralEntityStartPToken, GeneralEntityStartXToken } from '../generalEntityStart';

import * as checks from 'source/wellformedness/token/generalEntityReferenceCheck';

describe('GeneralEntityStartPToken (unit)', () => {
   let checkSpy: jasmine.Spy;

   beforeEach(() => {
      checkSpy = spyOn(checks, 'generalEntityReferenceCheck');
   });

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartPToken(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));

      expect(token.referencePToken).toEqual(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));
   });

   it('checkWellFormed() calls checkWellFormed on reference', () => {
      const emd = new EntityMetaData();
      const ec = new ErrorCollector(SToken.fromString('foo'), WellFormedError);
      const reference = new GeneralEntityReferencePToken({
         open: SToken.fromString('&'),
         name: SToken.fromString('foo')
      });
      const token = new GeneralEntityStartPToken(reference);

      token.checkWellFormed(ec, emd);

      expect(checkSpy).toHaveBeenCalledWith(reference, ec, emd);
   });

   it('will create an xToken', () => {
      const token = new GeneralEntityStartPToken(new GeneralEntityReferencePToken({
         open: SToken.fromString('&'),
         name: SToken.fromString('foo')
      }));

      expect(token.toXToken()).toEqual(new GeneralEntityStartXToken('foo', token));
   });

});

describe('GeneralEntityStartXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
