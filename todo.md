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
