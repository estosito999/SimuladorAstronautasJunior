using System;
using UnityEngine;

namespace BaseLunar
{
    public enum CrewZone { Interior, Airlock, Exterior }
    public enum CrewDeathCause
    {
        TankEmpty, VacuumExposure, AirlockBreach, HullFailure, HealthFailure,
        Ejection, Oxygen, Stress, Radiation, Blackout, Dehydration, Hunger, Dismissed
    }

    [RequireComponent(typeof(Rigidbody2D))]
    [DisallowMultipleComponent]
    public sealed class EvaCrewState : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer bodySprite;
        [SerializeField] private Sprite interiorSprite;
        [SerializeField] private Sprite suitSprite;
        [SerializeField, Min(0.1f)] private float tankCapacitySeconds = 75f;
        [Tooltip("Controladores de movimiento que deben desactivarse si muere.")]
        [SerializeField] private Behaviour[] movementControllers;

        private Rigidbody2D body;

        public Vector2 Position => body != null ? body.position : (Vector2)transform.position;
        public bool HasSpaceSuit { get; private set; }
        public float CurrentOxygenTank { get; private set; }
        public float OxygenTankFraction => Mathf.Clamp01(CurrentOxygenTank / Mathf.Max(0.1f, tankCapacitySeconds));
        public bool IsDead { get; private set; }
        public CrewZone CurrentZone { get; private set; }
        public string DeathReason { get; private set; }
        public CrewDeathCause DeathCause { get; private set; }
        public string DeathAdvice { get; private set; }
        public event Action<EvaCrewState> Changed;

        internal void ConfigureMovement(Behaviour movement, float oxygenSeconds)
        {
            movementControllers = new[] { movement };
            tankCapacitySeconds = oxygenSeconds;
        }

        private void Awake()
        {
            body = GetComponent<Rigidbody2D>();
            ApplySprite();
        }

        internal void EquipSuit()
        {
            if (IsDead || HasSpaceSuit)
                return;

            HasSpaceSuit = true;
            CurrentOxygenTank = Mathf.Max(0.1f, tankCapacitySeconds);
            ApplySprite();
            Changed?.Invoke(this);
        }

        internal void RemoveSuit()
        {
            if (IsDead || !HasSpaceSuit)
                return;

            HasSpaceSuit = false;
            CurrentOxygenTank = 0f;
            ApplySprite();
            Changed?.Invoke(this);
        }

        internal void RestoreSuit(bool equipped, float oxygen)
        {
            HasSpaceSuit = equipped;
            CurrentOxygenTank = equipped ? Mathf.Clamp(oxygen, 0f, tankCapacitySeconds) : 0f;
            ApplySprite();
            Changed?.Invoke(this);
        }

        internal void SetZone(CrewZone zone)
        {
            if (CurrentZone == zone)
                return;

            CurrentZone = zone;
            Changed?.Invoke(this);
        }

        internal void ConsumeTank(float seconds)
        {
            if (IsDead)
                return;

            CurrentOxygenTank = Mathf.Max(0f, CurrentOxygenTank - seconds);
            if (CurrentOxygenTank <= 0f)
                Kill(CrewDeathCause.TankEmpty, "Tu tanque llegó a cero mientras estabas en una zona sin aire respirable.",
                    "Vuelve a la esclusa con oxígeno suficiente para cerrar la compuerta y represurizar.");
            else
                Changed?.Invoke(this);
        }

        internal void Kill(CrewDeathCause cause, string reason, string advice)
        {
            if (IsDead)
                return;

            IsDead = true;
            DeathCause = cause;
            DeathReason = reason;
            DeathAdvice = advice;
            if (body != null)
            {
                body.linearVelocity = Vector2.zero;
                body.angularVelocity = 0f;
                body.simulated = false;
            }

            if (movementControllers != null)
            {
                foreach (Behaviour controller in movementControllers)
                {
                    if (controller != null)
                        controller.enabled = false;
                }
            }

            Changed?.Invoke(this);
        }

        private void ApplySprite()
        {
            Sprite sprite = HasSpaceSuit ? suitSprite : interiorSprite;
            if (bodySprite != null && sprite != null)
                bodySprite.sprite = sprite;
        }
    }
}
