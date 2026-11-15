using System.IO;
using System.Collections.Generic;
using UnityEngine;

namespace BaseLunar
{
    internal sealed class LunarKitMeshes
    {
        private readonly Dictionary<string, Mesh> meshes = new();
        private Material material;

        public MeshRenderer Draw(Transform parent, string piece, Vector2 position,
            Vector2 size, int order, float angle)
        {
            if (material == null)
            {
                Shader shader = Resources.Load<Shader>("Kenney3D/KenneyMesh");
                if (shader == null)
                {
                    Debug.LogError("No se encontró el shader de las mallas de Kenney.");
                    return null;
                }
                material = new Material(shader);
            }
            if (!meshes.TryGetValue(piece, out Mesh mesh))
            {
                TextAsset source = Resources.Load<TextAsset>("Kenney3D/" + piece);
                if (source == null)
                {
                    Debug.LogError("No se encontró la malla Kenney: " + piece);
                    return null;
                }
                mesh = ReadMesh(source.bytes, piece);
                meshes.Add(piece, mesh);
            }

            Transform graphic = LunarShapes.Group(parent, piece + " · malla 3D", position, angle);
            graphic.localPosition = new Vector3(position.x, position.y, -order * 0.05f);
            graphic.localScale = new Vector3(size.x, size.y, 0.12f);
            graphic.gameObject.AddComponent<MeshFilter>().sharedMesh = mesh;
            var renderer = graphic.gameObject.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            renderer.sortingOrder = order;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            renderer.receiveShadows = false;
            return renderer;
        }

        private static Mesh ReadMesh(byte[] payload, string piece)
        {
            using var reader = new BinaryReader(new MemoryStream(payload, false));
            const int signature = 0x3144334B;
            if (reader.ReadInt32() != signature)
                throw new InvalidDataException("Formato de malla inválido: " + piece);
            int count = reader.ReadInt32();
            if (count < 3 || count % 3 != 0 || count > 65535 || payload.Length != 8 + 16 * count)
                throw new InvalidDataException("Geometría incompleta: " + piece);

            var vertices = new Vector3[count];
            var colors = new Color32[count];
            var indices = new int[count];
            for (int i = 0; i < count; i++)
            {
                vertices[i] = new Vector3(reader.ReadSingle(), reader.ReadSingle(), reader.ReadSingle());
                colors[i] = new Color32(reader.ReadByte(), reader.ReadByte(), reader.ReadByte(), reader.ReadByte());
                indices[i] = i;
            }

            var mesh = new Mesh { name = piece, vertices = vertices, colors32 = colors, triangles = indices };
            mesh.RecalculateBounds();
            mesh.UploadMeshData(true);
            return mesh;
        }

        public void Dispose()
        {
            foreach (Mesh mesh in meshes.Values)
                Object.Destroy(mesh);
            meshes.Clear();
            if (material != null)
                Object.Destroy(material);
        }
    }
}
