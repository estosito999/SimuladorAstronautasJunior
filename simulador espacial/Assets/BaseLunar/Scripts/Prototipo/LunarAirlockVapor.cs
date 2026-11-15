using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarAirlockVapor
    {
        private readonly SpriteRenderer[] clouds = new SpriteRenderer[28];
        private readonly float innerEdge;
        private readonly float outerEdge;
        private float motion;
        private float density;
        private bool exhausting;

        public LunarAirlockVapor(Transform world, LunarShapes art, BoxCollider2D chamber)
        {
            float x = chamber.transform.localPosition.x;
            innerEdge = x - chamber.size.x * 0.5f + 0.52f;
            outerEdge = x + chamber.size.x * 0.5f - 0.52f;
            Transform group = Group(world, "Vapor de la cámara EVA", Vector2.zero);
            foreach (float edge in new[] { innerEdge, outerEdge })
            {
                Vector2 grille = new(edge, 0.78f);
                art.Plate(group, "Rejilla de intercambio", grille, new Vector2(0.28f, 0.35f), Ink("5B7284"), 5);
                for (int line = -1; line <= 1; line++)
                    art.Plate(group, "Ranura de ventilación", grille + new Vector2(0, line * 0.07f),
                        new Vector2(0.18f, 0.027f), Ink("DFEBF0"), 6);
            }
            for (int i = 0; i < clouds.Length; i++)
            {
                clouds[i] = art.Vapor(group, 11);
                clouds[i].enabled = false;
            }
        }

        public void Tick(AirlockPressure pressure, float seconds)
        {
            bool active = pressure == AirlockPressure.Depressurizing || pressure == AirlockPressure.Repressurizing;
            if (active)
                exhausting = pressure == AirlockPressure.Depressurizing;

            float before = density;
            density = Mathf.MoveTowards(density, active ? 1f : 0f, seconds * (active ? 3.5f : 1.8f));
            if (density <= 0)
            {
                if (before > 0)
                    foreach (SpriteRenderer cloud in clouds)
                        cloud.enabled = false;
                return;
            }

            motion = Mathf.Repeat(motion + seconds * 0.92f, 1f);
            for (int i = 0; i < clouds.Length; i++)
            {
                float phase = Mathf.Repeat(motion + i * 0.143f, 1f);
                float spread = (i % 7) / 6f;
                float across = exhausting ? phase : 1f - phase;
                float x = Mathf.Lerp(innerEdge, outerEdge, across);
                float y = Mathf.Lerp(0.63f, Mathf.Lerp(-0.63f, 0.44f, spread), Mathf.Sin(phase * Mathf.PI / 2));
                y += Mathf.Sin(i * 0.92f + phase * 7f) * 0.12f;
                float size = 0.62f + Mathf.Sin(phase * Mathf.PI) * 1.24f;
                SpriteRenderer cloud = clouds[i];
                cloud.enabled = true;
                cloud.transform.localPosition = new Vector3(x, y, -0.55f);
                cloud.transform.localScale = new Vector3(size * 1.35f, size * 0.76f, 1);
                Color color = exhausting ? Ink("84A2BA") : Ink("FCFFFF");
                color.a = density * Mathf.Sin(phase * Mathf.PI) * 0.68f;
                cloud.color = color;
            }
        }
    }
}
