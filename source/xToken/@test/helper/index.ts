function stripPTokens(items: Array<unknown> | unknown): Array<unknown> | unknown {
   if (Array.isArray(items)) {
      return items.map((item) => {
         if (typeof item === 'object' && item !== null && 'pToken' in item) {
            delete (item as { pToken: unknown }).pToken;
         }

         return item as unknown;
      });
   } else {
      delete (items as { pToken: unknown }).pToken;

      return items;
   }
}

export { stripPTokens };
