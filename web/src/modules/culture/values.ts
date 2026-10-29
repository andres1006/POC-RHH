export const VALUES = ['Colaboración', 'Innovación', 'Servicio', 'Excelencia', 'Integridad'] as const

export const BENEFIT_CATEGORIES = ['Salud', 'Bienestar', 'Educación', 'Experiencias', 'Alimentación', 'Mascotas'] as const

// shortcut: catálogo estático compartido; en fase 1 tabla `benefits` por tenant administrada por RR. HH.
export const BENEFITS: { id: string; name: string; category: (typeof BENEFIT_CATEGORIES)[number]; discount: string; text: string; hue: number }[] = [
  { id: 'b1', name: 'Gimnasio Bodytech', category: 'Bienestar', discount: '25 %', text: 'Plan anual con descuento en todas las sedes del país.', hue: 12 },
  { id: 'b2', name: 'Medicina prepagada', category: 'Salud', discount: '30 %', text: 'Cobertura para ti y tu grupo familiar.', hue: 200 },
  { id: 'b3', name: 'Inglés con subsidio', category: 'Educación', discount: '70 %', text: 'Programa virtual con tutor y certificación.', hue: 260 },
  { id: 'b4', name: 'Platzi', category: 'Educación', discount: '40 %', text: 'Suscripción Expert a cursos de tecnología y negocios.', hue: 140 },
  { id: 'b5', name: 'Terapia psicológica', category: 'Salud', discount: '4 sesiones', text: 'Sesiones gratuitas y confidenciales al año.', hue: 180 },
  { id: 'b6', name: 'Día de cumpleaños libre', category: 'Bienestar', discount: '1 día', text: 'Tu cumpleaños es tuyo: tómalo libre.', hue: 330 },
  { id: 'b7', name: 'Cine Colombia', category: 'Experiencias', discount: '2x1', text: 'Boletas 2x1 de lunes a jueves.', hue: 0 },
  { id: 'b8', name: 'Hoteles Decameron', category: 'Experiencias', discount: '20 %', text: 'Planes todo incluido para vacaciones.', hue: 40 },
  { id: 'b9', name: 'Rappi Pro', category: 'Alimentación', discount: '3 meses', text: 'Envíos gratis y descuentos en restaurantes.', hue: 20 },
  { id: 'b10', name: 'Bono de almuerzo', category: 'Alimentación', discount: '$15.000', text: 'Bono diario en restaurantes aliados.', hue: 90 },
  { id: 'b11', name: 'Veterinaria Mascotas', category: 'Mascotas', discount: '15 %', text: 'Consultas y vacunas para tu mascota.', hue: 30 },
  { id: 'b12', name: 'Seguro de mascotas', category: 'Mascotas', discount: '10 %', text: 'Cobertura por accidente y enfermedad.', hue: 280 },
]
