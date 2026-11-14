import type { DeviceId } from '../types'

export const instructor = {
  welcome: '¡Hola, astronauta junior! Soy LUNA. Vamos a descubrir cómo funciona nuestra estación.',
  select: {
    solar: 'Los paneles convierten la luz en electricidad. Prueba a cambiar la iluminación y observa la batería.',
    rover: 'Antes de enviar el rover, comprueba la batería para ir y regresar. ¡Planificar es parte de explorar!',
    antenna: 'Una antena nos conecta con la Tierra. Enciéndela y busca una señal fuerte.',
    habitat: 'Este es nuestro hogar lunar. Sus luces y equipos también necesitan electricidad.',
  } satisfies Record<DeviceId, string>,
  noPower: 'La batería está vacía. Activa los paneles, aumenta la luz o apaga un equipo para recuperar energía.',
  maintenance: 'Durante la revisión este equipo descansa. En unos segundos volverá a estar disponible.',
}
