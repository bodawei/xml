/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import ErrorCollector from '../../ErrorCollector';
import { SToken } from 'sToken';

import { Position, BaseError } from '../../BaseError';
import { XmlErrorToken } from 'source/basic/error/XmlErrorToken';

/**********************************************************************\
  Miscellaneous utilities for use in testing things in this namespace
\**********************************************************************/

interface ErrorInfo {
   position: Position;
   id: string;
   params?: Array<string>;
   lastPosition?: Position;
}

declare class ErrorToken {
   public readonly id: string;
   constructor(id: string, params: Array<string>, position: Position, context: Position);
}

type ErrConstFunc = typeof ErrorToken;

/*
 * The chief reason for this mock collector is simply that it stores the individual
 * properties passed to the error functions, rather than them building a string
 * immediately with them. This lets us do more checking without needing to test
 * the strings generated, and helps us validate that we're passing the right
 * numbers of parameters etc.
 */
class MockErrorCollector extends ErrorCollector {
   public _lastNotNull?: SToken;

   public _lastPos?: SToken;

   public _lastPosition?: SToken;

   public errors: Array<XmlErrorToken> = [];

   constructor() {
      super(SToken.fromString('test'), BaseError as any);
      this.errors = [];
      this.setPos = this.setPos.bind(this);
      this.report = this.report.bind(this);

      this.setPos = jasmine.createSpy('setPosSpy').and.callFake(this.setPos);
      this.getErrors = jasmine.createSpy('getErrorsSpy');
      this.report = jasmine.createSpy('reportSpy').and.callFake(this.report);
   }

   setPos(sToken?: SToken): void {
      if (sToken) {
         this._lastNotNull = sToken;
      }

      this._lastPos = sToken;
   }

   report(id: string, params?: Array<string>, position?: Position): void {
      const info: ErrorInfo = {
         position: position || this._lastPos,
         id,
         params,
      };
      if (!this._lastPos) {
         info.lastPosition = this._lastNotNull;
      }

      this.errors.push(info as any);
   }

   check(condition: any, id: string, params?: Array<string>, position?: Position): void {
      if (condition) {
         if (params) {
            this.report(id, params, position);
         } else {
            this.report(id);
         }
      }
   }

   reportError(
      id: string,
      constructor: ErrConstFunc,
      params: Array<string>,
      position?: Position,
   ): void {
      this.report(id, params, position);
   }
}

export { MockErrorCollector, ErrorInfo };
