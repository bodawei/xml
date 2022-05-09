interface ErrorCodeMap {
   [errorId: string]:
      | undefined
      | {
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
   public id: Record<string, string>;

   private code: Record<string, number | undefined>;

   private mapping: ErrorCodeMap;

   constructor(mapping: ErrorCodeMap) {
      this.mapping = {};
      this.code = {};
      this.id = {};

      this.addMapping(mapping);
   }

   public addMapping(mapping: ErrorCodeMap): void {
      for (const key of Object.keys(mapping)) {
         this.id[key] = key;
         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- always defined since we just got key from this
         this.code[key] = mapping[key]!.code;
         this.mapping[key] = mapping[key];
      }
   }

   public codeFor(id: string): number {
      return this.code[id] ?? 0;
   }

   public messageTemplateFor(id: string): string | undefined {
      return this.mapping[id]?.message ?? '';
   }

   public messageFor(
      id: string,
      params: ReadonlyArray<string | number | boolean> | undefined,
   ): string {
      let message = this.mapping[id]?.message;

      if (params && message) {
         for (let index = 0; index < params.length; index++) {
            message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(params[index]));
         }
      }

      return unescapeBraces(message);
   }
}

export { ErrorCodes };
