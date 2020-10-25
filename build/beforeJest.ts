console.json = function json() {
   if (arguments.length === 1) {
      console.debug(JSON.stringify(arguments[0], undefined, 3));
      return;
   }

   for (let index = 0; index < arguments.length; index++) {
      console.debug(`ARG ${index}: ${JSON.stringify(arguments[index], undefined, 3)}`);
   }
};

interface Console {
   json(...args: Array<any>): void;
}
