/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

type Handler = (param: object) => void;

class LoadingEmitter {
   private listeners: Array<Handler>;

   constructor() {
      this.listeners = [];
   }

   once(eventName: string, handler: Handler): void {
      this.listeners.push(handler);
   }

   emit(eventName: string, param: object): void {
      const onceListeners = this.listeners;
      this.listeners = [];

      for (const listener of onceListeners) {
         listener(param);
      }
   }
}

export { LoadingEmitter };
