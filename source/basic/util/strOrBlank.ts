import { SToken } from '../sToken/sToken';

function strOrBlank(sToken: SToken | undefined): string {
   return sToken ? sToken.str : '';
}

export { strOrBlank };
