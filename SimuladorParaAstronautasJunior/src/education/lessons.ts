import type { Lesson, ModuleId } from '../types'

export const lessons: Record<ModuleId, Lesson> = {
  solar: {
    title: 'La energía de nuestra base', subtitle: 'Cada rayo de Sol puede ayudarnos.',
    what: 'Un panel solar es un conjunto de celdas que transforma la luz del Sol en electricidad.',
    purpose: 'Da energía al hábitat, a la antena y al cargador del rover.',
    how: 'Con luz producimos electricidad. La batería guarda una parte para cuando hay menos luz.',
    parts: [{ name: 'Celdas solares', description: 'Reciben la luz y producen electricidad.' }, { name: 'Soporte', description: 'Mantiene los paneles en su posición.' }, { name: 'Batería de la base', description: 'Almacena energía para usarla después.' }],
    experiment: 'Baja la luz solar y observa la batería. Después apaga un equipo: ¿cambia el consumo?',
    fact: 'La electricidad que usamos debe venir de los paneles o de energía guardada en una batería.',
  },
  rover: {
    title: 'Un robot para explorar', subtitle: 'Planificar también es explorar.',
    what: 'Un rover es un vehículo robot que puede observar y estudiar el terreno.',
    purpose: 'Nos ayuda a investigar lugares que están lejos de la estación.',
    how: 'Sus ruedas lo mueven y su cámara observa. Antes de salir necesita energía para ir y regresar.',
    parts: [{ name: 'Ruedas', description: 'Lo ayudan a desplazarse por el terreno.' }, { name: 'Cámara', description: 'Observa los lugares que queremos estudiar.' }, { name: 'Panel de control', description: 'Recibe las instrucciones de su recorrido.' }],
    experiment: 'Compara las rutas. ¿Cuál puedes recorrer y regresar dejando una reserva de batería?',
    fact: 'Los robots permiten explorar lugares difíciles sin enviar allí a una persona.',
  },
  antenna: {
    title: 'Una llamada a la Tierra', subtitle: 'La información también viaja.',
    what: 'Una antena es un equipo que envía y recibe información mediante ondas de radio.',
    purpose: 'Permite compartir observaciones y hablar con el centro de control.',
    how: 'Necesita electricidad, una conexión disponible y una orientación adecuada.',
    parts: [{ name: 'Reflector', description: 'Ayuda a dirigir la señal.' }, { name: 'Receptor', description: 'Recibe y envía la información.' }, { name: 'Base orientable', description: 'Permite apuntar la antena.' }],
    experiment: 'Activa la antena y prueba distintas orientaciones. Interrumpe y restaura la conexión.',
    fact: 'Aquí la orientación es un ejercicio simplificado: no calculamos una señal espacial real.',
  },
}
