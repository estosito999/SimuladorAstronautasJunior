using UnityEngine;

namespace BaseLunar
{
    internal static class LunarCollection
    {
        private const string Prefix = "Selene.Collection.";
        private const string All = "AllUnlocked";
        public static readonly string[] Sections = { "Muertes", "Finales", "Datos", "Módulos" };
        public static readonly (string Key, string Name)[] Deaths =
        {
            ("Death.TankEmpty", "Tanque de oxígeno vacío"),
            ("Death.VacuumExposure", "Exposición al vacío"),
            ("Death.AirlockBreach", "Fallo del protocolo de la esclusa"),
            ("Death.HullFailure", "Colapso del casco"),
            ("Death.HealthFailure", "Salud agotada"),
            ("Death.Ejection", "Nico no era un impostor"),
            ("Death.Oxygen", "La base se queda sin oxígeno"),
            ("Death.Stress", "Estrés al límite"),
            ("Death.Radiation", "Mutación por radiación"),
            ("Death.Blackout", "Apagón total"),
            ("Death.Dehydration", "Deshidratado"),
            ("Death.Hunger", "Hambre extrema")
        };
        public static readonly (string Key, string Name)[] Endings =
        {
            ("End.Victory", "¿Continuará?"),
            ("End.Expired", "Tiempo de misión agotado"),
            ("End.Abandoned", "Despido por abandono"),
            ("End.NoReport", "Despido por dormir sin enviar datos")
        };
        public static readonly (string Key, string Name)[] Data = BuildData();

        private static (string Key, string Name)[] BuildData()
        {
            var list = new System.Collections.Generic.List<(string, string)>
            {
                ("Landing", "Bitácora de aterrizaje"),
                ("Earth", "Observación de la Tierra"),
                ("Report", "Primer informe enviado"),
                ("Report.5", "Informe de la jornada 5"),
                ("Report.10", "Informe de la jornada 10"),
                ("Report.15", "Informe de la jornada 15")
            };
            for (int i = 0; i < LunarNasaData.FlareCount; i++)
            {
                var flare = LunarNasaData.FlareAt(i);
                list.Add(($"DONKI.{i}", $"NASA DONKI · {flare.Class} · {flare.Date}"));
            }
            for (int i = 0; i < LunarNasaData.MarsSites.Length; i++)
                list.Add(($"Mars.{i}", $"Mars Trek · {LunarNasaData.MarsSites[i].Name}"));
            for (int i = 0; i < LunarVhs.Programs.Length; i++)
                list.Add(($"VHS.{i}", $"VHS · {LunarVhs.Programs[i].Title}"));
            return list.ToArray();
        }

        public static bool IsUnlocked(string key) =>
            PlayerPrefs.GetInt(Prefix + All, 0) == 1 || PlayerPrefs.GetInt(Prefix + key, 0) == 1;

        public static bool HasRecorded(string key) => PlayerPrefs.GetInt(Prefix + key, 0) == 1;

        public static void Unlock(string key)
        {
            if (PlayerPrefs.GetInt(Prefix + key, 0) == 1)
                return;
            PlayerPrefs.SetInt(Prefix + key, 1);
            PlayerPrefs.Save();
        }

        public static bool TryCode(string value)
        {
            if (!string.Equals(value, "NASA", System.StringComparison.OrdinalIgnoreCase))
                return false;
            Unlock(All);
            return true;
        }
    }
}
