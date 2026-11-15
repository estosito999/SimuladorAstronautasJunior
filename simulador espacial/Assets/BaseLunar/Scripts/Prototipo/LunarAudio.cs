using System;
using System.Collections.Generic;
using UnityEngine;

namespace BaseLunar
{
    internal sealed class LunarAudio : IDisposable
    {
        private const int Rate = 22050;
        private const double Tau = 2 * Math.PI;
        private readonly AudioSource interior, exterior, effects, music, voice;
        private readonly Dictionary<string, AudioClip> clips = new();
        private float nextWorkCue;
        private int currentWork = -1;

        public LunarAudio(GameObject owner)
        {
            interior = Source(owner, true, 0f);
            exterior = Source(owner, true, 0f);
            effects = Source(owner, false, 0.75f);
            music = Source(owner, false, 0.48f);
            voice = Source(owner, false, 0.92f);
        }

        private static AudioSource Source(GameObject owner, bool loop, float volume)
        {
            AudioSource source = owner.AddComponent<AudioSource>();
            source.playOnAwake = false;
            source.loop = loop;
            source.spatialBlend = 0f;
            source.volume = volume;
            return source;
        }

        public void Mix(bool gameplay, bool outside, float dt)
        {
            if (gameplay && interior.clip == null)
            {
                interior.clip = Ambience(false);
                exterior.clip = Ambience(true);
                interior.Play();
                exterior.Play();
            }
            interior.volume = Mathf.MoveTowards(interior.volume, gameplay && !outside ? 0.29f : 0f, dt * 0.6f);
            exterior.volume = Mathf.MoveTowards(exterior.volume, gameplay && outside ? 0.34f : 0f, dt * 0.6f);
        }

        public void Task(int task) => Effect($"Task.{task}", new[] { 48 + task * 2, 55 + task * 2 }, 0.11f);
        public void Success() => Effect("Success", new[] { 60, 64, 69, 74 }, 0.095f);
        public void Error() => Effect("Error", new[] { 53, 47, 42 }, 0.09f);
        public void Pet() => Effect("Pet", new[] { 68, 72, 76, 72 }, 0.12f);
        public void Hero() => Outcome("End.Hero");
        public void LanternVoice(int index)
        {
            voice.Stop();
            voice.clip = Resources.Load<AudioClip>($"Selene/Lantern/lantern-{index}");
            if (voice.clip != null) voice.Play();
        }

        public void CatSpin()
        {
            const string key = "Cat.Spin";
            if (!clips.TryGetValue(key, out AudioClip clip))
            {
                const string vowels = "uiiaioui iiai";
                const float beat = 0.23f;
                int step = (int)(Rate * beat);
                var wave = new float[vowels.Length * step];
                for (int i = 0; i < vowels.Length; i++)
                {
                    (double f1, double f2) = vowels[i] switch
                    {
                        'u' => (310d, 870d), 'i' => (320d, 2210d),
                        'a' => (810d, 1220d), 'o' => (450d, 950d), _ => (0d, 0d)
                    };
                    if (f1 == 0d) continue;
                    double pitch = i % 3 == 1 ? 245d : 196d;
                    for (int n = 0; n < step; n++)
                    {
                        double t = (double)n / Rate;
                        double envelope = Math.Sin(Math.PI * n / step);
                        double carrier = Math.Sin(Tau * pitch * t + 0.7d * Math.Sin(Tau * 9d * t));
                        wave[i * step + n] = (float)(0.17d * envelope * carrier *
                            (0.65d + 0.24d * Math.Sin(Tau * f1 * t) + 0.15d * Math.Sin(Tau * f2 * t)));
                    }
                }
                clip = Clip(key, wave);
            }
            effects.PlayOneShot(clip);
        }

        public void Work(int task, float time)
        {
            if (task != currentWork)
            {
                currentWork = task;
                nextWorkCue = time + 1.65f;
            }
            if (task < 0 || time < nextWorkCue)
                return;
            nextWorkCue = time + 1.6f + task % 3 * 0.21f;
            int pitch = task == 4 ? 37 : 47 + (task * 7) % 18;
            AudioClip cue = Melody($"Work.{task}", new[] { pitch, pitch + 4 }, 0.09f, 0.22f, 0.075f);
            effects.PlayOneShot(cue);
        }

        private void Effect(string key, int[] notes, float step)
        {
            effects.PlayOneShot(Melody(key, notes, step, 0.17f, 0.27f));
        }

        public void Outcome(string key)
        {
            (int[] notes, float tempo, float timbre) = key switch
            {
                "End.Victory" => (new[] { 50, 57, 62, 66, 69, 74, 73, 64, 74, 76, 74, 69,
                    66, 62, 57, 62, 66, 69, 66, 64, 68, 74, 70 }, 0.88f, 0.17f),
                "End.Hero" => (new[] { 55, 62, 67, 71, 74, 71, 76, 74, 79, 74, 71, 67, 74, 79, 81, 79, 76, 74, 79, 79 },
                    0.71f, 0.48f),
                "End.Expired" => (new[] { 55, 51, 48, 46, 48, 43 }, 1.12f, 0.10f),
                "End.Abandoned" => (new[] { 62, 57, 53, 50, 55, 50, 53, 50, 47, 43, 48, 47, 43 }, 1.14f, 0.14f),
                "End.NoReport" => (new[] { 65, 60, 58, 53, 55, 48 }, 1.12f, 0.19f),
                "Death.Ejection" => (new[] { 67, 71, 74, 78, 72, 65, 60, 55 }, 0.55f, 0.31f),
                "Death.TankEmpty" => (new[] { 55, 53, 50, 46, 43 }, 1.21f, 0.09f),
                "Death.VacuumExposure" => (new[] { 39, 43, 50, 45, 38 }, 1.2f, 0.24f),
                "Death.AirlockBreach" => (new[] { 45, 51, 45, 48, 39, 36 }, 0.81f, 0.38f),
                "Death.HullFailure" => (new[] { 42, 42, 39, 35, 34, 30 }, 0.84f, 0.33f),
                "Death.HealthFailure" => (new[] { 55, 52, 47, 50, 43 }, 1.15f, 0.08f),
                "Death.Oxygen" => (new[] { 52, 52, 51, 47, 40 }, 1.12f, 0.17f),
                "Death.Stress" => (new[] { 58, 59, 61, 62, 68, 69, 63, 46 }, 0.59f, 0.45f),
                "Death.Radiation" => (new[] { 42, 49, 54, 61, 67, 73, 60, 36 }, 0.65f, 0.49f),
                "Death.Blackout" => (new[] { 67, 74, 71, 60, 67, 60 }, 0.93f, 0.25f),
                "Death.Dehydration" => (new[] { 61, 61, 64, 68, 65, 52, 49 }, 0.71f, 0.36f),
                "Death.Hunger" => (new[] { 55, 59, 65, 59, 54, 47, 43 }, 0.71f, 0.23f),
                _ => (new[] { 55, 51, 48, 46, 43 }, 1.1f, 0.13f)
            };
            music.Stop();
            music.clip = Melody(key, notes, tempo, timbre, 0.31f);
            music.Play();
        }

        public void StopOutcome()
        {
            music.Stop();
            music.clip = null;
            if (voice != null) voice.Stop();
        }

        private AudioClip Melody(string key, int[] notes, float step, float upper, float gain)
        {
            if (clips.TryGetValue(key, out AudioClip audio)) return audio;
            float noteLength = step * 1.75f;
            float[] wave = new float[Mathf.CeilToInt((step * (notes.Length - 1) + noteLength) * Rate)];
            for (int note = 0; note < notes.Length; note++)
            {
                int offset = Mathf.RoundToInt(note * step * Rate);
                double pitch = 440 * Math.Pow(2, (notes[note] - 69) / 12.0);
                int count = Mathf.Min(wave.Length - offset, Mathf.CeilToInt(noteLength * Rate));
                for (int i = 0; i < count; i++)
                {
                    double time = (double)i / Rate;
                    double level = Math.Min(1.0, time / 0.018) * Math.Pow(1 - time / noteLength, 2.0);
                    double phase = time * pitch * Tau;
                    double harmony = key == "End.Hero" && note % 3 == 0 ? 0.26 * Math.Sin(phase * 1.5) : 0;
                    wave[offset + i] += (float)((Math.Sin(phase) + upper * Math.Sin(phase * 2) +
                        0.20 * Math.Sin(phase / 2) + harmony) * level * gain);
                }
            }
            return Clip(key, wave);
        }

        private AudioClip Ambience(bool outside)
        {
            const float length = 8f;
            float[] wave = new float[(int)(Rate * length)];
            var random = new System.Random(outside ? 31 : 83);
            float noise = 0f;
            for (int i = 0; i < wave.Length; i++)
            {
                double t = (double)i / Rate;
                noise = noise * 0.93f + ((float)random.NextDouble() - 0.5f) * 0.14f;
                float loopEdge = Mathf.Clamp01(Mathf.Min(i, wave.Length - i - 1) / 1000f);
                if (outside)
                {
                    double breath = 0.33 + 0.67 * Math.Pow(0.5 + 0.5 * Math.Sin(Tau * t / 4), 2);
                    wave[i] = (float)((noise * 0.58 * breath + 0.027 * Math.Sin(Tau * 36 * t)) * loopEdge);
                }
                else
                {
                    double pulse = 0.78 + 0.22 * Math.Sin(Tau * t / 8);
                    wave[i] = (float)((0.105 * Math.Sin(Tau * 58 * t) + 0.026 * Math.Sin(Tau * 116 * t) +
                        noise * 0.19) * pulse * loopEdge);
                }
            }
            return Clip(outside ? "Respiración EVA" : "Ambiente de Selene", wave);
        }

        private AudioClip Clip(string key, float[] wave)
        {
            var clip = AudioClip.Create(key, wave.Length, 1, Rate, false);
            clip.SetData(wave, 0);
            clips.Add(key, clip);
            return clip;
        }

        public void Dispose()
        {
            if (music != null) StopOutcome();
            if (effects != null) effects.Stop();
            if (interior != null) interior.Stop();
            if (exterior != null) exterior.Stop();
            foreach (AudioClip clip in clips.Values)
                UnityEngine.Object.Destroy(clip);
        }
    }
}
