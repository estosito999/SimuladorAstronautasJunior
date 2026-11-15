using System;
using System.Collections.Generic;
using UnityEngine;

namespace BaseLunar
{
    [Serializable]
    public struct ResourceFlow
    {
        public float Oxygen;
        public float Water;
        public float Food;

        public ResourceFlow(float oxygen, float water, float food)
        {
            Oxygen = oxygen;
            Water = water;
            Food = food;
        }

        public ResourceFlow NonNegative() =>
            new(Mathf.Max(0f, Oxygen), Mathf.Max(0f, Water), Mathf.Max(0f, Food));

        public ResourceFlow ClampTo(ResourceFlow capacity) =>
            new(Mathf.Clamp(Oxygen, 0f, capacity.Oxygen),
                Mathf.Clamp(Water, 0f, capacity.Water),
                Mathf.Clamp(Food, 0f, capacity.Food));

        public static ResourceFlow operator +(ResourceFlow a, ResourceFlow b) =>
            new(a.Oxygen + b.Oxygen, a.Water + b.Water, a.Food + b.Food);

        public static ResourceFlow operator *(ResourceFlow a, float factor) =>
            new(a.Oxygen * factor, a.Water * factor, a.Food * factor);
    }

    public readonly struct StationResources
    {
        public ResourceFlow Reserves { get; }
        public float GenerationKw { get; }
        public float DemandKw { get; }
        public float SuppliedKw { get; }
        public float BatteryKwh { get; }
        public float HullPercent { get; }
        public float RadiationMsvPerHour { get; }
        public float MoralePercent { get; }
        public float HealthPercent { get; }
        public float SolarEfficiency { get; }
        public float AntennaQuality { get; }

        internal StationResources(ResourceFlow reserves, float generationKw, float demandKw,
            float suppliedKw, float batteryKwh, float hull, float radiation, float morale,
            float health, float solar, float antenna)
        {
            Reserves = reserves;
            GenerationKw = generationKw;
            DemandKw = demandKw;
            SuppliedKw = suppliedKw;
            BatteryKwh = batteryKwh;
            HullPercent = hull;
            RadiationMsvPerHour = radiation;
            MoralePercent = morale;
            HealthPercent = health;
            SolarEfficiency = solar;
            AntennaQuality = antenna;
        }
    }

    [DisallowMultipleComponent]
    public sealed class ResourceManager : MonoBehaviour
    {
        [SerializeField] private StationResourceProfile profile;
        [SerializeField, Min(0.05f)] private float tickSeconds = 0.25f;

        // El índice es el ID del módulo. El reparto eléctrico usa menor ID primero.
        private readonly StationModule[] modules = new StationModule[8];
        private readonly List<StationModule> tickModules = new(7);
        private ResourceFlow reserves;
        private float generationKw;
        private float demandKw;
        private float suppliedKw;
        private float batteryKwh;
        private float hull = 100f;
        private float morale = 100f;
        private float health = 100f;
        private float solarDust;
        private float antennaDust;
        private float antennaCalibration = 1f;
        private float shieldCoverage;
        private float accumulator;
        private float oxygenLeakPerSecond;

        internal float OxygenFraction => profile != null && profile.Capacity.Oxygen > 0
            ? Mathf.Clamp01(reserves.Oxygen / profile.Capacity.Oxygen) : 0;

        internal void SetOxygenLeak(float rate) => oxygenLeakPerSecond = Mathf.Max(0, rate);

        private float Radiation => profile != null
            ? profile.AmbientRadiation * (1f - shieldCoverage)
            : 0f;

        public StationResources Current => new(reserves, generationKw, demandKw, suppliedKw,
            batteryKwh, hull, Radiation, morale, health, 1f - solarDust,
            (1f - antennaDust) * antennaCalibration);
        public event Action<StationResources> Changed;

        internal void Configure(StationResourceProfile settings) => profile = settings;

        internal sealed class Checkpoint
        {
            public StationResources Resources;
            public float SolarDust, AntennaDust, Calibration, Shield, Leak, Accumulator;
            public readonly (bool Broken, bool Powered, bool Pressurized)[] Modules = new (bool, bool, bool)[8];
        }

        internal Checkpoint CaptureCheckpoint()
        {
            var snapshot = new Checkpoint
            {
                Resources = Current, SolarDust = solarDust, AntennaDust = antennaDust,
                Calibration = antennaCalibration, Shield = shieldCoverage, Leak = oxygenLeakPerSecond,
                Accumulator = accumulator
            };
            for (int i = 1; i < modules.Length; i++)
                if (modules[i] != null)
                    snapshot.Modules[i] = modules[i].CaptureState();
            return snapshot;
        }

        internal void RestoreCheckpoint(Checkpoint snapshot)
        {
            StationResources saved = snapshot.Resources;
            reserves = saved.Reserves;
            generationKw = saved.GenerationKw;
            demandKw = saved.DemandKw;
            suppliedKw = saved.SuppliedKw;
            batteryKwh = saved.BatteryKwh;
            hull = saved.HullPercent;
            morale = saved.MoralePercent;
            health = saved.HealthPercent;
            solarDust = snapshot.SolarDust;
            antennaDust = snapshot.AntennaDust;
            antennaCalibration = snapshot.Calibration;
            shieldCoverage = snapshot.Shield;
            oxygenLeakPerSecond = snapshot.Leak;
            accumulator = snapshot.Accumulator;
            for (int i = 1; i < modules.Length; i++)
                if (modules[i] != null)
                    modules[i].RestoreState(snapshot.Modules[i]);
            Publish();
        }

        private void Awake()
        {
            if (profile == null)
            {
                Debug.LogError("Asigna un perfil de recursos a ResourceManager.", this);
                enabled = false;
                return;
            }

            reserves = profile.Initial.ClampTo(profile.Capacity);
            batteryKwh = Mathf.Clamp(profile.InitialBatteryKwh, 0f, profile.BatteryCapacityKwh);
        }

        private void Start() => Publish();

        private void Update()
        {
            accumulator += Time.deltaTime;
            float step = Mathf.Max(0.05f, tickSeconds);
            while (accumulator >= step)
            {
                accumulator -= step;
                Simulate(step);
            }
        }

        internal bool Register(StationModule module)
        {
            int id = module.ModuleId;
            if (profile == null || id < 1 || id > 7 || (modules[id] != null && modules[id] != module))
                return false;

            modules[id] = module;
            return true;
        }

        internal void Unregister(StationModule module)
        {
            int id = module.ModuleId;
            if (id >= 1 && id <= 7 && modules[id] == module)
                modules[id] = null;
        }

        private void Simulate(float seconds)
        {
            solarDust = Mathf.Clamp01(solarDust + profile.SolarDustPerSecond * seconds);
            antennaDust = Mathf.Clamp01(antennaDust + profile.AntennaDustPerSecond * seconds);

            tickModules.Clear();
            foreach (StationModule module in modules)
            {
                if (module != null && module.isActiveAndEnabled)
                    tickModules.Add(module);
            }

            foreach (StationModule module in tickModules)
                module.SimulateFailure(seconds);

            generationKw = profile.CleanSolarKw * (1f - solarDust);
            foreach (StationModule module in tickModules)
                generationKw += module.GenerationKw;

            // Potencia instantánea en kW. La batería integra el balance en horas.
            float hours = seconds / 3600f;
            float remainingKw = generationKw + batteryKwh / hours;
            demandKw = 0f;
            suppliedKw = 0f;
            ResourceFlow net = profile.CrewUse * -1f + new ResourceFlow(-oxygenLeakPerSecond, 0, 0);

            foreach (StationModule module in tickModules)
            {
                if (!module.IsAvailable)
                    continue;

                float requiredKw = module.DemandKw;
                demandKw += requiredKw;
                bool powered = requiredKw <= remainingKw;
                module.SetPowered(powered);
                if (powered)
                {
                    remainingKw -= requiredKw;
                    suppliedKw += requiredKw;
                    net += module.FlowPerSecond;
                }
            }

            batteryKwh = Mathf.Clamp(batteryKwh + (generationKw - suppliedKw) * hours,
                0f, profile.BatteryCapacityKwh);
            reserves = (reserves + net * seconds).ClampTo(profile.Capacity);
            UpdateCrew(seconds);
            Publish();
        }

        private void UpdateCrew(float seconds)
        {
            float healthLoss = reserves.Oxygen <= 0f ? 6f : 0f;
            if (reserves.Water <= 0f)
                healthLoss += 1f;
            if (reserves.Food <= 0f)
                healthLoss += 0.5f;

            healthLoss += Mathf.Max(0f, Radiation - profile.RadiationHealthThreshold) * 0.2f;
            health = Mathf.Clamp(health - healthLoss * seconds, 0f, 100f);
            if (healthLoss > 0f || reserves.Food <= 0f)
                morale = Mathf.Max(0f, morale - seconds);
        }

        public void AdjustReserves(ResourceFlow delta)
        {
            if (profile == null)
                return;

            reserves = (reserves + delta).ClampTo(profile.Capacity);
            Publish();
        }

        public void AdjustHull(float percentagePoints)
        {
            hull = Mathf.Clamp(hull + percentagePoints, 0f, 100f);
            Publish();
        }

        public void AdjustCrew(float moralePoints, float healthPoints)
        {
            morale = Mathf.Clamp(morale + moralePoints, 0f, 100f);
            health = Mathf.Clamp(health + healthPoints, 0f, 100f);
            Publish();
        }

        // API para los futuros puntos de tarea de la superficie.
        public void CleanSolarPanels()
        {
            solarDust = 0f;
            Publish();
        }

        public void CleanAntenna()
        {
            antennaDust = 0f;
            Publish();
        }

        public void SetAntennaCalibration(float fraction)
        {
            antennaCalibration = Mathf.Clamp01(fraction);
            Publish();
        }

        public void SetRadiationShieldCoverage(float fraction)
        {
            shieldCoverage = Mathf.Clamp01(fraction);
            Publish();
        }

        private void Publish() => Changed?.Invoke(Current);
    }
}
