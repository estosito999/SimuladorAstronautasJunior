using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarDeathAnimation
    {
        private const float Duration = 8f;
        private readonly LunarCrewArt artwork;
        private readonly Transform figure;
        private readonly SpriteRenderer[] particles = new SpriteRenderer[10];
        private readonly SpriteRenderer[] suitFragments = new SpriteRenderer[7];
        private readonly SpriteRenderer[] bodySprites;
        private readonly SpriteRenderer[] tail;
        private readonly Color[] bodyColors;
        private readonly SpriteRenderer vein;
        private CrewDeathCause cause;
        private float elapsed;
        private bool hadSuit, suitSplit;

        public bool Playing { get; private set; }
        public CrewDeathCause Cause => cause;
        public float Progress => Mathf.Clamp01(elapsed / Duration);

        public LunarDeathAnimation(Transform astronaut, LunarCrewArt artwork, LunarShapes art)
        {
            this.artwork = artwork;
            figure = artwork.Root;
            bodySprites = figure.GetComponentsInChildren<SpriteRenderer>(true);
            tail = System.Array.FindAll(bodySprites, sprite => sprite.name == "Cola" || sprite.name == "Anillo de la cola");
            bodyColors = new Color[bodySprites.Length];
            vein = art.Plate(astronaut, "Vena de estrés", new Vector2(-0.05f, 0.52f), new Vector2(0.22f, 0.05f),
                Ink("F65C55"), 31, -24f);
            vein.enabled = false;
            for (int i = 0; i < suitFragments.Length; i++)
            {
                suitFragments[i] = art.Plate(astronaut, "Fragmento del traje", Vector2.zero,
                    new Vector2(0.14f, 0.29f), Color.white, 31);
                suitFragments[i].enabled = false;
            }
            for (int i = 0; i < particles.Length; i++)
            {
                particles[i] = art.Disc(astronaut, "Efecto de muerte", Vector2.zero, Vector2.one * 0.14f,
                    Color.white, 29);
                particles[i].enabled = false;
            }
        }

        public void Play(CrewDeathCause reason, bool equipped = false)
        {
            if (Playing)
                return;

            cause = reason;
            hadSuit = equipped;
            suitSplit = false;
            for (int i = 0; i < bodySprites.Length; i++)
                bodyColors[i] = bodySprites[i].color;
            elapsed = 0;
            Playing = true;
        }

        public void Tick(float seconds)
        {
            elapsed += seconds;
            float t = Progress;
            Vector2 offset;
            float rotation, stretch;
            float width = 1f;
            switch (cause)
            {
                case CrewDeathCause.Dismissed:
                case CrewDeathCause.Blackout:
                    offset = Vector2.zero;
                    rotation = 0;
                    stretch = 1;
                    break;
                case CrewDeathCause.Ejection:
                    offset = new Vector2(7.3f * t * t, Mathf.Sin(t * Mathf.PI) * 1.2f + t * 1.7f);
                    rotation = -790f * t;
                    stretch = 1f - 0.8f * t;
                    Burst(Ink("E7F8FF"), t, offset, 1.2f, 0.82f);
                    break;
                case CrewDeathCause.Stress:
                {
                    float pop = Mathf.InverseLerp(0.67f, 1f, t);
                    vein.enabled = t < 0.67f;
                    vein.transform.localScale = new Vector3(0.18f + 0.19f * t, 0.045f + 0.06f * t, 1);
                    offset = new Vector2(Mathf.Sin(t * 178f) * (1 - pop) * 0.07f, -0.31f * pop);
                    rotation = 83f * pop;
                    stretch = 1f + Mathf.Sin(t * 87f) * 0.10f * (1 - pop);
                    if (pop > 0)
                        Burst(Ink("FFE1A5"), pop, new Vector2(0, 0.51f), 1.5f, 0.9f);
                    break;
                }
                case CrewDeathCause.Radiation:
                {
                    float changing = Mathf.InverseLerp(0.10f, 0.72f, t);
                    float pop = Mathf.InverseLerp(0.74f, 0.88f, t);
                    if (!suitSplit && t >= 0.34f)
                    {
                        suitSplit = true;
                        artwork.ShowSuit(false);
                    }
                    TearSuit(t);
                    offset = new Vector2(Mathf.Sin(elapsed * 24f) * changing * 0.17f * (1 - pop), changing * 0.19f * (1 - pop));
                    rotation = Mathf.Sin(elapsed * 18f) * 13f * (1 - pop);
                    stretch = (1f + 0.92f * changing) * (1 - pop);
                    width = (1f + 0.48f * changing) * (1 - pop);
                    float translucency = Mathf.Lerp(1f, 0.51f, Mathf.InverseLerp(0.34f, 0.60f, t));
                    for (int i = 0; i < bodySprites.Length; i++)
                    {
                        Color green = Color.Lerp(bodyColors[i], Ink("75D764"), changing);
                        green.a = bodyColors[i].a * translucency * (1 - pop);
                        bodySprites[i].color = green;
                    }
                    if (t >= 0.74f)
                        Burst(Ink("A7F575"), Mathf.InverseLerp(0.74f, 1f, t), new Vector2(0, 0.65f), 3.4f, 0.99f);
                    break;
                }
                case CrewDeathCause.AirlockBreach:
                    offset = new Vector2(Mathf.SmoothStep(0, 2.85f, t), Mathf.Sin(t * Mathf.PI) * 0.7f);
                    rotation = -430f * t;
                    stretch = 1f;
                    Burst(Ink("94DAFC"), t, offset * 0.42f, 2.25f, 0.88f);
                    break;
                case CrewDeathCause.VacuumExposure:
                    offset = new Vector2(-0.43f * t, Mathf.Sin(t * Mathf.PI) * 0.62f);
                    rotation = 80 * Mathf.SmoothStep(0, 1, t);
                    stretch = 1f;
                    Burst(Ink("E7F8FF"), t, new Vector2(0, 0.5f), 0.86f, 0.61f);
                    break;
                case CrewDeathCause.TankEmpty:
                case CrewDeathCause.Oxygen:
                    float falling = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0.54f, 1f, t));
                    offset = new Vector2(Mathf.Sin(t * 72f) * 0.13f * (1 - falling), -0.32f * falling);
                    rotation = Mathf.Sin(t * 34f) * 12f * (1 - falling) - 83f * falling;
                    stretch = 1f + Mathf.Sin(t * 45f) * 0.14f * (1 - falling);
                    Leak(t);
                    break;
                case CrewDeathCause.Dehydration:
                    offset = new Vector2(0, -0.31f * Mathf.Clamp01(t * 3f));
                    rotation = 85f * Mathf.Clamp01(t * 3f);
                    stretch = 1f - 0.48f * Mathf.InverseLerp(0.68f, 1f, t);
                    break;
                case CrewDeathCause.Hunger:
                    offset = new Vector2(0.18f * Mathf.Sin(t * 49f) * (1 - t), -0.20f * t);
                    rotation = -38f * Mathf.Abs(Mathf.Sin(t * 41f));
                    stretch = 1f - t * 0.93f;
                    foreach (SpriteRenderer stripe in tail)
                        stripe.enabled = t < 0.58f;
                    Burst(Ink("F5A463"), t, new Vector2(-0.20f, 0.10f), 0.7f, 0.9f);
                    break;
                case CrewDeathCause.HullFailure:
                    offset = new Vector2(Mathf.Sin(t * 118f) * 0.23f * (1 - t), -0.36f * t);
                    rotation = Mathf.Sin(t * 72f) * 18f * (1 - t) - 79f * t;
                    stretch = 1f - 0.32f * t;
                    Burst(Ink("FFC283"), t, new Vector2(0, 0.2f), 1.75f, 0.93f);
                    break;
                default:
                    offset = new Vector2(Mathf.Sin(t * 19f) * 0.10f, -0.35f * t);
                    rotation = 65f * Mathf.SmoothStep(0, 1, t);
                    stretch = 1f - 0.23f * t;
                    Burst(Ink("BCAAE9"), t, new Vector2(0, 0.36f), 0.58f, 0.40f);
                    break;
            }
            figure.localPosition = offset;
            figure.localRotation = Quaternion.Euler(0, 0, rotation);
            figure.localScale = new Vector3(Mathf.Sign(figure.localScale.x) * width, stretch, 1);
            if (t < 1)
                return;
            foreach (SpriteRenderer particle in particles)
                particle.enabled = false;
            foreach (SpriteRenderer fragment in suitFragments)
                fragment.enabled = false;
            vein.enabled = false;
            Playing = false;
        }

        private void TearSuit(float t)
        {
            float age = Mathf.InverseLerp(0.34f, 0.64f, t);
            for (int i = 0; i < suitFragments.Length; i++)
            {
                SpriteRenderer fragment = suitFragments[i];
                fragment.enabled = age > 0f && age < 1f;
                if (!fragment.enabled)
                    continue;
                float angle = i * 2.39996f;
                Vector2 ray = new(Mathf.Cos(angle), Mathf.Sin(angle));
                Vector2 p = new Vector2(0f, 0.38f) + ray * (0.38f + 1.4f * age) - Vector2.up * age * age * 0.72f;
                fragment.transform.localPosition = new Vector3(p.x, p.y, -1.55f);
                fragment.transform.localRotation = Quaternion.Euler(0f, 0f, i * 51f + age * (125f + 21f * i));
                Color color = Ink(hadSuit ? "F2F1EA" : "5189BD");
                color.a = 1f - age;
                fragment.color = color;
            }
        }

        private void Burst(Color color, float t, Vector2 center, float reach, float life)
        {
            for (int i = 0; i < particles.Length; i++)
            {
                float angle = i * 2.4f;
                Vector2 ray = new(Mathf.Cos(angle), Mathf.Sin(angle));
                float advance = Mathf.Sqrt(t) * reach * (0.50f + i * 0.05f);
                SetParticle(i, center + ray * advance, color, 1 - t / life);
            }
        }

        private void Leak(float t)
        {
            Color color = Ink("96CEF2");
            for (int i = 0; i < particles.Length; i++)
            {
                float age = (t - i * 0.054f) / 0.44f;
                Vector2 point = new(-0.24f - Mathf.Clamp01(age) * 0.52f,
                    0.20f + Mathf.Clamp01(age) * 0.96f + Mathf.Sin(i * 5) * 0.12f);
                SetParticle(i, point, color, age < 0 ? 0 : 1 - age);
            }
        }

        private void SetParticle(int index, Vector2 point, Color color, float alpha)
        {
            SpriteRenderer particle = particles[index];
            particle.enabled = alpha > 0;
            particle.transform.localPosition = new Vector3(point.x, point.y, -1.45f);
            color.a = Mathf.Clamp01(alpha);
            particle.color = color;
        }
    }
}
