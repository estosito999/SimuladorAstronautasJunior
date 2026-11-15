using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed class LunarRoute
    {
        private readonly Vector2[] nodes = new Vector2[24];
        private readonly bool[] visited = new bool[24];
        private readonly float[] distance = new float[24];
        private readonly int[] first = new int[24];
        private readonly RaycastHit2D[] hit = new RaycastHit2D[1];
        private readonly ContactFilter2D solids = new()
        {
            useTriggers = false,
            useLayerMask = true,
            layerMask = Physics2D.DefaultRaycastLayers
        };
        private readonly Transform marker;

        public LunarRoute(Transform world, LunarShapes art)
        {
            nodes[2] = Vector2.zero;
            for (int i = 0; i < 6; i++)
            {
                Vector2 radial = LunarMap.Direction(i);
                int index = 3 + i * 3;
                nodes[index] = radial * (LunarMap.CoreApothem - 1.18f);
                nodes[index + 1] = radial * (LunarMap.OrbitRadius - LunarMap.RoomApothem + 1.2f);
                nodes[index + 2] = radial * LunarMap.OrbitRadius;
            }
            nodes[21] = new Vector2(LunarMap.InnerGateX + 1.4f, 0);
            nodes[22] = new Vector2(LunarMap.OuterGateX - 0.8f, 0);
            nodes[23] = new Vector2(LunarMap.OuterGateX + 0.9f, 0);

            marker = Group(world, "Flecha de navegación", Vector2.zero);
            art.Plate(marker, "Trazo", new Vector2(-0.13f, 0), new Vector2(0.66f, 0.16f), Ink("1774F1"), 28);
            art.Line(marker, new Vector2(0.42f, 0), new Vector2(0.09f, 0.24f), 0.14f, Ink("1774F1"), 28);
            art.Line(marker, new Vector2(0.42f, 0), new Vector2(0.09f, -0.24f), 0.14f, Ink("1774F1"), 28);
        }

        private bool Clear(Vector2 start, Vector2 end)
        {
            Vector2 offset = end - start;
            float length = offset.magnitude;
            if (length <= 0.12f)
                return true;

            // Only map obstacles are in this mask. The astronaut and trigger
            // volumes never mask a useful line of sight.
            return Physics2D.CircleCast(start, 0.265f, offset / length, solids, hit, length) == 0;
        }

        public Vector2 Next(Vector2 position, Vector2 target)
        {
            if (Clear(position, target))
                return target;

            nodes[0] = position;
            nodes[1] = target;
            for (int i = 0; i < nodes.Length; i++)
            {
                distance[i] = float.PositiveInfinity;
                visited[i] = false;
                first[i] = -1;
            }
            distance[0] = 0;
            for (int step = 0; step < nodes.Length; step++)
            {
                int current = -1;
                float best = float.PositiveInfinity;
                for (int i = 0; i < nodes.Length; i++)
                    if (!visited[i] && distance[i] < best)
                    {
                        current = i;
                        best = distance[i];
                    }
                if (current < 0)
                    break;
                if (current == 1)
                    return nodes[first[1]];
                visited[current] = true;

                for (int i = 1; i < nodes.Length; i++)
                {
                    float length = Vector2.Distance(nodes[i], nodes[current]);
                    if (visited[i] || best + length >= distance[i] || !Clear(nodes[current], nodes[i]))
                        continue;
                    distance[i] = best + length;
                    first[i] = current == 0 ? i : first[current];
                }
            }

            // If a closed door temporarily prevents a complete path, guide
            // only as far as a reachable node on this side of the door.
            int closest = 0;
            float targetDistance = Vector2.Distance(position, target);
            for (int i = 2; i < nodes.Length; i++)
            {
                float remaining = Vector2.Distance(nodes[i], target);
                if (first[i] >= 0 && remaining < targetDistance)
                {
                    closest = i;
                    targetDistance = remaining;
                }
            }
            return closest == 0 ? position : nodes[first[closest]];
        }

        public void Point(Vector2 position, Vector2 waypoint, bool visible)
        {
            Vector2 delta = waypoint - position;
            visible &= delta.sqrMagnitude > 0.16f;
            marker.gameObject.SetActive(visible);
            if (!visible)
                return;
            marker.position = position + delta.normalized * Mathf.Min(1.3f, delta.magnitude);
            marker.localRotation = Quaternion.Euler(0, 0, Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg);
        }
    }
}
