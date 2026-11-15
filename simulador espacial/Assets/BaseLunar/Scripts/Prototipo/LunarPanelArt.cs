using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal static class LunarPanelArt
    {
        public static void Draw(Rect rect, int task, int progress)
        {
            Fill(rect, 0, 0, 120, 76, "101927");
            Fill(rect, 5, 5, 110, 66, "223347");
            for (int i = 12; i < 70; i += 8)
                Fill(rect, 7, i, 106, 1, "2A3B50");

            switch (task)
            {
                case 0:
                    Fill(rect, 21, 16, 78, 42, "233C39");
                    for (int i = 0; i < 3; i++)
                    {
                        Fill(rect, 24, 23 + i * 11, 72, 2, "49645A");
                        Fill(rect, 31 + i * 23, 20, 11, 29, i < progress ? "66EAC1" : "DA995C");
                    }
                    break;
                case 1:
                    Fill(rect, 20, 48, 80, 9, "9C7854");
                    for (int i = 0; i < 3; i++)
                    {
                        int x = 33 + i * 27;
                        Fill(rect, x, 27, 3, 24, "70C66D");
                        Fill(rect, x - 8, 30, 10, 7, "578E57");
                        Fill(rect, x + 2, 24, 10, 8, "A6DA73");
                        Fill(rect, x + 8, 41, 4, 6, i < progress ? "72CFFF" : "3A5470");
                    }
                    break;
                case 2:
                    Fill(rect, 20, 35, 79, 8, "8399AC");
                    for (int i = 0; i < 3; i++)
                    {
                        int x = 25 + i * 26;
                        Fill(rect, x, 19, 18, 37, "182535");
                        Fill(rect, x + 3, 22, 12, 31, i < progress ? "77D6F0" : "46718E");
                        Fill(rect, x + 5, 25, 3, 24, "B3E3F7");
                    }
                    break;
                case 3:
                case 5:
                    Fill(rect, 17, 14, 86, 48, "132435");
                    for (int i = 0; i < 13; i++)
                    {
                        int bar = 4 + (i * 7 + i * i) % (13 + 5 * progress);
                        Fill(rect, 24 + i * 6, 43 - bar / 2, 3, bar, i < progress * 4 ? "65ECC6" : "5B91BB");
                    }
                    break;
                case 4:
                    for (int i = 0; i < 3; i++)
                    {
                        int x = 13 + i * 32;
                        Fill(rect, x, 15, 29, 46, "8DA9C0");
                        for (int j = 0; j < 6; j++)
                            Fill(rect, x + 2 + (j % 2) * 13, 17 + (j / 2) * 14,
                                12, 13, i < progress ? "4CA3D7" : "827866");
                    }
                    break;
                case 6:
                    Fill(rect, 27, 52, 66, 10, "71869D");
                    Fill(rect, 32, 47, 56, 6, "ABC6D6");
                    Fill(rect, 40, 22, 40, 27, "427D91");
                    Fill(rect, 37, 18, 46, 6, "70C6D6");
                    for (int i = 0; i < 3; i++)
                        Fill(rect, 40 + i * 17, 49, 5, 10, i < progress ? "6CF0B6" : "EEB574");
                    break;
                default:
                    Fill(rect, 19, 35, 83, 27, "53697F");
                    Fill(rect, 47, 13, 27, 47, "879DB1");
                    Fill(rect, 54, 19, 13, 38, progress > 0 ? "50D2AE" : "E7A765");
                    Fill(rect, 57, 25, 7, 18, "293F54");
                    Fill(rect, 25, 43, 15, 9, "73AABA");
                    Fill(rect, 80, 43, 15, 9, "73AABA");
                    break;
            }
        }

        private static void Fill(Rect target, float x, float y, float w, float h, string color)
        {
            Color before = GUI.color;
            GUI.color = Ink(color);
            GUI.DrawTexture(new Rect(target.x + x * target.width / 120, target.y + y * target.height / 76,
                w * target.width / 120, h * target.height / 76), Texture2D.whiteTexture);
            GUI.color = before;
        }
    }
}
