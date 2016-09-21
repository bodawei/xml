/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

describe('toEqualProps', () => {

   it('reports true when all the properties match', () => {
      expect({
         one: 1
      }).toEqualProps({
         one: 1
      });
   });

   it('reports true when the specified properties match', () => {
      expect({
         one: 1,
         two: 2
      }).toEqualProps({
         one: 1
      });
   });

   it('reports false when the specified properties do not match', () => {
      expect({
         one: 1,
         two: 2
      }).not.toEqualProps({
         one: 2
      });
   });

});
