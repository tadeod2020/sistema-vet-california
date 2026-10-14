# Proyecto: Sistema de Gestión - Servicio Veterinario California

## Visión
Aplicación web moderna, fluida y de alta calidad estética (estilo Apple: glassmorphism sutil, transiciones suaves, tipografía cuidada y micro-interacciones) para la gestión integral de la clínica **Servicio Veterinario California** en Tijuana, B.C., respetando su identidad visual oficial (Amarillo dorado `#FFD200` y Guinda/Vino tinto `#7A1416`).

## Identidad y Colores
- **Marca:** Servicio Veterinario California ("Todo para su mascota")
- **Ubicación:** Felipe Carrillo Puerto No. 7184, Local 1 (Calle Tercera), Zona Centro, Tijuana, B.C.
- **Teléfonos:** (664) 685-8512 | WhatsApp: (664) 394-9984
- **Paleta:**
  - Primario: Amarillo canario/dorado (`#FFD200` / `#F59E0B`)
  - Secundario / Acento de Autoridad: Guinda vino profundo (`#7A1416` / `#881337`)
  - Fondos / Superficies: Clean Apple Neutral (`#F8FAFC`, `#FFFFFF`, sutiles sombras `shadow-sm`, bordes `border-slate-200/80` y efectos de desenfoque `backdrop-blur-md`)

## Alcance Funcional
1. **Agenda con restricción de capacidad horaria:**
   - Máximo 2 citas simultáneas por cada bloque de 1 hora.
   - Indicador visual dinámico de cupo (Libre, 1 cupo restante, Lleno).
   - Control de estatus de cita y filtro por fecha.
2. **Directorio de Clientes Frecuentes y Mascotas:**
   - Soporte para clientes con múltiples mascotas (rescatistas, dueños frecuentes).
   - Ficha detallada de mascotas con antecedentes médicos.
3. **Módulo Especial de Rescates:**
   - Registro de perritos/gatitos sin nombre definido (identificación descriptiva: raza aparente, color, señas).
   - Bitácora de intervenciones clínicas recibidas (curaciones, tratamientos, desparasitación).
   - Estatus de rescate (En tratamiento, Listo para adopción, Adoptado).
4. **Registro y Control de Cirugías:**
   - Bitácora quirúrgica: Procedimiento, cirujano, fecha, tipo de anestesia, notas trans y post-operatorias, estado actual.
5. **Cartilla de Vacunación & "Passport to Travel":**
   - Registro formal de vacunas y desparasitaciones.
   - Modo de impresión / exportación bilingüe que replica el formato físico oficial de la cartilla amarilla para cruce fronterizo hacia California/EE.UU.
6. **Persistencia & Portabilidad:**
   - Almacenamiento local con datos iniciales realistas precargados y opción de exportar/importar respaldos JSON.
