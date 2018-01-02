/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
 StringBundle is a simple wrapper around a set of localized strings.
 The strings it is started with should have the form:
   {
      local-name: {
         key: string,
         ...
      },
      ...
   }
 Where there must be a locale called "base", and other locales are in
 the form en-US etc (see https://developer.mozilla.org/en-US/docs/Web/
 JavaScript/Reference/Global_Objects/Intl#Locale_negotiation for more
 inforamtion).

 The lookup routines that this provides will try to use the preferred
 locale, and when that doesn't work try to look up the string in the
 base locale.
\**********************************************************************/

class StringBundle {

   constructor(strings) {
      if (!(strings instanceof Object)) {
         throw new Error('Must pass an object containing locales and messages.');
      }
      if (!strings.base || !(strings.base instanceof Object)) {
         throw new Error('Strings must at least have a locale called "base", with an object value.');
      }

      this._strings = strings;
      this.preferredLocale = 'en-US';
   }

   /**********************************************************************\
    lookup() looks up the string message for the specified key.
    If the locales argument is specified, that value will be used, or if
    it is an array, each value in turn will be examined. Otherwise
    the preferredLocale will be used.

    This does not try to reduce a locale. That is, if zh-TW is used, and
    there is no zh-TW, this does not currently try to look up zh.

    PARAM
    key: The key to look up.
    locales: Optional. A locale identifier (e.g. zh-TW) or an array of them.

    RETURN
    A string, or undefined if no relevant string can be found.
   \**********************************************************************/

   lookup(key, locales) {
      if (typeof key !== 'string') {
         throw new Error('Must pass a string key to look up.');
      }

      let locale;

      if (locales) {
         if (!Array.isArray(locales)) {
            locales = [ locales ];
         }

         for (let index = 0; index < locales.length; index++) {
            locale = this._strings[locales[index]];
            if (locale) {
               const value = locale[key];

               if (value) {
                  return value;
               }
            }
         }
      }

      locale = this._strings[this.preferredLocale];

      if (locale && locale[key]) {
         return locale[key];
      }

      return this._strings.base[key];
   }

   /**********************************************************************\
    substitute() is idential to lookup(), except that if a value is found,
    then placeholders in the string (e.g. {0}) are replaced with the
    params, in the order they are specified.

    You can also use {0:key} in which case the parameter will be used as
    a key to look up a value in the string catalog. This is useful for
    parameterizing a string with another string that should also be
    internationalized.

    Finally, you can use the strings {{} and {}} to escape a curly brace
    that you might want to use.

    PARAM
    key: The key to look up.
    params: Optional. A single value, or an array of values to be
      substituted into the string.
    locales: Optional. A locale identifier (e.g. zh-TW) or an array of them.

    RETURN
    A string, or undefined if no relevant string can be found.
   \**********************************************************************/

   substitute(key, params, locales) {
      let message = this.lookup(key, locales);

      if (!params || !message) {
         return message ? unescapeBraces(message) : undefined;
      }

      if (!Array.isArray(params)) {
         params = [ params ];
      }

      for (let index = 0; index < params.length; index++) {
         // jsperf says this is faster than just doing the two replaces
         if (message.indexOf('{' + index + ':key}') !== -1) {
            const substitute = this.lookup(params[index], locales);
            message = message.replace('{' + index + ':key}', substitute);
         } else {
            message = message.replace('{' + index + '}', params[index]);
         }
      }

      return unescapeBraces(message);
   }

   /**********************************************************************\
    addLocale() Adds strings for a locale. Will replace any existing
    data for that locale

    PARAM
    localeName: the name of the locale.
    localeStrings: An object of locale strings.  It need not have all
      the keys.  The base local will be used if that string is not present.

    RETURN
    None
   \**********************************************************************/

   addLocale(localeName, localeStrings) {
      if (typeof localeName !== 'string') {
         throw new Error('Must pass in the name of a locale.');
      }
      const type = typeof localeStrings; // do this separately to help code coverage!
      if (type !== 'object') {
         throw new Error('Must pass an object of key/strings.');
      }

      this._strings[localeName] = localeStrings;
   }

   /**********************************************************************\
    removeLocale() Removes and returns any strings for the specified locale

    PARAM
    localeName: the name of the locale.

    RETURN
    The strings for that locale
   \**********************************************************************/

   removeLocale(localeName) {
      if (typeof localeName !== 'string') {
         throw new Error('Must pass in the name of a locale.');
      }

      const temp = this._strings[localeName];
      delete this._strings[localeName];

      return temp;
   }
}

const BRACES = /\{([{}])\}/g;

function unescapeBraces(message) {
   // interestingly, this is usually much faster than 2 replaces.
   return message.replace(BRACES, '$1');
}

export default StringBundle;
