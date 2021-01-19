import SToken from './SToken';

function strOrBlank(sToken: SToken | void): string {
   return sToken ? sToken.str : '';
}

export default strOrBlank;
