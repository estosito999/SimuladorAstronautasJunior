using System.Collections.Generic;
using UnityEngine;

namespace BaseLunar
{
    internal static class LunarCollection
    {
        private const string Prefix = "Selene.Collection.";
        public enum SecretCard { None, Foxy, MiniPekka, Us }
        private static readonly HashSet<SecretCard> redeemedCards = new();
        private static bool allUnlocked;
        public static bool UsesBaldSkin { get; private set; }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        internal static void ResetCodes()
        {
            redeemedCards.Clear();
            allUnlocked = false;
            UsesBaldSkin = false;
        }
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

        public static bool IsUnlocked(string key) => allUnlocked || HasRecorded(key);

        public static bool HasRecorded(string key) => PlayerPrefs.GetInt(Prefix + key, 0) == 1;
        public static bool HasRedeemed(SecretCard card) => redeemedCards.Contains(card);

        public static void Unlock(string key)
        {
            if (PlayerPrefs.GetInt(Prefix + key, 0) == 1)
                return;
            PlayerPrefs.SetInt(Prefix + key, 1);
            PlayerPrefs.Save();
        }

        public static bool TryCode(string value)
        {
            if (!string.Equals(value?.Trim(), "NASA", System.StringComparison.OrdinalIgnoreCase))
                return false;
            allUnlocked = true;
            return true;
        }

        public static SecretCard RedeemCard(string code)
        {
            SecretCard card = code?.Trim().Normalize().ToUpperInvariant() switch
            {
                "1983" => SecretCard.Foxy,
                "AÑA" => SecretCard.MiniPekka,
                "US" => SecretCard.Us,
                _ => SecretCard.None
            };
            if (card != SecretCard.None)
                redeemedCards.Add(card);
            return card;
        }

        public static bool ToggleBaldSkin(string code)
        {
            if (!string.Equals(code?.Trim(), "PELO", System.StringComparison.OrdinalIgnoreCase))
                return false;
            UsesBaldSkin = !UsesBaldSkin;
            return true;
        }
    }
}
