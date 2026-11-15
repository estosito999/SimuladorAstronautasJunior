namespace BaseLunar
{
    internal sealed class LunarVhs
    {
        public static readonly (string Title, string Genre, string Accent, string[] Captions)[] Programs =
        {
            ("Noticias de la Tierra", "BOLETÍN", "64C6EC", new[]
            {
                "Buenas noches desde la Tierra. El informe de Selene encabeza nuestro boletín.",
                "Al caer la tarde, las ciudades costeras se preparan para la lluvia.",
                "Un saludo a quienes nos escuchan desde la Luna. Volvemos mañana."
            }),
            ("Órbita del corazón", "TELENOVELA", "F5A5B4", new[]
            {
                "Julia, guardé tu carta junto a la ventana desde que te fuiste.",
                "Mateo, esa carta decía que te esperaría aquí. ¿Por qué tardaste tanto?",
                "Porque perdí el tren. Y después perdí el valor."
            }),
            ("Discovery Channel", "DOCUMENTAL", "8BD7AB", new[]
            {
                "En la Luna, cada bota deja un dibujo distinto sobre el polvo.",
                "Aquí no hay viento ni lluvia que borren las huellas.",
                "Ese rastro puede seguir ahí mucho después de que los astronautas vuelvan a casa."
            }),
            ("Cadetes del Cosmos", "SERIE ANIMADA", "FFD38E", new[]
            {
                "¡Tripulación, la Estrella de Queso se nos escapa!",
                "¡Activa los cohetes de confeti, capitana!",
                "¡La alcanzamos! Ahora solo falta encontrar las galletas."
            })
        };

        private readonly bool[] watched = new bool[Programs.Length];
        private const float ClipDuration = 12f;
        private float startedAt;
        public int Current { get; private set; } = -1;
        public float Progress { get; private set; }

        public bool Watched(int index) => watched[index];

        public void Play(int index, float now)
        {
            if (Current >= 0 || index < 0 || index >= watched.Length || watched[index])
                return;
            watched[index] = true;
            Current = index;
            Progress = 0f;
            startedAt = now;
        }

        public bool Update(float now)
        {
            if (Current < 0)
                return false;
            Progress = (now - startedAt) / ClipDuration;
            if (Progress < 1f)
                return false;
            Stop();
            return true;
        }

        public bool[] CaptureWatched() => (bool[])watched.Clone();

        public void RestoreWatched(bool[] snapshot) => System.Array.Copy(snapshot, watched, watched.Length);

        public void Stop() => Current = -1;
    }
}
