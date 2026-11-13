# Operación Extracción

Videojuego FPS 3D de supervivencia desarrollado con Three.js. El jugador debe avanzar por una ruta infestada, eliminar zombis, recoger suministros y entrar en la zona verde de extracción.

## Ejecutar

Abre la carpeta en Visual Studio Code y selecciona **Open with Live Server** sobre `index.html`. También puedes abrir una terminal en esta carpeta, ejecutar `node server.cjs` y navegar a `http://127.0.0.1:8000`. No abras `index.html` directamente desde el explorador de archivos, porque el navegador bloquea los módulos JavaScript.

Se necesita conexión a Internet para cargar Three.js desde jsDelivr y las fuentes de Google Fonts. Los modelos GLB del juego están incluidos en `assets/`.

## Controles

- `W`, `A`, `S`, `D`: desplazamiento en primera persona.
- Mouse: orientar la cámara.
- Clic izquierdo: un disparo por clic.
- `1` y `2`: seleccionar fusil M4 o escopeta.
- La misión comienza automáticamente al cargar la página. Arrastra el mouse para apuntar; el clic izquierdo dispara.

Las armas comienzan con munición limitada. Recoge las cajas iluminadas para reponer hasta 8 balas del fusil y 4 de la escopeta por caja, respetando la capacidad máxima de cada arma. Cada zombi requiere dos impactos válidos. Los enemigos se activan a 13 unidades de distancia, persiguen al jugador y causan daño al tocarlo.

## Implementación

- `main.js`: escena, cámara FPS, controles, raycasting, munición, IA de persecución, daño, suministros y extracción.
- `index.html` y `style.css`: HUD, pantallas de misión y presentación adaptable.
- `assets/free_ak47_gold.glb`, `assets/shotgun.glb`, `assets/zombie_walk_test.glb` y `assets/crying_head.glb`: modelos GLB proporcionados para el proyecto. `crying_head.glb` es una variante rápida con animaciones `IDLE` y `MOVE`; se activa al detectar al jugador y persigue a 2.5 unidades por segundo, frente a 1.15–1.5 de los zombis normales.

Los tres modelos 3D fueron proporcionados por el usuario. Three.js y las fuentes web se cargan desde los servicios indicados en el código y los estilos.

## Demostración

Para el video de sustentación (máximo 3 minutos), muestra el cambio de armas, los contadores y el consumo de munición, dos disparos para eliminar un zombi, la activación y persecución al acercarse, la recogida de suministros y la llegada a extracción. En una segunda pasada puedes demostrar Game Over al dejarte alcanzar.
