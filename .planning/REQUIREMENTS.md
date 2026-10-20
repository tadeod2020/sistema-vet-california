# Requisitos del Sistema - Servicio Veterinario California

## Requisitos Funcionales (RF)

### RF-01: Agenda por Bloques Horarios (Edición de Citas y Soporte Multi-Mascota)
- Visualización de agenda diaria por bloques de 1 hora (de 8:00 AM a 7:00 PM).
- Soporte para registrar **2 o más perros/mascotas dentro de una misma cita** o múltiples citas dentro de un mismo bloque horario.
- **Edición completa de citas médicas**: cambio de fecha, hora, dueño, lista de perros/mascotas, motivo de visita, veterinario asignado y estado.
- Registro rápido de cita: Dueño/Mascotas, motivo de visita, hora, estado (Pendiente, En Espera, En Consulta, Completada, Cancelada).

### RF-02: Base de Datos de Clientes & Clientes Frecuentes
- Gestión de clientes con indicador de "Cliente Frecuente / Rescatista".
- Relación 1 a N: Un cliente puede tener múltiples mascotas asociadas.
- Datos de contacto: Nombre, teléfono, WhatsApp directo (con link `https://wa.me/`), notas.

### RF-03: Ficha de Mascotas y Edición de Datos
- Nombre, especie, raza, edad (con soporte para **meses** o **años**), sexo, peso, color, microchip, antecedentes y alergias.
- **Edición completa de la información de la mascota** (desde el directorio de mascotas, lista por propietario, expediente clínico digital y cartilla oficial), incluyendo actualización sincronizada de datos del propietario y vacunas.
- Acceso directo desde la ficha a su historial de vacunas, cirugías y citas.

### RF-04: Módulo de Rescates (Animales sin nombre)
- Permite registrar ingresos sin nombre (código automático o descripción física: ej. "Mestizo macho color miel con pata vendada").
- Registro de rasgos físicos: color de pelaje, tamaño, señas particulares, lugar de rescate.
- Bitácora de intervenciones: fecha, qué se le realizó (limpieza de heridas, suero, analgésico, esterilización, etc.), medicamentos y estado actual.
- Estado del rescate: Crítico, En recuperación, Listo para adopción, Adoptado.

### RF-05: Bitácora de Cirugías y Procedimientos Complementarios
- Registro y edición de procedimientos quirúrgicos (Esterilizaciones, Ovariohisterectomía, Profilaxis, Reducción de fracturas, Extracción de cuerpos extraños, etc.).
- **Soporte para múltiples procedimientos adicionales en la misma cirugía** (vacunas como Rabia, Séxtuple, Bordetella, Triple Felina, desparasitaciones, microchip, profilaxis dental, corte de uñas, o cualquier procedimiento personalizado), con registro automático opcional de vacunas en la Cartilla Oficial.
- Campos: Mascota/Rescate, Tipo de cirugía, Procedimientos adicionales, Médico cirujano, Fecha y hora, Anestesia aplicada, Notas pre y post-quirúrgicas, Cuidados y medicación recomendada.
- Estatus: Programada, En Quirófano, En Recuperación, Alta Médica.

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

### RNF-03: Persistencia de Datos y Nube Supabase
- Sincronización bidireccional automática en tiempo real con **Supabase Cloud** (`clients`, `pets`, `appointments`, `cages`, `rescues`, `surgeries`, `vaccinations`) más respaldo local instantáneo y exportación/importación JSON.
