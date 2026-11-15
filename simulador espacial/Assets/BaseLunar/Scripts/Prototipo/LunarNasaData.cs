namespace BaseLunar
{
    internal static class LunarNasaData
    {
        public const string MarsTrek = "https://trek.nasa.gov/mars/";
        private const string SolarBulletin = "https://ccmc.gsfc.nasa.gov/DONKI/events/30944/1/";
        private static readonly (string Date, string Peak, string Class, string Region, string Source)[] Flares =
        {
            ("08 MAY 2024", "21:40 UTC", "X1.0", "13664", "https://ccmc.gsfc.nasa.gov/DONKI/events/30601/9/"),
            ("10 MAY 2024", "06:54 UTC", "X3.9", "13664", SolarBulletin),
            ("11 MAY 2024", "01:23 UTC", "X5.8", "13664", SolarBulletin),
            ("14 MAY 2024", "16:51 UTC", "X8.7", "13664", SolarBulletin)
        };

        public static int FlareCount => Flares.Length;
        public static int FlareIndex(int day) => (day - 1) % Flares.Length;
        public static (string Date, string Peak, string Class, string Region, string Source) FlareAt(int index) => Flares[index];
        public static (string Date, string Peak, string Class, string Region, string Source) FlareForDay(int day) =>
            FlareAt(FlareIndex(day));

        public static readonly (string Name, float Longitude, float Latitude, string Clue, string Fact)[] MarsSites =
        {
            ("Jezero", 77.4f, 18.5f,
                "Busca el cráter del hemisferio norte donde aterrizó Perseverance.",
                "Perseverance estudia los sedimentos de un antiguo delta en Jezero."),
            ("Gale", 137.8f, -5.4f,
                "Busca el cráter al sur del ecuador donde explora Curiosity.",
                "El montículo central de Gale conserva kilómetros de capas de roca."),
            ("Olympus Mons", -133.4f, 18.5f,
                "Busca el gran volcán al oeste del meridiano cero.",
                "Olympus Mons es el volcán más grande del sistema solar.")
        };
    }
}
