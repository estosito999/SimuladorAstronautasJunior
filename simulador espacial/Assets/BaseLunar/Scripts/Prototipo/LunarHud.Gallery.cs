using System;
using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed partial class LunarHud
    {
        public void ReplayHud(LunarGalleryReplay replay, LunarArrival cinematic, Action close)
        {
            if (replay.Victory)
                VictoryCinematic(cinematic, replay.Complete);
            else if (replay.Expired)
                ExpiredCutscene(replay.Progress);
            else if (replay.Effect.HasValue)
            {
                EndingEffect(replay.Effect.Value, replay.Progress);
                if (replay.Complete && replay.Effect.Value == CrewDeathCause.Dismissed)
                {
                    Label(49, height * 0.28f, 595, "DESPEDIDO", orange, endingTitle);
                    string reason = replay.Key == "End.Abandoned" ? "Abandono de la estación" : "Informe obligatorio sin enviar";
                    Label(55, height * 0.28f + 87, 513, reason, cloud, heading);
                }
            }

            Pill(new Rect(20, 17, 510, 43), graphite);
            Label(39, 25, 482, replay.Title, cloud, heading);
            if (RoundControl(new Rect(width - 174, 17, 154, 43), "Coleccionables"))
                close();
            else if (replay.Complete && RoundControl(new Rect(width - 174, height - 62, 154, 40), "Repetir", true))
                replay.Repeat();
        }

        public void ExpiredCutscene(float progress)
        {
            Fill(new Rect(0, 0, width, height),
                new Color(0.05f, 0.07f, 0.10f, Mathf.SmoothStep(0f, 0.92f, progress)));
            float y = height * 0.39f - Mathf.Sin(progress * Mathf.PI) * 18f;
            Text(new Rect(0, y, width, 37), "ÚLTIMO REGISTRO DE SELENE", orange, centeredBody);
            if (progress > 0.28f)
                Text(new Rect(0, y + 66, width, 32), "Día 15 · El tiempo de misión se agotó.", cloud, centeredBody);
        }

        public void SecretPortrait(LunarCollection.SecretCard card, Action back)
        {
            switch (card)
            {
                case LunarCollection.SecretCard.Foxy: CostumePortrait(back); break;
                case LunarCollection.SecretCard.MiniPekka: MiniPekkaPortrait(back); break;
                case LunarCollection.SecretCard.Us: UsPortrait(back); break;
            }
        }

        public void VictoryCode(bool controls, Action restart, Action menu)
        {
            Fill(new Rect(0, 0, width, height), Color.black);
            var center = new GUIStyle(endingTitle) { alignment = TextAnchor.MiddleCenter };
            Text(new Rect(0, height * 0.40f, width, 96), "NASA", Color.white, center);
            if (!controls) return;
            Rect play = new(width / 2f - 175, height - 85, 163, 42);
            Rect exit = new(width / 2f + 12, height - 85, 163, 42);
            if (Button(play, "Volver a jugar")) restart();
            else if (Button(exit, "Menú principal")) menu();
        }

        private void MiniPekkaPortrait(Action back)
        {
            Rect r = Dialog(588, 473, graphite, orange);
            Label(r.x + 24, r.y + 18, 500, "ARCHIVO SECRETO  /  AÑA", orange, small);
            Label(r.x + 24, r.y + 41, 509, "Miga con su disfraz de Mini P.E.K.K.A.", cloud, heading);
            Vector2 c = new(r.center.x, r.y + 227);
            Color steelArmor = Ink("586B86"), dark = Ink("272B45"), blue = Ink("68DFFF");
            Dot(c, 276, Ink("282B41"));
            Dot(c, 249, Ink("384567"));
            Stroke(c + new Vector2(14, 94), c + new Vector2(113, 79), 23, Ink("D58B5C"));
            Dot(c + new Vector2(114, 78), 26, Ink("F4BE95"));
            Dot(c + Vector2.up * 67, 148, dark);
            Dot(c + Vector2.up * 61, 130, steelArmor);
            for (int side = -1; side <= 1; side += 2)
            {
                Vector2 horn = c + new Vector2(side * 53, -39);
                Stroke(horn, horn + new Vector2(side * 24, -38), 24, Ink("4657A2"));
                Stroke(horn + new Vector2(side * 24, -38), horn + new Vector2(side * 16, -65), 16, blue);
                Dot(horn + new Vector2(side * 16, -65), 11, Ink("A6F4FF"));
            }
            Dot(c, 166, dark);
            Dot(c, 149, steelArmor);
            Pill(new Rect(c.x - 60, c.y - 36, 120, 57), Ink("20263B"));
            for (int side = -1; side <= 1; side += 2)
            {
                Vector2 eye = c + new Vector2(side * 29, -15);
                Dot(eye, 28, Ink("365275"));
                Dot(eye, 16, blue);
                for (int row = 0; row < 2; row++)
                    Stroke(c + new Vector2(side * 33, 22 + row * 8),
                        c + new Vector2(side * 58, 16 + row * 14), 2.5f, Ink("FFE0BE"));
            }
            Dot(c + Vector2.up * 25, 48, Ink("EAB18C"));
            Dot(c + Vector2.up * 19, 13, Ink("764446"));
            if (RoundControl(new Rect(r.center.x - 85, r.yMax - 54, 170, 36), "Coleccionables", true))
                back();
        }

        private void UsPortrait(Action back)
        {
            Fill(new Rect(0, 0, width, height), Color.black);
            var centerStyle = new GUIStyle(heading) { alignment = TextAnchor.MiddleCenter };
            Text(new Rect(0, height * 0.145f, width, 57), "esto no es among us", Color.white, centerStyle);
            Vector2 c = new(width * 0.5f, height * 0.51f);
            Color shade = Ink("592934"), suit = Ink("D65558");
            Pill(new Rect(c.x - 104, c.y - 31, 94, 82), shade);
            Pill(new Rect(c.x - 73, c.y - 75, 154, 153), shade);
            Pill(new Rect(c.x - 62, c.y - 67, 133, 137), suit);
            for (int side = -1; side <= 1; side += 2)
                Pill(new Rect(c.x + side * 33 - 28, c.y + 49, 54, 59), suit);
            Pill(new Rect(c.x - 35, c.y - 54, 124, 67), shade);
            Pill(new Rect(c.x - 29, c.y - 48, 112, 55), Ink("9CDBE7"));
            Dot(c + new Vector2(5, -18), 14, shade);
            Dot(c + new Vector2(49, -18), 14, shade);
            Stroke(c + new Vector2(-8, -36), c + new Vector2(17, -26), 6, shade);
            Stroke(c + new Vector2(62, -36), c + new Vector2(37, -26), 6, shade);
            if (Button(new Rect(width / 2f - 84, height - 90, 168, 37), "Coleccionables"))
                back();
        }

        private void CostumePortrait(Action back)
        {
            Rect r = Dialog(588, 473, graphite, orange);
            Label(r.x + 24, r.y + 18, 503, "ARCHIVO SECRETO  /  1983", orange, small);
            Label(r.x + 24, r.y + 41, 509, "Miga con su disfraz de Foxy", cloud, heading);
            Vector2 c = new(r.center.x, r.y + 227);
            Dot(c, 274, Ink("272631"));
            Dot(c, 242, Ink("52515E"));
            Color fur = Ink("AC473E"), dark = Ink("422832"), cream = Ink("F4CA9A");
            for (int side = -1; side <= 1; side += 2)
            {
                Vector2 ear = c + new Vector2(side * 58, -70);
                Stroke(ear, ear + new Vector2(side * 14, -54), 38, dark);
                Stroke(ear, ear + new Vector2(side * 13, -47), 28, fur);
                Stroke(ear + new Vector2(0, -4), ear + new Vector2(side * 11, -36), 13, Ink("D28C80"));
            }
            Dot(c + Vector2.up * 65, 144, dark);
            Dot(c + Vector2.up * 64, 127, Ink("6D534E"));
            Dot(c, 177, dark);
            Dot(c, 163, fur);
            Stroke(c + new Vector2(-71, -27), c + new Vector2(76, -14), 9, dark);
            Dot(c + new Vector2(-31, -18), 29, cloud);
            Dot(c + new Vector2(-31, -18), 14, Ink("E7A448"));
            Dot(c + new Vector2(-31, -18), 6, dark);
            Dot(c + new Vector2(35, -16), 43, Ink("27222B"));
            Dot(c + new Vector2(0, 29), 66, cream);
            Dot(c + new Vector2(0, 12), 23, dark);
            Stroke(c + new Vector2(-36, 39), c + new Vector2(36, 39), 6, dark);
            for (int i = -2; i <= 2; i++)
                Fill(new Rect(c.x + i * 12 - 4, c.y + 41, 9, 12), cloud);
            Vector2 hook = c + new Vector2(104, 82);
            Stroke(hook, hook + new Vector2(0, -22), 10, Ink("DDDDEA"));
            Stroke(hook + new Vector2(0, -22), hook + new Vector2(-13, -34), 9, Ink("DDDDEA"));
            Stroke(hook + new Vector2(-13, -34), hook + new Vector2(-25, -24), 9, Ink("DDDDEA"));
            if (RoundControl(new Rect(r.center.x - 85, r.yMax - 54, 170, 36), "Coleccionables", true))
                back();
        }
    }
}
