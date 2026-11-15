using System;
using UnityEngine;

namespace BaseLunar
{
    public enum AirlockPressure { Pressurized, Depressurizing, Vacuum, Repressurizing }

    [DisallowMultipleComponent]
    public sealed class AirlockController : MonoBehaviour
    {
        [SerializeField] private StationModule garage;
        [SerializeField] private EvaCrewState crew;

        [Header("Zonas con Is Trigger")]
        [SerializeField] private Collider2D garageZone;
        [SerializeField] private Collider2D suitZone;
        [SerializeField] private Collider2D chamberZone;
        [SerializeField] private Collider2D exteriorZone;
        [SerializeField] private Collider2D exteriorControlZone;
        [SerializeField] private Collider2D interiorControlZone;

        [Header("Colliders sólidos de las puertas")]
        [SerializeField] private Collider2D innerBarrier;
        [SerializeField] private Collider2D outerBarrier;

        [Header("Ciclos")]
        [SerializeField, Min(0.1f)] private float depressurizationSeconds = 3f;
        [SerializeField, Min(0.1f)] private float repressurizationSeconds = 4f;

        public AirlockPressure Pressure { get; private set; } = AirlockPressure.Pressurized;
        public bool DoorsOpen { get; private set; }
        public bool InnerFieldActive => DoorsOpen && Pressure != AirlockPressure.Pressurized;
        public bool OuterFieldActive => DoorsOpen && Pressure != AirlockPressure.Vacuum;
        public bool ProtocolFailed { get; private set; }
        public event Action<AirlockController> Changed;
        public event Action<string> CommandRejected;

        private float cycleRemaining;
        private bool exteriorAuthorized;
        private bool allowUnsuitedExit;
        private bool sealOnEntry;
        private bool sealOnDeparture;
        private bool enteredFromMoon;
        private float retreatDelay;
        private float previousCrewX;
        private bool emergencyRetreat;

        internal void PresentDoors(bool open, AirlockPressure pressure)
        {
            enabled = false;
            DoorsOpen = open;
            Pressure = pressure;
            SyncBarriers();
        }

        internal void RestoreGameplay()
        {
            DoorsOpen = false;
            Pressure = AirlockPressure.Pressurized;
            cycleRemaining = retreatDelay = 0f;
            exteriorAuthorized = sealOnEntry = sealOnDeparture = false;
            emergencyRetreat = false;
            previousCrewX = crew.Position.x;
            SyncBarriers();
            enabled = true;
        }

        internal bool NearButton => isActiveAndEnabled && crew != null &&
            (Contains(interiorControlZone) || Contains(exteriorControlZone));

        internal void Configure(StationModule linkedGarage, EvaCrewState astronaut, LunarMap map,
            bool allowUnsuitedExit = false)
        {
            this.allowUnsuitedExit = allowUnsuitedExit;
            garage = linkedGarage;
            crew = astronaut;
            garageZone = map.GarageZone;
            suitZone = map.SuitZone;
            chamberZone = map.ChamberZone;
            exteriorZone = map.ExteriorZone;
            exteriorControlZone = map.ControlZone;
            interiorControlZone = map.InteriorControlZone;
            innerBarrier = map.InnerGate;
            outerBarrier = map.OuterGate;
        }

        private void Awake()
        {
            if (garage == null || garage.ModuleId != 7 || crew == null ||
                !IsTrigger(garageZone) || !IsTrigger(suitZone) ||
                !IsTrigger(chamberZone) || !IsTrigger(exteriorZone) ||
                !IsTrigger(exteriorControlZone) || !IsTrigger(interiorControlZone) ||
                !IsSolid(innerBarrier) ||
                !IsSolid(outerBarrier) || innerBarrier == outerBarrier)
            {
                if (outerBarrier != null)
                    outerBarrier.enabled = true;
                Debug.LogError("La esclusa requiere el Módulo 7, tripulante, zonas trigger y dos puertas sólidas.", this);
                enabled = false;
                return;
            }

            SyncBarriers();
        }

        private void FixedUpdate()
        {
            if (ProtocolFailed)
                return;

            if (!crew.IsDead)
            {
                UpdateCrewExposure();
                if (!crew.IsDead)
                {
                    TryUnsuitedRetreat();
                    SealAfterEntry();
                    SealAfterDeparture();
                    UpdateRetreat();
                }
            }
            previousCrewX = crew.Position.x;

            if (ProtocolFailed || cycleRemaining <= 0f)
                return;

            // El ciclo queda en pausa durante un apagón o avería. Si el garaje pierde
            // presión durante una represurización, la cámara vuelve al vacío.
            if (Pressure == AirlockPressure.Repressurizing && !garage.IsPressurized)
            {
                CompleteCycle(AirlockPressure.Vacuum);
                return;
            }

            if (garage.State != ModuleState.Operational && !emergencyRetreat)
                return;

            cycleRemaining -= Time.fixedDeltaTime;
            if (cycleRemaining <= 0f)
            {
                CompleteCycle(Pressure == AirlockPressure.Depressurizing
                    ? AirlockPressure.Vacuum
                    : AirlockPressure.Pressurized);
            }
        }

        private void TryUnsuitedRetreat()
        {
            if (!allowUnsuitedExit || crew.HasSpaceSuit || crew.CurrentZone != CrewZone.Airlock ||
                enteredFromMoon || !garage.IsPressurized ||
                (Pressure != AirlockPressure.Depressurizing && Pressure != AirlockPressure.Vacuum))
                return;

            float x = crew.Position.x;
            if (x > innerBarrier.transform.position.x + 0.98f || x >= previousCrewX - 0.001f)
                return;

            emergencyRetreat = true;
            DoorsOpen = false;
            exteriorAuthorized = false;
            StartCycle(AirlockPressure.Repressurizing, 1.35f);
            Reject("Retorno de emergencia. Espera a que se abra la puerta del garaje.");
        }

        private void UpdateCrewExposure()
        {
            ObserveCrewPosition();
            // Mientras un ciclo está activo, la cámara se trata como no respirable.
            if (crew.IsDead || !IsInVacuum())
                return;

            if (crew.HasSpaceSuit)
                crew.ConsumeTank(Time.fixedDeltaTime);
            else if (!allowUnsuitedExit || crew.CurrentZone != CrewZone.Airlock || enteredFromMoon)
                crew.Kill(CrewDeathCause.VacuumExposure, "Entraste sin traje en una zona sin aire respirable.",
                    "Equípate en el casillero del garaje antes de entrar a una zona despresurizada.");
        }

        // La posición física es la fuente de verdad. Comprueba también un acceso
        // directo a la superficie aunque nunca se haya pulsado el mando.
        private void ObserveCrewPosition()
        {
            if (Contains(exteriorZone))
            {
                bool firstCrossing = crew.CurrentZone != CrewZone.Exterior;
                if ((!crew.HasSpaceSuit && !allowUnsuitedExit) || !exteriorAuthorized ||
                    (firstCrossing && (!DoorsOpen || OuterFieldActive || crew.CurrentZone != CrewZone.Airlock)))
                {
                    FailProtocol("Salida lunar sin completar el protocolo EVA.", CrewZone.Exterior);
                    return;
                }

                if (firstCrossing)
                    sealOnDeparture = true;
                crew.SetZone(CrewZone.Exterior);
                if (!crew.HasSpaceSuit)
                    crew.Kill(CrewDeathCause.Ejection, "Cruzaste la compuerta exterior sin traje y el vacío te arrastró fuera.",
                        "Equipa el traje en el garaje antes de cruzar la compuerta.");
                return;
            }

            if (Contains(chamberZone))
            {
                if (crew.CurrentZone == CrewZone.Exterior && (!DoorsOpen || OuterFieldActive))
                {
                    FailProtocol("Reingreso con la compuerta exterior cerrada.", CrewZone.Airlock);
                    return;
                }

                if (crew.CurrentZone != CrewZone.Airlock)
                {
                    enteredFromMoon = crew.CurrentZone == CrewZone.Exterior;
                    sealOnEntry = DoorsOpen;
                    sealOnDeparture = false;
                }
                crew.SetZone(CrewZone.Airlock);
                return;
            }

            if (crew.CurrentZone == CrewZone.Exterior)
            {
                FailProtocol("Reingreso a la estación sin pasar por la esclusa.", CrewZone.Interior);
                return;
            }

            if (crew.CurrentZone == CrewZone.Airlock && Pressure != AirlockPressure.Pressurized)
            {
                FailProtocol("Cruzaste hacia el garaje con la cámara todavía en vacío.", CrewZone.Interior);
                return;
            }

            exteriorAuthorized = false;
            sealOnEntry = false;
            if (crew.CurrentZone == CrewZone.Airlock)
                sealOnDeparture = true;
            crew.SetZone(CrewZone.Interior);
        }

        public void EquipSuit()
        {
            if (CanOperate() && Contains(suitZone) && crew.CurrentZone == CrewZone.Interior && garage.IsPressurized)
                crew.EquipSuit();
            else
                Reject("Usa el casillero desde el garaje presurizado.");
        }

        public void RemoveSuit()
        {
            if (CanOperate() && Contains(suitZone) && crew.CurrentZone == CrewZone.Interior && garage.IsPressurized)
                crew.RemoveSuit();
            else
                Reject("Quítate el traje en el casillero del garaje presurizado.");
        }

        internal void PressButton()
        {
            if (!CanOperate() || !NearButton)
                return;
            if (cycleRemaining > 0f || retreatDelay > 0f)
            {
                Reject("La cámara aún está cambiando de presión.");
                return;
            }
            if (DoorsOpen)
                return;

            if (crew.CurrentZone == CrewZone.Interior &&
                (Pressure != AirlockPressure.Pressurized || !garage.IsPressurized))
            {
                Reject("La cámara necesita presión para abrir desde el garaje.");
                return;
            }
            if (crew.CurrentZone == CrewZone.Exterior && Pressure != AirlockPressure.Vacuum)
            {
                Reject("La cámara aún no está en vacío.");
                return;
            }
            if (Pressure == AirlockPressure.Vacuum && !crew.HasSpaceSuit)
            {
                FailProtocol("Intentaste abrir hacia la Luna sin el traje equipado.");
                return;
            }

            OpenDoors();
        }

        private void SealAfterEntry()
        {
            if (!DoorsOpen || !sealOnEntry || crew.CurrentZone != CrewZone.Airlock)
                return;

            // Wait until the entire crew collider has cleared both thresholds.
            float x = crew.Position.x;
            if (x < innerBarrier.transform.position.x + 0.53f || x > outerBarrier.transform.position.x - 0.53f)
                return;

            sealOnEntry = false;
            DoorsOpen = false;
            if (garage.State == ModuleState.Operational && (crew.HasSpaceSuit || (allowUnsuitedExit && !enteredFromMoon)))
            {
                if (enteredFromMoon && Pressure == AirlockPressure.Vacuum)
                {
                    StartCycle(AirlockPressure.Repressurizing, repressurizationSeconds);
                    return;
                }
                if (!enteredFromMoon && Pressure == AirlockPressure.Pressurized)
                {
                    StartCycle(AirlockPressure.Depressurizing, depressurizationSeconds);
                    if (!crew.HasSpaceSuit)
                        Reject("Sin traje: camina hacia la puerta del garaje para volver.");
                    return;
                }
            }
            Publish();
            retreatDelay = 0.6f;
            if (!crew.HasSpaceSuit)
                Reject("Traje requerido. La esclusa se reabrirá hacia el garaje.");
            else if (garage.State != ModuleState.Operational)
                Reject("Falta energía o presión. La esclusa se reabrirá hacia el lado seguro.");
        }

        private void UpdateRetreat()
        {
            if (retreatDelay <= 0f)
                return;

            retreatDelay -= Time.fixedDeltaTime;
            if (retreatDelay <= 0f && crew.CurrentZone == CrewZone.Airlock)
                OpenDoors();
        }

        private void SealAfterDeparture()
        {
            if (!sealOnDeparture || !DoorsOpen)
                return;

            float x = crew.Position.x;
            bool clear = crew.CurrentZone == CrewZone.Exterior
                ? x >= outerBarrier.transform.position.x + 0.54f
                : crew.CurrentZone == CrewZone.Interior && x <= innerBarrier.transform.position.x - 0.54f;
            if (!clear)
                return;

            sealOnDeparture = false;
            DoorsOpen = false;
            Publish();
        }

        private bool CanOperate()
        {
            if (!isActiveAndEnabled || ProtocolFailed || crew == null || crew.IsDead)
                return false;

            ObserveCrewPosition();
            return !ProtocolFailed && !crew.IsDead;
        }

        private bool IsInVacuum() =>
            crew.CurrentZone == CrewZone.Exterior ||
            (crew.CurrentZone == CrewZone.Airlock &&
                (Pressure != AirlockPressure.Pressurized || (DoorsOpen && !garage.IsPressurized))) ||
            (crew.CurrentZone == CrewZone.Interior && Contains(garageZone) && !garage.IsPressurized);

        private bool Contains(Collider2D zone) => zone.OverlapPoint(crew.Position);

        private static bool IsTrigger(Collider2D collider) => collider != null && collider.isTrigger;
        private static bool IsSolid(Collider2D collider) => collider != null && !collider.isTrigger;

        private void StartCycle(AirlockPressure nextPressure, float seconds)
        {
            Pressure = nextPressure;
            cycleRemaining = Mathf.Max(0.1f, seconds);
            Publish();
        }

        private void CompleteCycle(AirlockPressure nextPressure)
        {
            cycleRemaining = 0f;
            emergencyRetreat = false;
            Pressure = nextPressure;
            if (!crew.IsDead && crew.CurrentZone == CrewZone.Airlock)
            {
                OpenDoors();
                return;
            }
            Publish();
        }

        private void OpenDoors()
        {
            DoorsOpen = true;
            exteriorAuthorized = Pressure == AirlockPressure.Vacuum;
            Publish();
        }

        private void FailProtocol(string reason, CrewZone? actualZone = null)
        {
            if (ProtocolFailed || crew.IsDead)
                return;

            ProtocolFailed = true;
            cycleRemaining = 0f;
            exteriorAuthorized = false;
            Pressure = AirlockPressure.Vacuum;
            crew.Kill(CrewDeathCause.AirlockBreach, reason + " El garaje quedó despresurizado.",
                "Equípate y espera dentro de la cámara a que cambie la presión y se abran las compuertas.");
            if (actualZone.HasValue)
                crew.SetZone(actualZone.Value);

            // Solo el módulo conectado pierde presión. HexStationLayout podrá
            // suscribirse a StateChanged para gestionar su conexión con el núcleo.
            garage.SetPressurized(false);
            Publish();
        }

        private void SyncBarriers()
        {
            innerBarrier.enabled = !DoorsOpen || InnerFieldActive;
            outerBarrier.enabled = !DoorsOpen || OuterFieldActive;
        }

        private void Publish()
        {
            SyncBarriers();
            Changed?.Invoke(this);
        }

        private void Reject(string reason) => CommandRejected?.Invoke(reason);
    }
}
