using UnityEngine;

namespace BaseLunar
{
    internal sealed class LunarHazards
    {
        private const float LowOxygen = 0.22f;
        private const float HighExposure = 0.72f;
        private float exposure = 0.1f;
        private float radiationDamage;

        public float Oxygen { get; private set; }
        public float Exposure => exposure;
        public bool UsingTank { get; private set; }
        public bool Outdoors { get; private set; }
        public bool OnProtectedRoute { get; private set; }
        public float OxygenDanger => Oxygen >= LowOxygen ? 0f :
            Mathf.Lerp(0.28f, 1f, 1f - Oxygen / LowOxygen);
        public float RadiationDanger => exposure <= HighExposure ? 0f :
            Mathf.Lerp(0.3f, 1f, (exposure - HighExposure) / (1 - HighExposure));

        public (float Exposure, float Damage) CaptureState() => (exposure, radiationDamage);

        public void RestoreState((float Exposure, float Damage) state) => (exposure, radiationDamage) = state;

        public void Update(EvaCrewState crew, AirlockController airlock, ResourceManager resources, float seconds,
            bool onProtectedRoute)
        {
            Outdoors = crew.CurrentZone == CrewZone.Exterior;
            OnProtectedRoute = Outdoors && onProtectedRoute;
            UsingTank = Outdoors || (crew.CurrentZone == CrewZone.Airlock &&
                airlock.Pressure != AirlockPressure.Pressurized);
            Oxygen = UsingTank ? crew.OxygenTankFraction : resources.OxygenFraction;
            if (seconds <= 0)
                return;

            float ambient = Mathf.Clamp01(resources.Current.RadiationMsvPerHour / 0.5f);
            float routeFactor = OnProtectedRoute ? 0.34f : 1.65f;
            exposure = Outdoors
                ? Mathf.Clamp01(exposure + (0.010f + 0.025f * ambient) * routeFactor * seconds)
                : Mathf.MoveTowards(exposure, 0.12f * ambient, 0.056f * seconds);
            if (Outdoors && RadiationDanger > 0f)
            {
                radiationDamage += RadiationDanger * 1.4f * seconds;
                if (radiationDamage >= 0.5f)
                {
                    resources.AdjustCrew(0, -radiationDamage);
                    radiationDamage = 0;
                }
            }
        }

        public Vector2 CameraShake(float time)
        {
            float amplitude = RadiationDanger * 0.13f + OxygenDanger * 0.055f;
            if (amplitude <= 0)
                return Vector2.zero;
            return new Vector2(Mathf.PerlinNoise(time * 18, 3) - 0.5f,
                Mathf.PerlinNoise(9, time * 23) - 0.5f) * (2f * amplitude);
        }
    }
}
