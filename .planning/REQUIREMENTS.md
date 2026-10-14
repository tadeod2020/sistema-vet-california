# Requisitos del Sistema - Servicio Veterinario California

## Requisitos Funcionales (RF)

### RF-01: Agenda por Bloques Horarios (Regla de 2 citas/hora)
- Visualización de agenda diaria y semanal por bloques de 1 hora (de 8:00 AM a 8:00 PM).
- Cada bloque tiene un tope estricto de **máximo 2 personas/citas por hora**.
- Si el bloque ya tiene 2 citas, el sistema inhabilita la adición o muestra advertencia clara de sobrecupo.
- Registro rápido de cita: Dueño/Mascota, motivo de visita, hora, estado (Pendiente, En Consulta, Completada, Cancelada).

### RF-02: Base de Datos de Clientes & Clientes Frecuentes
- Gestión de clientes con indicador de "Cliente Frecuente / Rescatista".
- Relación 1 a N: Un cliente puede tener múltiples mascotas asociadas.
- Datos de contacto: Nombre, teléfono, WhatsApp directo (con link `https://wa.me/`), notas.

### RF-03: Ficha de Mascotas
- Nombre, especie, raza, edad/fecha nacimiento, sexo, peso, color, antecedentes y alergias.
- Acceso directo desde la ficha a su historial de vacunas, cirugías y citas.

### RF-04: Módulo de Rescates (Animales sin nombre)
- Permite registrar ingresos sin nombre (código automático o descripción física: ej. "Mestizo macho color miel con pata vendada").
- Registro de rasgos físicos: color de pelaje, tamaño, señas particulares, lugar de rescate.
- Bitácora de intervenciones: fecha, qué se le realizó (limpieza de heridas, suero, analgésico, esterilización, etc.), medicamentos y estado actual.
- Estado del rescate: Crítico, En recuperación, Listo para adopción, Adoptado.

### RF-05: Bitácora de Cirugías
- Registro de procedimientos quirúrgicos (Esterilizaciones, Ovariohisterectomía, Profilaxis, Reducción de fracturas, Extracción de cuerpos extraños, etc.).
- Campos: Mascota/Rescate, Tipo de cirugía, Médico cirujano, Fecha y hora, Anestesia aplicada, Notas pre y post-quirúrgicas, Cuidados y medicación recomendada.
- Estatus: Programada, En recuperación, Dada de alta.

### RF-06: Cartilla de Vacunación & "Passport to Travel"
- Registro de vacunas: Rabia, Múltiple Canina (Séxtuple), Puppy, Bordetella, Desparasitaciones internas y externas.
- Vista de Certificado Oficial Bilingüe ("Passport to Travel") con diseño idéntico al carnet físico amarillo de Servicio Veterinario California (Tijuana-California), listo para imprimir o guardar.

## Requisitos No Funcionales (RNF)

### RNF-01: Estética y Experiencia "Apple-like"
- Interfaz limpia con cards pulidas, efectos de desenfoque (`backdrop-filter: blur()`), bordes sutiles, micro-interacciones suaves (`cubic-bezier`).
- Navegación fluida tipo tab/sidebar responsivo.
- Paleta fiel a la marca: Amarillo dorado oficial (`#FFD200`), Guinda vino (`#7A1416`), contrastes accesibles WCAG AA.

### RNF-02: Accesibilidad y Rendimiento
- HTML5 semántico (`<button>`, `<dialog>`, `<form>`, `<label>`).
- Manejo de teclado (`Tab`, `Esc` para modales).
- Respeta `prefers-reduced-motion`.

### RNF-03: Persistencia de Datos
- Almacenamiento instantáneo y persistente en el navegador con soporte de exportación/importación JSON para respaldos.
