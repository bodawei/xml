import SToken from './SToken';

function strOrBlank(sToken: SToken | void) {
   return sToken ? sToken.str : '';
}

export default strOrBlank;