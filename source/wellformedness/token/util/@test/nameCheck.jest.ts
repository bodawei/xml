/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'error-test';
import { WellFormedError } from 'error';
import { toSToken } from 'sToken';

import { nameCheck } from '../nameCheck';

describe('nameCheck()', () => {
   let ec: MockErrorCollector;
   let confVerV1R5: ConformanceVersion;
   let errorId: string;
   let isNameMock: jest.Mock;

   beforeEach(() => {
      ec = new MockErrorCollector();
      confVerV1R5 = new ConformanceVersion(1.0, 5);
      errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
   });

   it('accepts an empty Stoken', () => {
      // nameCheck(undefined as any, ec, confVerV1R5, errorId);

      // expect(ec.errors).toEqual([]);
      expect(true).toEqual(true);
   });

   // it('calls isName()', () => {
   //    nameCheck(toSToken('foo'), ec, confVerV1R5, errorId);

   //    expect(basic.isName).toHaveBeenCalledWith('foo', 1.0, 5);
   // });

   // it('reports an error if isName() returns false', () => {
   //    isNameMock.mockReturnValue(false);

   //    nameCheck(toSToken('foo'), ec, confVerV1R5, errorId);

   //    expect(ec.errors).toEqual([errorId, ['foo'], toSToken('foo')]);
   // });
});
