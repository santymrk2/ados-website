### Componente nuevo player
Eliminar el atributo apodo al agregar una nueva persona desde players list
quiero qeu el selector de varon mujer sea un tabs de los componentes de shadcn

### Componente invitaciones 
Rediseñá el componente de invitaciones priorizando claridad de la relación entre personas.
Concepto central
Cada invitación representa una relación direccional: "A invitó a B". El layout debe reflejar eso visualmente en una sola fila, no como dos campos independientes apilados. El usuario tiene que poder escanear todas las invitaciones de un vistazo y entender quién invitó a quién sin leer labels.
Estructura de cada fila
Una invitación = una fila horizontal con tres partes en línea: [quien invitó] → [invitado] [eliminar]. La flecha no es decorativa, es el elemento que comunica la dirección de la relación.
Selección
Cada parte de la fila es un trigger que abre un dropdown/popover de selección. Al seleccionar, el dropdown se cierra y la fila se actualiza mostrando el nombre (e iniciales si hay avatar). Solo un dropdown abierto a la vez.
Mobile
La fila no colapsa a layout vertical. Se mantiene horizontal pero los nombres se truncan con ellipsis. Lo importante es que la estructura [A → B] siga siendo legible en pantallas chicas. Si el espacio es muy reducido, se puede mostrar solo las iniciales en lugar del nombre completo, pero nunca romper la fila en dos líneas.
Estado vacío
Mensaje simple, sin invitaciones, con acción clara para agregar la primera.
Lo que se evita

Dos campos apilados que no comunican la relación entre sí
Labels genéricos como "campo 1" y "campo 2" sin contexto relacional
Cards individuales por invitación que consumen demasiado espacio vertical cuando hay varias


### Componente Goles:
Rediseñá el componente de goles manuales priorizando que cada entrada comunique su significado de forma inmediata.
Concepto central
Cada gol manual representa: "este jugador metió N goles de tipo X". Los tres datos (jugador, cantidad, deporte) tienen jerarquía distinta: el jugador es lo más importante, la cantidad es secundaria, el tipo es un clasificador. El layout debe reflejar esa jerarquía, no tratar los tres campos como iguales.
Estructura de cada fila
Una entrada = una fila horizontal. De izquierda a derecha: [selector de jugador, ocupa la mayor parte del ancho] [selector de tipo como pills o segmented control, no como dropdown] [stepper de cantidad +/−] [eliminar]. El tipo de deporte no merece un dropdown completo — son solo 3 opciones fijas, lo ideal es mostrarlas como opciones directamente visibles (pills, tabs chicos, o botones toggleables) para que el cambio sea un solo tap sin abrir ningún menú.
Cantidad
El campo cant existe en el modelo pero no tiene UI actualmente. Necesita un stepper simple (botón − | número | botón +) en lugar de un input de texto, ya que los valores típicos son bajos (1–5). El número debe ser siempre visible en la fila, no oculto.
Mobile
La fila se mantiene horizontal. El selector de jugador puede truncar el nombre con ellipsis. Las pills de tipo pueden mostrar solo la inicial del deporte (F / H / B) en pantallas chicas, con tooltip o label visible al seleccionar. El stepper no colapsa.
Estado vacío
Mensaje simple con acción clara para registrar el primer gol.
Lo que se evita

Usar un dropdown para elegir entre 3 opciones estáticas conocidas
Ocultar la cantidad o dejarla con valor fijo sin UI
Cards con demasiado padding para información tan compacta
