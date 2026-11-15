using System;
using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarGalleryReplay
    {
        private readonly Transform world;
        private readonly LunarShapes art;
        private readonly LunarArrival cinematic;
        private readonly LunarAudio audio;
        private Transform actor;
        private LunarDeathAnimation animation;
        private float elapsed;
        private bool shipScene;

        public string Key { get; private set; }
        public string Title { get; private set; }
        public bool Active => Key != null;
        public bool Complete { get; private set; }
        public bool Victory => Key == "End.Victory";
        public bool Expired => Key == "End.Expired";
        public Vector2 Focus { get; private set; }
        public float Progress => Expired ? Mathf.Clamp01(elapsed / 5.4f) : animation?.Progress ?? 0f;
        public CrewDeathCause? Effect => animation?.Cause;

        public LunarGalleryReplay(Transform world, LunarShapes art, LunarArrival cinematic, LunarAudio audio)
        {
            this.world = world;
            this.art = art;
            this.cinematic = cinematic;
            this.audio = audio;
        }

        public void Open(string key, string title)
        {
            Close();
            Key = key;
            Title = title;
            elapsed = 0f;
            Complete = false;
            audio.Outcome(key);
            if (Victory)
            {
                shipScene = true;
                cinematic.BeginVictory();
                Focus = cinematic.Focus;
            }
            else if (key == "End.Abandoned")
            {
                shipScene = true;
                cinematic.BeginAbandonment(LunarArrival.BoardingPoint + Vector2.left * 2f);
                Focus = cinematic.Focus;
            }
            else if (key == "End.NoReport")
                CreateActor(CrewDeathCause.Dismissed);
            else if (key.StartsWith("Death.", StringComparison.Ordinal) &&
                Enum.TryParse(key.Substring(6), out CrewDeathCause cause))
                CreateActor(cause);
            else
                Focus = LunarMap.Bedroom - Vector2.up;
        }

        private void CreateActor(CrewDeathCause cause)
        {
            bool outside = cause == CrewDeathCause.Ejection || cause == CrewDeathCause.VacuumExposure ||
                cause == CrewDeathCause.TankEmpty || cause == CrewDeathCause.Radiation;
            Vector2 position = outside ? new Vector2(LunarMap.OuterGateX + 3f, 0.8f) : new Vector2(0.9f, 0.4f);
            actor = Group(world, "Actor de repetición", position);
            var costume = new LunarCrewArt(actor, art);
            costume.SetBald(LunarCollection.UsesBaldSkin);
            bool equipped = cause == CrewDeathCause.TankEmpty || cause == CrewDeathCause.Radiation;
            costume.ShowSuit(equipped);
            animation = new LunarDeathAnimation(actor, costume, art);
            animation.Play(cause, equipped);
            Focus = position + (cause == CrewDeathCause.Ejection ? Vector2.right * 2.4f : Vector2.zero);
        }

        public void Tick(float dt)
        {
            if (!Active || Complete) return;
            if (cinematic.Playing)
            {
                bool ended = cinematic.Tick(dt);
                Focus = cinematic.Focus;
                if (!ended) return;
                if (Victory)
                {
                    cinematic.FinishVictory();
                    Complete = true;
                }
                else
                {
                    cinematic.FinishAbandonment();
                    CreateActor(CrewDeathCause.Dismissed);
                }
                return;
            }
            elapsed += dt;
            if (animation != null)
            {
                animation.Tick(dt);
                Complete = !animation.Playing;
            }
            else if (elapsed >= 5.4f)
                Complete = true;
        }

        public void Repeat() => Open(Key, Title);

        public void Close()
        {
            if (!Active) return;
            audio.StopOutcome();
            if (actor != null)
            {
                actor.gameObject.SetActive(false);
                UnityEngine.Object.Destroy(actor.gameObject);
            }
            actor = null;
            animation = null;
            if (shipScene) cinematic.ResetReplay();
            shipScene = false;
            Key = Title = null;
        }
    }
}
