import type { ModuleId, Practice } from '../types'

export const practices: Record<ModuleId, Practice> = {
  solar: {
    id: 'solar', number: 1, title: 'Encendamos la estación', objective: 'Alimenta dos equipos con energía del Sol.',
    introduction: 'La estación está en pausa. Activa los paneles, el hábitat y la antena. Mantén una producción suficiente durante 4 segundos.',
    steps: ['Activa el sistema solar.', 'Enciende el hábitat y la antena.', 'Ajusta la luz para producir al menos lo que consumes.'], duration: '3 min',
    result: { did: 'Activaste los paneles y alimentaste el hábitat y la antena.', happened: 'La estación funcionó sin gastar su reserva de batería.', why: 'Los paneles produjeron tanta electricidad como necesitaban los equipos.', learned: 'Producir, consumir y almacenar energía son tareas conectadas.' },
  },
  rover: {
    id: 'rover', number: 2, title: 'Exploración lunar', objective: 'Observa un lugar y regresa con una reserva.',
    introduction: 'Nuestro rover debe observar un cráter. Compara el gasto de ida y vuelta, elige una ruta y envíalo. Regresará después de observar.',
    steps: ['Compara la batería y el gasto de ida y vuelta.', 'Elige una ruta que deje al menos 5 % de reserva.', 'Envía el rover y espera su observación y regreso.'], duration: '3 min',
    result: { did: 'Elegiste una ruta, enviaste el rover y esperaste su regreso.', happened: 'El rover observó el terreno y volvió a la estación con batería.', why: 'Planificaste la energía de todo el viaje, incluida la vuelta.', learned: 'Una ruta segura necesita batería para ir, explorar y regresar.' },
  },
  antenna: {
    id: 'antenna', number: 3, title: 'Comunicación con la Tierra', objective: 'Conecta la antena y envía una observación.',
    introduction: 'Tenemos una observación para la Tierra. Enciende la antena, orienta su reflector hasta lograr una señal de 75 % o más y envía el mensaje.',
    steps: ['Activa la antena.', 'Orienta la antena y comprueba su señal.', 'Envía el mensaje al centro de control.'], duration: '2 min',
    result: { did: 'Encendiste y orientaste la antena, y enviaste el mensaje.', happened: 'El centro de control recibió la observación simulada.', why: 'La antena tenía electricidad y una conexión con buena señal.', learned: 'Para comunicarnos necesitamos energía, orientación y una conexión disponible.' },
  },
}
