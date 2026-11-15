using UnityEngine;
using System.Collections.Generic;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarMap
    {
        public const float OrbitRadius = 23f;
        public const float CoreApothem = 6.7f;
        public const float RoomApothem = 6f;
        public const float InnerGateX = OrbitRadius + RoomApothem;
        public const float OuterGateX = 36f;
        public const float EastEdge = 70f;
        public const float PassageHalfWidth = 1.12f;
        private const float SouthEdge = -15.5f;
        private const float NorthEdge = 15.5f;
        public static readonly Vector2 SolarJob = new(47f, 8.2f);
        public static readonly Vector2 AntennaJob = new(55f, -9.8f);
        public static readonly Vector2 ShieldJob = new(64f, 6.0f);
        public static readonly Vector2 LandingCenter = new(63.8f, 11.45f);
        public static readonly Vector2 MaraBerth = LandingCenter + Vector2.left * 2.36f;
        public static readonly Vector2 PlayerBerth = LandingCenter + Vector2.right * 2.36f;
        public static readonly Vector2 Bedroom = new(0.7f, 3.25f);
        public static readonly Vector2 BedroomTelevision = new(-2.03f, 3.64f);
        public const int CommunicationsRoom = 5;
        public const int ResearchRoom = 6;
        public static readonly Vector2 ResearchUplink = new(0, 0.54f);
        public static readonly Vector2 MarsTrekConsole = new(0, 0.38f);
        public static readonly string[] RoomNames =
        {
            "Habitación principal", "Garaje y esclusa", "Invernadero", "Soporte vital",
            "Sala de ejercicio", "Comunicaciones", "Investigación"
        };
        public static readonly int[] ModuleIds = { 1, 7, 2, 3, 4, 5, 6 };
        public static readonly string[] RoomColors =
        {
            "3C71A0", "B96B3B", "547650", "417A88", "A55465", "926B36", "7563A3"
        };

        private readonly LunarShapes art;
        private readonly Transform root;
        private readonly List<(Vector2 Start, Vector2 End)> protectedSegments = new();
        private readonly List<Rect> protectedPads = new();
        private GameObject borrowedSuit;
        public readonly Transform[] Rooms = new Transform[7];
        public readonly Vector2[] Centers = new Vector2[7];
        public BoxCollider2D GarageZone { get; private set; }
        public BoxCollider2D SuitZone { get; private set; }
        public BoxCollider2D ChamberZone { get; private set; }
        public BoxCollider2D ExteriorZone { get; private set; }
        public BoxCollider2D ControlZone { get; private set; }
        public BoxCollider2D InteriorControlZone { get; private set; }
        public BoxCollider2D InnerGate { get; private set; }
        public BoxCollider2D OuterGate { get; private set; }
        private SlidingGate innerVisual;
        private SlidingGate outerVisual;
        public Vector2 SuitPosition => Centers[1] + new Vector2(-0.15f, 2.65f);
        public static readonly Vector2 TelescopePosition = new(-3.85f, -2.27f);

        public void ShowStoredSuit(bool stored)
        {
            if (borrowedSuit != null && borrowedSuit.activeSelf != stored)
                borrowedSuit.SetActive(stored);
        }

        public bool IsOnProtectedPath(Vector2 position)
        {
            foreach (Rect pad in protectedPads)
                if (pad.Contains(position))
                    return true;
            foreach (var segment in protectedSegments)
            {
                Vector2 delta = segment.End - segment.Start;
                float fraction = Mathf.Clamp01(Vector2.Dot(position - segment.Start, delta) / delta.sqrMagnitude);
                if ((position - (segment.Start + fraction * delta)).sqrMagnitude <= 1.22f * 1.22f)
                    return true;
            }
            return false;
        }

        public LunarMap(Transform root, LunarShapes art)
        {
            this.root = root;
            this.art = art;
            Terrain();
            Station();
            Airlock();
        }

        private void Terrain()
        {
            Transform field = Group(root, "Terreno de tonos marcianos", Vector2.zero);
            art.Plate(field, "Superficie", new Vector2(18, 0), new Vector2(192f, 128f), Ink("9C6250"), -50);
            var random = new System.Random(194);
            for (int i = 0; i < 140; i++)
            {
                float x = (float)random.NextDouble() * 123f - 43f;
                float y = (float)random.NextDouble() * 73f - 37f;
                if (x * x + y * y < 12f)
                    continue;
                float size = 0.34f + (float)random.NextDouble() * (i < 26 ? 3.6f : 0.5f);
                Vector2 p = new(x, y);
                art.Disc(field, "Crater", p, new Vector2(size, size * 0.64f), Ink("B77D64"), -49);
                art.Disc(field, "Sombra del cráter", p + new Vector2(0f, 0.06f),
                    new Vector2(size * 0.83f, size * 0.48f), Ink("835041"), -48);
            }

            for (int i = 0; i < 240; i++)
            {
                Vector2 p = new((float)random.NextDouble() * 112f - 36f,
                    (float)random.NextDouble() * 67f - 33f);
                float size = random.Next(3, 12) / 100f;
                art.Disc(field, "Fragmento", p, new Vector2(size * 1.9f, size), Ink("BA876B"), -47);
            }

            // Esta cerca acota la zona exterior navegable. El único acceso es la esclusa.
            var fence = new[]
            {
                new Vector2(OuterGateX, -1.10f), new Vector2(OuterGateX, SouthEdge),
                new Vector2(EastEdge - 2.4f, SouthEdge), new Vector2(EastEdge, SouthEdge + 2.4f),
                new Vector2(EastEdge, NorthEdge - 2.4f), new Vector2(EastEdge - 2.4f, NorthEdge),
                new Vector2(OuterGateX, NorthEdge), new Vector2(OuterGateX, 1.10f)
            };
            for (int i = 1; i < fence.Length; i++)
            {
                art.Wall(field, fence[i - 1], fence[i]);
                art.KitWall(field, fence[i - 1], fence[i], "cave-ledge", 0.95f);
            }

            for (int i = 0; i < 27; i++)
            {
                float x = OuterGateX + 2f + (float)random.NextDouble() * (EastEdge - OuterGateX - 4f);
                float sign = i % 2 == 0 ? 1f : -1f;
                Vector2 point = new(x, sign * (11.5f + (float)random.NextDouble() * 2.7f));
                float size = 0.6f + (float)random.NextDouble() * 1.3f;
                art.Kit(field, "cave-rocks", point, new Vector2(size, size * 0.8f),
                    -5, (float)random.NextDouble() * 55f - 27.5f);
            }
            art.Kit(field, "cave-rock-arch", new Vector2(EastEdge - 4f, -10.7f),
                new Vector2(2.8f, 1.7f), -2, -12);

            Runway(field, new Vector2(OuterGateX, 0), new Vector2(EastEdge - 3.4f, 0));
            Runway(field, new Vector2(SolarJob.x, 0), SolarJob);
            Runway(field, new Vector2(AntennaJob.x, 0), AntennaJob);
            Runway(field, new Vector2(ShieldJob.x, 0), ShieldJob);
            Runway(field, ShieldJob, new Vector2(ShieldJob.x, LandingCenter.y));
            LandingPad(field, SolarJob + Vector2.up * 1.45f, new Vector2(5.6f, 3.8f));
            LandingPad(field, AntennaJob - Vector2.up * 0.95f, new Vector2(4f, 3.7f));
            LandingPad(field, ShieldJob, new Vector2(4.7f, 4.4f));
            LandingPad(field, LandingCenter, new Vector2(9.6f, 4.4f));
            foreach (Vector2 berth in new[] { MaraBerth, PlayerBerth })
            {
                art.Disc(field, "Contorno de atraque", berth, new Vector2(3.88f, 3.72f), Ink("C58551"), -4);
                art.Disc(field, "Superficie de atraque", berth, new Vector2(3.67f, 3.48f), Ink("52606B"), -3);
                art.Line(field, berth - Vector2.right * 1.67f, berth + Vector2.right * 1.67f, 0.06f, Ink("9CAAAE"), -2);
            }
        }

        private void Runway(Transform field, Vector2 a, Vector2 b)
        {
            protectedSegments.Add((a, b));
            Vector2 span = b - a;
            Vector2 side = new Vector2(-span.y, span.x).normalized;
            art.Line(field, a, b, 2.44f, Ink("52656C"), -9);
            art.Line(field, a, b, 2.17f, Ink("778F88"), -8);
            art.Line(field, a, b, 0.065f, Ink("A9C8AF"), -7);
            for (int i = 1; i < span.magnitude; i += 2)
            {
                Vector2 p = a + span.normalized * i;
                GreenLamp(field, p + side * 1.03f);
                GreenLamp(field, p - side * 1.03f);
            }
        }

        private void GreenLamp(Transform field, Vector2 p)
        {
            Transform lamp = Group(field, "Lámpara verde · protección lunar", p);
            SpriteRenderer glow = art.Vapor(lamp, -5);
            glow.transform.localScale = new Vector3(1.16f, 1.16f, 1f);
            glow.color = new Color(0.21f, 1f, 0.43f, 0.72f);
            art.Disc(lamp, "Base de la lámpara", Vector2.zero, Vector2.one * 0.34f, Ink("3C5851"), -4);
            art.Disc(lamp, "Lente verde", Vector2.zero, Vector2.one * 0.23f, Ink("58E384"), -3);
            art.Disc(lamp, "Reflejo", new Vector2(0, 0.02f), Vector2.one * 0.08f, Ink("DCFFBA"), -2);
        }

        private void LandingPad(Transform field, Vector2 p, Vector2 size)
        {
            protectedPads.Add(new Rect(p - size * 0.5f, size));
            art.Plate(field, "Plataforma de mantenimiento", p, size, Ink("9297A3"), -6);
            art.Plate(field, "Centro de plataforma", p, size - Vector2.one * 0.18f, Ink("788495"), -5);
            for (int sign = -1; sign <= 1; sign += 2)
            {
                Vector2 side = p + Vector2.right * sign * (size.x / 2f - 0.23f);
                art.Plate(field, "Guía de plataforma", side, new Vector2(0.07f, size.y - 0.35f), Ink("D8AB77"), -4);
                GreenLamp(field, side + Vector2.up * (size.y * 0.30f));
                GreenLamp(field, side - Vector2.up * (size.y * 0.30f));
            }
        }

        private void Station()
        {
            for (int i = 0; i < 6; i++)
            {
                Vector2 dir = Direction(i);
                Centers[i + 1] = dir * OrbitRadius;
                Vector2 side = new(-dir.y, dir.x);
                Vector2 a = dir * (CoreApothem - 0.06f);
                Vector2 b = dir * (OrbitRadius - RoomApothem + 0.06f);
                Vector2 p = (a + b) * 0.5f;
                art.Plate(root, "Sombra del pasillo", p - Vector2.up * 0.16f,
                    new Vector2((b - a).magnitude + 0.4f, 2.7f), Ink("121723"), -11, i * 60f);
                art.Plate(root, "Piso del pasillo", p, new Vector2((b - a).magnitude + 0.2f, 2.3f),
                    Ink("777D83"), -4, i * 60f);
                art.Wall(root, a + side * 1.12f, b + side * 1.12f);
                art.Wall(root, a - side * 1.12f, b - side * 1.12f);
                art.KitWall(root, a + side * 1.12f, b + side * 1.12f, "space-wall", 0.69f);
                art.KitWall(root, a - side * 1.12f, b - side * 1.12f, "space-wall", 0.69f);
                art.Line(root, a + side * 0.77f, b + side * 0.77f, 0.16f, Ink("D4763F"), 1);
                art.Line(root, a - side * 0.77f, b - side * 0.77f, 0.16f, Ink("D4763F"), 1);
                for (int j = 1; j <= 10; j++)
                {
                    Vector2 stripe = Vector2.Lerp(a, b, j / 11f);
                    art.Kit(root, "space-floor", stripe,
                        new Vector2(0.9f, 1.44f), -3, i * 60f);
                }
                art.ResourceSprite(root, "Selene/wayfinding-" + (i + 1),
                    Vector2.Lerp(a, b, 0.62f), new Vector2(1.55f, 1.13f), Color.white, 1);
            }

            for (int i = 0; i < Centers.Length; i++)
                DrawRoom(i);
        }

        internal static Vector2 Direction(int i)
        {
            float angle = i * Mathf.PI / 3f;
            return new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
        }

        private void DrawRoom(int index)
        {
            Transform room = Group(root, RoomNames[index], Centers[index]);
            Rooms[index] = room;
            float apothem = index == 0 ? CoreApothem : RoomApothem;
            float diameter = apothem * 4f / Mathf.Sqrt(3f);
            Color accent = Ink(RoomColors[index]);
            art.Hex(room, new Vector2(0.20f, -0.38f), diameter + 0.92f, Ink("252834"), -12);
            art.Hex(room, Vector2.zero, diameter + 0.15f, Ink("646B72"), -8);
            art.Hex(room, Vector2.zero, diameter - 0.23f, Ink("C07042"), -7);
            art.Hex(room, Vector2.zero, diameter * 0.88f, Ink("E08D55"), -6);
            art.Hex(room, Vector2.zero, diameter * 0.795f, Ink("A6ADB3"), -5);
            for (int tile = -2; tile <= 2; tile++)
            {
                float offset = tile * apothem * 0.23f;
                for (int row = -2; row <= 2; row++)
                {
                    Vector2 floorPosition = new(offset, row * apothem * 0.23f);
                    art.Kit(room, "space-floor", floorPosition,
                        Vector2.one * (apothem * 0.226f), -3);
                }
            }
            art.Line(room, new Vector2(-apothem * 0.65f, -2.25f), new Vector2(apothem * 0.65f, -2.25f),
                0.05f, Ink("7C8B9B"), 1);
            for (int j = -1; j <= 1; j++)
            {
                Vector2 panelPosition = new(j * 1.6f, apothem * 0.63f);
                art.Plate(room, "Panel auxiliar", panelPosition,
                    new Vector2(1.25f, 0.65f), Ink("A9BED1"), 2);
                art.Plate(room, "Indicador auxiliar", panelPosition + Vector2.up * 0.08f,
                    new Vector2(0.40f, 0.05f), accent, 3);
                if (j != 0)
                    art.Kit(room, "space-bollard", panelPosition + new Vector2(j * 0.5f, -0.45f),
                        new Vector2(0.27f, 0.67f), 4);
            }
            for (int side = -1; side <= 1; side += 2)
            {
                Vector2 p = new(side * apothem * 0.56f, -apothem * 0.53f);
                art.Plate(room, "Banco de almacenamiento", p, new Vector2(1.65f, 0.85f), Ink("C8D7E4"), 2);
                art.Plate(room, "Cubierta blanca", p + Vector2.up * 0.065f,
                    new Vector2(1.51f, 0.65f), Ink("FFFFFF"), 3);
                art.Plate(room, "Identificador de equipo", p + Vector2.up * 0.21f,
                    new Vector2(0.64f, 0.06f), accent, 4);
            }

            for (int face = 0; face < 6; face++)
            {
                Vector2 normal = Direction(face);
                Vector2 tangent = new(-normal.y, normal.x);
                Vector2 center = normal * apothem;
                float half = apothem / Mathf.Sqrt(3f);
                bool open = index == 0 || face == (index + 2) % 6 || (index == 1 && face == 0);
                if (open)
                {
                    Wall(room, center - tangent * half, center - tangent * 1.12f);
                    Wall(room, center + tangent * 1.12f, center + tangent * half);
                }
                else
                {
                    Wall(room, center - tangent * half, center + tangent * half);
                    Vector2 trim = center - normal * 0.21f;
                    art.Line(room, trim - tangent * 0.66f, trim + tangent * 0.66f, 0.07f, accent, 8);
                }
            }

            art.ResourceSprite(room, "Selene/sign-" + index, new Vector2(0, -2.35f),
                new Vector2(3.95f, 0.76f), Color.white, 2);
            switch (index)
            {
                case 0:
                    Table(room, new Vector2(-1.32f, 1.57f), accent);
                    Device(room, new Vector2(1.45f, 1.62f), 1.14f, Ink("C3CFDB"), accent);
                    Device(room, new Vector2(-1.20f, -1.72f), 0.8f, Ink("8A9DAE"), accent);
                    for (int i = -1; i <= 1; i++)
                        SleepPod(room, new Vector2(3.65f, i * 1.37f + 0.68f), accent);
                    Telescope(room);
                    Bed(room);
                    Television(room);
                    break;
                case 1:
                    SuitRack(room, SuitPosition - Centers[1] + Vector2.up * 0.85f);
                    Device(room, new Vector2(0.32f, -2.48f), 2.9f, Ink("F7FAFF"), accent);
                    Rover(room, new Vector2(-2.95f, -1.75f), accent);
                    break;
                case 2:
                    for (int j = -1; j <= 1; j++)
                    {
                        Vector2 bed = new(j * 1.75f, 2.12f);
                        art.Plate(room, "Mesa de cultivo", bed, new Vector2(1.55f, 2.6f), Ink("344740"), 3);
                        art.Plate(room, "Sustrato", bed, new Vector2(1.32f, 2.38f), Ink("74614E"), 4);
                        for (int row = 0; row < 4; row++)
                        for (int column = -1; column <= 1; column++)
                        {
                            Vector2 p = bed + new Vector2(column * 0.36f, -0.83f + row * 0.53f);
                            art.Disc(room, "Hoja", p, new Vector2(0.37f, 0.49f), Ink("4A774F"), 5);
                            art.Disc(room, "Brote", p + Vector2.up * 0.08f, new Vector2(0.21f, 0.32f), Ink("9FBE70"), 5);
                        }
                    }
                    break;
                case 3:
                    for (int j = -1; j <= 1; j++)
                    {
                        Vector2 tank = new(j * 1.43f, 2.4f);
                        art.Disc(room, "Depósito de oxígeno", tank, new Vector2(1.2f, 2.2f), accent, 3);
                        art.Disc(room, "Brillo del depósito", tank + new Vector2(-0.15f, 0.1f),
                            new Vector2(0.37f, 1.6f), Ink("B8D9DC"), 4);
                        art.Plate(room, "Sujeción", tank, new Vector2(1.19f, 0.19f), Ink("364B5F"), 5);
                    }
                    art.Line(room, new Vector2(-2.45f, 3.2f), new Vector2(2.45f, 3.2f), 0.14f, Ink("567D89"), 2);
                    break;
                case 4:
                    for (int i = -1; i <= 1; i++)
                    {
                        Vector2 track = new(i * 1.56f, 2.0f);
                        art.Plate(room, "Cinta de ejercicio", track, new Vector2(1.2f, 2.2f), Ink("354155"), 3);
                        art.Plate(room, "Banda de la cinta", track, new Vector2(0.80f, 1.73f), accent, 4);
                        art.Plate(room, "Mando de la cinta", track + new Vector2(0, 0.87f),
                            new Vector2(1.28f, 0.25f), Ink("F4EFE6"), 5);
                    }
                    break;
                case CommunicationsRoom:
                    for (int key = -2; key <= 2; key++)
                    {
                        Vector2 screen = new(key * 1.15f, 2.36f + Mathf.Abs(key) * 0.12f);
                        Device(room, screen, 1.04f, Ink("2F405A"), accent);
                        art.Plate(room, "Pantalla de comunicaciones", screen, new Vector2(0.88f, 0.42f), Ink("242E42"), 4);
                        art.Line(room, screen + new Vector2(-0.28f, -0.05f),
                            screen + new Vector2(0.28f, 0.06f), 0.04f, Ink("F6C085"), 5);
                    }
                    UplinkConsole(room);
                    break;
                case ResearchRoom:
                    for (int i = -1; i <= 1; i++)
                        SleepPod(room, new Vector2(i * 1.5f, 2.24f), accent);
                    DrawMarsTrekConsole(room);
                    break;
            }
        }

        private void UplinkConsole(Transform room)
        {
            Transform console = Group(room, "Panel de envío de datos", ResearchUplink + Vector2.up * 0.82f);
            art.Plate(console, "Carcasa", Vector2.zero, new Vector2(2.20f, 1.05f), Ink("2C374A"), 3);
            art.Plate(console, "Marco", Vector2.up * 0.08f, new Vector2(2.02f, 0.70f), Ink("8494A6"), 4);
            art.Plate(console, "Pantalla del enlace", new Vector2(-0.19f, 0.08f), new Vector2(1.45f, 0.52f), Ink("172239"), 5);
            art.Disc(console, "Destino Tierra", new Vector2(0.31f, 0.09f), Vector2.one * 0.35f, Ink("72BCDF"), 6);
            for (int i = 0; i < 3; i++)
                art.Plate(console, "Indicador de datos", new Vector2(-0.70f + i * 0.23f, 0.08f),
                    new Vector2(0.11f, 0.10f), Ink("AC9BFF"), 6);
            art.Disc(console, "Luz de la consola", new Vector2(0.72f, 0.08f), Vector2.one * 0.12f, Ink("77E1AF"), 6);
        }

        private void DrawMarsTrekConsole(Transform room)
        {
            Transform console = Group(room, "Cartografía Mars Trek", MarsTrekConsole);
            art.Plate(console, "Carcasa", Vector2.zero, new Vector2(2.23f, 1.08f), Ink("36465B"), 4);
            art.Plate(console, "Pantalla", new Vector2(0, 0.06f), new Vector2(2f, 0.74f), Ink("1A283B"), 5);
            art.Disc(console, "Marte", new Vector2(-0.55f, 0.08f), Vector2.one * 0.55f, Ink("E88D5B"), 6);
            art.Line(console, new Vector2(-0.80f, 0.02f), new Vector2(-0.32f, 0.14f), 0.05f, Ink("9C543C"), 7);
            for (int row = -1; row <= 1; row++)
                art.Plate(console, "Línea de telemetría", new Vector2(0.34f, 0.11f + row * 0.16f),
                    new Vector2(0.68f - row * 0.10f, 0.055f), Ink("75BAC3"), 6);
        }

        private void Bed(Transform room)
        {
            Transform bed = Group(room, "Cama del tripulante", Bedroom);
            art.Plate(bed, "Armazón", Vector2.zero, new Vector2(1.76f, 1.22f), Ink("4E5966"), 3);
            art.Plate(bed, "Colchón", new Vector2(0, 0.06f), new Vector2(1.59f, 1.02f), Ink("F2EAE1"), 4);
            art.Plate(bed, "Manta", new Vector2(0.19f, 0.06f), new Vector2(1.14f, 0.98f), Ink("6D8BA4"), 5);
            art.Disc(bed, "Almohada", new Vector2(-0.49f, 0.08f), new Vector2(0.49f, 0.67f), Ink("FCF6EF"), 5);
        }

        private void Telescope(Transform room)
        {
            Transform instrument = Group(room, "Telescopio de la sala de descanso", TelescopePosition, 27);
            art.Disc(instrument, "Alfombrilla de observación", Vector2.zero, new Vector2(2f, 1.43f), Ink("737D87"), 2);
            art.Line(instrument, Vector2.zero, new Vector2(-0.38f, -0.50f), 0.13f, Ink("354452"), 4);
            art.Line(instrument, Vector2.zero, new Vector2(0.31f, -0.52f), 0.13f, Ink("354452"), 4);
            art.Line(instrument, Vector2.zero, new Vector2(-0.06f, 0.39f), 0.13f, Ink("354452"), 4);
            art.Plate(instrument, "Tubo del telescopio", new Vector2(0.06f, 0.13f), new Vector2(1.56f, 0.53f), Ink("424A55"), 5);
            art.Plate(instrument, "Carcasa naranja", new Vector2(-0.01f, 0.14f), new Vector2(1.30f, 0.39f), Ink("D98548"), 6);
            art.Plate(instrument, "Aro del ocular", new Vector2(-0.70f, 0.13f), new Vector2(0.15f, 0.32f), Ink("F5F0E9"), 7);
            art.Disc(instrument, "Montura de lente", new Vector2(0.78f, 0.13f), new Vector2(0.28f, 0.57f), Ink("284654"), 7);
            art.Disc(instrument, "Lente del telescopio", new Vector2(0.83f, 0.13f), new Vector2(0.17f, 0.43f), Ink("79BAC9"), 8);
            Box(instrument, "Base sólida del telescopio", Vector2.zero, new Vector2(1.21f, 0.54f));
        }

        private void Television(Transform room)
        {
            Transform set = Group(room, "Televisor VHS del dormitorio", BedroomTelevision);
            art.Line(set, new Vector2(-0.34f, 0.26f), new Vector2(-0.65f, 0.73f), 0.055f, Ink("303849"), 4);
            art.Line(set, new Vector2(-0.34f, 0.26f), new Vector2(-0.07f, 0.73f), 0.055f, Ink("303849"), 4);
            art.Plate(set, "Marco CRT", Vector2.zero, new Vector2(1.69f, 1.04f), Ink("3F4655"), 5);
            art.Plate(set, "Cristal", new Vector2(-0.16f, 0.11f), new Vector2(1.17f, 0.67f), Ink("193348"), 6);
            art.Plate(set, "Reflejo", new Vector2(-0.31f, 0.27f), new Vector2(0.59f, 0.06f), Ink("5090A4"), 7);
            art.Plate(set, "Ranura VHS", new Vector2(-0.12f, -0.35f), new Vector2(0.79f, 0.10f), Ink("182231"), 6);
            art.Disc(set, "Luz de encendido", new Vector2(0.59f, -0.22f), Vector2.one * 0.11f, Ink("93DEAA"), 7);
        }

        private void SuitRack(Transform room, Vector2 position)
        {
            Transform rack = Group(room, "Estantería de trajes EVA", position);
            art.Plate(rack, "Marco de la estantería", Vector2.zero, new Vector2(3.72f, 1.45f), Ink("494F58"), 3);
            art.Plate(rack, "Cabecera naranja", new Vector2(0, 0.65f), new Vector2(3.57f, 0.21f), Ink("D07840"), 4);
            for (int i = 0; i < 3; i++)
            {
                Vector2 cell = new((i - 1) * 1.18f, -0.04f);
                art.Plate(rack, "Fondo del casillero", cell, new Vector2(1.04f, 1.04f), Ink("68747D"), 4);
                art.Plate(rack, "Balda", cell - Vector2.up * 0.49f, new Vector2(1.04f, 0.10f), Ink("D1D7D8"), 5);
                Transform outfit = Group(rack, "Traje EVA " + (i + 1), cell);
                art.ResourceSprite(outfit, "Selene/suit-rack", Vector2.zero,
                    new Vector2(0.72f, 0.95f), Color.white, 6);
                if (i == 1)
                    borrowedSuit = outfit.gameObject;
            }
        }

        private void SleepPod(Transform room, Vector2 p, Color accent)
        {
            art.Disc(room, "Cápsula", p, new Vector2(1.28f, 1.10f), Ink("536377"), 3);
            art.Disc(room, "Cubierta de la cápsula", p + Vector2.up * 0.06f,
                new Vector2(1.15f, 0.90f), Ink("F8F5EF"), 4);
            art.Disc(room, "Ventana de la cápsula", p + Vector2.up * 0.20f,
                new Vector2(0.73f, 0.50f), accent, 5);
        }

        private void Rover(Transform room, Vector2 p, Color accent)
        {
            for (int x = -1; x <= 1; x += 2)
            for (int y = -1; y <= 1; y += 2)
                art.Plate(room, "Rueda del rover", p + new Vector2(x * 0.79f, y * 0.48f),
                    new Vector2(0.44f, 0.62f), Ink("394251"), 3);
            art.Plate(room, "Chasis del rover", p, new Vector2(1.55f, 1.9f), Ink("DEE3E8"), 4);
            art.Plate(room, "Cubierta del rover", p + Vector2.up * 0.19f, new Vector2(1.13f, 1.39f), accent, 5);
            art.Plate(room, "Parabrisas", p + Vector2.up * 0.39f, new Vector2(1.02f, 0.34f), Ink("3C5269"), 6);
        }

        private void Wall(Transform room, Vector2 a, Vector2 b)
        {
            art.Wall(room, a, b);
            art.KitWall(room, a, b, "space-wall", 0.70f);
            art.Line(room, a, b, 0.095f, Ink("D27842"), 9);
        }

        private void Table(Transform room, Vector2 p, Color accent)
        {
            art.Disc(room, "Mesa", p, new Vector2(1.57f, 0.77f), Ink("91A6BA"), 2);
            art.Disc(room, "Cubierta", p + Vector2.up * 0.05f, new Vector2(1.40f, 0.66f), Ink("FFFFFF"), 3);
            art.Plate(room, "Bandeja", p, new Vector2(0.31f, 0.22f), accent, 4, 10f);
        }

        private void Device(Transform room, Vector2 p, float width, Color casing, Color light)
        {
            art.Plate(room, "Equipo", p, new Vector2(width + 0.10f, 0.78f), Ink("8CA2BA"), 2);
            art.Plate(room, "Carcasa", p + Vector2.up * 0.055f, new Vector2(width, 0.59f),
                Color.Lerp(casing, Color.white, 0.55f), 3);
            art.Plate(room, "Indicador", p + new Vector2(0f, 0.16f), new Vector2(width * 0.58f, 0.10f), light, 4);
        }

        private void Airlock()
        {
            float midpoint = (InnerGateX + OuterGateX) * 0.5f;
            float length = OuterGateX - InnerGateX;
            Vector2 left = new(InnerGateX, 0f), right = new(OuterGateX, 0f);
            art.Plate(root, "Piso esclusa", new Vector2(midpoint, 0f), new Vector2(length, 2.28f), Ink("E6EDF5"), -2);
            Wall(root, left + Vector2.up * 1.12f, right + Vector2.up * 1.12f);
            Wall(root, left - Vector2.up * 1.12f, right - Vector2.up * 1.12f);
            art.Kit(root, "space-cables", new Vector2(midpoint, -0.62f), new Vector2(1.42f, 0.55f), 1);
            for (int i = 0; i < 11; i++)
                art.Plate(root, "Marca de seguridad", new Vector2(InnerGateX + 0.3f + i * 0.46f, -0.80f),
                    new Vector2(0.27f, 0.075f), Ink("FFC577"), 0, 35f);

            GarageZone = Box(root, "Zona del garaje", Centers[1],
                new Vector2(2f * RoomApothem, 4f * RoomApothem / Mathf.Sqrt(3f)), trigger: true);
            SuitZone = Box(root, "Zona del casillero", SuitPosition, new Vector2(2.5f, 2.1f), trigger: true);
            ChamberZone = Box(root, "Cámara EVA", new Vector2(midpoint, 0f), new Vector2(length, 2.24f), trigger: true);
            ExteriorZone = Box(root, "Superficie EVA", new Vector2((OuterGateX + EastEdge) * 0.5f,
                (SouthEdge + NorthEdge) * 0.5f),
                new Vector2(EastEdge - OuterGateX, NorthEdge - SouthEdge), trigger: true);
            InteriorControlZone = AirlockButton("Botón del garaje", InnerGateX - 1.10f, 1.86f);
            ControlZone = AirlockButton("Botón lunar", OuterGateX + 1.15f, 1.92f);
            InnerGate = Box(root, "Puerta interior", left, new Vector2(0.30f, 2.22f));
            OuterGate = Box(root, "Compuerta exterior", right, new Vector2(0.30f, 2.22f));
            innerVisual = new SlidingGate(root, left, art);
            outerVisual = new SlidingGate(root, right, art);

            for (int panel = 0; panel < 3; panel++)
            {
                Vector2 p = SolarJob + new Vector2((panel - 1) * 1.35f, 1.35f);
                art.Plate(root, "Panel solar", p, new Vector2(0.92f, 1.45f), Ink("121D35"), 2, -16f);
                art.Plate(root, "Células solares", p, new Vector2(0.75f, 1.23f), Ink("4678AE"), 3, -16f);
                art.Line(root, p + new Vector2(-0.19f, -0.57f), p + new Vector2(0.15f, 0.58f), 0.045f, Ink("83BCEA"), 4);
            }
            art.Disc(root, "Antena", AntennaJob + new Vector2(0.05f, -1.25f), new Vector2(2.35f, 1.25f), Ink("A1AEBE"), 3);
            art.Disc(root, "Plato de la antena", AntennaJob + new Vector2(0.04f, -1.14f), new Vector2(1.85f, 0.89f), Ink("596C85"), 4);
            art.Line(root, AntennaJob + new Vector2(-0.18f, -1.4f), AntennaJob + new Vector2(0.42f, -0.88f), 0.09f, Ink("DBE3EB"), 5);
            art.Hex(root, ShieldJob, 2.82f, Ink("687587"), 2);
            art.Hex(root, ShieldJob, 2.49f, Ink("39485A"), 3);
            for (int i = 0; i < 6; i++)
            {
                Vector2 anchor = ShieldJob + Direction(i) * 0.95f;
                art.Disc(root, "Anclaje del escudo", anchor, Vector2.one * 0.13f, Ink("F6C27B"), 4);
            }
        }

        private BoxCollider2D AirlockButton(string name, float x, float reach)
        {
            Vector2 position = new(x, 0.76f);
            art.Plate(root, name + " · carcasa", position, new Vector2(0.48f, 0.48f), Ink("334A62"), 8);
            art.Disc(root, name, position, Vector2.one * 0.28f, Ink("77E5E2"), 9);
            art.Disc(root, name + " · reflejo", position + new Vector2(-0.047f, 0.045f),
                Vector2.one * 0.086f, Ink("E8FEFD"), 10);
            return Box(root, name + " · alcance", new Vector2(x, 0.05f),
                new Vector2(reach, 2.06f), trigger: true);
        }

        public void AnimateGates(bool open, bool innerField, bool outerField, float seconds)
        {
            innerVisual.Update(open, innerField, seconds);
            outerVisual.Update(open, outerField, seconds);
        }

        private sealed class SlidingGate
        {
            private readonly Transform upper;
            private readonly Transform lower;
            private readonly SpriteRenderer status;
            private readonly SpriteRenderer fieldGlow, fieldLine;
            private float progress;

            public SlidingGate(Transform root, Vector2 position, LunarShapes art)
            {
                Transform frame = Group(root, "Compuerta de dos hojas", position);
                art.Kit(frame, "space-gate", Vector2.zero, new Vector2(3.05f, 0.89f), 8, 90);
                upper = Leaf(frame, art, "Hoja superior", 0.55f);
                lower = Leaf(frame, art, "Hoja inferior", -0.55f);
                foreach (float y in new[] { -1.46f, 1.46f })
                    art.Plate(frame, "Alojamiento", new Vector2(0, y), new Vector2(0.66f, 1.06f),
                        Ink("9AAFC3"), 11);
                status = art.Plate(frame, "Luz de compuerta", new Vector2(0, 1.44f),
                    new Vector2(0.22f, 0.25f), Ink("F49067"), 13);
                fieldGlow = art.Plate(frame, "Campo de contención", Vector2.zero,
                    new Vector2(0.28f, 2.11f), Ink("51E3F4"), 12);
                fieldLine = art.Plate(frame, "Borde del campo", Vector2.zero,
                    new Vector2(0.055f, 2.11f), Ink("C6F9FF"), 13);
            }

            private static Transform Leaf(Transform frame, LunarShapes art, string name, float y)
            {
                Transform leaf = Group(frame, name, new Vector2(0, y));
                art.Kit(leaf, "space-door-leaf", Vector2.zero, new Vector2(1.12f, 0.49f),
                    10, y > 0 ? 90 : -90);
                return leaf;
            }

            public void Update(bool open, bool field, float seconds)
            {
                progress = Mathf.MoveTowards(progress, open ? 1f : 0f, seconds * 2.85f);
                float distance = 0.55f + Mathf.SmoothStep(0, 1.16f, progress);
                upper.localPosition = new Vector2(0, distance);
                lower.localPosition = new Vector2(0, -distance);
                status.color = Ink(field ? "54BEF0" : open ? "49DABA" : "F49067");
                fieldGlow.enabled = field;
                fieldLine.enabled = field;
                if (field)
                {
                    Color tint = fieldGlow.color;
                    tint.a = 0.27f + Mathf.Sin(Time.time * 5f) * 0.08f;
                    fieldGlow.color = tint;
                }
            }
        }
    }
}
