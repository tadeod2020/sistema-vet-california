# Hoja de Ruta (Roadmap) - Sistema Vet California

## Fases de Implementación

### Fase 1: Arquitectura Base y Diseño de Marca Apple-Style
- Scaffolding de Vite + React + Tailwind CSS + Lucide Icons.
- Configuración de tokens de diseño: Amarillo Dorado, Guinda Vino, efectos de Glassmorphism, modales y animaciones suaves.
- Estructura de almacenamiento centralizado (Estado reactivo + LocalStorage con exportación/importación JSON).
- Precarga de datos semilla realistas (clientes de Tijuana, mascotas, cirugías, rescates, citas).

### Fase 2: Módulos Clínicos y de Gestión
- **Agenda:** Vista por bloques de 1 hora con tope de 2 personas/hora, indicadores de capacidad y modal de agendamiento.
- **Clientes y Mascotas:** Directorio con filtro de "Clientes Frecuentes" (dueños de varias mascotas), gestión de fichas.
- **Módulo de Rescates:** Registro sin nombre, identificación física, bitácora cronológica de intervenciones clínicas y estatus de adopción.
- **Registro de Cirugías:** Historial quirúrgico, tipo de anestesia, notas trans y post-operatorias.
- **Cartilla de Vacunación & Passport to Travel:** Registro de vacunas y generador del carnet amarillo oficial bilingüe imprimible.

### Fase 3: Verificación, Detalle Estético y Pruebas
- Validación de límites de agenda (máximo 2 personas por hora).
- Prueba de flujo de rescates y cirugías.
- Verificación del diseño en dispositivos móviles y escritorio.
