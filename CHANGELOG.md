# Novedades de La Reta

Lo que va cambiando en la app y en la web, contado para quien juega.

<!--
Cómo se escribe esto (para quien lo mantenga, humano o agente):

- **Para quien juega, no para quien programa.** "La reta con menos goles no
  aparecía en la gráfica", no "el dominio del eje se ajustaba al mínimo". El
  porqué técnico va en el mensaje del commit, que es donde se busca.
- **Solo lo que se nota al usar la app o la web.** Un refactor, una poda de
  dependencias o un cambio de lint no entran: si nadie lo ve, no es una novedad.
- **Marcado por dónde se ve**, que es lo que un monorepo necesita: 📱 la app,
  🖥️ la web, 🌐 las dos. Sin eso, quien lee no sabe si tiene que actualizar.
- Se acumula en "Sin publicar" y se baja entero a una versión al publicar.
- Categorías: ✨ Nuevo · 🔧 Mejoras · 🐛 Correcciones. Nada más; si algo no cabe
  en las tres, casi siempre es que no era para aquí.
-->

## Sin publicar — septiembre 2026

### ✨ Nuevo

- 📱 **Las casacas se sortean desde el teléfono.** Ruleta con todos los de la plantilla, con la misma regla de siempre: quien lavó las dos últimas retas queda en descanso y sale en gris. Gira con el pulgar y hace tic cada vez que pasa un nombre. A diferencia de la web, **el turno no se guarda solo**: sale el elegido y tú confirmas — en la cancha pasa a menudo que el que salió ya se fue, y volver a girar tiene que costar un toque. Debajo, a quién le ha tocado y cuándo.

- 📱 **Registro de retas.** Todo lo que ha ido repartiendo el generador, en gráficas: qué tan parejas van saliendo las retas, con cuántos equipos se juega normalmente, quién sale más convocado y qué parejas siempre caen en el mismo equipo. Se abre desde el carrusel de Inicio y desde _Armar reta_.

- 🖥️ **Buscador del menú con ⌘K.** El menú de la web tiene catorce sitios a los que ir y encontrar el que quieres a ojo cuesta. Pulsa ⌘K (Ctrl+K en Windows) o toca _Buscar…_ arriba del menú, escribe dos letras y entra. Busca también por lo que hace cada página: "roster" lleva a Jugadores, "ruleta" a Casacas.

### 🔧 Mejoras

- 🖥️ **El menú se queda como lo dejaste.** Si lo plegabas para ganar pantalla, volvía a abrirse solo en cuanto recargabas. Ahora recuerda cómo lo dejaste. También se pliega arrastrando su borde, no solo desde el botón.

- 🖥️ **El menú deja de estar siempre abierto del todo.** Las páginas de dentro de _Jugadores_ y de _Armar equipos_ ocupaban sitio permanentemente aunque anduvieras en otra parte; ahora se despliegan solas cuando entras en esa sección y se pliegan al salir. Y plegado a iconos aparece un punto verde sobre _En vivo_ cuando hay partido: antes, en esa vista, no había forma de enterarse.

- 🖥️ **Tu cuenta vive al pie del menú**, con tu foto y tu correo, y desde ahí administras la cuenta o cierras sesión. Arriba solo quedan _iniciar sesión_ y _crear cuenta_, que son lo único que hace falta ver antes de entrar.

- 🖥️ **Cambiar dos jugadores de equipo ya no pide ratón.** En la cancha de _Armar equipos_ podías arrastrar una ficha sobre otra y nada más — sin ratón, o con el teclado, no había manera. Ahora tocas una ficha, tocas la otra y se cambian. Arrastrar sigue funcionando igual.

- 🖥️ **El marcador en vivo ya respeta el tema claro.** Era una tarjeta negra pasara lo que pasara: si tenías la app en claro, en medio de la pantalla blanca había un rectángulo oscuro que no pegaba con nada. Ahora es una tarjeta como las demás y cambia con el tema, con el color de cada equipo ajustado para que se lea bien sobre fondo claro y sobre fondo oscuro.

- 🖥️ **La reta en vivo se guarda una sola vez, y ya no como si fueran ocho partidos.** Con tres o más equipos había un botón _Guardar y siguiente_ que cerraba un partido cada vez que cambiaba la pareja en la cancha: el registro terminaba lleno de filas de cero minutos y marcadores 0-0 que no eran partidos de nada. Ya no está. Ahora el marcador enseña **un botón por equipo, todos a la vez**: da igual quién esté jugando contra quién, cuando alguien anota tocas el de su equipo. Al final, _Finalizar_ guarda la reta entera en un solo registro con los goles de cada quien. Si tenías una reta a medias, sigue ahí donde la dejaste.

- 🖥️ **Ahora se ve quién anotó, no solo cómo se llama.** Al apuntar un gol salía una lista de nombres a secas: si el que la metió era el primo de alguien, o dos se llamaban parecido, no había forma de saber a quién estabas marcando. Ahora cada uno viene con su foto, su posición y su overall, agrupados por línea, y se busca por nombre **o por apodo** —y sin tener que poner los acentos—. Los que ya anotaron en ese partido salen arriba del todo, porque casi siempre repiten.

- 🖥️ **La lista de goleadores dejó de parpadear.** Al recorrerla con el cursor, media lista se quedaba a medio dibujar —tarjetas vacías con solo el círculo de la foto— y volvía a aparecer sola. Ya se ve completa y estable. De paso, los jugadores marcados en verde ya no pierden el color al pasar el ratón por encima: ahora se intensifica en vez de apagarse.

- 🖥️ **Los delanteros ya no están hasta abajo al elegir goleador.** La lista salía en orden de alineación —portero primero, delanteros al final—, justo al revés de lo que hace falta: quien más anota quedaba fuera de la pantalla. Ahora empieza por los delanteros. Y a los que ya anotaron en la reta se les nota de un vistazo, con un contorno verde punteado y su número de goles, tanto arriba como dentro de su línea.

- 🖥️ **Y si de verdad nadie vio quién fue, se puede decir.** Abajo, siempre a la vista, está _No sé quién fue_: el gol cuenta igual, queda marcado en ámbar en el marcador y en el registro, y se le pone nombre cuando alguien se acuerde. Antes esa opción era un botón más perdido entre veinte nombres.

- 🖥️ **El marcador en vivo, rehecho para el teléfono.** Es donde se usa —de pie, en la banda, con una mano—, así que los dos botones de gol ahora caben juntos sin bajar la pantalla y se hunden al tocarlos, el marcador da un salto cada vez que sube, los goleadores aparecen con su cara junto a cada equipo y el registro dice de qué equipo fue cada gol con el color alrededor de la foto. Al elegir goleador, la lista ocupa la pantalla entera y el buscador ya no abre el teclado solo en el móvil, que tapaba justo lo que ibas a mirar. En tablet y computadora todo sigue centrado y en dos columnas en vez de estirarse de lado a lado.

- 🖥️ **El marcador en vivo dejó de dar saltos.** Al pulsar _Iniciar partido_, el formulario se apartaba y el marcador aparecía de golpe, sin nada que dijera que era la misma pantalla. Ahora uno cede el sitio al otro. Y al cambiar a 3, 4 o más equipos, la tarjeta nueva entra creciendo, la marca del número seleccionado se desliza hasta él y los botones de abajo bajan acompañando en vez de brincar.

- 🖥️ **La web va mucho más ligera.** Las fotos se estaban descargando a tamaño completo aunque se pintaran del tamaño de una moneda: la pantalla de un partido llegaba a ocupar 93 MB de memoria solo en imágenes, y por eso el navegador se atascaba al desplazarse, sobre todo en el teléfono. Ahora cada foto se pide al tamaño en que de verdad se ve —esa misma pantalla ocupa 3,6 MB— y las cartas de la galería se cargan según vas bajando. Nada cambia de aspecto; solo deja de pesar.

### 🐛 Correcciones

- 🌐 **Volver a poder apuntarse a la reta.** Mandar la solicitud fallaba —en la web y en la app— y el panel de solicitudes del admin no abría. Las cinco que ya estaban enviadas seguían guardadas; solo no había manera de verlas ni de añadir una nueva. Ya funcionan las dos cosas.

---

## Publicado — septiembre 2026

### ✨ Nuevo

- 📱 **Tu ficha ahora cuenta tu historia.** Entra a cualquier jugador y verás su palmarés —figuras, golazos, bloopers y las veces que le tocó lavar las casacas—, su balance de partidos con los últimos resultados, con quién suele jugar y cuántas ganan juntos. Todo estaba en la base desde hace meses; hasta ahora no se veía.

- 📱 **Cómo ha evolucionado cada jugador.** Una gráfica con su overall a lo largo del tiempo y, debajo, el diario de cada ajuste: qué atributo subió o bajó y cuánto. Se acabó el "a mí me bajaron el tiro y no me di cuenta".

- 📱 **Reseñas.** Ponle nota de una a cinco estrellas a cualquiera y deja tu comentario. La media sale bajo su carta. Puedes corregir lo que escribiste cuando quieras — y no, no puedes reseñarte a ti mismo.

- 📱 **Análisis del partido.** Al final de cada partido: el reparto de goles por equipo, cómo de parejo quedó, quién estuvo metido en los goles, el perfil de cada equipo en un hexágono comparado y una cuadrícula con las líneas que cubría cada uno — que suele explicar las palizas mejor que el marcador.

- 📱 **Toca a cualquiera y salta a su ficha.** Desde los goleadores, desde los premiados, desde tus compañeros habituales.

- 📱 **Guarda tu foto de perfil** antes de quitarla, con el botón de descarga.

### 🔧 Mejoras

- 📱 **Editar tu ficha pide la fecha de nacimiento**, no los años. Tu edad se actualiza sola cada cumpleaños.
- 📱 **Quitar tu foto ahora pregunta antes**, con el botón en rojo.
- 📱 La lista de goleadores del partido va en dos columnas: los tres equipos caben en una pantalla.
- 📱 Los premios del partido se ven en fila, con un aro alrededor de la cara que muestra qué parte de los votos se llevó cada uno.
- 📱 Al publicar una reseña se cierra el teclado. Esto no es un chat.

### 🐛 Correcciones

- 📱 **La reta con menos goles no aparecía en la gráfica de la portada.** El eje empezaba en el mínimo en vez de en cero, así que esa barra medía cero y las demás mentían sobre su tamaño. Ahora las cinco jornadas se ven en proporción.
- 📱 Editar tu ficha borraba tu fecha de nacimiento al guardar.
- 📱 La foto de perfil no se veía en el formulario de edición.

### ✨ Nuevo en la web

- 🖥️ Portada con movimiento: el ranking resalta la fila apuntada, las cifras cuentan hacia arriba y hay un panel de comentarista.
- 🖥️ Detalle de partido rehecho: podio de goleadores con oro, plata y bronce, reparto de goles, alineación por equipo con las líneas coloreadas y la ficha de cada jugador al pasar el ratón.

---

<!--
Este archivo arranca aquí a propósito. Antes de esta entrada el repo no tenía
changelog ni etiquetas de versión, y escribir las notas de los commits
anteriores solo a partir de su mensaje habría sido inventar detalle. A partir
de ahora, una entrada por release.
-->
