export type PitchVisual = 'stars' | 'voyage' | 'moon' | 'disciplines' | 'question' | 'station' | 'horizon';

export interface PitchSection {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  emphasis: string;
  subtitle: string;
  visual: PitchVisual;
  narration: string[];
}

/** The spoken script stays complete; the canvas shows only its central phrases. */
export const PITCH_SECTIONS: PitchSection[] = [
  {
    id: 'universe',
    label: 'El universo',
    eyebrow: 'El inicio de todo',
    title: 'Hay algo profundamente fascinante en el universo…',
    emphasis: 'en el universo',
    subtitle: 'Belleza, asombro y misterio.',
    visual: 'stars',
    narration: [
      'Hay algo profundamente fascinante en el universo...',
      'Cuando levantamos la mirada hacia un cielo lleno de estrellas, experimentamos una sensación difícil de describir. Una mezcla de belleza, asombro y misterio.',
      'Contemplamos pequeños puntos de luz separados de nosotros por distancias inimaginables. Y, sin embargo, aunque sabemos lo lejos que están, existe en nuestro interior ese deseo casi imposible de alcanzarlos, de tocarlos, de descubrir qué se encuentra más allá.',
    ],
  },
  {
    id: 'curiosity',
    label: 'La curiosidad',
    eyebrow: 'El impulso de explorar',
    title: 'La curiosidad nos impulsa a explorar',
    emphasis: 'La curiosidad',
    subtitle: 'Aquello que todavía desconocemos.',
    visual: 'voyage',
    narration: [
      'Porque hay algo que ha acompañado al ser humano a lo largo de toda su historia: la curiosidad por explorar aquello que todavía desconoce.',
      'Esa misma curiosidad que nos llevó a cruzar océanos, descubrir nuevos continentes, comprender las leyes de la naturaleza y, finalmente, abandonar por primera vez nuestro propio planeta.',
    ],
  },
  {
    id: 'moon',
    label: 'La Luna',
    eyebrow: 'Lo que parecía imposible',
    title: 'El ser humano llegó a la Luna',
    emphasis: 'llegó a la Luna',
    subtitle: 'Un logro construido durante generaciones.',
    visual: 'moon',
    narration: [
      'Y así, lo que durante miles de años parecía imposible, terminó convirtiéndose en uno de los mayores logros de nuestra civilización: el ser humano llegó a la Luna.',
      'Pero llegar hasta allí no fue únicamente el triunfo de un astronauta o de una nave espacial.',
    ],
  },
  {
    id: 'disciplines',
    label: 'Las ciencias',
    eyebrow: 'Conocimientos que se encuentran',
    title: 'Muchas disciplinas, un mismo propósito',
    emphasis: 'un mismo propósito',
    subtitle: 'La exploración espacial une nuestros conocimientos.',
    visual: 'disciplines',
    narration: [
      'Fue el resultado de generaciones de matemáticos, físicos, ingenieros, informáticos y científicos que lograron unir sus conocimientos para alcanzar un mismo propósito.',
      'Porque la exploración espacial no pertenece a una sola ciencia. Es el lugar donde muchas disciplinas se encuentran para hacer posible lo que antes parecía inalcanzable.',
    ],
  },
  {
    id: 'question',
    label: 'La pregunta',
    eyebrow: 'La reflexión que nos dio origen',
    title: '¿Por qué esperar hasta la universidad?',
    emphasis: 'hasta la universidad',
    subtitle: 'La exploración también puede comenzar en la infancia.',
    visual: 'question',
    narration: [
      'Y aquí nace una reflexión que dio origen a nuestro proyecto:',
      'Si la curiosidad ha sido el motor de los mayores descubrimientos de la humanidad, ¿por qué esperar a que un niño llegue a la universidad para permitirle experimentar cómo funciona la exploración espacial?',
      '¿Por qué no acercarlo desde sus primeros años a ese universo que tanto despierta su imaginación?',
      'No solamente para que observe la Luna, sino para que aprenda a comprenderla, a explorarla y a resolver los desafíos que implica trabajar en ella.',
    ],
  },
  {
    id: 'project',
    label: 'El proyecto',
    eyebrow: 'Con esa visión nace',
    title: 'Simulador para Astronautas Junior',
    emphasis: 'Astronautas Junior',
    subtitle: 'La fascinación por el espacio se convierte en una experiencia con la ciencia.',
    visual: 'station',
    narration: [
      'Con esa visión nace nuestro proyecto: Simulador para Astronautas Junior.',
      'Una plataforma educativa tridimensional que busca transformar la fascinación de los niños por el espacio en sus primeras experiencias con la ciencia, la tecnología y la ingeniería.',
    ],
  },
  {
    id: 'explorer',
    label: 'El propósito',
    eyebrow: 'Nuestro propósito',
    title: 'Antes de formar a un astronauta, debemos despertar la mente de un explorador',
    emphasis: 'la mente de un explorador',
    subtitle: 'Simulador para Astronautas Junior',
    visual: 'horizon',
    narration: [
      'Porque creemos que antes de formar a un astronauta, debemos despertar la mente de un explorador.',
    ],
  },
];

export const PITCH_SCRIPT = PITCH_SECTIONS.flatMap(section => section.narration).join('\n\n');
