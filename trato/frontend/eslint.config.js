// eslint-config-next 16 ya publica flat configs, así que se extienden directo.
// Pasarlas por FlatCompat revienta al validarlas contra el esquema viejo.
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypescript = require('eslint-config-next/typescript');

module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Todo el proyecto carga datos con useEffect + setState, que es lo que
      // esta regla persigue. La salida no es un disable por archivo sino mover
      // esas cargas a react-query (ya está en las dependencias, sin usar).
      // Mientras eso no pase queda como aviso, para que el resto del lint sirva.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
