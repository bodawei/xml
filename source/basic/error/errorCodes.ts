interface ErrorCodeMap {
   [errorId: string]: {
      code: number;
      message: string;
   };
}

const BRACES = /\{([{}])\}/g;

// If we find {{} (a { inside of {}'s) or {}}, remove the
// escaping outer braces
function unescapeBraces(message = ''): string {
   // interestingly, this is usually much faster than 2 replaces.
   return message.replace(BRACES, '$1');
}

class ErrorCodes {
   public code: Record<string, number>;

   public id: Record<string, string>;

   private mapping: ErrorCodeMap;

   constructor(mapping: ErrorCodeMap) {
      this.mapping = {};
      this.code = {};
      this.id = {};

      this.addMapping(mapping);
   }

   public addMapping(mapping: ErrorCodeMap): void {
      for (const key of Object.keys(mapping)) {
         // Validate no duplication
         this.id[key] = key;
         this.code[key] = mapping[key].code;
         this.mapping[key] = mapping[key];
      }
   }

   public codeFor(id: string): number {
      return this.code[id];
   }

   public messageTemplateFor(id: string): string | undefined {
      return this.mapping[id].message;
   }

   public messageFor(
      id: string,
      params: ReadonlyArray<string | number | boolean> | undefined,
   ): string {
      let message = this.mapping[id].message;

      if (params && message) {
         const paramsArray = Array.isArray(params) ? params : [params];

         for (let index = 0; index < paramsArray.length; index++) {
            message = message.replace(`{${index}}`, paramsArray[index]);
         }
      }

      return unescapeBraces(message);
   }
}

export { ErrorCodes };
