using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarArrival
    {
        private const float PlaybackRate = 0.68f;
        private static readonly Vector2 GateSide = new(LunarMap.OuterGateX + 1.25f, 0);
        private static readonly Vector2 Chamber = new((LunarMap.InnerGateX + LunarMap.OuterGateX) * 0.5f, 0);
        private static readonly Vector2 ArrivalStart = new(82f, 20f);
        private static readonly Vector2 DepartureEnd = new(79f, 24f);
        private static readonly Vector2 HatchOffset = new(-0.58f, -0.59f);
        private static readonly Vector2 RampFoot = new(-0.58f, -2.30f);
        public static Vector2 BoardingPoint => LunarMap.PlayerBerth + RampFoot;
        internal static readonly Vector2 PlayerRoom = new(0.78f, 2.12f);
        internal static readonly Vector2 MaraRoom = new(-2.15f, 0.55f);
        private static readonly Vector2[] MoonArrival =
        {
            BoardingPoint,
            new(64f, LunarMap.LandingCenter.y - 0.9f), new(64f, 0), GateSide
        };
        private static readonly Vector2[] InteriorWalk =
        {
            Chamber, new(1.85f, 0), PlayerRoom
        };
        private static readonly Vector2[] MoonDeparture =
        {
            Chamber, GateSide, new(64f, 0), new(64f, LunarMap.LandingCenter.y - 0.9f), LunarMap.MaraBerth + RampFoot
        };
        private readonly AirlockController airlock;
        private readonly Rigidbody2D player;
        private readonly LunarCrewArt crewArt;
        private readonly LunarTutorial mara;
        private readonly Transform playerStage;
        private readonly Shuttle heroShip;
        private readonly Shuttle maraShip;
        private readonly Transform cockroach;
        private readonly Transform ring, protector, lantern, cough;
        private readonly Transform[] insectLegs = new Transform[6];
        private readonly SpriteRenderer ringGlow, lanternGlow;
        private static readonly Vector2 LanternSite = new(64.3f, -11.2f);
        private static readonly (float Start, float End, string Speaker, string Text)[] LanternLines =
        {
            (9.6f, 15.8f, "ANILLO VERDE", "Cucaracha de la Tierra, el Cuerpo de Linternas Verdes te selecciona por tu capacidad para superar el miedo y tu fuerza de voluntad."),
            (18.4f, 23.4f, "PROTECTOR HERIDO", "Soy el protector del sector 2814. El anillo te eligió a ti."),
            (23.4f, 27.3f, "PROTECTOR HERIDO", "Toma el anillo. Colócalo en la linterna y di el juramento."),
            (27.3f, 31.9f, "CUCARACHA", "En el día más brillante, en la noche más oscura, ningún mal se escapará a mi vista."),
            (31.9f, 35.65f, "CUCARACHA", "Que aquellos que veneran el mal teman mi poder: la luz de Linterna Verde.")
        };
        private bool heroCuePlayed;
        private int lastLanternLine = -1;
        private Vector2 departureOrigin;
        private float elapsed;
        private bool liveHeroVisible, liveMaraVisible, liveCrewVisible;

        public bool Playing { get; private set; }
        public bool Departure { get; private set; }
        public bool Abandoning { get; private set; }
        public bool Winning { get; private set; }
        public bool VictorySpace => Winning && elapsed >= 5.7f && elapsed < 8.1f;
        public bool VictoryCloseup => Winning && elapsed >= 8.1f;
        public bool VictoryText => Winning && elapsed >= 36f;
        public event System.Action HeroMoment;
        public event System.Action<int> LanternSpoken;

        private int CurrentLanternLine
        {
            get
            {
                for (int i = 0; i < LanternLines.Length; i++)
                    if (elapsed >= LanternLines[i].Start && elapsed < LanternLines[i].End)
                        return i;
                return -1;
            }
        }
        public (string Speaker, string Text) VictoryDialogue
        {
            get
            {
                int index = CurrentLanternLine;
                return index < 0 ? (null, null) : (LanternLines[index].Speaker, LanternLines[index].Text);
            }
        }
        public Vector2 Focus { get; private set; }
        public float Zoom { get; private set; } = 7f;
        public string Caption { get; private set; }
        public string MaraSpeech { get; private set; }

        public LunarArrival(Transform world, LunarShapes art, AirlockController airlock,
            Rigidbody2D player, LunarCrewArt crewArt, LunarTutorial mara)
        {
            this.airlock = airlock;
            this.player = player;
            this.crewArt = crewArt;
            this.mara = mara;
            playerStage = Group(world, "Tripulante en la cinemática", Vector2.zero);
            art.Disc(playerStage, "Sombra del tripulante", new Vector2(0, -0.22f),
                new Vector2(0.91f, 0.41f), Ink("4A3029"), 14);
            playerStage.gameObject.SetActive(false);
            heroShip = new Shuttle(world, art, "Nave del tripulante", LunarMap.PlayerBerth, Ink("6AB2D1"));
            maraShip = new Shuttle(world, art, "Nave de Mara", LunarMap.MaraBerth, Ink("D88D56"));
            if (mara == null) maraShip.Show(false);
            heroShip.Show(false);
            cockroach = Group(world, "Cucaracha", LunarMap.PlayerBerth);
            art.Disc(cockroach, "Sombra", new Vector2(0.02f, -0.055f), new Vector2(0.59f, 0.26f), Ink("392B2B"), 14);
            art.Disc(cockroach, "Caparazón", Vector2.zero, new Vector2(0.47f, 0.24f), Ink("54332B"), 17);
            art.Disc(cockroach, "Reflejo", new Vector2(-0.035f, 0.066f), new Vector2(0.35f, 0.075f), Ink("90523C"), 18);
            art.Disc(cockroach, "Cabeza", new Vector2(0.22f, 0.015f), new Vector2(0.17f, 0.16f), Ink("352527"), 18);
            art.Line(cockroach, new Vector2(0.25f, 0.05f), new Vector2(0.47f, 0.15f), 0.022f, Ink("59352C"), 18);
            art.Line(cockroach, new Vector2(0.25f, -0.015f), new Vector2(0.47f, -0.065f), 0.022f, Ink("59352C"), 18);
            for (int i = 0; i < insectLegs.Length; i++)
            {
                float side = i < 3 ? -1f : 1f;
                Transform leg = Group(cockroach, "Pata", new Vector2((i % 3 - 1) * 0.14f, side * 0.067f));
                art.Line(leg, Vector2.zero, new Vector2(-0.10f, side * 0.18f), 0.031f, Ink("352527"), 16);
                insectLegs[i] = leg;
            }
            ring = Group(world, "Anillo verde", Vector2.zero);
            ringGlow = art.Disc(ring, "Halo", Vector2.zero, Vector2.one * 0.72f, new Color(0.22f, 1f, 0.42f, 0.27f), 25);
            art.Disc(ring, "Aro", Vector2.zero, Vector2.one * 0.29f, Ink("88FF9D"), 26);
            art.Disc(ring, "Hueco del anillo", Vector2.zero, Vector2.one * 0.16f, Ink("335F43"), 27);
            art.Plate(ring, "Gema", new Vector2(0f, 0.143f), new Vector2(0.16f, 0.09f), Ink("CEFFCF"), 28);

            protector = Group(world, "Protector del sector 2814", LanternSite + new Vector2(-0.66f, 0.15f));
            var protectorArt = new LunarCrewArt(protector, art);
            protectorArt.ShowSuit(false);
            protectorArt.Root.localRotation = Quaternion.Euler(0, 0, 75f);
            art.Plate(protectorArt.Root, "Chaqueta esmeralda", new Vector2(0.04f, 0.075f), new Vector2(0.44f, 0.34f), Ink("307A49"), 19);
            art.Disc(protectorArt.Root, "Insignia", new Vector2(0.10f, 0.12f), Vector2.one * 0.13f, Ink("BAFFBB"), 22);
            cough = Group(protector, "Tos", Vector2.zero);
            art.Disc(cough, "Gota estilizada", Vector2.zero, Vector2.one * 0.058f, Ink("A95E64"), 27);

            lantern = Group(world, "Linterna verde", LanternSite + new Vector2(0.52f, 0.04f));
            lanternGlow = art.Disc(lantern, "Luz proyectada", Vector2.zero, Vector2.one * 0.86f,
                new Color(0.22f, 1f, 0.42f, 0.22f), 23);
            art.Plate(lantern, "Cuerpo", Vector2.zero, new Vector2(0.35f, 0.37f), Ink("2C7850"), 24);
            art.Disc(lantern, "Lente", Vector2.zero, Vector2.one * 0.23f, Ink("AFFFB8"), 25);
            art.Line(lantern, new Vector2(-0.12f, 0.15f), new Vector2(-0.09f, 0.31f), 0.055f, Ink("76C788"), 24);
            art.Line(lantern, new Vector2(0.12f, 0.15f), new Vector2(0.09f, 0.31f), 0.055f, Ink("76C788"), 24);
            art.Line(lantern, new Vector2(-0.09f, 0.31f), new Vector2(0.09f, 0.31f), 0.055f, Ink("76C788"), 24);
            cockroach.gameObject.SetActive(false);
            ShowLanternActors(false);
        }

        public void BeginArrival()
        {
            Abandoning = false;
            Winning = false;
            Departure = false;
            Playing = true;
            elapsed = 0;
            Focus = ArrivalStart;
            Zoom = 8.7f;
            heroShip.Show(true);
            heroShip.Fly(ArrivalStart, 1f);
            // Keep the walk visible while gameplay physics is suspended.
            playerStage.position = LunarMap.PlayerBerth;
            crewArt.Root.SetParent(playerStage, false);
            crewArt.Root.gameObject.SetActive(false);
            crewArt.ShowSuit(true);
            mara.Place(GateSide + new Vector2(0.35f, 0.52f), 0f);
            airlock.PresentDoors(false, AirlockPressure.Vacuum);
        }

        public void BeginDeparture()
        {
            Abandoning = false;
            Winning = false;
            Departure = Playing = true;
            elapsed = 0;
            departureOrigin = mara.Position;
            Focus = departureOrigin;
            Zoom = 7.2f;
        }

        public void BeginAbandonment(Vector2? replayOrigin = null)
        {
            Departure = false;
            Abandoning = Playing = true;
            elapsed = 0f;
            heroShip.Show(true);
            departureOrigin = replayOrigin ?? player.position;
            Focus = departureOrigin;
            Zoom = 6.7f;
            playerStage.position = departureOrigin;
            crewArt.Root.SetParent(playerStage, false);
            crewArt.ShowSuit(true);
        }

        public void BeginVictory()
        {
            BeginAbandonment();
            Winning = true;
            departureOrigin = BoardingPoint + new Vector2(-2.9f, -0.33f);
            playerStage.position = departureOrigin;
            Focus = departureOrigin;
            crewArt.ShowSuit(true);
            cockroach.gameObject.SetActive(false);
            heroCuePlayed = false;
            lastLanternLine = -1;
            ShowLanternActors(false);
        }

        public bool Tick(float seconds)
        {
            elapsed += seconds * PlaybackRate;
            Caption = null;
            MaraSpeech = null;
            if (Winning)
                AnimateVictory(seconds);
            else if (Abandoning)
                AnimateAbandonment(seconds);
            else if (Departure)
                AnimateDeparture(seconds);
            else
                AnimateArrival(seconds);
            if (elapsed < (Winning ? 39.2f : Abandoning ? 5.7f : Departure ? 15f : 20.6f))
                return false;

            Playing = false;
            return true;
        }

        public void FinishArrival()
        {
            Playing = false;
            heroShip.Show(true);
            heroShip.Fly(LunarMap.PlayerBerth, 0);
            heroShip.Ramp(0f);
            crewArt.Root.SetParent(player.transform, false);
            crewArt.Root.localPosition = Vector3.zero;
            crewArt.Root.localRotation = Quaternion.identity;
            crewArt.Root.gameObject.SetActive(true);
            playerStage.gameObject.SetActive(false);
            player.transform.position = new Vector3(PlayerRoom.x, PlayerRoom.y, player.transform.position.z);
            player.position = PlayerRoom;
            crewArt.ShowSuit(false);
            mara.Place(MaraRoom, 0);
        }

        public void FinishDeparture()
        {
            Playing = false;
            maraShip.Show(false);
            mara.Dismiss();
        }

        public void FinishAbandonment()
        {
            Playing = false;
            heroShip.Show(false);
            playerStage.gameObject.SetActive(false);
        }

        public void FinishVictory()
        {
            FinishAbandonment();
            Winning = false;
        }

        public void ResetReplay()
        {
            Winning = Abandoning = false;
            cockroach.gameObject.SetActive(false);
            ShowLanternActors(false);
            FinishAbandonment();
            crewArt.Root.SetParent(player.transform, false);
        }

        public void HideForReplay()
        {
            liveHeroVisible = heroShip.Visible;
            liveMaraVisible = maraShip.Visible;
            liveCrewVisible = crewArt.Root.gameObject.activeSelf;
            heroShip.Show(false);
            maraShip.Show(false);
            crewArt.Root.gameObject.SetActive(false);
        }

        public void RestoreAfterReplay()
        {
            heroShip.Show(liveHeroVisible);
            maraShip.Show(liveMaraVisible);
            crewArt.Root.gameObject.SetActive(liveCrewVisible);
        }

        private void AnimateArrival(float seconds)
        {
            if (elapsed < 2.8f)
            {
                float phase = elapsed / 2.8f;
                Focus = Vector2.Lerp(ArrivalStart, LunarMap.PlayerBerth, Ease(phase));
                heroShip.Fly(Focus, 1f - phase);
                Caption = "Llegada a Estación Selene";
                return;
            }
            heroShip.Fly(LunarMap.PlayerBerth, 0f);
            Zoom = 6.6f;
            if (elapsed >= 9.7f && elapsed < 12f)
                MaraSpeech = "Bienvenido. La esclusa está abierta.";
            if (elapsed < 4.45f)
            {
                heroShip.Ramp(Ease((elapsed - 2.8f) / 0.55f));
                if (elapsed >= 3.35f)
                    WalkPlayer(Vector2.Lerp(LunarMap.PlayerBerth + HatchOffset, BoardingPoint,
                        Ease((elapsed - 3.35f) / 1.1f)), seconds);
                Caption = "Aterrizaje junto a la nave de Mara";
            }
            else if (elapsed < 9.7f)
            {
                heroShip.Ramp(1f - Ease((elapsed - 4.45f) / 0.6f));
                WalkPlayer(Travel(MoonArrival, (elapsed - 4.45f) / 5.25f), seconds);
            }
            else if (elapsed < 10.7f)
            {
                WalkPlayer(GateSide, seconds);
                airlock.PresentDoors(true, AirlockPressure.Vacuum);
            }
            else if (elapsed < 12.0f)
            {
                float phase = (elapsed - 10.7f) / 1.3f;
                WalkPlayer(Vector2.Lerp(GateSide, Chamber, phase), seconds);
                mara.Place(Vector2.Lerp(GateSide + new Vector2(0.35f, 0.52f), Chamber - new Vector2(0.63f, -0.38f), phase), seconds);
            }
            else if (elapsed < 13.5f)
            {
                WalkPlayer(Chamber, 0);
                airlock.PresentDoors(false, AirlockPressure.Repressurizing);
                Caption = "La cámara recupera la presión";
            }
            else if (elapsed < 18.55f)
            {
                airlock.PresentDoors(true, AirlockPressure.Pressurized);
                crewArt.ShowSuit(false);
                float phase = (elapsed - 13.5f) / 5.05f;
                Vector2 p = Travel(InteriorWalk, phase);
                WalkPlayer(p, seconds);
                mara.Place(Vector2.Lerp(p - new Vector2(0.68f, -0.35f), MaraRoom,
                    Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0.79f, 1, phase))), seconds);
            }
            else
            {
                WalkPlayer(PlayerRoom, 0);
                mara.Place(MaraRoom, seconds);
                Focus = LunarMap.Bedroom - Vector2.up * 0.7f;
                MaraSpeech = "Este es tu cuarto. Aquí puedes descansar.";
            }
        }

        private void AnimateDeparture(float seconds)
        {
            if (elapsed < 4.1f)
                MaraSpeech = "Te dejo al mando. Nos vemos pronto.";
            if (elapsed < 2.9f)
            {
                airlock.PresentDoors(true, AirlockPressure.Pressurized);
                Focus = Vector2.Lerp(departureOrigin, Chamber, elapsed / 2.9f);
                mara.Place(Focus, seconds);
            }
            else if (elapsed < 4.1f)
            {
                airlock.PresentDoors(false, AirlockPressure.Depressurizing);
                mara.Place(Chamber, 0);
                Focus = Chamber;
            }
            else if (elapsed < 10.35f)
            {
                airlock.PresentDoors(elapsed < 5.2f, AirlockPressure.Vacuum);
                Focus = Travel(MoonDeparture, (elapsed - 4.1f) / 6.25f);
                maraShip.Ramp(Ease((elapsed - 9.6f) / 0.75f));
                mara.Place(Focus, seconds);
            }
            else if (elapsed < 11.45f)
            {
                Focus = Vector2.Lerp(LunarMap.MaraBerth + RampFoot, LunarMap.MaraBerth + HatchOffset,
                    Ease((elapsed - 10.35f) / 1.1f));
                mara.Place(Focus, seconds);
            }
            else
            {
                mara.Dismiss();
                maraShip.Ramp(1f - Ease((elapsed - 11.45f) / 0.55f));
                float lift = Ease((elapsed - 12f) / 3f);
                Focus = Vector2.Lerp(LunarMap.MaraBerth, DepartureEnd, lift);
                maraShip.Fly(Focus, lift);
                Zoom = 8.1f;
            }
        }

        private void AnimateAbandonment(float seconds)
        {
            float ramp = Ease(elapsed / 0.65f);
            heroShip.Ramp(ramp);
            if (elapsed < 0.85f)
                WalkPlayer(Vector2.Lerp(departureOrigin, BoardingPoint, Ease(elapsed / 0.85f)), seconds);
            else if (elapsed < 2.1f)
                WalkPlayer(Vector2.Lerp(BoardingPoint, LunarMap.PlayerBerth + HatchOffset,
                    Ease((elapsed - 0.85f) / 1.25f)), seconds);
            else
            {
                playerStage.gameObject.SetActive(false);
                heroShip.Ramp(1f - Ease((elapsed - 2.1f) / 0.6f));
                float lift = Ease((elapsed - 2.7f) / 3f);
                Focus = Vector2.Lerp(LunarMap.PlayerBerth, DepartureEnd, lift);
                heroShip.Fly(Focus, lift);
                Zoom = 8.3f;
            }
        }

        private void AnimateVictory(float seconds)
        {
            if (elapsed < 2.1f)
            {
                AnimateAbandonment(seconds);
                return;
            }

            playerStage.gameObject.SetActive(false);
            Vector2 roachStart = LunarMap.PlayerBerth + HatchOffset;
            Vector2 roachEnd = BoardingPoint + new Vector2(1.64f, -0.42f);
            cockroach.gameObject.SetActive(true);
            float walk = Ease((elapsed - 2.29f) / 1.7f);
            cockroach.position = Vector2.Lerp(roachStart, roachEnd, walk);
            for (int i = 0; i < insectLegs.Length; i++)
                insectLegs[i].localRotation = Quaternion.Euler(0, 0,
                    Mathf.Sin(elapsed * 49f + i * 2f) * (walk < 1f ? 29f : 6f));
            heroShip.Ramp(1f - Ease((elapsed - 4.02f) / 0.66f));

            if (elapsed < 4.7f)
            {
                Focus = Vector2.Lerp(LunarMap.PlayerBerth, roachEnd, 0.53f);
                Zoom = 4.5f;
                return;
            }
            if (!VictoryCloseup)
            {
                float ascent = Ease((elapsed - 4.7f) / 3.4f);
                Focus = Vector2.Lerp(LunarMap.PlayerBerth, new Vector2(102f, 34f), ascent);
                heroShip.Fly(Focus, ascent);
                Zoom = 8.4f;
                return;
            }
            heroShip.Show(false);
            AnimateLantern(roachEnd);
        }

        private void AnimateLantern(Vector2 roachEnd)
        {
            Vector2 hovered = roachEnd + new Vector2(0.42f, 0.67f);
            Vector2 arrived = LanternSite + new Vector2(0.13f, -0.23f);
            ring.gameObject.SetActive(true);
            if (elapsed < 15.8f)
            {
                float approach = Ease((elapsed - 8.3f) / 1.28f);
                ring.position = Vector2.Lerp(roachEnd + new Vector2(4.4f, 2.1f), hovered, approach);
                Focus = roachEnd + Vector2.up * 0.22f;
            }
            else
            {
                float trip = Ease((elapsed - 15.8f) / 2.55f);
                float charge = Ease((elapsed - 26.43f) / 0.82f);
                cockroach.position = Vector2.Lerp(roachEnd, arrived, trip);
                ring.position = Vector2.Lerp(Vector2.Lerp(hovered, arrived + new Vector2(0.31f, 0.48f), trip),
                    lantern.position, charge);
                Focus = Vector2.Lerp(roachEnd, LanternSite + Vector2.up * 0.13f, trip);
                protector.gameObject.SetActive(trip > 0.62f);
                lantern.gameObject.SetActive(trip > 0.62f);
                lanternGlow.transform.localScale = Vector3.one * (0.22f + charge * (0.9f + Mathf.Sin(elapsed * 10f) * 0.14f));
                float gasp = Mathf.Clamp01((elapsed - 18.26f) / 0.44f);
                cough.gameObject.SetActive(gasp > 0f && gasp < 1f);
                cough.localPosition = new Vector3(-0.33f - gasp * 0.28f, 0.21f + Mathf.Sin(gasp * Mathf.PI) * 0.11f, 0f);
                if (!heroCuePlayed && elapsed >= 27.3f)
                {
                    heroCuePlayed = true;
                    HeroMoment?.Invoke();
                }
            }
            ringGlow.transform.localScale = Vector3.one * (0.66f + 0.15f * Mathf.Sin(elapsed * 6f));
            int line = CurrentLanternLine;
            if (line >= 0 && line != lastLanternLine)
            {
                lastLanternLine = line;
                LanternSpoken?.Invoke(line);
            }
            Zoom = 1.74f;
        }

        private void ShowLanternActors(bool visible)
        {
            ring.gameObject.SetActive(visible);
            protector.gameObject.SetActive(visible);
            lantern.gameObject.SetActive(visible);
            cough.gameObject.SetActive(false);
        }

        private void WalkPlayer(Vector2 point, float seconds)
        {
            Vector2 previous = playerStage.position;
            playerStage.position = new Vector3(point.x, point.y, 0f);
            playerStage.gameObject.SetActive(true);
            crewArt.Root.gameObject.SetActive(true);
            crewArt.Walk(seconds > 0f ? (point - previous) / seconds : Vector2.zero, seconds);
            Focus = point;
        }

        private static float Ease(float phase) => Mathf.SmoothStep(0f, 1f, Mathf.Clamp01(phase));

        private static Vector2 Travel(Vector2[] path, float phase)
        {
            float length = 0f;
            for (int i = 1; i < path.Length; i++)
                length += Vector2.Distance(path[i - 1], path[i]);
            float remaining = length * Mathf.Clamp01(phase);
            for (int i = 1; i < path.Length; i++)
            {
                float segment = Vector2.Distance(path[i - 1], path[i]);
                if (remaining <= segment)
                    return Vector2.Lerp(path[i - 1], path[i], remaining / segment);
                remaining -= segment;
            }
            return path[path.Length - 1];
        }

        private sealed class Shuttle
        {
            private readonly Transform root;
            private readonly Transform cabin;
            private readonly SpriteRenderer[] flames = new SpriteRenderer[3];
            private readonly SpriteRenderer ramp;
            private readonly SpriteRenderer[] treads = new SpriteRenderer[4];
            private readonly SpriteRenderer hatch;

            public Shuttle(Transform world, LunarShapes art, string name, Vector2 berth, Color accent)
            {
                root = Group(world, name, berth);
                cabin = Group(root, "Casco de la nave", Vector2.zero);
                art.Disc(root, "Sombra", new Vector2(0, -0.21f), new Vector2(3.24f, 2.35f), Ink("343B46"), 4);
                for (int side = -1; side <= 1; side += 2)
                {
                    Vector2 wing = new(1.01f * side, -0.49f);
                    art.Plate(cabin, "Ala metálica", wing, new Vector2(1.08f, 1.59f), Ink("758492"), 7, -side * 28);
                    art.Plate(cabin, "Color de ala", wing + Vector2.up * 0.24f, new Vector2(0.68f, 0.23f), accent, 8, -side * 28);
                }
                art.Disc(cabin, "Silueta del casco", Vector2.zero, new Vector2(1.78f, 3.35f), Ink("303C4B"), 9);
                art.Disc(cabin, "Blindaje", new Vector2(0, 0.08f), new Vector2(1.58f, 3.05f), Ink("E6E9E6"), 10);
                art.Disc(cabin, "Visor", new Vector2(0, 0.51f), new Vector2(1.04f, 1.26f), Ink("364C61"), 11);
                art.Disc(cabin, "Reflejo del visor", new Vector2(-0.17f, 0.72f), new Vector2(0.35f, 0.37f), accent, 12);
                art.Plate(cabin, "Motor", new Vector2(0, -1.12f), new Vector2(0.62f, 0.40f), Ink("425260"), 11);
                for (int i = 0; i < flames.Length; i++)
                {
                    float x = (i - 1) * 0.67f;
                    art.Plate(cabin, "Tobera", new Vector2(x, -1.10f), new Vector2(0.40f, 0.28f), Ink("41444B"), 10);
                    flames[i] = art.Disc(cabin, "Llama del propulsor", new Vector2(x, -1.50f),
                        new Vector2(0.37f, 0.98f), Ink(i == 1 ? "FFE9C6" : "F39354"), 6);
                }
                hatch = art.Plate(cabin, "Escotilla", HatchOffset, new Vector2(0.52f, 0.46f), Ink("212733"), 12);
                ramp = art.Plate(cabin, "Rampa de embarque", HatchOffset, new Vector2(0.75f, 1f), Ink("AEB0B4"), 11);
                for (int i = 0; i < treads.Length; i++)
                    treads[i] = art.Plate(cabin, "Peldaño", HatchOffset, new Vector2(0.65f, 0.055f), Ink("696D76"), 12);
                Ramp(0f);
                Fly(berth, 0);
            }

            public bool Visible => root.gameObject.activeSelf;
            public void Show(bool visible) => root.gameObject.SetActive(visible);

            public void Fly(Vector2 position, float height)
            {
                root.localPosition = position;
                cabin.localScale = Vector3.one * (1 + 0.30f * height);
                cabin.localPosition = new Vector2(0, height * 0.65f);
                for (int i = 0; i < flames.Length; i++)
                {
                    float burn = Mathf.Lerp(0.47f, 1.38f, height) + Mathf.Sin(Time.unscaledTime * 53f + i) * 0.18f;
                    flames[i].transform.localScale = new Vector3(0.36f, burn, 1);
                    flames[i].enabled = height > 0.008f;
                }
            }

            public void Ramp(float open)
            {
                float length = (HatchOffset.y - RampFoot.y) * open;
                ramp.enabled = hatch.enabled = length > 0.01f;
                ramp.transform.localScale = new Vector3(0.76f, length, 1f);
                ramp.transform.localPosition = new Vector3(HatchOffset.x, HatchOffset.y - length / 2f, -0.55f);
                for (int i = 0; i < treads.Length; i++)
                {
                    treads[i].enabled = ramp.enabled;
                    treads[i].transform.localPosition = new Vector3(HatchOffset.x,
                        HatchOffset.y - length * (i + 1) / (treads.Length + 1), -0.6f);
                }
            }
        }
    }
}
