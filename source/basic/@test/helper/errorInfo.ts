import { XmlErrorPosition } from '../../token/xmlErrorToken';

interface ErrorInfo {
   position: XmlErrorPosition;
   id: string;
   params?: ReadonlyArray<string>;
   lastPosition?: XmlErrorPosition;
}

export { ErrorInfo };
