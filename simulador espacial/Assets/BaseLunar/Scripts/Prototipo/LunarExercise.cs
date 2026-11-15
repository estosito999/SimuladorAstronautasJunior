using UnityEngine;

namespace BaseLunar
{
    internal sealed class LunarExercise
    {
        public const int Task = 7;
        public int Target { get; private set; }
        public int Repetitions { get; private set; }
        public int Routine { get; private set; }
        public string Name => Routine == 1 ? "Press de banca" : Routine == 2 ? "Sentadilla con barra" : "Saltos";
        public float TimeLimit { get; private set; }
        public float Remaining { get; private set; }
        public float JumpHeight { get; private set; }
        public bool Running { get; private set; }
        public bool Retrying { get; private set; }
        private float jumpUntil;
        private float endsAt;

        public void Reset(int day, bool retry = false)
        {
            if (!retry)
            {
                Routine = (Mathf.Max(1, day) - 1) % 3;
                Target = Random.Range(20, 101);
            }
            TimeLimit = Target <= 50
                ? Mathf.Lerp(5f, 10f, (Target - 20) / 30f)
                : Mathf.Lerp(10f, 20f, (Target - 50) / 50f);
            Remaining = TimeLimit;
            Repetitions = 0;
            JumpHeight = 0;
            Running = false;
            Retrying = retry;
            jumpUntil = 0;
        }

        public bool Update(float now, bool pressed)
        {
            if (Running)
            {
                Remaining = Mathf.Max(0, endsAt - now);
                if (Remaining <= 0)
                {
                    Reset(0, retry: true);
                    return false;
                }
            }
            if (pressed)
            {
                if (!Running)
                {
                    Running = true;
                    Retrying = false;
                    endsAt = now + TimeLimit;
                }
                jumpUntil = now + 0.20f;
                if (++Repetitions == Target)
                    return true;
            }
            JumpHeight = jumpUntil > now ? Mathf.Sin(Mathf.PI * (1 - (jumpUntil - now) / 0.20f)) : 0;
            return false;
        }
    }
}
