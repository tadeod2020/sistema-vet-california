// Datos iniciales realistas para Servicio Veterinario California (Tijuana, B.C.)

export const INITIAL_DATA = {
  // Clientes y dueños (incluyendo clientes frecuentes con múltiples mascotas y rescatistas)
  clients: [
    {
      id: "cli-1",
      name: "Carmen Villalobos",
      phone: "(664) 555-1284",
      whatsapp: "5216645551284",
      email: "carmen.rescates@gmail.com",
      address: "Col. Cacho, Tijuana, B.C.",
      isFrequent: true,
      tag: "Rescatista Independiente",
      notes: "Trae frecuentemente perros de la calle para rehabilitar y vacunar."
    },
    {
      id: "cli-2",
      name: "Lic. Carlos Mendoza",
      phone: "(664) 345-9921",
      whatsapp: "5216643459921",
      email: "carlos.mendoza@bufete.com",
      address: "Zona Río, Tijuana, B.C.",
      isFrequent: true,
      tag: "Cliente Frecuente (Viaja a San Diego)",
      notes: "Requiere siempre su Passport to Travel sellado y al día para cruce por San Ysidro."
    },
    {
      id: "cli-3",
      name: "Dra. Elena Ortiz",
      phone: "(664) 712-4091",
      whatsapp: "5216647124091",
      email: "elena.ortiz@uabc.edu.mx",
      address: "Playas de Tijuana, B.C.",
      isFrequent: false,
      tag: "Cliente Regular",
      notes: "Atención preventiva semestral."
    },
    {
      id: "cli-4",
      name: "Marcos Sandoval",
      phone: "(664) 489-3320",
      whatsapp: "5216644893320",
      email: "marcos_sandoval@outlook.com",
      address: "Calle 4ta y Mutualismo, Zona Centro, Tijuana",
      isFrequent: true,
      tag: "Vecino Zona Centro / Frecuente",
      notes: "Compra frecuentemente en Granero California."
    }
  ],

  // Mascotas registradas
  pets: [
    {
      id: "pet-1",
      clientId: "cli-1",
      name: "Canela",
      species: "Canino",
      breed: "Mestizo",
      ageYears: 3,
      sex: "Hembra (Esterilizada)",
      weightKg: 14.5,
      color: "Canela dorado con pecho blanco",
      allergies: "Ninguna conocida",
      microchip: "985141004829103",
      notes: "Rescatada hace 2 años en Otay, muy dócil."
    },
    {
      id: "pet-2",
      clientId: "cli-1",
      name: "Capitán",
      species: "Canino",
      breed: "Pastor Alemán Mix",
      ageYears: 1,
      sex: "Macho",
      weightKg: 24.0,
      color: "Negro con manto fuego",
      allergies: "Sensibilidad estomacal a granos",
      microchip: "985141004829104",
      notes: "En entrenamiento."
    },
    {
      id: "pet-3",
      clientId: "cli-2",
      name: "Thor",
      species: "Canino",
      breed: "Golden Retriever",
      ageYears: 4,
      sex: "Macho",
      weightKg: 31.8,
      color: "Dorado claro",
      allergies: "Alergia a piquete de pulga",
      microchip: "985141003719001",
      notes: "Cruza frecuentemente a EE.UU., vacunas de Rabia al día."
    },
    {
      id: "pet-4",
      clientId: "cli-2",
      name: "Bella",
      species: "Felino",
      breed: "Siamés",
      ageYears: 2,
      sex: "Hembra",
      weightKg: 4.2,
      color: "Fawn point",
      allergies: "Ninguna",
      microchip: "",
      notes: "Gata de departamento."
    },
    {
      id: "pet-5",
      clientId: "cli-3",
      name: "Rocky",
      species: "Canino",
      breed: "Bulldog Francés",
      ageYears: 3,
      sex: "Macho",
      weightKg: 12.0,
      color: "Atigrado",
      allergies: "Dermatitis atópica",
      microchip: "985141009988221",
      notes: "Revisión constante de vías respiratorias."
    }
  ],

  // Citas (Agenda con tope de 2 personas por hora)
  appointments: [
    {
      id: "apt-1",
      date: new Date().toISOString().split('T')[0], // Hoy
      timeHour: "09:00",
      clientName: "Lic. Carlos Mendoza",
      petName: "Thor (Golden)",
      reason: "Certificado de Viaje (Passport to Travel) y refuerzo de Rabia",
      status: "Completada", // Pendiente, En Espera, En Consulta, Completada, Cancelada
      assignedVet: "Médico Veterinario de Guardia",
      slotIndex: 1 // slot 1 de 2
    },
    {
      id: "apt-2",
      date: new Date().toISOString().split('T')[0],
      timeHour: "09:00",
      clientName: "Carmen Villalobos",
      petName: "Canela (Mestizo)",
      reason: "Revisión post-operatoria de esterilización",
      status: "Completada",
      assignedVet: "Personal Clínico California",
      slotIndex: 2 // slot 2 de 2 -> ¡HORA LLENA!
    },
    {
      id: "apt-3",
      date: new Date().toISOString().split('T')[0],
      timeHour: "11:00",
      clientName: "Dra. Elena Ortiz",
      petName: "Rocky (Bulldog Francés)",
      reason: "Limpieza de oídos y vacuna Bordetella anual",
      status: "En Espera",
      assignedVet: "Médico Veterinario de Guardia",
      slotIndex: 1
    },
    {
      id: "apt-4",
      date: new Date().toISOString().split('T')[0],
      timeHour: "12:00",
      clientName: "Marcos Sandoval",
      petName: "Pelusa (Poodle)",
      reason: "Chequeo general y desparasitación externa (Bravecto)",
      status: "Pendiente",
      assignedVet: "Personal Clínico California",
      slotIndex: 1
    },
    {
      id: "apt-5",
      date: new Date().toISOString().split('T')[0],
      timeHour: "15:00",
      clientName: "Rescate #102 - Calle Tercera",
      petName: "Perrito atropellado sin nombre",
      reason: "Curación de emergencia y vendaje",
      status: "Pendiente",
      assignedVet: "Médico Veterinario de Guardia",
      slotIndex: 1
    }
  ],

  // Apartado especial de Rescates (sin nombre obligatorio, descripción física e intervenciones)
  rescues: [
    {
      id: "resc-1",
      code: "RES-2026-001",
      physicalDescription: "Perro mestizo tipo Criollo/Pastor, aprox 2 años. Pelaje corto color miel claro con calcetines blancos en las 4 patas y orejas caídas. Peso aproximado 16 kg.",
      rescueLocation: "Encontrado en Calle Tercera y Mutualismo (Zona Centro, frente al Granero)",
      intakeDate: "2026-10-10",
      rescuerName: "Carmen Villalobos",
      healthStatus: "En recuperación", // Crítico, En tratamiento, En recuperación, Listo para adopción, Adoptado
      temperament: "Tímido al inicio, responde bien a premios, cero agresividad.",
      interventions: [
        {
          date: "2026-10-10 10:30",
          type: "Ingreso & Urgencia",
          description: "Limpieza de herida lacerante en cojinete delantero derecho. Se aplicó anestésico local, lavado con clorhexidina al 2% y vendaje acolchado.",
          vet: "Médico Veterinario de Guardia",
          meds: "Cefalexina 500mg c/12h por 7 días, Meloxicam 1ml oral c/24h por 3 días."
        },
        {
          date: "2026-10-12 16:00",
          type: "Desparasitación & Análisis",
          description: "Prueba rápida 4Dx negativa a erliquia y anaplasma. Desparasitación interna con Endovet.",
          vet: "Personal Clínico California",
          meds: "Pipeta antipulgas Fipronil."
        },
        {
          date: "2026-10-14 09:15",
          type: "Revisión de herida",
          description: "Excelente cicatrización en cojinete. Retiro de vendaje, se deja expuesto con spray antiséptico cicatrizante.",
          vet: "Médico Veterinario de Guardia",
          meds: "Fin de antibioterapia en 3 días."
        }
      ]
    },
    {
      id: "resc-2",
      code: "RES-2026-002",
      physicalDescription: "Cachorro macho aprox 4 meses, tipo Terrier mestizo. Color negro azabache con manchita blanca en pecho y barbilla. Pelo áspero y alambre.",
      rescueLocation: "Abandonado en caja cerca del Mercado Hidalgo, Zona Río",
      intakeDate: "2026-10-13",
      rescuerName: "Anónimo (Entregado en clínica)",
      healthStatus: "Listo para adopción",
      temperament: "Muy juguetón, activo y sociable con otros cachorros.",
      interventions: [
        {
          date: "2026-10-13 14:00",
          type: "Evaluación General & Desparasitación",
          description: "Temperatura 38.5°C normal, mucosas rosadas. Leve deshidratación revertida con suero oral. Baño medicado antipulgas.",
          vet: "Personal Clínico California",
          meds: "Drontal Puppy 1ml."
        },
        {
          date: "2026-10-14 11:00",
          type: "Vacunación Inicial",
          description: "Aplicación de primera vacuna Puppy DP (Distemper y Parvovirus). Se emitió carnet preliminar.",
          vet: "Médico Veterinario de Guardia",
          meds: "Próximo refuerzo en 21 días."
        }
      ]
    }
  ],

  // Registro de Cirugías
  surgeries: [
    {
      id: "surg-1",
      patientName: "Thor",
      patientType: "Mascota con dueño", // Mascota con dueño | Rescate
      ownerName: "Lic. Carlos Mendoza",
      procedure: "Profilaxis Dental Ultrasonica y Extracción de Premolar 104",
      surgeon: "Médico Veterinario de Guardia",
      anesthetist: "Personal Clínico California",
      date: "2026-10-08",
      anesthesiaType: "Inhalatoria (Isoflurano) + Premedicación Xilacina/Tramadol",
      preOpNotes: "Hemograma y química sanguínea de 6 elementos dentro de rangos normales. Ayuno de 10 horas confirmado.",
      intraOpNotes: "Remoción de sarro grado 3 con ultrasonido, pulido de esmalte con pasta fluorada. Extracción simple de pieza con reabsorción ósea sin sangrado excesivo.",
      postOpNotes: "Recuperación anestésica estable en 45 minutos. Dieta blanda por 4 días.",
      status: "Alta Médica" // Programada, En Quirófano, En Recuperación, Alta Médica
    },
    {
      id: "surg-2",
      patientName: "Canela",
      patientType: "Mascota con dueño",
      ownerName: "Carmen Villalobos",
      procedure: "Ovariohisterectomía (Esterilización Preventiva)",
      surgeon: "Personal Clínico California",
      anesthetist: "Médico Veterinario de Guardia",
      date: "2026-10-09",
      anesthesiaType: "General Intravenosa (Tiletamina-Zolazepam) y Atropina",
      preOpNotes: "Paciente en condición corporal óptima 3/5, sin antecedentes de coagulopatía.",
      intraOpNotes: "Incisión retro-umbilical de 3 cm. Ligadura de pedículos ováricos y muñón uterino con sutura absorbible Vicryl 2-0. Cierre de planos por capas con sutura intradérmica.",
      postOpNotes: "Uso obligatorio de cono isabelino por 10 días. Retiro de puntos innecesario por sutura absorbible.",
      status: "Alta Médica"
    },
    {
      id: "surg-3",
      patientName: "Rescate #101 - Pitbull Mix",
      patientType: "Rescate",
      ownerName: "Refugio Zona Centro",
      procedure: "Orquiectomía (Castración) y Corrección de Entropión Ocular",
      surgeon: "Médico Veterinario de Guardia",
      anesthetist: "Personal Clínico California",
      date: "2026-10-15", // Programada para mañana
      anesthesiaType: "Inhalatoria con intubación endotraqueal",
      preOpNotes: "Programada a las 09:00 AM. Se requiere confirmar ayuno estricto desde las 22:00 hrs de hoy.",
      intraOpNotes: "Pendiente de realización.",
      postOpNotes: "Se requerirá collar isabelino y gotas oftálmicas tobramicina.",
      status: "Programada"
    }
  ],

  // Vacunas y "Passport to Travel"
  vaccinations: [
    {
      id: "vac-1",
      petId: "pet-3", // Thor
      petName: "Thor",
      ownerName: "Lic. Carlos Mendoza",
      vaccineName: "Vacuna Antirrábica (Rabies)",
      manufacturer: "Nobivac Rabies (MSD Animal Health)",
      lotNumber: "RAB-78829-TJ",
      appliedDate: "2026-08-15",
      dueDate: "2027-08-15",
      vetName: "Médico Veterinario de Guardia",
      licenseNumber: "CÉD. PROF. 8492019-BC",
      isTravelValid: true,
      notes: "Aprobada para cruce internacional EE.UU. / CBP California"
    },
    {
      id: "vac-2",
      petId: "pet-3",
      petName: "Thor",
      ownerName: "Lic. Carlos Mendoza",
      vaccineName: "Múltiple Canina Séxtuple (DHPPi+L)",
      manufacturer: "Zoetis Vanguard Plus 5 L4",
      lotNumber: "VAN-44120",
      appliedDate: "2026-08-15",
      dueDate: "2027-08-15",
      vetName: "Médico Veterinario de Guardia",
      licenseNumber: "CÉD. PROF. 8492019-BC",
      isTravelValid: true,
      notes: "Refuerzo anual"
    },
    {
      id: "vac-3",
      petId: "pet-3",
      petName: "Thor",
      ownerName: "Lic. Carlos Mendoza",
      vaccineName: "Bordetella Bronchiseptica (Tos de las Perreras)",
      manufacturer: "Nobivac KC",
      lotNumber: "KC-91823",
      appliedDate: "2026-08-15",
      dueDate: "2027-08-15",
      vetName: "Médico Veterinario de Guardia",
      licenseNumber: "CÉD. PROF. 8492019-BC",
      isTravelValid: true,
      notes: "Requisito para pensiones y cruce fronterizo"
    },
    {
      id: "vac-4",
      petId: "pet-1", // Canela
      petName: "Canela",
      ownerName: "Carmen Villalobos",
      vaccineName: "Vacuna Antirrábica (Rabies)",
      manufacturer: "Nobivac Rabies",
      lotNumber: "RAB-61029",
      appliedDate: "2026-05-10",
      dueDate: "2027-05-10",
      vetName: "Personal Clínico California",
      licenseNumber: "CÉD. PROF. 9102831-BC",
      isTravelValid: true,
      notes: "Campaña de vacunación"
    }
  ],

  // Jaulas / Caniles / Hospitalización
  cages: [
    {
      id: "cage-1",
      code: "J-01",
      name: "Jaula Grande 01",
      size: "Grande (Perros >25kg)",
      zone: "Hospitalización General",
      status: "Ocupada", // Disponible, Ocupada, Necesita Limpieza, Mantenimiento
      currentOccupant: {
        patientName: "Thor (Golden)",
        ownerName: "Lic. Carlos Mendoza",
        reason: "Recuperación post-profilaxis dental e hidratación",
        intakeTime: "Hoy 10:15 AM",
        specialCare: "Suero fisiológico IV 30ml/h, dieta blanda a las 18:00 hrs."
      },
      lastCleaned: "2026-10-14 08:30"
    },
    {
      id: "cage-2",
      code: "J-02",
      name: "Jaula Mediana 02",
      size: "Mediana (Perros 10-25kg)",
      zone: "Hospitalización General",
      status: "Ocupada",
      currentOccupant: {
        patientName: "Canela (Mestizo)",
        ownerName: "Carmen Villalobos",
        reason: "Monitoreo post-quirúrgico esterilización (OVH)",
        intakeTime: "Hoy 09:30 AM",
        specialCare: "Revisar vendaje abdominal cada 2 hrs, mantener cono isabelino."
      },
      lastCleaned: "2026-10-14 08:00"
    },
    {
      id: "cage-3",
      code: "J-03",
      name: "Jaula Mediana 03",
      size: "Mediana (Perros 10-25kg)",
      zone: "Área de Rescates",
      status: "Ocupada",
      currentOccupant: {
        patientName: "RES-2026-001 (Mestizo Canela)",
        ownerName: "Rescate Callejero",
        reason: "Cicatrización de cojinete y tratamiento antibiótico",
        intakeTime: "2026-10-10",
        specialCare: "Curación tópica diaria con spray antiséptico."
      },
      lastCleaned: "2026-10-13 19:00"
    },
    {
      id: "cage-4",
      code: "J-04",
      name: "Jaula Chica 04",
      size: "Chica (Gatos / Perros pequeños)",
      zone: "Área de Rescates",
      status: "Necesita Limpieza",
      currentOccupant: null,
      lastCleaned: "2026-10-13 11:00",
      cleaningNotes: "Cachorro dado de alta. Requiere desinfección profunda con amonio cuaternario y tapete limpio."
    },
    {
      id: "cage-5",
      code: "J-05",
      name: "Jaula Grande 05",
      size: "Grande (Perros >25kg)",
      zone: "Recuperación Quirófano",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy 09:00 AM"
    },
    {
      id: "cage-6",
      code: "J-06",
      name: "Jaula Mediana 06",
      size: "Mediana (Perros 10-25kg)",
      zone: "Recuperación Quirófano",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy 09:15 AM"
    },
    {
      id: "cage-7",
      code: "J-07",
      name: "Jaula Chica 07",
      size: "Chica (Gatos)",
      zone: "Hospitalización Felina",
      status: "Disponible",
      currentOccupant: null,
      lastCleaned: "Hoy 08:45 AM"
    },
    {
      id: "cage-8",
      code: "J-08",
      name: "Jaula Aislamiento A-1",
      size: "Mediana",
      zone: "Aislamiento Infeccioso",
      status: "Necesita Limpieza",
      currentOccupant: null,
      lastCleaned: "2026-10-12",
      cleaningNotes: "Desinfección obligatoria con cloro diluido y recambio total de sábanas."
    }
  ]
};
