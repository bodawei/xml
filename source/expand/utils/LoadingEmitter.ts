/* Copyright ® 2020 by 柏大衛. All rights reserved. */

type Handler = () => void;

class LoadingEmitter {
   private listeners: Array<Handler>;
 
   constructor() {
      this.listeners = [];
   }

   once(eventName: string, handler: Handler) {
      this.listeners.push(handler);
   }

   emit(eventName: string) {
      const onceListeners = this.listeners;
      this.listeners = [];

      for (let listener of onceListeners) {
         listener();
      }
   }
}

export {
   LoadingEmitter,
}
