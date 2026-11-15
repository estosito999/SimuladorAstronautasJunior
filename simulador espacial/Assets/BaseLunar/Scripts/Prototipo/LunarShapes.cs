using UnityEngine;

namespace BaseLunar
{
    internal sealed class LunarShapes
    {
        private readonly Sprite square;
        private readonly Sprite disc;
        private readonly Sprite hex;
        private Sprite vapor;
        private readonly Material material;
        private readonly LunarKitMeshes kitMeshes = new();
        private readonly System.Collections.Generic.Dictionary<string, Sprite> kitSprites = new();

        public LunarShapes()
        {
            square = MakeSprite("Cuadro", (_, _) => true, 2);
            disc = MakeSprite("Disco", (x, y) => x * x + y * y <= 1f, 96);
            hex = MakeSprite("Hexágono", (x, y) =>
                Mathf.Abs(x) <= Mathf.Sqrt(3f) * Mathf.Min(0.5f, 1f - Mathf.Abs(y)), 192);
            var shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            if (shader != null)
            {
                material = new Material(shader);
                material.renderQueue = 3000;
            }
        }

        private static Sprite MakeSprite(string name, System.Func<float, float, bool> covers, int size)
        {
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false) { name = name };
            var pixels = new Color32[size * size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                    pixels[y * size + x] = new Color32(255, 255, 255,
                        covers((2f * x + 1f) / size - 1f, (2f * y + 1f) / size - 1f) ? (byte)255 : (byte)0);
            texture.SetPixels32(pixels);
            texture.Apply(false, true);
            var sprite = Sprite.Create(texture, new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f), size, 0, SpriteMeshType.FullRect);
            sprite.name = name;
            return sprite;
        }

        public static Color Ink(string html)
        {
            ColorUtility.TryParseHtmlString("#" + html, out Color color);
            return color;
        }

        public static Transform Group(Transform parent, string name, Vector2 position, float angle = 0f)
        {
            var child = new GameObject(name).transform;
            child.SetParent(parent, false);
            child.localPosition = position;
            child.localRotation = Quaternion.Euler(0f, 0f, angle);
            return child;
        }

        public SpriteRenderer Plate(Transform parent, string name, Vector2 p, Vector2 size, Color color,
            int order, float angle = 0f) => Draw(parent, name, p, size, color, order, angle, square);

        public SpriteRenderer Disc(Transform parent, string name, Vector2 p, Vector2 size, Color color,
            int order) => Draw(parent, name, p, size, color, order, 0f, disc);

        public SpriteRenderer Hex(Transform parent, Vector2 p, float size, Color color, int order) =>
            Draw(parent, "Hexágono", p, Vector2.one * size, color, order, 0f, hex);

        public SpriteRenderer Vapor(Transform parent, int order)
        {
            if (vapor == null)
            {
                const int resolution = 48;
                var texture = new Texture2D(resolution, resolution, TextureFormat.RGBA32, false)
                    { name = "Vapor difuso", wrapMode = TextureWrapMode.Clamp };
                var pixels = new Color32[resolution * resolution];
                for (int y = 0; y < resolution; y++)
                for (int x = 0; x < resolution; x++)
                {
                    Vector2 p = new((x + 0.5f) / 24f - 1, (y + 0.5f) / 24f - 1);
                    float distance = p.magnitude;
                    float falloff = Mathf.Clamp01(1 - distance);
                    pixels[y * resolution + x] = new Color32(255, 255, 255, (byte)(falloff * falloff * 255));
                }
                texture.SetPixels32(pixels);
                texture.Apply(false, true);
                vapor = Sprite.Create(texture, new Rect(0, 0, resolution, resolution),
                    new Vector2(0.5f, 0.5f), resolution, 0, SpriteMeshType.FullRect);
            }
            return Draw(parent, "Nube de vapor", Vector2.zero, Vector2.one, Color.white, order, 0, vapor);
        }

        public MeshRenderer Kit(Transform parent, string piece, Vector2 p, Vector2 size,
            int order, float angle = 0f) =>
            kitMeshes.Draw(parent, piece, p, size, order, angle);

        public void ReleaseKitMeshes() => kitMeshes.Dispose();

        public SpriteRenderer ResourceSprite(Transform parent, string path, Vector2 p, Vector2 size,
            Color color, int order, float angle = 0)
        {
            if (!kitSprites.TryGetValue(path, out Sprite sprite))
            {
                Texture2D texture = Resources.Load<Texture2D>(path);
                sprite = texture == null ? null : Sprite.Create(texture,
                    new Rect(0, 0, texture.width, texture.height), new Vector2(0.5f, 0.5f),
                    texture.width, 0, SpriteMeshType.FullRect);
                kitSprites.Add(path, sprite);
                if (sprite == null)
                    Debug.LogError("Falta el sprite: " + path);
            }
            if (sprite == null)
                return null;
            float nativeHeight = sprite.bounds.size.y;
            return Draw(parent, sprite.texture.name, p, new Vector2(size.x, size.y / nativeHeight),
                color, order, angle, sprite);
        }

        private SpriteRenderer Draw(Transform parent, string name, Vector2 p, Vector2 size, Color color,
            int order, float angle, Sprite sprite)
        {
            Transform child = Group(parent, name, p, angle);
            child.localPosition = new Vector3(p.x, p.y, -order * 0.05f);
            child.localScale = new Vector3(size.x, size.y, 1f);
            var renderer = child.gameObject.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.color = color;
            renderer.sortingOrder = order;
            if (material != null)
                renderer.sharedMaterial = material;
            return renderer;
        }

        public void Line(Transform parent, Vector2 a, Vector2 b, float width, Color color, int order)
        {
            Vector2 delta = b - a;
            Plate(parent, "Línea", (a + b) * 0.5f, new Vector2(delta.magnitude, width), color,
                order, Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg);
        }

        public static BoxCollider2D Box(Transform parent, string name, Vector2 p, Vector2 size,
            float angle = 0f, bool trigger = false)
        {
            var box = Group(parent, name, p, angle).gameObject.AddComponent<BoxCollider2D>();
            box.size = size;
            box.isTrigger = trigger;
            return box;
        }

        public void Wall(Transform parent, Vector2 a, Vector2 b)
        {
            Vector2 delta = b - a;
            Box(parent, "Muro sólido", (a + b) * 0.5f, new Vector2(delta.magnitude + 0.16f, 0.28f),
                Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg);
            Line(parent, a, b, 0.64f, Ink("586D83"), 6);
            Line(parent, a, b, 0.43f, Ink("EDF5FC"), 7);
            Line(parent, a, b, 0.07f, Ink("B1C5D8"), 8);
        }

        public void KitWall(Transform parent, Vector2 a, Vector2 b, string piece, float depth)
        {
            Vector2 delta = b - a;
            float length = delta.magnitude;
            float angle = Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg;
            int count = Mathf.CeilToInt(length / 1.85f);
            float width = length / count;
            for (int i = 0; i < count; i++)
            {
                Vector2 position = a + delta * ((i + 0.5f) / count);
                Kit(parent, piece, position, new Vector2(width + 0.035f, depth), 8, angle);
            }
        }
    }
}
