using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;
using UnityEngine.InputSystem.LowLevel;

namespace BaseLunar
{
    internal static class LunarControls
    {
        private static Gamepad lastPad;
        private static bool padWasLast;
        public static bool UsingPS4 => padWasLast && IsPS4(lastPad);
        public static string ClosePrompt => UsingPS4 ? "○  ·  Salir" : "Esc  ·  Salir";

        public static Gamepad PS4
        {
            get
            {
                if (IsPS4(lastPad))
                    return lastPad;
                foreach (Gamepad device in Gamepad.all)
                    if (IsPS4(device))
                        return device;
                return null;
            }
        }

        private static bool IsPS4(Gamepad pad) => pad != null && pad.added && pad.enabled &&
            pad.layout.StartsWith("DualShock4", System.StringComparison.OrdinalIgnoreCase);

        // El callback recibe los eventos en orden y lee cada valor antes de que Unity aplique el estado nuevo.
        public static void TrackActivity(InputEventPtr input, InputDevice device)
        {
            if (!input.IsA<StateEvent>() && !input.IsA<DeltaStateEvent>())
                return;

            if (device is Mouse mouse)
            {
                if (Moved(input, mouse.delta, 1f) || Moved(input, mouse.scroll, 0.01f) ||
                    Moved(input, mouse.position, 1f, comparePrevious: true) || Pressed(input, device))
                    padWasLast = false;
                return;
            }
            if (device is Keyboard)
            {
                if (Pressed(input, device))
                    padWasLast = false;
                return;
            }
            if (device is Gamepad pad && IsPS4(pad) &&
                (Moved(input, pad.leftStick, 0.015f, comparePrevious: true, minimum: 0.0625f) ||
                 Moved(input, pad.dpad, 0.2f, comparePrevious: true, minimum: 0.25f) || Pressed(input, device)))
            {
                lastPad = pad;
                padWasLast = true;
            }
        }

        private static bool Pressed(InputEventPtr input, InputDevice device)
        {
            foreach (InputControl control in input.EnumerateChangedControls(device))
                if (control is ButtonControl button && !button.isPressed &&
                    button.ReadValueFromEvent(input, out float value) && value > 0.5f)
                    return true;
            return false;
        }

        private static bool Moved(InputEventPtr input, InputControl<Vector2> control, float threshold,
            bool comparePrevious = false, float minimum = 0f)
        {
            if (!control.ReadValueFromEvent(input, out Vector2 current) || current.sqrMagnitude < minimum)
                return false;
            Vector2 change = comparePrevious ? current - control.ReadValue() : current;
            return change.sqrMagnitude >= threshold;
        }

        public static Vector2 Direction(Gamepad pad)
        {
            if (pad == null) return Vector2.zero;
            Vector2 dpad = pad.dpad.ReadValue();
            if (dpad.sqrMagnitude > 0) return dpad;
            Vector2 stick = pad.leftStick.ReadValue();
            return stick.sqrMagnitude >= 0.04f ? stick : Vector2.zero;
        }

        public static string Tutorial(string text)
        {
            if (!UsingPS4) return text;
            return text.Replace("WASD o clic", "la cruceta o la palanca izquierda")
                .Replace("pulsa E ", "pulsa Cuadrado ").Replace("Pulsa E ", "Pulsa Cuadrado ")
                .Replace("usa E ", "usa Cuadrado ").Replace("pulsar E ", "pulsar Cuadrado ")
                .Replace("presiona E ", "presiona Cuadrado ").Replace("plano con M", "plano con Triángulo");
        }
    }
}
