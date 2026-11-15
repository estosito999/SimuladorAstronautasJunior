using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarCrewArt
    {
        private readonly GameObject adventurer;
        private readonly GameObject suit;
        private readonly Transform[][] legs = { new Transform[2], new Transform[2] };
        private readonly Transform[][] arms = { new Transform[2], new Transform[2] };
        private readonly SpriteRenderer face, ear, eye, eyeBag, stubble;
        private readonly Color restedSkin;
        private float stride;
        private float gait;
        public Transform Root { get; }

        public const string PilotName = "Nico";

        public LunarCrewArt(Transform astronaut, LunarShapes art)
        {
            Root = Group(astronaut, "Tripulante y traje EVA", Vector2.zero);
            art.Disc(astronaut, "Sombra", new Vector2(0, -0.22f), new Vector2(0.91f, 0.41f),
                Ink("242B3A"), 14);
            Transform casual = Group(Root, "Nico · Mapache", Vector2.zero);
            adventurer = casual.gameObject;
            Color outline = Ink("252837"), blue = Ink("3579AC"), skin = Ink("ADB1B7");
            art.Disc(casual, "Cola", new Vector2(-0.40f, -0.08f), new Vector2(0.47f, 0.29f), outline, 14);
            art.Plate(casual, "Anillo de la cola", new Vector2(-0.49f, -0.08f), new Vector2(0.09f, 0.22f), skin, 15, -15f);
            art.Plate(casual, "Anillo de la cola", new Vector2(-0.34f, -0.09f), new Vector2(0.08f, 0.23f), skin, 15, -15f);
            Limbs(casual, art, 0, Ink("224E84"), Ink("214573"), skin);
            art.Disc(casual, "Piernas", new Vector2(0, -0.10f), new Vector2(0.41f, 0.44f), outline, 15);
            art.Disc(casual, "Chaqueta", new Vector2(0, 0.07f), new Vector2(0.67f, 0.54f), outline, 17);
            art.Disc(casual, "Chaqueta de trabajo", new Vector2(0.01f, 0.08f), new Vector2(0.56f, 0.45f), blue, 18);
            art.Plate(casual, "Cierre de la chaqueta", new Vector2(0.10f, 0.09f), new Vector2(0.025f, 0.34f), Ink("A4CFFF"), 19, -4);
            art.Plate(casual, "Insignia", new Vector2(0.20f, 0.17f), new Vector2(0.09f, 0.055f), Ink("E5F5FF"), 20);
            art.Disc(casual, "Silueta del rostro", new Vector2(0.01f, 0.38f), new Vector2(0.65f, 0.52f), outline, 20);
            restedSkin = skin;
            foreach (float x in new[] { -0.20f, 0.20f })
                art.Disc(casual, "Oreja", new Vector2(x, 0.61f), new Vector2(0.19f, 0.21f), outline, 20);
            face = art.Disc(casual, "Rostro", new Vector2(0.01f, 0.38f), new Vector2(0.57f, 0.45f), skin, 21);
            ear = art.Disc(casual, "Interior oreja", new Vector2(0.20f, 0.61f), new Vector2(0.11f, 0.13f), skin, 21);
            art.Disc(casual, "Interior oreja", new Vector2(-0.20f, 0.61f), new Vector2(0.11f, 0.13f), skin, 21);
            art.Disc(casual, "Antifaz", new Vector2(0.06f, 0.39f), new Vector2(0.50f, 0.20f), outline, 22);
            art.Disc(casual, "Hocico", new Vector2(0.115f, 0.285f), new Vector2(0.27f, 0.17f), Ink("F5EDDF"), 22);
            art.Disc(casual, "Nariz", new Vector2(0.17f, 0.325f), new Vector2(0.09f, 0.056f), outline, 24);
            art.Disc(casual, "Ojo lejano", new Vector2(-0.07f, 0.41f), new Vector2(0.057f, 0.075f), Color.white, 24);
            eye = art.Disc(casual, "Ojo", new Vector2(0.20f, 0.41f), new Vector2(0.054f, 0.084f), Color.white, 24);
            eyeBag = art.Disc(casual, "Ojera", new Vector2(0.18f, 0.35f), new Vector2(0.14f, 0.057f), Color.clear, 23);
            stubble = art.Disc(casual, "Barba incipiente", new Vector2(0.123f, 0.231f), new Vector2(0.24f, 0.086f), Color.clear, 23);

            Transform eva = Group(Root, "Traje EVA", Vector2.zero);
            suit = eva.gameObject;
            Limbs(eva, art, 1, Ink("F6FAFF"), Ink("E9F0FA"), Ink("F5FAFF"));
            art.Plate(eva, "Tanque", new Vector2(-0.26f, 0.13f), new Vector2(0.23f, 0.46f), Ink("D3DFED"), 15);
            art.Disc(eva, "Silueta", new Vector2(0, 0.06f), new Vector2(0.73f, 0.61f), outline, 16);
            art.Disc(eva, "Traje blanco", new Vector2(0.025f, 0.07f), new Vector2(0.59f, 0.53f), Ink("FFFFFF"), 17);
            art.Disc(eva, "Casco", new Vector2(0.03f, 0.36f), new Vector2(0.68f, 0.64f), outline, 19);
            art.Disc(eva, "Junta del visor", new Vector2(0.055f, 0.36f), new Vector2(0.58f, 0.55f), Ink("F9FCFF"), 20);
            art.Disc(eva, "Visor", new Vector2(0.105f, 0.39f), new Vector2(0.47f, 0.39f), Ink("4F6280"), 21);
            art.Disc(eva, "Antifaz tras el visor", new Vector2(0.11f, 0.373f),
                new Vector2(0.28f, 0.12f), Ink("27374D"), 22);
            art.Disc(eva, "Ojo tras el visor", new Vector2(0.045f, 0.386f),
                new Vector2(0.039f, 0.045f), Ink("C0D7E4"), 23);
            art.Disc(eva, "Ojo tras el visor", new Vector2(0.17f, 0.386f),
                new Vector2(0.039f, 0.045f), Ink("C0D7E4"), 23);
            art.Disc(eva, "Reflejo", new Vector2(0.18f, 0.47f), new Vector2(0.21f, 0.061f), Ink("FFE1A5"), 22);
            art.Plate(eva, "Indicador del tanque", new Vector2(0.09f, 0.06f),
                new Vector2(0.16f, 0.10f), Ink("5ADC9B"), 23);
        }

        public void SetFatigue(float level)
        {
            face.color = ear.color = Color.Lerp(restedSkin, Ink("B7AE98"), level);
            eye.transform.localScale = new Vector3(0.054f, Mathf.Lerp(0.084f, 0.048f, level), 1f);
            eyeBag.color = new Color(0.26f, 0.18f, 0.31f, level * 0.83f);
            stubble.color = new Color(0.29f, 0.24f, 0.23f, Mathf.InverseLerp(0.3f, 1f, level) * 0.55f);
        }

        private void Limbs(Transform body, LunarShapes art, int outfit, Color trousers, Color sleeve, Color hand)
        {
            for (int i = 0; i < 2; i++)
            {
                float side = i == 0 ? -1 : 1;
                Transform leg = Group(body, "Pierna articulada", new Vector2(side * 0.12f, -0.08f));
                legs[outfit][i] = leg;
                art.Plate(leg, "Pantalón", new Vector2(0, -0.12f), new Vector2(0.15f, 0.25f), trousers, 16);
                art.Disc(leg, "Zapato", new Vector2(0.04f, -0.27f), new Vector2(0.23f, 0.13f), Ink("28364B"), 16);
                Transform arm = Group(body, "Brazo articulado", new Vector2(side * 0.24f, 0.16f));
                arms[outfit][i] = arm;
                int order = i == 0 ? 15 : 19;
                art.Disc(arm, "Manga", new Vector2(0, -0.12f), new Vector2(0.15f, 0.28f), sleeve, order);
                art.Disc(arm, "Mano", new Vector2(0, -0.24f), new Vector2(0.13f, 0.13f), hand, order);
            }
        }

        public void Walk(Vector2 velocity, float seconds)
        {
            float speed = velocity.magnitude;
            gait = Mathf.MoveTowards(gait, speed > 0.13f ? 1f : 0f, seconds * 9f);
            stride += speed * seconds * 2.35f;
            float swing = Mathf.Sin(stride) * gait;
            for (int outfit = 0; outfit < 2; outfit++)
            for (int i = 0; i < 2; i++)
            {
                float step = swing * (i == 0 ? 1 : -1);
                legs[outfit][i].localRotation = Quaternion.Euler(0, 0, 29f * step);
                arms[outfit][i].localRotation = Quaternion.Euler(0, 0, -22f * step);
            }
            if (Mathf.Abs(velocity.x) > 0.08f)
                Root.localScale = new Vector3(Mathf.Sign(velocity.x), 1f, 1f);
            Root.localPosition = new Vector3(0, Mathf.Abs(swing) * 0.046f, 0);
        }

        public void Refresh(EvaCrewState crew) => ShowSuit(crew.HasSpaceSuit);

        public void ShowSuit(bool equipped)
        {
            adventurer.SetActive(!equipped);
            suit.SetActive(equipped);
        }
    }
}
