using System;
using UnityEngine;

namespace BaseLunar
{
    public enum ModuleState { Operational, Broken, Unpowered, Depressurized }

    [DisallowMultipleComponent]
    public sealed class StationModule : MonoBehaviour
    {
        [SerializeField] private StationModuleProfile profile;
        [SerializeField] private ResourceManager resources;

        private bool broken;
        private bool hasPower = true;

        public int ModuleId => profile != null ? profile.ModuleId : 0;
        public bool IsPressurized { get; private set; } = true;
        public ModuleState State { get; private set; } = ModuleState.Operational;
        public event Action<StationModule> StateChanged;

        // Las causas son independientes. Recuperar presión conserva una avería previa.
        internal bool IsAvailable => isActiveAndEnabled && IsPressurized && !broken;
        internal float DemandKw => profile.PowerDemandKw;
        internal float GenerationKw => IsAvailable ? profile.IndependentGenerationKw : 0f;
        internal ResourceFlow FlowPerSecond => State == ModuleState.Operational
            ? profile.FlowPerSecond
            : default;

        internal void Configure(StationModuleProfile settings, ResourceManager manager)
        {
            profile = settings;
            resources = manager;
        }

        private void OnEnable()
        {
            if (profile == null || resources == null || !resources.Register(this))
            {
                Debug.LogError("Asigna un perfil y un ResourceManager y usa un ID único del 1 al 7.", this);
                enabled = false;
                return;
            }

            RefreshState();
        }

        private void OnDisable()
        {
            if (resources != null)
                resources.Unregister(this);
        }

        internal void SimulateFailure(float seconds)
        {
            if (State != ModuleState.Operational || profile.FailureRatePerMinute <= 0f)
                return;

            // Proceso de Poisson: la probabilidad depende del tiempo, no de los FPS.
            float probability = 1f - Mathf.Exp(-profile.FailureRatePerMinute * seconds / 60f);
            if (UnityEngine.Random.value < probability)
                SetBroken(true);
        }

        internal void SetPowered(bool powered)
        {
            hasPower = powered;
            RefreshState();
        }

        internal (bool Broken, bool Powered, bool Pressurized) CaptureState() => (broken, hasPower, IsPressurized);

        internal void RestoreState((bool Broken, bool Powered, bool Pressurized) state)
        {
            (broken, hasPower, IsPressurized) = state;
            RefreshState();
        }

        public void SetBroken(bool value)
        {
            broken = value;
            RefreshState();
        }

        public void SetPressurized(bool value)
        {
            if (IsPressurized == value)
                return;

            IsPressurized = value;
            RefreshState();
            if (!value && resources != null && profile != null)
                resources.AdjustReserves(new ResourceFlow(-profile.OxygenLostOnBreach, 0f, 0f));
        }

        private void RefreshState()
        {
            ModuleState next = ModuleState.Operational;
            if (!IsPressurized)
                next = ModuleState.Depressurized;
            else if (broken)
                next = ModuleState.Broken;
            else if (!hasPower)
                next = ModuleState.Unpowered;

            if (State == next)
                return;

            State = next;
            StateChanged?.Invoke(this);
        }
    }
}
