# La Reta

Monorepo turbo: `apps/la-reta-app` (Expo), `apps/la-reta-web` (Next.js), `packages/*` (dominio compartido).

Cada workspace tiene su propio `CLAUDE.md` con lo que hace falta saber **antes** de escribir código ahí. Léelo; no están de adorno: los dos frameworks son versiones con cambios de ruptura respecto a lo que sabes de memoria.

## Cómo se escribe aquí

- **YAGNI.** Se construye lo que se pidió. Ni un parámetro "por si acaso", ni una abstracción para un segundo caso que no existe, ni una opción configurable con un solo valor. Si aparece el segundo caso, se generaliza entonces.
- **La lógica de dominio vive en `packages/reta`** cuando la usan los dos clientes. Copiarla en cada app se rompe al primer cambio de regla, y el fallo sale en el teléfono de alguien, no al compilar. El repartidor de equipos, las posiciones, los equipos y el sorteo de casacas ya están ahí.
- **Los comentarios explican el porqué, no el qué.** El código dice lo que hace. Un comentario que lo repite envejece mal; uno que cuenta qué se probó antes y por qué no funcionó ahorra que el siguiente lo repita.
- **Nada de datos inventados.** Si un dato no está en la base, no se enseña una estimación con cara de dato. Antes va un hueco honesto que un número bonito.
- **Verifica antes de decir que funciona.** La app se prueba en el simulador y la web con `npm run build`. "Debería funcionar" no es una comprobación.

## Al terminar un cambio

Dos archivos se quedan viejos solos si nadie los toca, y los dos son el contexto del siguiente que llegue:

1. **`CHANGELOG.md`** si el cambio se nota al usar la app o la web. En "Sin publicar", marcado con 📱 / 🖥️ / 🌐 y contado para quien juega. Las instrucciones completas están en un comentario dentro del propio archivo. Un refactor o una poda no van ahí: eso es lo que cuenta el commit.
2. **El `CLAUDE.md` del workspace** si cambió algo estructural — una ruta nueva de `/api/v1`, una convención de navegación, una pieza de la interfaz que hay que reutilizar en vez de rehacer. La regla para saber si toca: _¿lo habría adivinado leyendo el código, o lo aprendí a base de romperlo?_ Lo segundo se escribe.

Y en el mensaje del commit va el porqué técnico: qué se probó, qué falló y por qué la solución es esa. Es lo único que sobrevive a que se pierda el hilo.

## Estándares de código

Lint y formato son Ultracite (ESLint + Prettier + Stylelint) desde la raíz. Sus reglas están en `.claude/CLAUDE.md` — léelas antes de escribir. `npm run check` verifica y `npm run fix` autocorrige.

`apps/la-reta-app` está fuera de Ultracite a propósito: React Native lo linta `expo lint` (eslint-config-expo) desde ese workspace, porque los autofixes agresivos de Ultracite llegaron a borrar componentes por creerlos sin uso.

El hook de pre-commit corre `lint-staged`. Si falla, se arregla lo que señala; `--no-verify` solo con permiso explícito y diciéndolo en el mensaje.

## Skills

Solo las que corresponden a este stack. Si una tarea necesita otra cosa, se añade entonces:

| Skill                           | Cuándo                             |
| ------------------------------- | ---------------------------------- |
| `clerk-nextjs-patterns`         | Auth en la web                     |
| `clerk-expo`                    | Auth en la app                     |
| `neon`, `neon-postgres`         | Base de datos                      |
| `vercel-optimize`               | Deploy y rendimiento en Vercel     |
| `vercel-react-native-skills`    | Rendimiento de la app              |
| `vercel-react-view-transitions` | Las view transitions de la web     |
| `changelog-generator`           | Notas de versión desde los commits |
