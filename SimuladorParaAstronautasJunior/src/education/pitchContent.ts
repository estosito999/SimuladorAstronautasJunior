export interface PitchSection {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  narration: string[];
}

export const PITCH_SECTIONS: PitchSection[] = [
  {
    id: 'universe',
    label: 'El universo',
    title: 'Hay algo profundamente fascinante en el universo…',
    subtitle: 'El deseo de descubrir qué hay más allá.',
    narration: [
      'Hay algo profundamente fascinante en el universo…',
      'Cuando levantamos la mirada hacia un cielo lleno de estrellas, sentimos belleza, asombro y misterio. Vemos luces a distancias inimaginables y, aun así, algo dentro de nosotros quiere acercarse. Queremos descubrir qué hay más allá.',
      'Ese impulso es la curiosidad.',
    ],
  },
  {
    id: 'curiosity',
    label: 'La curiosidad',
    title: 'La curiosidad nos llevó hasta la Luna.',
    subtitle: 'Muchas disciplinas, un propósito compartido.',
    narration: [
      'La misma curiosidad que nos llevó a cruzar océanos, comprender la naturaleza y superar los límites de nuestro planeta.',
      'Hasta que un día, la humanidad llegó a la Luna.',
      'Detrás de aquel paso estuvieron generaciones de científicos, matemáticos, ingenieros e informáticos. Personas que conectaron sus conocimientos para hacer posible lo que parecía inalcanzable.',
    ],
  },
  {
    id: 'question',
    label: 'La pregunta',
    title: '¿Por qué esperar hasta la universidad?',
    subtitle: 'La curiosidad comienza en la infancia.',
    narration: [
      'Y esa historia nos llevó a preguntarnos…',
      'Si la curiosidad comienza en la infancia, ¿por qué esperar hasta la universidad para experimentar cómo funciona la exploración espacial?',
      '¿Qué pasaría si un niño pudiera explorar una estación lunar y descubrir, con sus propias decisiones, cómo mantenerla funcionando?',
    ],
  },
  {
    id: 'project',
    label: 'El proyecto',
    title: 'Simulador para Astronautas Junior',
    subtitle: 'Exploración 3D para niños de siete a doce años.',
    narration: [
      'Con esa visión nace Simulador para Astronautas Junior.',
      'Una plataforma educativa tridimensional para niños de siete a doce años, donde la fascinación por el espacio se convierte en una oportunidad para experimentar con ciencia, tecnología e ingeniería.',
    ],
  },
  {
    id: 'connections',
    label: 'La experiencia',
    title: 'Una decisión conecta toda la estación.',
    subtitle: 'El polvo, la energía, el rover y las comunicaciones trabajan juntos.',
    narration: [
      'Dentro de nuestra estación lunar, un niño conduce un rover cerca de unos paneles solares. El movimiento levanta polvo, que se deposita sobre ellos. La producción de energía disminuye.',
      '¿Cómo puede recuperarla?',
      'Con ayuda de LUNA, nuestra instructora virtual, activa la limpieza y observa cómo mejora la generación. Después utiliza esa electricidad para recargar el rover, orienta una antena y envía sus observaciones al centro de control.',
    ],
  },
  {
    id: 'learning',
    label: 'El aprendizaje',
    title: 'Observar. Comparar. Volver a probar.',
    subtitle: 'LUNA acompaña cada descubrimiento.',
    narration: [
      'Así descubre que los equipos forman un sistema. Que sus decisiones tienen consecuencias. Y que comprender esas conexiones le permite resolver un desafío.',
      'La física aparece en la energía. Las matemáticas, en los datos. Y la ingeniería, en la manera de conectar los equipos.',
      'Cada intento invita a observar, comparar y volver a probar. LUNA acompaña el recorrido con explicaciones sencillas que despiertan nuevas preguntas.',
    ],
  },
  {
    id: 'explorer',
    label: 'El propósito',
    title: 'Antes de formar a un astronauta, debemos despertar la mente de un explorador.',
    subtitle: 'El viaje comienza aquí.',
    narration: [
      'Queremos que esa curiosidad se convierta en confianza para aprender, explorar y construir soluciones.',
      'Porque antes de formar a un astronauta, debemos despertar la mente de un explorador.',
      'Y tal vez, para quien algún día nos lleve más lejos, el viaje comience aquí.',
    ],
  },
];

export const PITCH_SCRIPT = PITCH_SECTIONS.flatMap(section => section.narration).join('\n\n');
