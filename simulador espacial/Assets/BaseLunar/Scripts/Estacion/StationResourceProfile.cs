using UnityEngine;

namespace BaseLunar
{
    [CreateAssetMenu(menuName = "Base Lunar/Datos de recursos")]
    public sealed class StationResourceProfile : ScriptableObject
    {
        [SerializeField] private ResourceFlow capacity = new(100f, 100f, 100f);
        [SerializeField] private ResourceFlow initial = new(80f, 80f, 80f);
        [Tooltip("Consumo base de la tripulación por segundo de juego.")]
        [SerializeField] private ResourceFlow crewUse = new(0.25f, 0.12f, 0.09f);
        [SerializeField, Min(0f)] private float batteryCapacityKwh = 0.08f;
        [SerializeField, Min(0f)] private float initialBatteryKwh = 0.03f;
        [SerializeField, Min(0f)] private float cleanSolarKw = 8f;
        [Tooltip("Fracción de eficiencia perdida por segundo a causa del polvo.")]
        [SerializeField, Min(0f)] private float solarDustPerSecond = 0.001f;
        [SerializeField, Min(0f)] private float antennaDustPerSecond = 0.0005f;
        [Tooltip("Radiación exterior de referencia, en mSv/h.")]
        [SerializeField, Min(0f)] private float ambientRadiation = 0.5f;
        [Tooltip("Radiación a partir de la que se pierde salud, en mSv/h.")]
        [SerializeField, Min(0f)] private float radiationHealthThreshold = 0.25f;

        internal void ConfigureForPrototype()
        {
            ambientRadiation = 0.38f;
        }

        public ResourceFlow Capacity => capacity.NonNegative();
        public ResourceFlow Initial => initial;
        public ResourceFlow CrewUse => crewUse.NonNegative();
        public float BatteryCapacityKwh => Mathf.Max(0f, batteryCapacityKwh);
        public float InitialBatteryKwh => Mathf.Max(0f, initialBatteryKwh);
        public float CleanSolarKw => Mathf.Max(0f, cleanSolarKw);
        public float SolarDustPerSecond => Mathf.Max(0f, solarDustPerSecond);
        public float AntennaDustPerSecond => Mathf.Max(0f, antennaDustPerSecond);
        public float AmbientRadiation => Mathf.Max(0f, ambientRadiation);
        public float RadiationHealthThreshold => Mathf.Max(0f, radiationHealthThreshold);
    }
}
