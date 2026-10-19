// Datos iniciales para Servicio Veterinario California (Tijuana, B.C.)

export const CLINIC_DOCTORS = [
  "Dra. María José Mendoza Gutiérrez",
  "Dr. Miguel Ángel Michel Rea",
  "Dr. José Rubén Estrada Hernández",
  "Dr. César Wilfredo Solórzano Hernández"
];

export const INITIAL_DATA = {
  // Base de datos limpia sin pacientes ni clientes de prueba
  clients: [],
  pets: [],
  appointments: [],
  rescues: [],
  surgeries: [],
  vaccinations: [],

  // Jaulas / Hospitalización listas y limpias para recibir pacientes
  cages: [
    {
      id: "cage-1",
      code: "J-01",
      name: "Jaula Grande 01",
      size: "Grande (Perros >25kg)",
      zone: "Hospitalización General",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-2",
      code: "J-02",
      name: "Jaula Mediana 02",
      size: "Mediana (Perros 10-25kg)",
      zone: "Hospitalización General",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-3",
      code: "J-03",
      name: "Jaula Mediana 03",
      size: "Mediana (Perros 10-25kg)",
      zone: "Área de Rescates",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-4",
      code: "J-04",
      name: "Jaula Chica 04",
      size: "Chica (Gatos / Perros pequeños)",
      zone: "Área de Rescates",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-5",
      code: "J-05",
      name: "Jaula Grande 05",
      size: "Grande (Perros >25kg)",
      zone: "Recuperación Quirófano",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-6",
      code: "J-06",
      name: "Jaula Mediana 06",
      size: "Mediana (Perros 10-25kg)",
      zone: "Recuperación Quirófano",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-7",
      code: "J-07",
      name: "Jaula Chica 07",
      size: "Chica (Gatos)",
      zone: "Hospitalización Felina",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    },
    {
      id: "cage-8",
      code: "J-08",
      name: "Jaula Aislamiento A-1",
      size: "Mediana",
      zone: "Aislamiento Infeccioso",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy"
    }
  ]
};
