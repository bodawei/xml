import SToken from './SToken';

function strOrBlank(sToken: SToken | undefined): string {
   return sToken ? sToken.str : '';
}

export default strOrBlank;
