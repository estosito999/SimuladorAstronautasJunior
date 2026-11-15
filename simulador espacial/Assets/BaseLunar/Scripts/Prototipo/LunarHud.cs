using System;
using System.Collections.Generic;
using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed partial class LunarHud
    {
        private readonly Color panel = Ink("151E2C");
        private readonly Color line = Ink("35485C");
        private readonly Color white = Ink("EDF5FA");
        private readonly Color muted = Ink("A5B7C9");
        private readonly Color mint = Ink("65EBCB");
        private readonly Color gold = Ink("FFC687");
        private readonly Color paper = Ink("F1EEE5");
        private readonly Color ink = Ink("162637");
        private readonly Color indigo = Ink("2C5071");
        private readonly Color steel = Ink("526473");
        private GUIStyle title, endingTitle, heading, body, small, button, paragraph;
        private GUIStyle cleanButton, centeredBody;
        private float width, height;
        private float scale;
        private bool dragging;
        private Vector2 dragPoint;
        private Vector2 previousDragPoint;
        private int swept;
        private Texture2D discTexture;
        private Texture2D breathVignette;
        private readonly Texture2D maraPortrait = Resources.Load<Texture2D>("Selene/mara-mapache");
        private readonly Color orange = Ink("F29353"), graphite = Ink("343841"), cloud = Ink("F5F4F0");
        private readonly Texture2D handIcon = Resources.Load<Texture2D>("Selene/interact-hand");
        private readonly Texture2D mapIcon = Resources.Load<Texture2D>("Selene/map-icon");
        private readonly Texture2D earthView = Resources.Load<Texture2D>("Selene/telescope-earth");
        private readonly Texture2D marsMap = Resources.Load<Texture2D>("Selene/mars-trek-mola");
        private bool overviewHidden = PlayerPrefs.GetInt("Selene.HideOverview", 0) == 1;
        private bool rewardsVisible;
        private int collectionSection, collectionPage;
        private string collectionCode = "", codeFeedback = "";
        private bool pointerActive, pointerWasActive, pointerUsed, pointerTracking;
        private Vector2 padPointer, padDown;
        private EventType padEvent;
        private int pointerFrame = -1;

        public void ReleaseTextures()
        {
            if (discTexture != null)
                UnityEngine.Object.Destroy(discTexture);
            if (breathVignette != null)
                UnityEngine.Object.Destroy(breathVignette);
        }

        public void CancelDrag()
        {
            dragging = false;
            swept = 0;
        }

        public void Begin(bool usePadPointer)
        {
            if (title == null)
            {
                title = Style(34, FontStyle.Bold);
                endingTitle = Style(58, FontStyle.Bold);
                heading = Style(20, FontStyle.Bold);
                body = Style(15);
                paragraph = new GUIStyle(body) { wordWrap = true };
                centeredBody = new GUIStyle(body) { alignment = TextAnchor.MiddleCenter };
                small = Style(12, FontStyle.Bold);
                button = new GUIStyle(GUI.skin.button) { fontSize = 15, fontStyle = FontStyle.Bold };
                cleanButton = new GUIStyle(GUIStyle.none)
                    { alignment = TextAnchor.MiddleCenter, fontSize = 14, fontStyle = FontStyle.Bold };
            }

            scale = Mathf.Max(0.05f, Mathf.Min(Screen.width / 875f, Screen.height / 590f));
            width = Screen.width / scale;
            height = Screen.height / scale;
            GUI.matrix = Matrix4x4.Scale(new Vector3(scale, scale, 1f));
            pointerActive = usePadPointer && LunarControls.UsingPS4;
            if (!pointerActive && pointerWasActive)
            {
                CancelDrag();
                purgeStarted = -1f;
                pointerTracking = false;
                pointerWasActive = false;
            }
            if (pointerActive && Event.current.type == EventType.Repaint && pointerFrame != Time.frameCount)
                UpdatePadPointer();
        }

        private void UpdatePadPointer()
        {
            pointerFrame = Time.frameCount;
            pointerUsed = false;
            if (!pointerWasActive)
                padPointer = new Vector2(width / 2f, height / 2f);
            pointerWasActive = true;
            var pad = LunarControls.PS4;
            Vector2 direction = LunarControls.Direction(pad);
            padPointer += new Vector2(direction.x, -direction.y) * Mathf.Min(0.05f, Time.unscaledDeltaTime) * 590f;
            padPointer = new Vector2(Mathf.Clamp(padPointer.x, 5, width - 5), Mathf.Clamp(padPointer.y, 5, height - 5));
            padEvent = EventType.Ignore;
            if (pad.buttonSouth.wasPressedThisFrame)
            {
                padDown = padPointer;
                pointerTracking = true;
                padEvent = EventType.MouseDown;
            }
            else if (pointerTracking && pad.buttonSouth.wasReleasedThisFrame)
            {
                pointerTracking = false;
                padEvent = EventType.MouseUp;
            }
            else if (pointerTracking && pad.buttonSouth.isPressed)
                padEvent = EventType.MouseDrag;
        }

        private Vector2 PointerPosition => pointerActive && !Event.current.isMouse ? padPointer : Event.current.mousePosition;

        private bool PointerEvent(EventType type) =>
            (Event.current.type == type && Event.current.button == 0) ||
            (pointerActive && !pointerUsed && Event.current.type == EventType.Repaint && padEvent == type);

        private void UsePointer()
        {
            if (Event.current.type == EventType.Repaint)
                pointerUsed = true;
            else
                Event.current.Use();
        }

        private bool VirtualClick(Rect rect)
        {
            if (!pointerActive || Event.current.type != EventType.Repaint || !PointerEvent(EventType.MouseUp) ||
                !rect.Contains(padDown) || !rect.Contains(padPointer))
                return false;
            UsePointer();
            return true;
        }

        public void DrawControllerCursor()
        {
            if (pointerActive && Event.current.type == EventType.Repaint)
            {
                Dot(padPointer, 18, graphite);
                Dot(padPointer, 11, orange);
                Dot(padPointer, 4, cloud);
            }
        }

        private static GUIStyle Style(int size, FontStyle weight = FontStyle.Normal) =>
            new(GUI.skin.label) { fontSize = size, fontStyle = weight, clipping = TextClipping.Clip };

        private static void Fill(Rect rect, Color color)
        {
            Color old = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = old;
        }

        private void Card(Rect rect)
        {
            Fill(rect, panel);
            Fill(new Rect(rect.x, rect.y, rect.width, 1), line);
            Fill(new Rect(rect.x, rect.yMax - 1, rect.width, 1), line);
        }

        private static void Text(Rect rect, string value, Color color, GUIStyle style)
        {
            style.normal.textColor = color;
            style.hover.textColor = color;
            style.active.textColor = color;
            style.focused.textColor = color;
            style.onNormal.textColor = color;
            style.onHover.textColor = color;
            style.onActive.textColor = color;
            style.onFocused.textColor = color;
            GUI.Label(rect, value, style);
        }

        private void Label(float x, float y, float w, string value, Color color, GUIStyle style) =>
            Text(new Rect(x, y, w, style.fontSize + 11), value, color, style);

        private bool Button(Rect rect, string label) => GUI.Button(rect, label, button) || VirtualClick(rect);

        private bool Control(Rect rect, string label, bool primary = false)
        {
            bool hovered = rect.Contains(PointerPosition);
            Fill(new Rect(rect.x, rect.y + 2, rect.width, rect.height), Ink("B1B7B5"));
            Fill(rect, primary ? hovered ? Ink("44749A") : indigo : hovered ? Color.white : Ink("DFE4E2"));
            Color foreground = primary ? Color.white : ink;
            cleanButton.normal.textColor = foreground;
            cleanButton.hover.textColor = foreground;
            cleanButton.active.textColor = foreground;
            return GUI.Button(rect, label, cleanButton) || VirtualClick(rect);
        }

        private void Instrument(Rect rect)
        {
            Fill(new Rect(rect.x + 2, rect.y + 3, rect.width, rect.height), new Color(0.04f, 0.09f, 0.14f, 0.42f));
            Fill(rect, paper);
        }

        public void Top(StationResources data, int day, int campaignDays, int done, int limit,
            int packetsSent, string room, EvaCrewState crew, AirlockController airlock, bool alertVisible, Action retry)
        {
            var toggle = new Rect(width - 62, 26, 39, 40);
            if (!overviewHidden)
            {
                Fill(new Rect(16, 16, width - 32, 62), new Color(0.135f, 0.17f, 0.21f, 0.86f));
                Fill(new Rect(16, 16, width - 32, 1), new Color(0.65f, 0.71f, 0.75f, 0.54f));
                Label(29, 20, 210, "ESTACIÓN SELENE", Ink("BBCBD5"), small);
                Label(29, 38, 190, room, white, heading);
                float scaleMetrics = (width - 295f) / 580f;
                Metric(225, "POTENCIA", $"{data.GenerationKw:0.0} kW", white);
                Metric(225 + 77 * scaleMetrics, "DATOS ENVIADOS", packetsSent.ToString(), mint);
                Metric(225 + 179 * scaleMetrics, "AGUA", $"{data.Reserves.Water:0}", white);
                Metric(225 + 255 * scaleMetrics, "COMIDA", $"{data.Reserves.Food:0}", white);
                Metric(225 + 332 * scaleMetrics, "CASCO", $"{data.HullPercent:0} %", data.HullPercent < 40 ? gold : white);
                Metric(225 + 410 * scaleMetrics, "CAMPAÑA", day == 0 ? $"{campaignDays} días" : $"Día {day} / {campaignDays}", white);
                if (day > 0)
                    Metric(225 + 523 * scaleMetrics, "TRABAJOS", $"{done} / {limit}", white);
            }
            if (Control(toggle, overviewHidden ? "+" : "−"))
            {
                overviewHidden = !overviewHidden;
                PlayerPrefs.SetInt("Selene.HideOverview", overviewHidden ? 1 : 0);
            }
            if (retry != null && RoundControl(new Rect(width - 145, 89, 124, 30), "↶ Reiniciar día"))
                retry();

            if (crew.HasSpaceSuit || crew.CurrentZone == CrewZone.Airlock)
            {
                float y = alertVisible ? 153 : 90;
                Instrument(new Rect(17, y, 245, 51));
                Label(29, y + 4, 228, crew.HasSpaceSuit ? "TRAJE EQUIPADO" : "TRAJE SIN EQUIPAR",
                    crew.HasSpaceSuit && crew.CurrentOxygenTank < 20f ? Ink("A3442C") : indigo, small);
                Label(29, y + 22, 226, PressureText(airlock), ink, body);
            }
        }

        public void HazardAlerts(LunarHazards hazards)
        {
            bool lowOxygen = hazards.OxygenDanger > 0;
            bool highRadiation = hazards.RadiationDanger > 0;
            const float bubbleWidth = 280f;
            float total = lowOxygen && highRadiation ? 2 * bubbleWidth + 14f : bubbleWidth;
            float x = (width - total) * 0.5f;
            if (lowOxygen)
            {
                AlertBubble(new Rect(x, 90, bubbleWidth, 52), Ink("9DDEF1"), Ink("E7989B"), Ink("154655"), "OXÍGENO CRÍTICO",
                    hazards.UsingTank ? "Regresa pronto a la esclusa." : "Revisa las reservas de soporte vital.");
                x += bubbleWidth + 14;
            }
            if (highRadiation)
                AlertBubble(new Rect(x, 90, bubbleWidth, 52), Ink("A7E4B0"), Ink("E59088"), Ink("1C4827"), "RADIACIÓN CRÍTICA",
                    "Entra a la estación para bajar la exposición.");
        }

        private void AlertBubble(Rect r, Color surface, Color warning, Color textColor, string headingText, string detail)
        {
            Pill(new Rect(r.x + 2, r.y + 3, r.width, r.height), new Color(0.04f, 0.06f, 0.12f, 0.42f));
            Pill(r, Color.Lerp(surface, warning, 0.23f));
            Dot(new Vector2(r.x + 29, r.yMax - 1), 10, surface);
            Dot(new Vector2(r.xMax - 21, r.y + 17), 10f, Ink("B8505D"));
            Label(r.x + 27, r.y + 4, 225, headingText, textColor, small);
            Label(r.x + 24, r.y + 24, 253, detail, textColor, body);
        }

        private Rect HazardArea => new(16, height - 148, 126, 130);

        public void Hazards(LunarHazards hazards, float stress, bool survival)
        {
            Rect r = HazardArea;
            if (survival)
                r.width += 57;
            Fill(r, new Color(0.14f, 0.18f, 0.22f, 0.93f));
            HazardMeter(new Rect(r.x + 8, r.y + 9, 51, 110), hazards.UsingTank ? "TRAJE" : "BASE",
                hazards.Oxygen, hazards.OxygenDanger, Ink("64CDEB"), Ink("44C6FF"), lowIsDanger: true);
            HazardMeter(new Rect(r.x + 68, r.y + 9, 51, 110), "DOSIS",
                hazards.Exposure, hazards.RadiationDanger, Ink("7CBF87"), Ink("39EF79"));
            if (survival)
                HazardMeter(new Rect(r.x + 125, r.y + 9, 51, 110), "ESTRÉS", stress,
                    Mathf.InverseLerp(0.72f, 1f, stress), Ink("DEAA62"), Ink("FB795D"), symbol: "EST");
            if (hazards.Outdoors)
            {
                var route = new Rect(r.xMax + 9, r.yMax - 30, 143, 29);
                Fill(route, hazards.OnProtectedRoute ? Ink("23563D") : Ink("48484D"));
                Label(route.x + 9, route.y + 5, 127, hazards.OnProtectedRoute ? "Ruta protegida" : "Fuera de la ruta",
                    hazards.OnProtectedRoute ? Ink("B9F4C1") : white, small);
            }
        }

        private void HazardMeter(Rect rect, string label, float value, float danger, Color normal, Color critical,
            bool lowIsDanger = false, string symbol = "RAD")
        {
            float pulse = 0.55f + 0.45f * Mathf.Sin(Time.unscaledTime * 7f);
            Color color = danger <= 0 ? normal : Color.Lerp(normal, critical, 0.65f + pulse * 0.35f);
            if (lowIsDanger)
                symbol = "O₂";
            Label(rect.x + 12, rect.y - 2, 43, danger > 0 ? symbol + " !" : symbol, danger > 0 ? critical : white, small);
            Label(rect.x + 5, rect.yMax - 8, rect.width + 2, label, white, small);
            Rect track = new(rect.x + 15, rect.y + 20, 19, 76);
            Fill(new Rect(track.x - 1, track.y - 1, track.width + 2, track.height + 2),
                danger > 0 ? color : Ink("ABBBC3"));
            Fill(track, danger > 0 ? Color.Lerp(Ink("DCE4E8"), critical, pulse * 0.21f) : Ink("DCE4E8"));
            float filled = track.height * Mathf.Clamp01(value);
            Fill(new Rect(track.x, track.yMax - filled, track.width, filled), color);
            float mark = track.yMax - track.height * (lowIsDanger ? 0.22f : 0.72f);
            Fill(new Rect(track.x, mark, track.width, 1), Ink("334D60"));
        }

        public void HazardTint(float oxygen, float radiation)
        {
            float severity = Mathf.Max(oxygen, radiation);
            if (severity <= 0)
                return;

            if (breathVignette == null)
            {
                const int size = 64;
                var colors = new Color32[size * size];
                for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    Vector2 p = new((x + 0.5f) / 32f - 1, (y + 0.5f) / 32f - 1);
                    float shade = Mathf.SmoothStep(0, 1, Mathf.InverseLerp(0.38f, 1.13f, p.magnitude));
                    colors[y * size + x] = new Color32(255, 255, 255, (byte)(shade * 255));
                }
                breathVignette = new Texture2D(size, size, TextureFormat.RGBA32, false)
                    { name = "Visión de sofocación", wrapMode = TextureWrapMode.Clamp };
                breathVignette.SetPixels32(colors);
                breathVignette.Apply(false, true);
            }

            float breathing = 0.72f + Mathf.Sin(Time.unscaledTime * 5f) * 0.22f;
            Rect screen = new(0, 0, width, height);
            Color tint = Color.Lerp(Ink("55D5EE"), Ink("50D264"), radiation / Mathf.Max(0.01f, oxygen + radiation));
            tint.a = (0.12f + severity * 0.18f) * (oxygen > radiation ? breathing : 1f);
            Fill(screen, tint);
            Color previous = GUI.color;
            GUI.color = new Color(0.63f, 0.06f, 0.13f, (0.16f + severity * 0.38f) * breathing);
            GUI.DrawTexture(screen, breathVignette);
            GUI.color = previous;
        }

        private static string PressureText(AirlockController airlock) => airlock.Pressure switch
        {
            AirlockPressure.Pressurized => "Esclusa presurizada",
            AirlockPressure.Depressurizing => "Despresurizando…",
            AirlockPressure.Vacuum => "Esclusa en vacío",
            _ => "Represurizando…"
        };

        private void Metric(float x, string label, string number, Color color)
        {
            Fill(new Rect(x - 9, 27, 1, 39), new Color(0.68f, 0.71f, 0.76f, 0.30f));
            Label(x, 21, 105, label, Ink("BBCBD5"), small);
            Label(x, 38, 112, number, color, heading);
        }

        private Rect Dialog(float w, float h, Color? surface = null, Color? accent = null, bool guided = false)
        {
            Fill(new Rect(0, 0, width, height), new Color(0.02f, 0.035f, 0.065f, 0.72f));
            Rect rect = new((width - w) / 2f, (height - h) / 2f + (guided ? -42f : 22f), w, h);
            Card(rect);
            if (surface.HasValue)
                Fill(new Rect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2), surface.Value);
            Fill(new Rect(rect.x, rect.y, rect.width, 3f), accent ?? mint);
            return rect;
        }

        public void MainMenu(Action begin, Action collections, Action exit)
        {
            Fill(new Rect(0, 0, width, height), graphite);
            Rect r = new((width - 790) / 2f, (height - 440) / 2f, 790, 440);
            Dot(new Vector2(r.x + 502, r.y + 213), 351, Ink("49505A"));
            Dot(new Vector2(r.x + 502, r.y + 213), 290, Ink("565B63"));
            Raccoon(new Vector2(r.x + 502, r.y + 200), 205);
            Label(r.x + 480, r.y + 324, 110, LunarCrewArt.PilotName, cloud, heading);
            float x = r.x + 680, y = r.y + 74;
            if (LunarControls.UsingPS4)
            {
                Label(x - 10, y + 7, 136, "Cruceta / palanca", cloud, small);
                Label(x - 10, y + 36, 136, "Mover o apuntar", muted, small);
                Label(x - 10, y + 89, 136, "□  Usar", cloud, body);
                Label(x - 10, y + 130, 136, "△  Mapa", cloud, body);
                Label(x - 10, y + 171, 147, "×  Elegir o entrenar", cloud, small);
                Label(x - 10, y + 211, 136, "○  Volver", cloud, body);
            }
            else
            {
                Keycap(new Rect(x + 37, y, 31, 29), "W");
                Keycap(new Rect(x + 1, y + 34, 31, 29), "A");
                Keycap(new Rect(x + 37, y + 34, 31, 29), "S");
                Keycap(new Rect(x + 73, y + 34, 31, 29), "D");
                Label(x, y + 69, 175, "Mover · o clic en el suelo", white, small);
                Keycap(new Rect(x + 1, y + 111, 31, 29), "E");
                Label(x + 40, y + 116, 135, "Usar", white, small);
                Keycap(new Rect(x + 1, y + 154, 31, 29), "M");
                Label(x + 40, y + 159, 135, "Mapa", white, small);
                Keycap(new Rect(x + 1, y + 198, 61, 27), "Enter");
                Label(x + 72, y + 201, 99, "Diálogo", white, small);
                Keycap(new Rect(x + 1, y + 239, 75, 27), "Espacio");
                Label(x + 84, y + 242, 96, "Ejercicio", white, small);
            }
            Label(r.x + 26, r.y + 56, 322, "TURNO DE MANTENIMIENTO LUNAR", orange, small);
            Label(r.x + 24, r.y + 83, 335, "Estación Selene", cloud, title);
            float buttonsY = r.y + 226;
            if (MenuCircle(new Vector2(r.x + 66, buttonsY), "▶", "Jugar", primary: true)) begin();
            if (MenuCircle(new Vector2(r.x + 178, buttonsY), "★", "Coleccionables")) collections();
            if (MenuCircle(new Vector2(r.x + 290, buttonsY), "×", "Salir")) exit();
        }

        private bool MenuCircle(Vector2 point, string icon, string label, bool primary = false)
        {
            const float radius = 42f;
            bool hover = (PointerPosition - point).sqrMagnitude <= radius * radius;
            Dot(point + Vector2.up * 4f, radius * 2, Ink("24262C"));
            Dot(point, radius * 2, primary ? (hover ? Ink("FFB37B") : orange) : cloud);
            Rect symbol = new(point.x - radius, point.y - radius, radius * 2, radius * 2);
            cleanButton.normal.textColor = graphite;
            cleanButton.hover.textColor = graphite;
            cleanButton.active.textColor = graphite;
            int font = cleanButton.fontSize;
            cleanButton.fontSize = 27;
            bool clicked = (GUI.Button(symbol, icon, cleanButton) || VirtualClick(symbol)) && hover;
            cleanButton.fontSize = font;
            Text(new Rect(point.x - 59, point.y + 52, 118, 32), label, cloud, centeredBody);
            return clicked;
        }

        private bool RoundControl(Rect rect, string label, bool primary = false)
        {
            Rect hit = new(rect.x + rect.height * 0.14f, rect.y, rect.width - rect.height * 0.28f, rect.height);
            bool hover = hit.Contains(PointerPosition);
            Pill(rect, primary ? (hover ? Ink("FFB37B") : orange) : (hover ? Color.white : cloud));
            cleanButton.normal.textColor = graphite;
            cleanButton.hover.textColor = graphite;
            cleanButton.active.textColor = graphite;
            return GUI.Button(hit, label, cleanButton) || VirtualClick(hit);
        }

        private void Pill(Rect shape, Color color)
        {
            Dot(new Vector2(shape.x + shape.height / 2f, shape.center.y), shape.height, color);
            Dot(new Vector2(shape.xMax - shape.height / 2f, shape.center.y), shape.height, color);
            Fill(new Rect(shape.x + shape.height / 2f, shape.y, shape.width - shape.height, shape.height), color);
        }

        private void Raccoon(Vector2 center, float size, bool faceOnly = false)
        {
            Color fur = Ink("A5A7AB"), mask = Ink("30333C");
            if (!faceOnly)
            {
                Dot(center + new Vector2(-0.31f, 0.30f) * size, size * 0.40f, mask);
                Dot(center + new Vector2(-0.36f, 0.30f) * size, size * 0.15f, fur);
                Dot(center + Vector2.up * size * 0.30f, size * 0.58f, Ink("6B6D71"));
            }
            for (int side = -1; side <= 1; side += 2)
            {
                Vector2 ear = center + new Vector2(0.24f * side, -0.30f) * size;
                Dot(ear, size * 0.24f, mask);
                Dot(ear, size * 0.14f, fur);
            }
            Dot(center, size * 0.71f, fur);
            for (int side = -1; side <= 1; side += 2)
            {
                Dot(center + new Vector2(0.16f * side, -0.02f) * size, size * 0.30f, mask);
                Dot(center + new Vector2(0.16f * side, -0.04f) * size, size * 0.078f, cloud);
            }
            Dot(center + Vector2.up * size * 0.11f, size * 0.28f, cloud);
            Dot(center + Vector2.up * size * 0.048f, size * 0.096f, mask);
        }

        public void Collection(Action close, Action<int> openJunior)
        {
            Rect r = Dialog(700, 491, graphite, orange);
            Label(r.x + 28, r.y + 19, 535, "Coleccionables", cloud, title);
            if (RoundControl(new Rect(r.xMax - 125, r.y + 23, 97, 30), "Volver"))
            {
                close();
                return;
            }
            for (int i = 0; i < LunarCollection.Sections.Length; i++)
                if (RoundControl(new Rect(r.x + 28 + i * 163, r.y + 77, 155, 34),
                    LunarCollection.Sections[i], collectionSection == i) && collectionSection != i)
                {
                    collectionSection = i;
                    collectionPage = 0;
                }
            if (collectionSection == 3)
            {
                for (int i = 0; i < LunarJunior.Modules.Length; i++)
                {
                    Rect row = new(r.x + 28, r.y + 132 + i * 80, 644, 64);
                    Pill(row, cloud);
                    Dot(new Vector2(row.x + 33, row.center.y), 40, Ink("DDD9D1"));
                    Text(new Rect(row.x + 13, row.y + 12, 40, 40), (i + 1).ToString("00"), graphite, centeredBody);
                    Label(row.x + 61, row.y + 7, 427, LunarJunior.Modules[i].Name, graphite, heading);
                    Label(row.x + 61, row.y + 34, 423, LunarJunior.Modules[i].Goal, steel, small);
                    string action = LunarCollection.HasRecorded($"Junior.{i}") ? "Repetir" : "Abrir";
                    if (RoundControl(new Rect(row.xMax - 125, row.y + 15, 98, 34), action, true))
                        openJunior(i);
                }
                return;
            }
            var entries = collectionSection == 0 ? LunarCollection.Deaths :
                collectionSection == 1 ? LunarCollection.Endings : LunarCollection.Data;
            const int pageSize = 6;
            int first = collectionPage * pageSize;
            int last = Mathf.Min(entries.Length, first + pageSize);
            for (int i = first; i < last; i++)
            {
                var entry = entries[i];
                bool unlocked = LunarCollection.IsUnlocked(entry.Key);
                Rect row = new(r.x + 28, r.y + 124 + (i - first) * 40, r.width - 56, 34);
                Pill(row, unlocked ? cloud : Ink("4F535B"));
                Dot(new Vector2(row.x + 18, row.center.y), 9, unlocked ? orange : muted);
                Label(row.x + 33, row.y + 5, 486, entry.Name, unlocked ? ink : cloud, body);
                Label(row.xMax - 116, row.y + 7, 108, unlocked ? "DESBLOQUEADO" : "PENDIENTE",
                    unlocked ? steel : muted, small);
            }
            if (collectionPage > 0 && RoundControl(new Rect(r.x + 28, r.y + 373, 94, 30), "Anterior"))
                collectionPage--;
            if (last < entries.Length && RoundControl(new Rect(r.x + 129, r.y + 373, 105, 30), "Siguiente"))
                collectionPage++;
            Label(r.x + 244, r.y + 375, 140, $"{collectionPage + 1} / {(entries.Length + pageSize - 1) / pageSize}", muted, body);
            Label(r.x + 28, r.y + 424, 121, "Código secreto", cloud, body);
            collectionCode = GUI.TextField(new Rect(r.x + 153, r.y + 422, 61, 29), collectionCode, 4);
            if (RoundControl(new Rect(r.x + 226, r.y + 419, 116, 34), "Canjear", true))
                codeFeedback = LunarCollection.TryCode(collectionCode) ? "Colección completa." : "Código incorrecto.";
            Label(r.x + 357, r.y + 425, 290, codeFeedback, cloud, body);
        }

        public void Cinematic(string caption, string maraSpeech, bool arrival, Action skip)
        {
            Fill(new Rect(0, 0, width, 40), new Color(0.03f, 0.06f, 0.10f, 0.93f));
            Fill(new Rect(0, height - 73, width, 73), new Color(0.03f, 0.06f, 0.10f, 0.93f));
            if (!string.IsNullOrEmpty(caption))
                Label(25, height - 46, width - 300, caption, white, body);
            if (!string.IsNullOrEmpty(maraSpeech))
                Instructor(arrival ? "BIENVENIDA" : "DESPEDIDA", maraSpeech, manualAdvance: false);
            string key = LunarControls.UsingPS4 ? "Options" : "N";
            if (Control(new Rect(width - 243, height - 57, 215, 37),
                key + (arrival ? " · Saltar introducción" : " · Saltar despedida")))
                skip();
        }

        public void VictoryCinematic(bool space, bool inscription)
        {
            if (space)
                for (int i = 0; i < 36; i++)
                {
                    float x = Mathf.Repeat(i * 127.4f - Time.unscaledTime * (11f + 2f * (i % 3)), width);
                    float y = Mathf.Repeat(i * 65.87f + 29f, height);
                    Dot(new Vector2(x, y), 1.5f + i % 3, new Color(0.9f, 0.93f, 1f, 0.67f));
                }
            Fill(new Rect(0, 0, width, 38), Ink("151922"));
            Fill(new Rect(0, height - 53, width, 53), Ink("151922"));
            if (inscription)
            {
                Fill(new Rect(0, 0, width, height), new Color(0.04f, 0.06f, 0.09f, 0.42f));
                Label(width / 2f - 218, height * 0.65f, 500, "¿CONTINUARÁ?", cloud, endingTitle);
            }
        }

        public void SleepTransition(float progress, bool dawn, int day, bool finished)
        {
            float fade = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0f, 0.36f, progress)) *
                (1f - Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0.69f, 1f, progress)));
            Fill(new Rect(0, 0, width, height), new Color(0.035f, 0.055f, 0.09f, fade));
            if (!dawn)
            {
                float bob = Mathf.Sin(progress * 13f) * 5f;
                Color sleeping = new(muted.r, muted.g, muted.b, fade * Mathf.InverseLerp(0.5f, 0.35f, progress));
                Label(width / 2f - 34, height / 2f + 6 + bob, 22, "z", sleeping, body);
                Label(width / 2f - 12, height / 2f - 9 + bob, 26, "z", sleeping, heading);
                Label(width / 2f + 12, height / 2f - 30 + bob, 34, "Z", sleeping, title);
            }
            else if (!finished)
            {
                Color morning = new(white.r, white.g, white.b, fade * Mathf.InverseLerp(0.5f, 0.62f, progress));
                Label(width / 2f - 54, height / 2f - 20, 145, $"Día {day}", morning, title);
            }
        }

        private Rect JournalPage(int day, string section)
        {
            Rect r = Dialog(694, 492, Ink("EEE2C9"), Ink("AE754C"));
            Fill(new Rect(r.x + 42, r.y + 12, 1, r.height - 24), Ink("CD9A8B"));
            for (int i = 0; i < 12; i++)
                Dot(new Vector2(r.x + 17, r.y + 23 + i * 39), 7, Ink("8E7969"));
            Label(r.x + 61, r.y + 22, 550, $"{section}  /  DÍA {day:00}", Ink("825637"), small);
            return r;
        }

        public void Journal(int day, List<(string Name, string Impact)> jobs, string entry,
            float oxygen, float radiation, float stress, float fatigue, Action next)
        {
            Rect r = JournalPage(day, "BITÁCORA PERSONAL");
            Label(r.x + 61, r.y + 40, 550, "Diario del astronauta", ink, title);
            JournalMetric(r.x + 61, r.y + 103, "OXÍGENO", oxygen, Ink("3E89A4"));
            JournalMetric(r.x + 215, r.y + 103, "RADIACIÓN", radiation, Ink("55854E"));
            JournalMetric(r.x + 369, r.y + 103, "ESTRÉS", stress, Ink("A87235"));
            JournalMetric(r.x + 523, r.y + 103, "DESGASTE", fatigue, Ink("9C5861"));

            Label(r.x + 61, r.y + 150, 420, "TRABAJOS DE HOY", Ink("825637"), small);
            for (int i = 0; i < jobs.Count; i++)
            {
                float y = r.y + 176 + i * 27;
                Dot(new Vector2(r.x + 68, y + 10), 6, Ink("5E886A"));
                Label(r.x + 81, y, 306, jobs[i].Name, ink, body);
                Label(r.x + 401, y + 1, 260, jobs[i].Impact, Ink("526650"), small);
                Fill(new Rect(r.x + 61, y + 23, 606, 1), Ink("DACBB0"));
            }

            Label(r.x + 61, r.y + 268, 420, "NOTA AL APAGAR LA LUZ", Ink("825637"), small);
            Text(new Rect(r.x + 61, r.y + 295, 602, 124), entry, Ink("48392D"), paragraph);
            Label(r.x + 61, r.yMax - 43, 180, "HOJA 1 / 2", Ink("825637"), small);
            string key = LunarControls.UsingPS4 ? "X" : "Enter";
            if (Control(new Rect(r.xMax - 253, r.yMax - 51, 225, 34), $"Boletín solar  ·  {key} →", true))
                next();
        }

        public void SolarJournal(int day, int lastDay, Action back, Action next)
        {
            var flare = LunarNasaData.FlareForDay(day);
            Rect r = JournalPage(day, "ARCHIVO DE CLIMA ESPACIAL");
            Label(r.x + 61, r.y + 40, 550, "Boletín solar", ink, title);
            Rect card = new(r.x + 61, r.y + 107, 604, 183);
            Fill(card, Ink("26334B"));
            Vector2 sun = new(card.x + 79, card.y + 89);
            Dot(sun, 111, Ink("54414A"));
            Dot(sun, 83, Ink("CC7850"));
            Dot(sun, 62, Ink("F4AA61"));
            Stroke(sun + new Vector2(18, -13), sun + new Vector2(41, -38), 4, Ink("F6CD8B"));
            Stroke(sun + new Vector2(41, -38), sun + new Vector2(55, -20), 3, Ink("F6CD8B"));
            Label(card.x + 154, card.y + 19, 425, "NASA CCMC  /  DONKI", gold, small);
            Label(card.x + 154, card.y + 42, 425, $"Llamarada solar {flare.Class}", white, heading);
            Label(card.x + 154, card.y + 83, 425, $"Pico registrado  ·  {flare.Date}  ·  {flare.Peak}", white, body);
            Label(card.x + 154, card.y + 113, 425, $"Región solar activa  ·  {flare.Region}", muted, body);
            Label(card.x + 154, card.y + 143, 425, "Registro histórico de mayo de 2024", gold, small);
            Label(r.x + 61, r.y + 311, 400, "NOTA DEL ASTRONAUTA", Ink("825637"), small);
            Text(new Rect(r.x + 61, r.y + 335, 603, 47),
                "Mañana, antes de salir, voy a revisar el escudo y seguir el sendero de luces verdes.", ink, paragraph);
            Label(r.x + 61, r.y + 388, 430, "La radiación de Selene es una lectura de la simulación.", steel, small);
            if (Control(new Rect(r.xMax - 156, r.y + 380, 128, 30), "Fuente DONKI"))
                Application.OpenURL(flare.Source);
            Label(r.x + 61, r.yMax - 43, 105, "HOJA 2 / 2", Ink("825637"), small);
            if (Control(new Rect(r.x + 170, r.yMax - 51, 130, 34), "← Diario"))
                back();
            string key = LunarControls.UsingPS4 ? "X" : "Enter";
            if (Control(new Rect(r.xMax - 253, r.yMax - 51, 225, 34),
                (day == lastDay ? "Cerrar diario" : "Pasar al día siguiente") + "  ·  " + key, true))
                next();
        }

        public void MarsTrek(int[] order, int round, int missed, Action<int> select, Action close)
        {
            Rect r = Dialog(842, 445, Ink("252830"), Ink("E69564"));
            var sites = LunarNasaData.MarsSites;
            bool done = round == sites.Length;
            Label(r.x + 24, r.y + 17, 550, "INVESTIGACIÓN  /  CARTOGRAFÍA PLANETARIA", gold, small);
            Label(r.x + 24, r.y + 40, 600, "Atlas marciano · Mars Trek", white, heading);
            if (Control(new Rect(r.xMax - 131, r.y + 22, 107, 32), LunarControls.ClosePrompt))
            {
                close();
                return;
            }
            Rect map = new(r.x + 24, r.y + 96, 488, 244);
            Fill(new Rect(map.x - 2, map.y - 2, map.width + 4, map.height + 4), Ink("64686E"));
            if (marsMap != null)
                GUI.DrawTexture(map, marsMap, ScaleMode.ScaleToFit);
            else
                Fill(map, Ink("3A3D44"));
            for (int i = 1; i < 6; i++)
                Fill(new Rect(map.x + map.width * i / 6, map.y, 1, map.height), new Color(1, 1, 1, i == 3 ? 0.64f : 0.25f));
            for (int i = 1; i < 6; i++)
                Fill(new Rect(map.x, map.y + map.height * i / 6, map.width, 1), new Color(1, 1, 1, i == 3 ? 0.64f : 0.25f));
            Label(map.x + 7, map.y + 3, 26, "N", white, small);
            Label(map.x + 7, map.yMax - 23, 26, "S", white, small);
            Label(map.x + 5, map.yMax + 13, 130, "180° O", muted, small);
            Label(map.center.x - 6, map.yMax + 13, 84, "0°", muted, small);
            Label(map.xMax - 48, map.yMax + 13, 62, "180° E", muted, small);
            for (int i = 0; i < sites.Length; i++)
            {
                var site = sites[i];
                Vector2 point = new(map.x + (site.Longitude + 180f) / 360f * map.width,
                    map.y + (90f - site.Latitude) / 180f * map.height);
                if (Array.IndexOf(order, i) < round)
                {
                    Dot(point, 16, ink);
                    Dot(point, 9, mint);
                    Fill(new Rect(point.x - 22, point.y + 11, 97, 20), Ink("34363D"));
                    Label(point.x - 17, point.y + 11, 91, site.Name, white, small);
                }
                else if (Control(new Rect(point.x - 16, point.y - 16, 32, 32), ((char)('A' + i)).ToString(), i != missed))
                {
                    select(i);
                    return;
                }
            }

            Rect side = new(map.xMax + 22, map.y, 284, 244);
            Fill(side, Ink("393C43"));
            Label(side.x + 15, side.y + 14, 254, $"SITIOS LOCALIZADOS  ·  {round} / {sites.Length}", done ? mint : gold, small);
            Label(side.x + 15, side.y + 43, 254, done ? "Atlas completado" : $"Busca {sites[order[round]].Name}", white, heading);
            if (!done)
                Text(new Rect(side.x + 15, side.y + 76, 253, 60), sites[order[round]].Clue +
                    (LunarControls.UsingPS4 ? " Elige una baliza con X." : " Haz clic en una baliza."), white, paragraph);
            if (round > 0)
                Text(new Rect(side.x + 15, side.y + (done ? 83 : 161), 253, 77), sites[order[round - 1]].Fact, muted, paragraph);
            if (missed >= 0)
                Label(side.x + 15, side.y + 137, 254, "Esa baliza corresponde a otro sitio.", gold, small);
            Label(r.x + 24, r.yMax - 46, 528, marsMap != null
                ? "Relieve en color · Mars Global Surveyor / MOLA · NASA/JPL Mars Trek"
                : "Vista de coordenadas · NASA/JPL Mars Trek", muted, small);
            if (Control(new Rect(r.xMax - 190, r.yMax - 54, 166, 32), "Abrir Mars Trek"))
                Application.OpenURL(LunarNasaData.MarsTrek);
        }

        private void JournalMetric(float x, float y, string name, float value, Color tint)
        {
            Label(x, y, 142, $"{name}  {value:P0}", ink, small);
            Fill(new Rect(x, y + 23, 127, 4), Ink("D8CCB6"));
            Fill(new Rect(x, y + 23, 127 * value, 4), tint);
        }

        public void Television(LunarVhs vhs, Action close)
        {
            Rect r = Dialog(660, 440, Ink("232B3C"), Ink("80B9B8"));
            Label(r.x + 25, r.y + 17, 390, "TELEVISOR DEL CAMAROTE  /  VHS", Ink("A0CFCD"), small);
            if (Control(new Rect(r.xMax - 130, r.y + 13, 105, 27), "Apagar"))
            {
                close();
                return;
            }

            if (vhs.Current < 0)
            {
                Label(r.x + 25, r.y + 43, 610, "Elige una cinta", white, heading);
                Label(r.x + 25, r.y + 72, 610, "Una reproducción por cinta en esta partida.", muted, body);
                for (int i = 0; i < LunarVhs.Programs.Length; i++)
                {
                    var program = LunarVhs.Programs[i];
                    bool watched = vhs.Watched(i);
                    Rect tape = new(r.x + 25 + (i % 2) * 310, r.y + 114 + (i / 2) * 145, 300, 132);
                    Fill(tape, Ink("151C2B"));
                    Fill(new Rect(tape.x + 1, tape.y + 3, 4, tape.height - 6),
                        watched ? Ink("565E6A") : Ink(program.Accent));
                    Label(tape.x + 17, tape.y + 11, 270, program.Genre, watched ? muted : Ink(program.Accent), small);
                    Label(tape.x + 17, tape.y + 31, 270, program.Title, white, heading);
                    Dot(new Vector2(tape.x + 24, tape.y + 105), 10, Ink("6D7782"));
                    Dot(new Vector2(tape.x + 42, tape.y + 105), 10, Ink("6D7782"));
                    if (watched)
                        Label(tape.x + 164, tape.y + 96, 123, "YA VISTA", muted, small);
                    else if (Control(new Rect(tape.x + 164, tape.y + 85, 119, 32), "Reproducir", true))
                        vhs.Play(i, Time.unscaledTime);
                }
                return;
            }

            var clip = LunarVhs.Programs[vhs.Current];
            Color accent = Ink(clip.Accent);
            float progress = Mathf.Clamp01(vhs.Progress);
            Rect screen = new(r.x + 25, r.y + 53, 610, 300);
            Fill(screen, Ink("101725"));
            Label(screen.x + 18, screen.y + 13, 525, clip.Title, accent, heading);
            Label(screen.xMax - 83, screen.y + 18, 72, "▶ VHS", white, small);
            TapePicture(new Rect(screen.x + 18, screen.y + 49, 574, 170), vhs.Current, progress, accent);
            int caption = Mathf.Min(clip.Captions.Length - 1, (int)(progress * clip.Captions.Length));
            Text(new Rect(screen.x + 18, screen.yMax - 66, screen.width - 36, 52), clip.Captions[caption], white, paragraph);
            Fill(new Rect(screen.x, screen.yMax + 15, screen.width, 3), Ink("414D61"));
            Fill(new Rect(screen.x, screen.yMax + 15, screen.width * progress, 3), accent);
            if (Control(new Rect(r.xMax - 155, r.yMax - 48, 130, 30), "Expulsar cinta"))
                vhs.Stop();
        }

        private void TapePicture(Rect screen, int tape, float progress, Color accent)
        {
            Fill(screen, tape == 1 ? Ink("382638") : tape == 2 ? Ink("243B3B") : Ink("172F48"));
            Vector2 center = screen.center;
            float wave = Mathf.Sin(progress * 27f);
            switch (tape)
            {
                case 0:
                    if (earthView != null)
                        GUI.DrawTexture(new Rect(center.x - 70, center.y - 68, 136, 136), earthView, ScaleMode.ScaleToFit);
                    else
                        Dot(center, 110, accent);
                    for (int i = -1; i <= 1; i++)
                        Stroke(center + new Vector2(-190, i * 25 + wave * 9),
                            center + new Vector2(-85, i * 25 + wave * 9), 2, accent);
                    Fill(new Rect(screen.x, screen.yMax - 24, screen.width, 24), Ink("28446B"));
                    Label(screen.x + 14, screen.yMax - 21, 200, "BOLETÍN  ·  EN DIRECTO", white, small);
                    break;
                case 1:
                    Fill(new Rect(center.x - 69, screen.y + 10, 138, 125), Ink("735064"));
                    Dot(center + new Vector2(34, -40), 32, Ink("FFDCA3"));
                    for (int i = -1; i <= 1; i += 2)
                    {
                        Vector2 actor = center + new Vector2(i * (133 - progress * 57), 27 + wave * 2);
                        Dot(actor + new Vector2(0, -35), 36, accent);
                        Dot(actor + new Vector2(0, 8), 62, Ink(i < 0 ? "BB697C" : "5F516F"));
                    }
                    Fill(new Rect(center.x - 15, center.y + 28, 30, 19), Ink("F2E1C5"));
                    break;
                case 2:
                    Fill(new Rect(screen.x, center.y, screen.width, screen.height / 2), Ink("4F6865"));
                    for (int i = 0; i < 8; i++)
                    {
                        if (i > progress * 9f)
                            break;
                        Vector2 print = new(screen.x + 80 + i * 57, center.y + 26 + i % 2 * 19);
                        Dot(print, 25, Ink("233E3D"));
                        Stroke(print + new Vector2(-8, 2), print + new Vector2(8, -5), 2, accent);
                    }
                    break;
                case 3:
                    for (int i = 0; i < 20; i++)
                        Dot(new Vector2(screen.x + 14 + (i * 47) % 546, screen.y + 12 + (i * 49) % 143), 2 + i % 3, white);
                    Dot(new Vector2(screen.xMax - 52, center.y - 25), 61, accent);
                    Dot(new Vector2(screen.xMax - 61, center.y - 34), 12, Ink("C79557"));
                    Vector2 rocket = new(screen.x + 60 + progress * 410, center.y + wave * 28);
                    Stroke(rocket - new Vector2(30, 0), rocket, 9, accent);
                    Dot(rocket, 27, Ink("FFEFD0"));
                    Dot(rocket + new Vector2(4, -2), 9, Ink("3C91AA"));
                    break;
            }
            for (int i = 0; i < 21; i++)
                Fill(new Rect(screen.x, screen.y + i * 8, screen.width, 1), new Color(0.02f, 0.05f, 0.1f, 0.2f));
        }

        private void Keycap(Rect rect, string key)
        {
            Fill(new Rect(rect.x, rect.y + 2, rect.width, rect.height), Ink("1D2E44"));
            Fill(rect, Ink("E4E9E9"));
            Label(rect.x + 7, rect.y + 1, 27, key, ink, heading);
        }

        private Rect InstructorArea => new((width - 754) / 2f, 86, 754, 124);

        public void Instructor(string topic, string speech, bool manualAdvance = true)
        {
            Rect r = InstructorArea;
            Instrument(r);
            Fill(new Rect(r.x, r.y, r.width, 2), Ink("A46936"));
            MaraMedallion(new Vector2(r.x + 64, r.y + 61), 96);
            Label(r.x + 125, r.y + 11, 580, "MARA  ·  " + topic, indigo, small);
            Text(new Rect(r.x + 125, r.y + 33, r.width - 146, 55), speech, ink, paragraph);
            if (!manualAdvance)
                return;
            float bob = Mathf.Sin(Time.unscaledTime * 6f) * 3f;
            Rect key = new(r.xMax - 111, r.yMax - 33 + bob, 64, 22);
            Fill(key, indigo);
            Label(key.x + 10, key.y + 1, 63, LunarControls.UsingPS4 ? "× / □" : "ENTER", white, small);
            float arrowX = key.xMax + 14, arrowY = key.y + 10;
            Stroke(new Vector2(arrowX, arrowY - 3), new Vector2(arrowX + 6, arrowY + 3), 3, indigo);
            Stroke(new Vector2(arrowX + 6, arrowY + 3), new Vector2(arrowX + 12, arrowY - 3), 3, indigo);
        }

        private void MaraMedallion(Vector2 center, float diameter)
        {
            Dot(center + new Vector2(1, 2), diameter, Ink("536371"));
            Dot(center, diameter, Ink("A46936"));
            Dot(center, diameter - 6, Ink("DDE8E7"));
            if (maraPortrait != null)
            {
                float side = diameter * 0.74f;
                GUI.DrawTexture(new Rect(center.x - side / 2f, center.y - side / 2f, side, side),
                    maraPortrait, ScaleMode.ScaleToFit);
            }
        }

        public void DayTerminal(int day, int campaignDays, int done, int limit, bool pendingReport, Action close)
        {
            Rect r = Dialog(525, 253, paper, indigo);
            Label(r.x + 28, r.y + 24, 432, "TERMINAL DE JORNADA", indigo, small);
            Label(r.x + 28, r.y + 50, 466, $"Supervivencia · Día {day} / {campaignDays}", ink, heading);
            Label(r.x + 28, r.y + 87, 460, $"{done}/{limit} trabajos completados hoy", indigo, body);
            string detail = pendingReport ? "Envía el informe en Comunicaciones antes de dormir." :
                day == campaignDays ? "Al dormir termina la campaña. Completa los ocho tipos de trabajo." :
                "Descansar recupera salud y moral. Consume 5 de oxígeno, 3 de agua y 4 de comida.";
            Text(new Rect(r.x + 28, r.y + 118, 467, 42), detail, ink, paragraph);
            Label(r.x + 28, r.y + 166, 467,
                LunarControls.Tutorial("Tras dos trabajos, pulsa E junto a tu cama para dormir."), indigo, body);
            if (Control(new Rect(r.xMax - 130, r.y + 192, 101, 35), "Cerrar"))
                close();
        }

        public void Telescope(int day, Action close)
        {
            Rect r = Dialog(605, 505, Ink("101823"), Ink("D98548"));
            Label(r.x + 25, r.y + 18, 525, "La Tierra", white, heading);
            Rect image = new(r.center.x - 197, r.y + 47, 394, 394);
            Fill(new Rect(image.x - 3, image.y - 3, 400, 400), Ink("263543"));
            if (earthView != null)
            {
                GUI.DrawTexture(image, earthView, ScaleMode.ScaleToFit);
                EarthOrbit(image, day);
            }
            else
                Label(image.x + 10, image.center.y - 20, 345, "Vista del telescopio no disponible.", muted, body);
            Label(r.x + 26, r.yMax - 46, 315, $"REGISTRO ORBITAL  /  DÍA {Mathf.Max(1, day):00}", orange, small);
            if (Button(new Rect(r.xMax - 177, r.yMax - 48, 152, 32),
                LunarControls.UsingPS4 ? "□ / ○  ·  Salir" : "E / Esc  ·  Salir"))
                close();
        }

        private void EarthOrbit(Rect image, int day)
        {
            int traffic = 1 + Mathf.Clamp((day - 1) / 2, 0, 7);
            Vector2 center = image.center;
            for (int ring = 0; ring < (day >= 9 ? 2 : 1); ring++)
            {
                float radius = 146f + 17f * ring;
                for (int step = 0; step < 32; step++)
                {
                    float a = step * Mathf.PI / 16f, b = a + Mathf.PI / 16f;
                    Vector2 p = center + new Vector2(Mathf.Cos(a) * radius, Mathf.Sin(a) * (44 + 16 * ring));
                    Vector2 q = center + new Vector2(Mathf.Cos(b) * radius, Mathf.Sin(b) * (44 + 16 * ring));
                    if (step >= 16 && step % 2 == 0 || step < 16)
                        Stroke(p, q, 1f, new Color(0.57f, 0.91f, 0.97f, 0.36f));
                }
            }
            for (int i = 0; i < traffic; i++)
            {
                float angle = Time.unscaledTime * (0.29f + 0.02f * (i % 3)) + i * 2.4f;
                Vector2 scout = center + new Vector2(Mathf.Cos(angle) * (151f + i % 2 * 17), Mathf.Sin(angle) * (48f + i % 3 * 19));
                Dot(scout, 15, Ink("263F52"));
                Stroke(scout + Vector2.left * 8f, scout + Vector2.right * 8f, 3, Ink("79D9E1"));
                Dot(scout, 7, cloud);
                Dot(scout + Vector2.up * 3f, 3, orange);
            }
            if (day >= 11)
            {
                Vector2 dock = center + new Vector2(112f, -88f);
                Stroke(dock - Vector2.right * 24, dock + Vector2.right * 24, 5, cloud);
                Stroke(dock - Vector2.up * 17, dock + Vector2.up * 17, 4, Ink("79D9E1"));
                Dot(dock, 14, orange);
            }
        }

        public void SkipTutorial(Action skip)
        {
            var r = new Rect(width - 345, height - 53, 157, 35);
            Instrument(r);
            if (Control(r, LunarControls.UsingPS4 ? "Options · Saltar" : "N   Saltar tutorial"))
                skip();
        }

        private void MaraBubble(Rect game, string tip)
        {
            Rect bubble = new(game.x, game.yMax + 9f, Mathf.Min(570, game.width), 91);
            Pill(bubble, cloud);
            Fill(new Rect(bubble.x + 18, bubble.y - 5, 11, 6), paper);
            MaraMedallion(new Vector2(bubble.x + 33, bubble.y + 36), 49);
            Label(bubble.x + 64, bubble.y + 6, 188, "MARA · CURIOSIDAD", indigo, small);
            Text(new Rect(bubble.x + 64, bubble.y + 25, bubble.width - 88, 62), tip, ink, paragraph);
        }

        public bool TryMove(out Vector2 point, bool talkingToMara = false)
        {
            point = default;
            Event current = Event.current;
            if (current.type != EventType.MouseDown || current.button != 0 ||
                current.mousePosition.y < 145f || current.mousePosition.y > height - 120f ||
                HazardArea.Contains(current.mousePosition) ||
                (talkingToMara && InstructorArea.Contains(current.mousePosition)))
                return false;

            point = new Vector2(current.mousePosition.x * scale, Screen.height - current.mousePosition.y * scale);
            current.Use();
            return true;
        }

        public void Controls(string hint, string detail, Action openMap)
        {
            var hand = new Vector2(width - 49, height - 48);
            bool ready = hint != null;
            if (ready)
                Dot(hand, 72 + Mathf.Sin(Time.unscaledTime * 5f) * 3, Ink("50C4D7"));
            Dot(hand, 62, ready ? Ink("203F64") : Ink("3F4B58"));
            if (handIcon != null)
            {
                Color previous = GUI.color;
                GUI.color = ready ? Ink("D5FFF2") : Ink("A6B4BE");
                GUI.DrawTexture(new Rect(hand.x - 27, hand.y - 28, 55, 55), handIcon, ScaleMode.ScaleToFit);
                GUI.color = previous;
            }
            if (LunarControls.UsingPS4)
            {
                Dot(hand, 27, graphite);
                Text(new Rect(hand.x - 14, hand.y - 14, 28, 28), "□", cloud, centeredBody);
            }
            if (hint != null)
            {
                float tagWidth = Mathf.Clamp(body.CalcSize(new GUIContent(hint)).x + 22, 118, 270);
                var tag = new Rect(hand.x + 32 - tagWidth, hand.y - 58, tagWidth, 25);
                Instrument(tag);
                Label(tag.x + 8, tag.y - 1, tag.width - 12, hint, ink, body);
            }
            else if (!string.IsNullOrEmpty(detail))
            {
                Instrument(new Rect(width - 283, height - 111, 266, 27));
                Label(width - 275, height - 110, 252, detail, ink, body);
            }

            var mapButton = new Rect(width - 161, height - 77, 62, 56);
            Dot(mapButton.center, 57, Ink("354B60"));
            if (mapIcon != null)
                GUI.DrawTexture(new Rect(mapButton.x + 6, mapButton.y + 7, 50, 41), mapIcon, ScaleMode.ScaleToFit);
            Label(mapButton.center.x - 10, mapButton.y + 12, 34, LunarControls.UsingPS4 ? "△" : "M",
                new Color(0.16f, 0.26f, 0.34f, 0.56f), heading);
            if (GUI.Button(mapButton, GUIContent.none, GUIStyle.none) || VirtualClick(mapButton))
                openMap();
        }

        private bool Drag(Rect start, Rect release, out Vector2 point)
        {
            point = PointerPosition;
            if (PointerEvent(EventType.MouseDown) && start.Contains(point))
            {
                dragging = true;
                dragPoint = point;
                previousDragPoint = point;
                UsePointer();
            }
            else if (dragging && PointerEvent(EventType.MouseDrag))
            {
                previousDragPoint = dragPoint;
                dragPoint = point;
                UsePointer();
            }
            else if (dragging && PointerEvent(EventType.MouseUp))
            {
                dragging = false;
                previousDragPoint = dragPoint;
                dragPoint = point;
                UsePointer();
                return release.Contains(point);
            }

            return false;
        }

        public void Toast(string content, bool suitPanel, bool alerts)
        {
            float y = (alerts ? 153 : 90) + (suitPanel ? 62 : 0);
            Rect bubble = new(16, y, Mathf.Min(width - 32, Mathf.Max(235, body.CalcSize(new GUIContent(content)).x + 64)), 48);
            Dot(new Vector2(bubble.x + 23, bubble.yMax + 2), 11, cloud);
            Pill(bubble, cloud);
            Dot(new Vector2(bubble.x + 24, bubble.center.y), 9, orange);
            Text(new Rect(bubble.x + 41, bubble.y + 6, bubble.width - 57, 37), content, graphite, paragraph);
        }

        private static readonly int[] BoardContacts = { 2, 1, 3 };
        private static readonly int[] ValveRates = { 2, 3, 5 };
        private readonly int[] anchorTurns = new int[3];
        private readonly int[] pulseOrder = new int[4];
        private int contactStep, valveMask, pulseStep;
        private float purgeStarted, dial, dialSince, pulseStarted;

        public void ResetTask()
        {
            CancelDrag();
            contactStep = valveMask = pulseStep = 0;
            purgeStarted = dialSince = -1f;
            dial = 17f;
            anchorTurns[0] = 1;
            anchorTurns[1] = 3;
            anchorTurns[2] = 2;
            for (int i = 0; i < pulseOrder.Length; i++)
            {
                int next = UnityEngine.Random.Range(0, 3);
                pulseOrder[i] = i > 0 && next == pulseOrder[i - 1] ? (next + 1) % 3 : next;
            }
            pulseStarted = Time.unscaledTime;
        }

        public void Connect(int number, Action complete, Action<string> mistake)
        {
            if (contactStep >= BoardContacts.Length)
                return;
            if (number != BoardContacts[contactStep])
            {
                contactStep = 0;
                mistake("Contacto incorrecto. Reinicia el orden");
                return;
            }
            if (++contactStep == BoardContacts.Length)
                complete();
        }

        public void Task(string name, string hint, int task, Action complete,
            Action<string> mistake, Action close, string tip = null)
        {
            var (size, surface, accent) = task switch
            {
                0 => (new Vector2(590, 354), "282B30", "F29353"),
                1 => (new Vector2(670, 354), "2E3136", "F2A469"),
                2 => (new Vector2(469, 415), "292C31", "F29353"),
                3 => (new Vector2(545, 404), "32343A", "F6A465"),
                4 => (new Vector2(798, 478), "292D32", "FFD18C"),
                5 => (new Vector2(704, 364), "303338", "F0A06B"),
                _ => (new Vector2(574, 423), "34353A", "F5BD79")
            };
            Rect r = Dialog(size.x, size.y, Ink(surface), Ink(accent), guided: tip != null);
            Label(r.x + 26, r.y + 18, r.width - 160, name, white, heading);
            if (LunarControls.UsingPS4)
                hint = task switch
                {
                    0 => "Sujeta el conector con X y llévalo al puerto indicado.",
                    2 => "Mantén X sobre el botón naranja hasta llenar el anillo.",
                    4 => "Sujeta el cepillo con X y pásalo por toda la superficie.",
                    _ => hint
                };
            Label(r.x + 26, r.y + 51, r.width - 52, hint, muted, body);
            Rect work = new(r.x + 26, r.y + 83, r.width - 52, r.height - 147);
            switch (task)
            {
                case 0: Board(work, complete, mistake); break;
                case 1: Irrigation(work, complete); break;
                case 2: Purge(work, complete); break;
                case 3: Pulses(work, complete, mistake); break;
                case 4: Brush(work, complete); break;
                case 5: Antenna(work, complete); break;
                case 6: Anchors(work, complete); break;
            }
            if (Button(new Rect(r.xMax - 135, r.yMax - 47, 109, 32), LunarControls.ClosePrompt))
                close();
            if (tip != null)
                MaraBubble(r, tip);
        }

        public void Exercise(LunarExercise game, Action close, string tip = null)
        {
            Rect r = Dialog(528, 342, Ink("343841"), Ink("F29353"), guided: tip != null);
            Label(r.x + 26, r.y + 18, 450, game.Name, white, heading);
            string repeatKey = LunarControls.UsingPS4 ? "X" : "Espacio";
            Label(r.x + 26, r.y + 52, 475, $"Pulsa {repeatKey} rápido. Cada pulsación cuenta como una repetición.", muted, body);
            Rect field = new(r.x + 27, r.y + 91, 210, 171);
            Fill(field, Ink("23262B"));
            Fill(new Rect(field.x + 17, field.yMax - 26, field.width - 34, 3), Ink("506B7B"));
            Dot(new Vector2(field.center.x, field.yMax - 26), 39, Ink("304250"));
            Vector2 p = new(field.center.x, field.yMax - 63);
            if (game.Routine == 1)
            {
                Stroke(p + new Vector2(-69, 18), p + new Vector2(53, 18), 10, Ink("88898B"));
                Raccoon(p + Vector2.left * 42f, 43);
                Stroke(p + Vector2.left * 24f, p + Vector2.right * 29f, 12, orange);
                ExerciseBar(p - Vector2.up * (16f + 39f * game.JumpHeight));
            }
            else
            {
                p.y += (game.Routine == 2 ? 16f : -38f) * game.JumpHeight;
                Raccoon(p - Vector2.up * 21f, 48);
                Stroke(p + new Vector2(-8, 5), p + new Vector2(-19, 32 - 10f * game.JumpHeight), 7, cloud);
                Stroke(p + new Vector2(8, 5), p + new Vector2(19, 32 - 10f * game.JumpHeight), 7, cloud);
                if (game.Routine == 2)
                    ExerciseBar(p - Vector2.up * 7f);
            }

            float x = r.x + 259;
            Label(x, r.y + 96, 232, "REPETICIONES", orange, small);
            Label(x, r.y + 118, 232, $"{game.Repetitions} / {game.Target}", white, title);
            Label(x, r.y + 175, 234, $"TIEMPO DEL RETO   {game.Remaining:0.0}s", gold, small);
            Meter(new Rect(x + 2, r.y + 204, 211, 10),
                game.Remaining / Mathf.Max(0.1f, game.TimeLimit), game.Remaining <= 1 ? gold : orange);
            Label(x, r.y + 232, 234, game.Retrying ? $"Tiempo agotado. Pulsa {repeatKey}." :
                game.Running ? "¡Sigue!" : $"Pulsa {repeatKey} para empezar.", game.Retrying ? gold : muted, small);
            if (Button(new Rect(r.xMax - 135, r.yMax - 47, 109, 32), LunarControls.ClosePrompt))
                close();
            if (tip != null)
                MaraBubble(r, tip);
        }

        private void ExerciseBar(Vector2 p)
        {
            Stroke(p + Vector2.left * 46f, p + Vector2.right * 46f, 5, cloud);
            Dot(p + Vector2.left * 39f, 23, orange);
            Dot(p + Vector2.right * 39f, 23, orange);
        }

        private void Board(Rect work, Action complete, Action<string> mistake)
        {
            var contacts = new Rect(work.xMax - 250, work.y + 65, 225, 62);
            Fill(work, Ink("34363A"));
            for (int i = 0; i < 6; i++)
            {
                float y = work.y + 24 + i * 31;
                Stroke(new Vector2(work.x + 16, y), new Vector2(work.xMax - 16, y), 1, Ink("55585D"));
            }
            Fill(new Rect(work.x + 29, work.y + 64, 144, 70), Ink("252629"));
            Label(work.x + 38, work.y + 72, 124, "DIAGNÓSTICO", orange, small);
            Label(work.x + 38, work.y + 96, 124, $"{contactStep}/3", white, heading);
            for (int i = 0; i < 3; i++)
            {
                Rect cell = Cell(contacts, i);
                bool solved = Array.IndexOf(BoardContacts, i + 1) < contactStep;
                Dot(cell.center, 52f, Ink("212225"));
                Dot(cell.center, 40f, solved ? Ink("585A60") : Ink("816144"));
                Label(cell.x + 23, cell.y + 16, 35, (i + 1).ToString(), solved ? orange : white, heading);
            }
            Label(contacts.x, work.y + 26, 226,
                $"CONECTA AL PUERTO  {BoardContacts[Mathf.Min(contactStep, 2)]}", orange, small);
            Rect tool = Tool(new Rect(work.x + 28, work.yMax - 56, 125, 42), "CONECTOR", false);
            if (Drag(tool, contacts, out Vector2 point))
            {
                int contact = CellAt(point, contacts);
                if (contact > 0)
                    Connect(contact, complete, mistake);
            }
            if (dragging)
                DrawTool(dragPoint, false);
        }

        private void Irrigation(Rect work, Action complete)
        {
            int flow = 0;
            for (int i = 0; i < 3; i++)
                if ((valveMask & (1 << i)) != 0)
                    flow += ValveRates[i];

            Fill(work, Ink("272A2F"));
            Label(work.x + 17, work.y + 8, 225, $"CAUDAL   {flow} / 7", flow == 7 ? orange : gold, heading);
            Meter(new Rect(work.xMax - 252, work.y + 19, 231, 12), flow / 10f, flow > 7 ? gold : orange);
            float bay = work.width / 3f;
            for (int i = 0; i < 3; i++)
            {
                int bit = 1 << i;
                bool opened = (valveMask & bit) != 0;
                float x = work.x + i * bay + 13;
                Fill(new Rect(x, work.y + 85, bay - 27, 64), Ink("665641"));
                Fill(new Rect(x + 3, work.y + 89, bay - 33, 54), Ink("46494E"));
                for (int j = 0; j < 7; j++)
                {
                    Vector2 sprout = new(x + 19 + j * 23, work.y + 111 + (j % 2) * 15);
                    Dot(sprout, 14, Ink("DE8B56"));
                    Dot(sprout + new Vector2(5, -5), 9, Ink("F1B389"));
                }
                Vector2 pipe = new(x + bay / 2f - 14, work.y + 68);
                Stroke(new Vector2(x + 7, pipe.y), new Vector2(x + bay - 35, pipe.y), 9, Ink("62656A"));
                Stroke(pipe, pipe + Vector2.up * 20f, 8, opened ? Ink("F3AB79") : Ink("62656A"));
                Dot(pipe, 29, graphite);
                Dot(pipe, 19, opened ? orange : Ink("1E2025"));
                Vector2 cap = opened ? pipe - Vector2.up * 23f : pipe;
                Dot(cap, 24, cloud);
                Stroke(cap + Vector2.left * 7f, cap + Vector2.right * 7f, 3, graphite);
                var valve = new Rect(x, work.yMax - 44, bay - 27, 33);
                if (RoundControl(valve, $"+{ValveRates[i]} de caudal  ·  {(opened ? "Tapar" : "Destapar")}", opened))
                {
                    valveMask ^= bit;
                    int updated = flow + (opened ? -ValveRates[i] : ValveRates[i]);
                    if (updated == 7)
                        complete();
                    return;
                }
            }
        }

        private void Purge(Rect work, Action complete)
        {
            const float seconds = 2.3f;
            Vector2 center = work.center;
            const float radius = 76f;
            Event current = Event.current;
            bool inside = (PointerPosition - center).sqrMagnitude <= radius * radius;
            if (PointerEvent(EventType.MouseDown) && inside)
            {
                purgeStarted = Time.unscaledTime;
                UsePointer();
            }
            else if (purgeStarted >= 0f &&
                ((PointerEvent(EventType.MouseDrag) && !inside) || PointerEvent(EventType.MouseUp)))
            {
                purgeStarted = -1f;
                UsePointer();
            }
            float progress = purgeStarted < 0 ? 0 : Mathf.Clamp01((Time.unscaledTime - purgeStarted) / seconds);
            Dot(center, 190, Ink("70747C"));
            Dot(center, 176, graphite);
            for (int i = 0; i < 64 * progress; i++)
            {
                float a = (i / 64f - 0.25f) * 2f * Mathf.PI;
                float b = ((i + 1) / 64f - 0.25f) * 2f * Mathf.PI;
                Stroke(center + 92f * new Vector2(Mathf.Cos(a), Mathf.Sin(a)),
                    center + 92f * new Vector2(Mathf.Cos(b), Mathf.Sin(b)), 7, cloud);
            }
            Dot(center, radius * 2f, inside ? Ink("FFB37B") : orange);
            Label(center.x - 56, center.y - 14, 135, "Pulsa para purgar", graphite, body);
            Label(center.x - 19, center.y + 14, 75, $"{progress:P0}", graphite, heading);
            if (progress >= 1f && current.type == EventType.Repaint)
                complete();
        }

        private void Pulses(Rect work, Action complete, Action<string> mistake)
        {
            const float interval = 0.72f;
            float age = Time.unscaledTime - pulseStarted;
            int flash = Mathf.FloorToInt(age / interval);
            bool playing = flash < pulseOrder.Length;
            int highlighted = playing && age % interval < 0.51f ? pulseOrder[flash] : -1;
            Fill(work, Ink("22252B"));
            Label(work.x + 22, work.y + 18, 338, playing ? "OBSERVA LOS PULSOS" : $"REPITE LOS PULSOS   {pulseStep}/4", Ink("F6A465"), small);
            for (int i = 0; i < pulseOrder.Length; i++)
                Dot(new Vector2(work.x + 31 + i * 24, work.y + 59), 11,
                    i < pulseStep ? orange : Ink("5D6068"));
            for (int i = 0; i < 3; i++)
            {
                Rect key = new(work.x + 22 + i * 153, work.y + 87, 137, 85);
                Color light = Ink(i == 0 ? "F29353" : i == 1 ? "D0D1D3" : "F8E8DA");
                Fill(new Rect(key.x, key.y, key.width, 7), light);
                Rect face = new(key.x, key.y + 8, key.width, key.height - 8);
                if (playing)
                {
                    Fill(face, i == highlighted ? light : Ink("393B42"));
                    Label(key.x + 58, key.y + 29, 36, (i + 1).ToString(), i == highlighted ? panel : white, heading);
                }
                else if (Button(face, (i + 1).ToString()))
                {
                    if (i != pulseOrder[pulseStep])
                    {
                        pulseStep = 0;
                        pulseStarted = Time.unscaledTime;
                        mistake("Pulso incorrecto. Observa la secuencia otra vez");
                    }
                    else if (++pulseStep == pulseOrder.Length)
                        complete();
                    return;
                }
            }
            if (!playing && Button(new Rect(work.x + 22, work.yMax - 53, 191, 33), "Volver a ver los pulsos"))
            {
                pulseStep = 0;
                pulseStarted = Time.unscaledTime;
            }
        }

        public void Transmission(float progress, bool practice)
        {
            Color signal = Ink("F29353");
            Rect r = Dialog(566, 274, Ink("25282E"), signal);
            float flight = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0.05f, 0.76f, progress));
            bool delivered = flight >= 1f;
            Label(r.x + 25, r.y + 16, 516, practice ? "PRUEBA DE ENLACE" : "ENLACE CON LA TIERRA", signal, small);
            Label(r.x + 25, r.y + 36, 516,
                delivered ? "Recepción confirmada" : "Enviando datos de investigación", delivered ? orange : white, heading);

            Vector2 origin = new(r.x + 83, r.y + 136);
            Vector2 earth = new(r.xMax - 83, origin.y);
            for (int i = 1; i < 15; i++)
                Dot(Vector2.Lerp(origin, earth, i / 15f), 4, Ink("62666F"));
            for (int i = 2; i >= 0; i--)
            {
                float position = Mathf.Clamp01(flight - i * 0.05f);
                if (position > 0f && !delivered)
                    Dot(Vector2.Lerp(origin, earth, position), 12 - i * 3, i == 0 ? white : signal);
            }

            Dot(origin, 59, Ink("41454D"));
            Vector2 dish = origin + new Vector2(-2, -4);
            Stroke(dish + new Vector2(-11, -11), dish + new Vector2(-6, 4), 3, signal);
            Stroke(dish + new Vector2(-6, 4), dish + new Vector2(9, 10), 3, signal);
            Stroke(dish, dish + new Vector2(11, -9), 2, white);
            Stroke(dish + new Vector2(-5, 5), dish + new Vector2(-10, 17), 3, white);
            Fill(new Rect(dish.x - 17, dish.y + 16, 20, 3), white);

            Dot(earth, 79, delivered ? Ink("9E6449") : Ink("454A53"));
            if (earthView != null)
                GUI.DrawTexture(new Rect(earth.x - 35, earth.y - 35, 70, 70), earthView, ScaleMode.ScaleToFit);
            else
                Dot(earth, 59, Ink("D88D61"));
            Label(origin.x - 27, origin.y + 46, 85, "SELENE", white, small);
            Label(earth.x - 28, earth.y + 46, 86, "TIERRA", white, small);

            Rect track = new(r.x + 25, r.yMax - 46, r.width - 50, 5);
            Fill(track, Ink("4B4F57"));
            Fill(new Rect(track.x, track.y, track.width * flight, track.height), delivered ? orange : signal);
            Label(track.x, track.y + 8, track.width, delivered ? "PAQUETE RECIBIDO" : "TRANSMISIÓN EN CURSO",
                delivered ? orange : muted, small);
        }

        private void Brush(Rect work, Action complete)
        {
            const int columns = 6, rows = 3;
            const int allClean = (1 << (columns * rows)) - 1;
            var cells = new Rect(work.x + 12, work.y + 42, work.width - 24, work.height - 100);
            Rect tool = Tool(new Rect(work.x + 13, work.yMax - 45, 138, 40), "CEPILLO", true);
            bool released = Drag(tool, cells, out _);
            if (dragging || released)
            {
                int samples = Mathf.Max(1, Mathf.CeilToInt(Vector2.Distance(previousDragPoint, dragPoint) / 8f));
                for (int sample = 0; sample <= samples; sample++)
                {
                    Vector2 point = Vector2.Lerp(previousDragPoint, dragPoint, (float)sample / samples);
                    if (!cells.Contains(point))
                        continue;
                    int x = Mathf.Min(columns - 1, (int)((point.x - cells.x) / cells.width * columns));
                    int y = Mathf.Min(rows - 1, (int)((point.y - cells.y) / cells.height * rows));
                    swept |= 1 << (y * columns + x);
                }
                if (swept == allClean)
                {
                    complete();
                    return;
                }
            }
            int cleaned = 0;
            Fill(new Rect(cells.x - 6, cells.y - 6, cells.width + 12, cells.height + 12), Ink("95999F"));
            float cellWidth = cells.width / columns, cellHeight = cells.height / rows;
            for (int y = 0; y < rows; y++)
            for (int x = 0; x < columns; x++)
            {
                bool clean = (swept & (1 << (y * columns + x))) != 0;
                if (clean) cleaned++;
                var cell = new Rect(cells.x + x * cellWidth + 2, cells.y + y * cellHeight + 2,
                    cellWidth - 4, cellHeight - 4);
                DrawSolarCell(cell, clean);
            }
            Label(work.x + 13, work.y + 4, 300, $"SUPERFICIE LIMPIA   {cleaned}/{columns * rows}", orange, small);
            Meter(new Rect(work.xMax - 295, work.y + 13, 280, 9), (float)cleaned / (columns * rows), orange);
            if (dragging)
                DrawTool(dragPoint, true);
        }

        private void Antenna(Rect work, Action complete)
        {
            const float center = 74f;
            const float tolerance = 4f;
            bool tuned = Mathf.Abs(dial - center) <= tolerance;
            if (!tuned)
                dialSince = -1f;
            else if (dialSince < 0)
                dialSince = Time.unscaledTime;

            Fill(work, Ink("222427"));
            Rect scope = new(work.x + 15, work.y + 14, work.width - 30, 104);
            Fill(scope, Ink("303236"));
            for (int i = 1; i < 6; i++)
                Fill(new Rect(scope.x, scope.y + i * scope.height / 6, scope.width, 1), Ink("51535A"));
            Vector2 last = new(scope.x, scope.center.y);
            for (int i = 1; i <= 80; i++)
            {
                float t = i / 80f;
                float waves = Mathf.Sin(t * 31f + Time.unscaledTime * 4f);
                if (!tuned) waves += Mathf.Cos(t * 93f) * 0.58f;
                Vector2 point = new(scope.x + t * scope.width, scope.center.y + waves * 22);
                Stroke(last, point, 2, tuned ? orange : gold);
                last = point;
            }
            float trackWidth = work.width - 205;
            float x = work.x + 19;
            Fill(new Rect(x, work.y + 132, trackWidth, 8), Ink("383B41"));
            Fill(new Rect(x + trackWidth * (center - tolerance) / 100, work.y + 132,
                trackWidth * tolerance * 2 / 100, 8), orange);
            dial = GUI.HorizontalSlider(new Rect(x, work.y + 145, trackWidth, 25), dial, 0, 100);
            Label(work.xMax - 170, work.y + 132, 160, $"{dial:0.0}   MHz", tuned ? orange : white, heading);
            Label(x, work.y + 174, 350, tuned ? "Mantén la señal estable" : "Desliza el dial hasta la banda verde", muted, small);
            float lockProgress = dialSince < 0 ? 0 : (Time.unscaledTime - dialSince) / 0.85f;
            Meter(new Rect(x, work.y + 198, trackWidth, 8), lockProgress, orange);
            if (lockProgress >= 1f && Mathf.Abs(dial - center) <= tolerance)
                complete();
        }

        private void Anchors(Rect work, Action complete)
        {
            Fill(work, Ink("27282C"));
            Vector2 plate = work.center + Vector2.down * 4;
            Dot(plate, 255f, Ink("6C6658"));
            Dot(plate, 222f, Ink("42444A"));
            Dot(plate, 156f, Ink("57595D"));
            for (int i = 0; i < anchorTurns.Length; i++)
            {
                bool aligned = anchorTurns[i] == 0;
                Vector2 point = plate + (i == 0 ? new Vector2(0, -70) :
                    new Vector2(i == 1 ? -69 : 69, 38));
                Rect socket = new(point.x - 29, point.y - 29, 58, 58);
                Dot(point, 71, Ink("25272B"));
                Dot(point, 61, aligned ? Ink("A9643C") : Ink("796249"));
                if (GUI.Button(socket, GUIContent.none, GUIStyle.none) || VirtualClick(socket))
                {
                    anchorTurns[i] = (anchorTurns[i] + 1) % 4;
                    if (anchorTurns[0] == 0 && anchorTurns[1] == 0 && anchorTurns[2] == 0)
                        complete();
                    return;
                }
                Vector2 direction = anchorTurns[i] switch
                {
                    0 => Vector2.down, 1 => Vector2.right, 2 => Vector2.up, _ => Vector2.left
                };
                Vector2 tip = point + direction * 17;
                Vector2 side = new(-direction.y, direction.x);
                Color color = aligned ? orange : gold;
                Stroke(point - direction * 13, tip, 4, color);
                Stroke(tip, tip - direction * 9 + side * 8, 4, color);
                Stroke(tip, tip - direction * 9 - side * 8, 4, color);
            }
        }

        private static Rect Cell(Rect area, int index) => new(area.x + index * 80, area.y, 65, area.height);

        private void Meter(Rect area, float fraction, Color color)
        {
            Fill(area, Ink("383B41"));
            Fill(new Rect(area.x, area.y, area.width * Mathf.Clamp01(fraction), area.height), color);
        }

        private Rect Tool(Rect tool, string label, bool solar)
        {
            Fill(tool, Ink("45484F"));
            Label(tool.x + 32, tool.y + 9, 88, label, orange, small);
            DrawTool(new Vector2(tool.x + 17, tool.y + 20), solar);
            return tool;
        }

        private void DrawSolarCell(Rect cell, bool clean)
        {
            Fill(cell, Ink("262930"));
            Rect inner = new(cell.x + 3, cell.y + 3, cell.width - 6, cell.height - 6);
            Fill(inner, clean ? Ink("666A70") : Ink("746A5C"));
            for (int i = 1; i <= 5; i++)
                Fill(new Rect(inner.x + i * inner.width / 6, inner.y, 1, inner.height),
                    clean ? Ink("C7CBD0") : Ink("9B876D"));
            if (!clean)
                for (int i = 0; i < 12; i++)
                    Dot(new Vector2(inner.x + 5 + (i * 19 % 91) * (inner.width - 10) / 91,
                        inner.y + 4 + (i * 17 % 39) * (inner.height - 8) / 39),
                        i % 3 + 3, Ink("C1A281"));
        }

        private static Vector2 DialDirection(float fraction)
        {
            float angle = Mathf.Lerp(145, 395, fraction) * Mathf.Deg2Rad;
            return new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
        }

        private void Dot(Vector2 point, float size, Color color)
        {
            if (discTexture == null)
            {
                const int resolution = 64;
                discTexture = new Texture2D(resolution, resolution, TextureFormat.RGBA32, false);
                var pixels = new Color32[resolution * resolution];
                for (int y = 0; y < resolution; y++)
                for (int x = 0; x < resolution; x++)
                {
                    float distance = new Vector2(x - 31.5f, y - 31.5f).magnitude;
                    pixels[y * resolution + x] = new Color32(255, 255, 255,
                        (byte)(255 * Mathf.Clamp01(32f - distance)));
                }
                discTexture.SetPixels32(pixels);
                discTexture.Apply(false, true);
            }
            Color old = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(new Rect(point.x - size / 2, point.y - size / 2, size, size), discTexture);
            GUI.color = old;
        }

        private static void Stroke(Vector2 from, Vector2 to, float thickness, Color color)
        {
            Vector2 offset = to - from;
            Matrix4x4 old = GUI.matrix;
            GUI.matrix = old * Matrix4x4.TRS(from,
                Quaternion.Euler(0, 0, Mathf.Atan2(offset.y, offset.x) * Mathf.Rad2Deg), Vector3.one);
            Fill(new Rect(0, -thickness / 2, offset.magnitude, thickness), color);
            GUI.matrix = old;
        }

        private void DrawTool(Vector2 point, bool solar)
        {
            Fill(new Rect(point.x - 10, point.y - 3, 18, 6), solar ? Ink("AE7441") : mint);
            if (solar)
                Fill(new Rect(point.x + 3, point.y - 7, 8, 14), Ink("F6CB80"));
            else
                for (int i = -1; i <= 1; i++)
                    Fill(new Rect(point.x + 5, point.y + i * 3 - 1, 7, 2), Ink("FFE2A1"));
        }

        private static int CellAt(Vector2 point, Rect area)
        {
            if (!area.Contains(point))
                return 0;
            float x = point.x - area.x;
            return x % 80f < 65f ? (int)(x / 80f) + 1 : 0;
        }

        public void MapLabels(Camera camera, Vector2[] centers)
        {
            for (int i = 0; i < centers.Length; i++)
            {
                Vector3 screen = camera.WorldToScreenPoint(centers[i] + Vector2.up * 4.35f);
                Vector2 point = new(screen.x / scale, (Screen.height - screen.y) / scale);
                string label = LunarMap.RoomNames[i];
                float span = small.CalcSize(new GUIContent(label)).x + 15f;
                if (point.x - span * 0.5f < 4 || point.x + span * 0.5f > width - 356 ||
                    point.y < 78 || point.y > height - 25)
                    continue;
                Label(point.x - span * 0.5f + 1, point.y + 1, span, label, new Color(0.06f, 0.10f, 0.16f, 0.57f), small);
                Label(point.x - span * 0.5f, point.y, span, label, new Color(1f, 0.97f, 0.92f, 0.75f), small);
            }
        }

        public void Map(List<(string Name, string Place, string Impact, bool Done, bool Available, string Status)> jobs,
            int day, int done, int limit, Action close)
        {
            var r = new Rect(width - 354, 96, 338, 484);
            Instrument(r);
            Label(r.x + 18, r.y + 14, 207, day > 0 ? $"DÍA {day}   ·   {limit - done} CUPOS" : "PLANO DE LA ESTACIÓN", indigo, small);
            if (Control(new Rect(r.xMax - 74, r.y + 11, 61, 29), "Cerrar")) close();
            if (Control(new Rect(r.x + 17, r.y + 47, 144, 29), "Trabajos", !rewardsVisible)) rewardsVisible = false;
            if (Control(new Rect(r.x + 171, r.y + 47, 151, 29), "Recompensas", rewardsVisible)) rewardsVisible = true;
            int row = 0;
            for (int i = 0; i < jobs.Count; i++)
            {
                var job = jobs[i];
                if (rewardsVisible && !job.Done)
                    continue;
                float y = r.y + 88 + row++ * 48;
                bool mandatory = job.Status == "Obligatorio hoy";
                bool completed = job.Done && (rewardsVisible || !job.Available);
                Fill(new Rect(r.x + 17, y - 2, 305, 1), Ink("CED4D4"));
                Dot(new Vector2(r.x + 25, y + 14), 7, mandatory ? Ink("BC5538") : completed ? Ink("4E8968") : Ink("C38650"));
                Label(r.x + 38, y, 260, job.Name, ink, body);
                Label(r.x + 38, y + 18, 285, rewardsVisible ? job.Impact : $"{job.Place} · {job.Status}",
                    rewardsVisible ? Ink("337251") : mandatory ? Ink("A3442C") : steel, small);
                if (!rewardsVisible && job.Available && !mandatory)
                    Label(r.x + 38, y + 31, 282, job.Impact, steel, small);
            }
            if (rewardsVisible && row == 0)
                Label(r.x + 17, r.y + 101, 301, "Completa trabajos para ganar recompensas.", steel, body);
        }

        public void DismissalPrompt(Action cancel, Action dismiss)
        {
            Rect r = Dialog(580, 225, graphite, orange);
            Label(r.x + 25, r.y + 22, 530, "Falta el informe de hoy", cloud, title);
            Text(new Rect(r.x + 26, r.y + 82, 525, 61),
                "Si duermes sin enviar el paquete, perderás tu puesto. Aún puedes volver a Comunicaciones y transmitirlo.",
                cloud, paragraph);
            if (RoundControl(new Rect(r.x + 25, r.yMax - 63, 200, 40), "Volver a la base"))
                cancel();
            if (RoundControl(new Rect(r.xMax - 235, r.yMax - 63, 210, 40), "Dormir sin enviar datos", true))
                dismiss();
        }

        public void RetryPrompt(Action cancel, Action retry)
        {
            Rect r = Dialog(557, 200, graphite, orange);
            Label(r.x + 25, r.y + 22, 507, "¿Reiniciar este día?", cloud, title);
            Text(new Rect(r.x + 25, r.y + 75, 507, 49),
                "Volverás al inicio de la jornada. Las jornadas anteriores quedan guardadas.", cloud, paragraph);
            if (RoundControl(new Rect(r.x + 25, r.yMax - 59, 159, 37), "Cancelar"))
                cancel();
            if (RoundControl(new Rect(r.xMax - 211, r.yMax - 59, 186, 37), "Reiniciar día", true))
                retry();
        }

        public void EndingEffect(CrewDeathCause cause, float progress)
        {
            Vector2 center = new(width / 2f, height / 2f);
            switch (cause)
            {
                case CrewDeathCause.Blackout:
                    float flicker = progress < 0.19f ? Mathf.Abs(Mathf.Sin(progress * 110f)) * progress * 5f : 1f;
                    Fill(new Rect(0, 0, width, height), new Color(0.015f, 0.018f, 0.025f, flicker));
                    if (progress > 0.12f)
                    {
                        Raccoon(center, 142, faceOnly: true);
                        float bob = 5f * Mathf.Sin(progress * 14f);
                        Label(center.x + 65, center.y - 104 + bob, 64, "?", orange, title);
                    }
                    break;
                case CrewDeathCause.Ejection:
                    if (progress > 0.19f)
                        EndingCaption(LunarCrewArt.PilotName + " no era un impostor");
                    break;
                case CrewDeathCause.Stress:
                    if (progress > 0.67f)
                        EndingCaption("¡POP!");
                    break;
                case CrewDeathCause.Radiation:
                    float flash = Mathf.InverseLerp(0.85f, 0.75f, progress) * Mathf.InverseLerp(0.71f, 0.75f, progress);
                    Fill(new Rect(0, 0, width, height), new Color(0.59f, 0.95f, 0.39f, flash * 0.43f));
                    if (progress > 0.58f)
                        EndingCaption(progress > 0.73f ? "¡PUM!" : "Transformación fallida");
                    break;
                case CrewDeathCause.TankEmpty:
                case CrewDeathCause.Oxygen:
                    if (progress < 0.59f)
                        EndingCaption("Un… poco… de aire…");
                    break;
                case CrewDeathCause.Hunger:
                    if (progress > 0.13f)
                        EndingCaption("Ñam… ¡esa era mi cola!");
                    break;
                case CrewDeathCause.Dehydration:
                    Mosquito(center, progress);
                    if (progress > 0.75f)
                        EndingCaption("Deshidratado");
                    break;
                case CrewDeathCause.Dismissed:
                    Fill(new Rect(0, 0, width, height), new Color(0.045f, 0.05f, 0.07f, Mathf.SmoothStep(0f, 0.87f, progress)));
                    CryingMara(new Vector2(width - 166, center.y - 15), 121f);
                    break;
            }
        }

        private void EndingCaption(string caption)
        {
            Rect box = new((width - 416) / 2f, height * 0.73f, 416, 55);
            Pill(box, graphite);
            GUIStyle centered = new(heading) { alignment = TextAnchor.MiddleCenter };
            Text(box, caption, cloud, centered);
        }

        private void Mosquito(Vector2 center, float progress)
        {
            if (progress < 0.22f)
                return;
            Vector2 mushroom = center + new Vector2(89, 26);
            if (progress < 0.57f)
            {
                Fill(new Rect(mushroom.x - 7, mushroom.y - 2, 14, 22), cloud);
                Dot(mushroom + Vector2.down * 7, 35, Ink("C54F39"));
                Dot(mushroom + new Vector2(-8, -12), 8, cloud);
                Dot(mushroom + new Vector2(8, -8), 9, cloud);
            }
            float cruise = Mathf.InverseLerp(0.22f, 0.53f, progress);
            float feeding = Mathf.InverseLerp(0.64f, 1f, progress);
            Vector2 insect = Vector2.Lerp(center + new Vector2(232, -118), mushroom, cruise);
            insect = Vector2.Lerp(insect, center + new Vector2(13, 4), Mathf.InverseLerp(0.54f, 0.73f, progress));
            float size = Mathf.Lerp(23, 66, Mathf.InverseLerp(0.49f, 0.69f, progress));
            Dot(insect + new Vector2(-size / 4, -size / 2), size * 0.58f, cloud);
            Dot(insect + new Vector2(size / 4, -size / 2), size * 0.58f, cloud);
            Dot(insect, size, Ink("3A2932"));
            Dot(insect + Vector2.right * 5f, size * 0.31f, Ink("AA4741"));
            Stroke(insect, insect + Vector2.left * size * 0.85f, 3, Ink("493441"));
            if (feeding > 0)
                Dot(Vector2.Lerp(center, insect, Mathf.Repeat(feeding * 4, 1f)), 8, Ink("A33B35"));
        }

        private void CryingMara(Vector2 point, float size)
        {
            MaraMedallion(point, size);
            float tear = Mathf.Repeat(Time.unscaledTime * 1.25f, 1f);
            Vector2 drop = point + new Vector2(size * 0.13f, size * (0.04f + 0.31f * tear));
            Stroke(drop, drop + new Vector2(-3, 8), size * 0.04f, Ink("81DBFF"));
            Rect speech = new(point.x - 125, point.y + size * 0.57f, 250, 47);
            Dot(new Vector2(point.x + 24, speech.y - 1), 12, cloud);
            Pill(speech, cloud);
            Text(speech, "Nico, ¿por qué? Yo confiaba en ti.", graphite, centeredBody);
        }

        public void Results(bool victory, bool expired, bool dismissed, string why, string advice, string location, int done,
            int total, float duration, int errors, Action retryDay, Action restart, Action mainMenu)
        {
            Fill(new Rect(0, 0, width, height), graphite);
            Rect r = new((width - 800) / 2f, (height - 489) / 2f, 800, 489);
            Dot(new Vector2(r.x + 650, r.y + 178), 278, Ink("444951"));
            Label(r.x + 20, r.y + 46, 570, dismissed ? "ESTACIÓN SELENE" : "INFORME DE MISIÓN", orange, small);
            string result = victory ? "Campaña completada" : expired ? "Fin de la campaña" :
                dismissed ? "DESPEDIDO" : "Tripulante perdido";
            Label(r.x + 16, r.y + 69, 748, result, dismissed ? orange : cloud, dismissed ? endingTitle : title);
            if (victory)
                Label(r.x + 20, r.y + 134, 505, "La estación vuelve a estar operativa.", cloud, body);
            else if (expired)
                Label(r.x + 20, r.y + 134, 505, "Terminaste los 15 días con trabajos pendientes.", cloud, body);
            else if (dismissed)
            {
                Label(r.x + 20, r.y + 157, 480, "CAUSAS DEL DESPIDO", cloud, small);
                Label(r.x + 20, r.y + 187, 480, "Incumplimiento", cloud, heading);
                Label(r.x + 20, r.y + 219, 480, "Abandono", cloud, heading);
                Label(r.x + 20, r.y + 251, 519, "Dejar un olor sospechoso en el camarote", cloud, heading);
                Text(new Rect(r.x + 20, r.y + 289, 487, 43), why, muted, paragraph);
            }
            else
            {
                Label(r.x + 20, r.y + 133, 505, "QUÉ PASÓ   ·   " + location, orange, small);
                Text(new Rect(r.x + 20, r.y + 159, 496, 62), why, cloud, paragraph);
                Label(r.x + 20, r.y + 224, 505, "PARA EL PRÓXIMO TURNO", orange, small);
                Text(new Rect(r.x + 20, r.y + 248, 496, 55), advice, muted, paragraph);
            }
            if (dismissed)
                CryingMara(new Vector2(r.x + 650, r.y + 168), 164f);
            else
                Raccoon(new Vector2(r.x + 650, r.y + 171), 158);
            Label(r.x + 20, r.y + 333, 513, $"{done}/{total} tareas   ·   {duration:0}s   ·   {errors} errores de contacto", muted, body);
            float optionsY = r.y + 420;
            if (retryDay != null && MenuCircle(new Vector2(r.x + 92, optionsY), "↶", "Reiniciar el día", primary: true))
                retryDay();
            if (MenuCircle(new Vector2(r.x + (retryDay == null ? 92 : 256), optionsY), "▶", "Volver a jugar", primary: retryDay == null))
                restart();
            if (MenuCircle(new Vector2(r.x + (retryDay == null ? 256 : 420), optionsY), "⌂", "Menú principal"))
                mainMenu();
        }
    }
}
