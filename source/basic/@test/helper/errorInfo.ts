import { XmlErrorPosition } from '../../error/XmlErrorToken';

interface ErrorInfo {
   position: XmlErrorPosition;
   id: string;
   params?: ReadonlyArray<string>;
   lastPosition?: XmlErrorPosition;
}

export { ErrorInfo };
