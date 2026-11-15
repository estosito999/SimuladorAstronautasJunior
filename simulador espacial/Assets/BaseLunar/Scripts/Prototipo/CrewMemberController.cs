using UnityEngine;
using UnityEngine.InputSystem;

namespace BaseLunar
{
    [RequireComponent(typeof(Rigidbody2D))]
    public sealed class CrewMemberController : MonoBehaviour
    {
        private Rigidbody2D body;
        private EvaCrewState eva;
        private LunarCrewArt artwork;
        private Vector2 input;
        private Vector2? destination;
        private Vector2 previousPosition;
        private float blockedTime;
        public bool ControlsLocked { get; set; }
        internal float OxygenSpeedMultiplier { get; set; } = 1f;

        internal void MoveTo(Vector2 point)
        {
            destination = point;
            blockedTime = 0f;
            previousPosition = body.position;
        }

        internal void Bind(EvaCrewState state, LunarCrewArt visual)
        {
            eva = state;
            artwork = visual;
        }

        private void Awake() => body = GetComponent<Rigidbody2D>();

        private void Update()
        {
            Keyboard keys = Keyboard.current;
            if (ControlsLocked || eva.IsDead)
            {
                input = Vector2.zero;
                destination = null;
                return;
            }

            float x = keys == null ? 0f : (keys.dKey.isPressed ? 1f : 0f) - (keys.aKey.isPressed ? 1f : 0f);
            float y = keys == null ? 0f : (keys.wKey.isPressed ? 1f : 0f) - (keys.sKey.isPressed ? 1f : 0f);
            input = Vector2.ClampMagnitude(new Vector2(x, y), 1f);
            Vector2 pad = LunarControls.UsingPS4 ? LunarControls.Direction(LunarControls.PS4) : Vector2.zero;
            if (pad.sqrMagnitude > 0f)
                input = pad;
            if (input.sqrMagnitude > 0f)
                destination = null;
            else if (destination.HasValue)
            {
                Vector2 offset = destination.Value - body.position;
                if (offset.sqrMagnitude <= 0.06f * 0.06f || blockedTime > 0.22f)
                    destination = null;
                else
                    input = Vector2.ClampMagnitude(offset / 0.22f, 1f);
            }

        }

        private void LateUpdate()
        {
            if (artwork != null && !eva.IsDead)
                artwork.Walk(ControlsLocked ? Vector2.zero : body.linearVelocity, Time.deltaTime);
        }

        private void FixedUpdate()
        {
            if (destination.HasValue)
            {
                blockedTime = (body.position - previousPosition).sqrMagnitude < 0.000025f
                    ? blockedTime + Time.fixedDeltaTime : 0f;
                previousPosition = body.position;
            }
            body.linearVelocity = (ControlsLocked ? Vector2.zero : input) *
                (eva.CurrentZone == CrewZone.Exterior ? 4.7f : 5.4f) * OxygenSpeedMultiplier;
        }
    }
}
