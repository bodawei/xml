/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

const defineCheckKeys = require('./check-keys.js');

describe('checkKeys()', () => {
   let mockGrunt;
   let ckThis;

   function setup() {
      let checkKeys;

      mockGrunt = {
         registerMultiTask(name, def, func) {
            checkKeys = func;
         },
         fail: {
            fatal: (message) => {
               throw new Error(message);
            },
         },
         file: {
            expand: () => {},
            exists: (pathname) => {
               switch (pathname) {
                  case './test/test1.properties':
                  case './test/test2.properties':
                  case './source/one.js':
                  case './source/two.js':
                     return true;
                  default:
                     return false;

               }
            },
            read: (pathname) => {
               switch (pathname) {
                  case './test/test1.properties':
                     return 'AAA = aaaa';
                  case './test/test2.properties':
                     return 'BBB= bbb';
                  case './source/one.js':
                     return 'blah blah';
                  case './source/two.js':
                     return 'AAA, BBBB';
               }
            },
         },
      };

      defineCheckKeys(mockGrunt);

      ckThis = {
         options: jasmine.createSpy('optionsSpy'),
         checkKeys: checkKeys,
      };

      spyOn(mockGrunt.file, 'expand');
   }

   it('reports an error if no property file defined', () => {
      setup();
      ckThis.options.and.returnValue({});

      expect(() => {
         ckThis.checkKeys();
      }).toThrowError('Must specify a globbing pattern for "propFiles". e.g. checkkeys: ' +
         '{ default: options: { propFiles: ./**/*.properties }}.');
   });

   it('reports an error if no source files included', () => {
      setup();
      ckThis.options.and.returnValue({
         propFiles: [ 'whatever' ],
      });
      mockGrunt.file.expand.and.returnValue([
         './test/test1.properties',
      ]);
      ckThis.filesSrc = [];

      expect(() => {
         ckThis.checkKeys();
      }).toThrowError('Must specify source files to examine.');
   });

   it('reports no errors when all keys used', () => {
      setup();
      ckThis.options.and.returnValue({
         propFiles: [ 'whatever' ],
      });
      mockGrunt.file.expand.and.returnValue([
         './test/test1.properties',
         './test/test2.properties',
      ]);
      ckThis.filesSrc = [
         './source/one.js',
         './source/two.js',
      ];

      expect(() => {
         ckThis.checkKeys();
      }).not.toThrow();
   });

   it('ignores a source file that no longer exists', () => {
      setup();
      ckThis.options.and.returnValue({
         propFiles: [ 'whatever' ],
      });
      mockGrunt.file.expand.and.returnValue([
         './test/test1.properties',
         './test/test2.properties',
      ]);
      ckThis.filesSrc = [
         './source/bogus.js',
         './source/one.js',
         './source/two.js',
      ];

      expect(() => {
         ckThis.checkKeys();
      }).not.toThrow();
   });

   it('ignores a property file that no longer exists', () => {
      setup();
      ckThis.options.and.returnValue({
         propFiles: [ 'whatever' ],
      });
      mockGrunt.file.expand.and.returnValue([
         './test/testBOGUS.properties',
         './test/test1.properties',
         './test/test2.properties',
      ]);
      ckThis.filesSrc = [
         './source/one.js',
         './source/two.js',
      ];

      expect(() => {
         ckThis.checkKeys();
      }).not.toThrow();
   });

   it('reports an error if a key is not being used', () => {
      setup();
      ckThis.options.and.returnValue({
         propFiles: [ 'whatever' ],
      });
      mockGrunt.file.expand.and.returnValue([
         './test/test1.properties',
         './test/test2.properties',
      ]);
      ckThis.filesSrc = [
         './source/one.js',
      ];

      expect(() => {
         ckThis.checkKeys();
      }).toThrowError('These keys from ./test/test1.properties are not being used: AAA\n' +
         'These keys from ./test/test2.properties are not being used: BBB');
   });

});
