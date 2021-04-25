/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { LiteralValuePToken } from 'token';

import { charCheck } from '../../common/charCheck';

import { literalValueCheck } from '../literalValueCheck';

jest.mock('../../common/charCheck');

describe('literalValueCheck() (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let valuePToken: LiteralValuePToken;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();

      valuePToken = [new TextPToken({ text: toSToken('xxx') })];
   });

   it('calls charCheck() to check the value', () => {
      literalValueCheck(valuePToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(toSToken('xxx'), mockErrorCollector, confVer, false);
   });

   it('sets the position before calling misc.checkWellFormed', () => {
      const mock: jest.MockedFunction<typeof mockErrorCollector.setPos> = jest.fn();

      mockErrorCollector.setPos = mock;

      literalValueCheck(valuePToken, mockErrorCollector, confVer);

      expect(mock.mock.calls[0][0]).toEqual(toSToken('xxx'));
   });

   // it('calls reference.checkWellFormed if an entity reference PToken is found', () => {
   //    const geRef = new GeneralEntityReferencePToken({ open: toSToken('&') });
   //    refCheckWellFormedSpy = spyOn(geRef, 'checkWellFormed');
   //    valuePToken.push(geRef);

   //    literalValueCheck(valuePToken, mockErrorCollector, confVer);

   //    expect(refCheckWellFormedSpy.mock.calls[0][0]).toEqual(mockErrorCollector);
   // });

   // it('calls charRef.checkWellFormed when there is a charRef in the value', () => {
   //    const ref = new charRef.CharRefPToken({ open: toSToken('&#') });
   //    const spy = spyOn(ref, 'checkWellFormed');
   //    valuePToken.push(ref);

   //    literalValueCheck(valuePToken, mockErrorCollector, confVer);

   //    expect(spy).toHaveBeenCalledWith(mockErrorCollector, confVer);
   // });
});
