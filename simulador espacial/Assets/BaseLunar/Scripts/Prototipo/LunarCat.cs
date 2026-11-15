using System.Collections.Generic;
using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarCat
    {
        private readonly Transform root, body, tail, heart;
        private readonly Queue<Vector2> trail = new();
        private Vector2 sampled;
        private const float SpinDuration = 3.12f;
        private float petTime, gait, streakTime, spinTime, facing = 1f;
        private int pets;
        public Vector2 Position => root.position;
        public bool Following { get; private set; }

        public LunarCat(Transform room, LunarShapes art, Vector2 start)
        {
            root = Group(room, "Miga · gata de Selene", start);
            art.Disc(root, "Sombra", Vector2.zero, new Vector2(0.75f, 0.31f), Ink("444047"), 13);
            body = Group(root, "Gata", Vector2.zero);
            Color fur = Ink("EBA16C"), cream = Ink("FFF0D7"), dark = Ink("5A3636");
            tail = Group(body, "Cola", new Vector2(-0.22f, 0.09f));
            art.Line(tail, Vector2.zero, new Vector2(-0.25f, 0.25f), 0.076f, fur, 15);
            art.Disc(tail, "Punta", new Vector2(-0.25f, 0.25f), new Vector2(0.10f, 0.10f), cream, 16);
            art.Disc(body, "Lomo", new Vector2(-0.06f, 0.06f), new Vector2(0.52f, 0.30f), fur, 16);
            art.Disc(body, "Patas", new Vector2(0.08f, -0.04f), new Vector2(0.42f, 0.12f), cream, 17);
            art.Plate(body, "Oreja izquierda", new Vector2(0.08f, 0.34f), new Vector2(0.13f, 0.14f), fur, 17, 45);
            art.Plate(body, "Oreja derecha", new Vector2(0.28f, 0.34f), new Vector2(0.13f, 0.14f), fur, 17, 45);
            art.Disc(body, "Cabeza", new Vector2(0.18f, 0.23f), new Vector2(0.38f, 0.29f), fur, 18);
            art.Disc(body, "Hocico", new Vector2(0.20f, 0.17f), new Vector2(0.23f, 0.12f), cream, 19);
            art.Disc(body, "Nariz", new Vector2(0.23f, 0.19f), new Vector2(0.06f, 0.04f), dark, 20);
            art.Disc(body, "Ojo", new Vector2(0.12f, 0.24f), new Vector2(0.035f, 0.045f), dark, 20);
            art.Disc(body, "Ojo", new Vector2(0.27f, 0.24f), new Vector2(0.035f, 0.045f), dark, 20);
            heart = Group(root, "Corazón", new Vector2(0, 0.55f));
            Color pink = Ink("F490AE");
            art.Plate(heart, "Corazón", new Vector2(0, -0.015f), new Vector2(0.14f, 0.14f), pink, 27, 45);
            art.Disc(heart, "Corazón", new Vector2(-0.057f, 0.045f), Vector2.one * 0.144f, pink, 27);
            art.Disc(heart, "Corazón", new Vector2(0.057f, 0.045f), Vector2.one * 0.144f, pink, 27);
            heart.gameObject.SetActive(false);
        }

        public bool IsNear(Vector2 player) => (Position - player).sqrMagnitude <= 1.15f * 1.15f;

        public bool Pet(Vector2 player)
        {
            Following = !Following;
            trail.Clear();
            sampled = player;
            petTime = 0.75f;
            heart.gameObject.SetActive(true);
            pets = streakTime > 0f ? pets + 1 : 1;
            streakTime = 2.4f;
            if (pets < 5 || spinTime > 0f)
                return false;
            pets = 0;
            streakTime = 0f;
            spinTime = SpinDuration;
            return true;
        }

        public void Tick(Vector2 player, bool inside, float dt)
        {
            streakTime = Mathf.Max(0f, streakTime - dt);
            spinTime = Mathf.Max(0f, spinTime - dt);
            if (petTime > 0f)
            {
                petTime = Mathf.Max(0f, petTime - dt);
                heart.localPosition = new Vector3(0, 0.58f + (0.75f - petTime) * 0.55f, 0);
                if (petTime == 0f) heart.gameObject.SetActive(false);
            }

            bool walking = false;
            if (Following && inside)
            {
                if ((player - sampled).sqrMagnitude > 0.14f)
                {
                    trail.Enqueue(sampled);
                    sampled = player;
                }
                while (trail.Count > 0 && (trail.Peek() - Position).sqrMagnitude < 0.025f)
                    trail.Dequeue();
                if (spinTime <= 0f && trail.Count > 0 && (player - Position).sqrMagnitude > 0.71f * 0.71f)
                {
                    Vector2 next = Vector2.MoveTowards(Position, trail.Peek(), dt * 5.9f);
                    Vector2 step = next - Position;
                    root.position = next;
                    walking = step.sqrMagnitude > 0.000001f;
                    if (Mathf.Abs(step.x) > 0.003f)
                        facing = Mathf.Sign(step.x);
                }
            }
            gait += dt * (walking ? 17f : 4f);
            float spin = spinTime > 0f ? (SpinDuration - spinTime) * 16f : 0f;
            float silhouette = Mathf.Cos(spin);
            body.localScale = new Vector3(facing * Mathf.Sign(silhouette) * Mathf.Max(0.12f, Mathf.Abs(silhouette)), 1f, 1f);
            body.localPosition = new Vector3(0f, spinTime > 0f ? 0.12f + Mathf.Abs(Mathf.Sin(spin)) * 0.09f :
                walking ? Mathf.Abs(Mathf.Sin(gait)) * 0.08f : 0f, 0f);
            tail.localRotation = Quaternion.Euler(0, 0, (Following ? 0f : -21f) + Mathf.Sin(gait) * 12f);
        }

        [System.Serializable]
        public struct Checkpoint
        {
            public Vector2 Position, Sample;
            public bool Following;
            public Vector2[] Trail;
        }

        public Checkpoint Capture() => new()
        {
            Position = Position, Sample = sampled, Following = Following, Trail = trail.ToArray()
        };

        public void Restore(Checkpoint saved)
        {
            root.position = saved.Position;
            Following = saved.Following;
            pets = 0;
            streakTime = spinTime = 0f;
            sampled = saved.Sample;
            trail.Clear();
            foreach (Vector2 point in saved.Trail)
                trail.Enqueue(point);
        }
    }
}
