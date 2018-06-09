declare module "readable-stream" {
   namespace stream {
      class Transform {
         constructor(params: Object);
         on(event: string, cb: Function): any;
         push(value: any): any;
         write(value: any): void;
         end(): void;
      }
   }
   export default stream;
}
