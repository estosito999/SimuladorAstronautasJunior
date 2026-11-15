using System.Collections.Generic;
using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarTutorial
    {
        private static readonly (int Room, string Title, string Speech, int Task, string Tip)[] Lessons =
        {
            (0, "Habitación principal",
                "Soy Mara. Muévete con WASD o clic, usa E junto a un equipo y abre el plano con M. El tablero de esta sala repara el casco. Sígueme al invernadero.", -1, ""),
            (2, "Invernadero",
                "Aquí cultivamos la comida. Regar recupera comida y gasta agua.", 1,
                "El agua de riego vuelve al circuito de la estación.\nLa misma gota puede pasar por varias macetas.\nAsí se aprovecha cada litro del invernadero."),
            (3, "Soporte vital",
                "Este módulo sostiene las reservas de oxígeno y agua. Si dejas el filtro pendiente, comenzarán las fugas.", 2,
                "La base y el traje tienen reservas distintas.\nUna fuga interior afecta primero al aire de la sala.\nEl tanque portátil viaja contigo durante la EVA."),
            (4, "Sala de ejercicio",
                "Aquí entrenamos antes de las salidas. Una sesión en el gimnasio recupera salud y moral.", LunarExercise.Task,
                "Entrenamos con botas lastradas dentro de Selene.\nLas correas ayudan a mantener el equilibrio.\nLa rutina cambia cada día para alternar el esfuerzo."),
            (LunarMap.CommunicationsRoom, "Comunicaciones y mantenimiento",
                "En Investigación se preparan los datos. Desde este panel los enviamos a la Tierra los días 5, 10 y 15. Cada envío ocupa uno de los tres cupos.", 3,
                "El enlace envía un paquete por día de informe.\nLos otros días, la consola conserva los registros.\nLa Tierra confirma la recepción de cada paquete."),
            (LunarMap.ResearchRoom, "Investigación",
                "Aquí diseñamos el escudo para la superficie. En el otro panel podrás practicar cartografía de Marte con Mars Trek.", 6,
                "El escudo se ancla fuera de la base.\nLos tres soportes orientan sus capas protectoras.\nSu cobertura beneficia a toda la estación."),
            (1, "Garaje y esclusa",
                "Equipa el traje antes de pulsar E en la esclusa. Afuera, sigue las luces verdes hacia los paneles y la antena. Al volver, presiona E en el botón lunar.", -1, ""),
            (1, "Te dejo al mando",
                "Puedes hacer hasta tres trabajos por día. Cuando termines al menos dos, pulsa E junto a tu cama para dormir. Completa los ocho tipos de trabajo antes de dormir el día 15.", -1, "")
        };

        private readonly LunarMap map;
        private readonly Transform actor;
        private readonly Transform body;
        private readonly Transform leftBoot, rightBoot;
        private readonly Queue<Vector2> path = new();
        private float stride;
        private int lesson;

        public string Title => Lessons[lesson].Title;
        public string Speech => Lessons[lesson].Speech;
        public int PracticeTask => Lessons[lesson].Task;
        public string Tip => Lessons[lesson].Tip;
        public bool IsLast => lesson == Lessons.Length - 1;
        public bool Ready => path.Count == 0;
        public Vector2 Position => actor.position;

        public LunarTutorial(Transform world, LunarShapes art, LunarMap map, Vector2 start)
        {
            this.map = map;
            actor = Group(world, "Mara · mapache astronauta", start);
            art.Disc(actor, "Sombra de Mara", new Vector2(0, -0.14f), new Vector2(0.96f, 0.36f),
                new Color(0.15f, 0.20f, 0.27f, 0.31f), 23);
            body = Group(actor, "Arte animado de Mara", Vector2.zero);
            leftBoot = Boot(art, -0.16f);
            rightBoot = Boot(art, 0.19f);
            art.ResourceSprite(body, "Selene/mara-mapache", new Vector2(0, 0.43f),
                new Vector2(1.36f, 1.32f), Color.white, 27);
            art.ResourceSprite(actor, "Selene/instructor", new Vector2(0, 1.24f),
                new Vector2(1.92f, 0.36f), Color.white, 28);
        }

        private Transform Boot(LunarShapes art, float x)
        {
            Transform foot = Group(body, "Bota articulada", new Vector2(x, -0.12f));
            art.Disc(foot, "Suela", Vector2.zero, new Vector2(0.25f, 0.22f), Ink("273246"), 25);
            art.Disc(foot, "Bota", new Vector2(0.007f, 0.023f), new Vector2(0.19f, 0.15f), Ink("FFF5DF"), 26);
            return foot;
        }

        public bool CanTalk(Vector2 position) => Ready &&
            (position - (Vector2)actor.position).sqrMagnitude <= 2.55f * 2.55f;

        public void Advance()
        {
            if (!Ready || IsLast)
                return;

            int previousRoom = Lessons[lesson++].Room;
            int nextRoom = Lessons[lesson].Room;
            if (previousRoom == nextRoom)
                return;
            path.Enqueue(map.Centers[previousRoom]);
            if (previousRoom != 0)
                path.Enqueue(Vector2.zero);
            path.Enqueue(map.Centers[nextRoom]);
        }

        public void Dismiss()
        {
            path.Clear();
            actor.gameObject.SetActive(false);
        }

        public void Place(Vector2 position, float seconds)
        {
            actor.gameObject.SetActive(true);
            Vector2 previous = actor.position;
            actor.position = position;
            Pose(seconds > 0f ? position - previous : Vector2.zero, seconds);
        }

        public void Tick(Vector2 player, float seconds)
        {
            if (path.Count > 0)
            {
                Vector2 position = actor.position;
                // The instructor stays a short distance ahead so the player can follow on foot.
                if (Vector2.Distance(player, position) > 5.7f)
                {
                    Pose(Vector2.zero, seconds);
                    return;
                }
                Vector2 waypoint = path.Peek();
                Vector2 next = Vector2.MoveTowards(position, waypoint, 3.45f * seconds);
                actor.position = next;
                Pose(next - position, seconds);
                if (next == waypoint)
                    path.Dequeue();
                return;
            }

            Pose(Vector2.zero, seconds);
        }

        private void Pose(Vector2 offset, float seconds)
        {
            bool walking = offset.sqrMagnitude > 0.00001f;
            if (Mathf.Abs(offset.x) > 0.002f)
                body.localScale = new Vector3(Mathf.Sign(offset.x), 1f, 1f);
            stride = walking ? stride + seconds * 17f : 0f;
            float swing = Mathf.Sin(stride);
            leftBoot.localRotation = Quaternion.Euler(0, 0, swing * 23f);
            rightBoot.localRotation = Quaternion.Euler(0, 0, -swing * 23f);
            body.localPosition = new Vector2(0, Mathf.Abs(swing) * 0.065f);
        }
    }
}
