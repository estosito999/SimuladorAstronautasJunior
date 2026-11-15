using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

// Editor-only export entry point. Game scenes and runtime scripts are used as authored.
public static class SeleneWebBuild
{
    private const string RequiredVersion = "6000.6.7f1";
    private const string EntryScene = "Assets/Scenes/EstacionSelene.unity";

    [Serializable]
    private sealed class ExportMetadata
    {
        public string unityVersion = Application.unityVersion;
        public string entryScene = EntryScene;
    }

    public static void Build()
    {
        if (Application.unityVersion != RequiredVersion)
            throw new BuildFailedException("Esta exportación requiere Unity " + RequiredVersion + ".");
        if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.WebGL, BuildTarget.WebGL))
            throw new BuildFailedException("Instala Web Build Support para Unity " + RequiredVersion + ".");

        string output = ReadOutputPath();
        string[] scenes = EditorBuildSettings.scenes
            .Where(scene => scene.enabled)
            .Select(scene => scene.path)
            .ToArray();
        if (!scenes.Contains(EntryScene) || scenes.Any(scene => !File.Exists(scene)))
            throw new BuildFailedException("Comprueba las escenas activas y EstacionSelene en Build Profiles.");

        // SampleScene is an empty template. Only the exported player's entry order changes.
        scenes = new[] { EntryScene }.Concat(scenes.Where(scene => scene != EntryScene)).ToArray();
        var originalCompression = PlayerSettings.WebGL.compressionFormat;
        bool originalFallback = PlayerSettings.WebGL.decompressionFallback;
        try
        {
            // Uncompressed artifacts also work on static hosts without Content-Encoding rules.
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.decompressionFallback = false;
            BuildReport report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = output,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            });
            if (report.summary.result != BuildResult.Succeeded)
                throw new BuildFailedException("Falló la exportación Web de Unity. Consulta el registro de compilación.");
            File.WriteAllText(Path.Combine(output, "selene-build.json"), JsonUtility.ToJson(new ExportMetadata(), true));
            Debug.Log("SELENE Web export completed: " + output);
        }
        finally
        {
            PlayerSettings.WebGL.compressionFormat = originalCompression;
            PlayerSettings.WebGL.decompressionFallback = originalFallback;
        }
    }

    private static string ReadOutputPath()
    {
        string[] arguments = Environment.GetCommandLineArgs();
        int index = Array.IndexOf(arguments, "-seleneOutputPath");
        if (index < 0 || index + 1 >= arguments.Length)
            throw new BuildFailedException("Falta -seleneOutputPath con el directorio de exportación.");
        string output = Path.GetFullPath(arguments[index + 1]);
        if (Directory.Exists(output) && Directory.EnumerateFileSystemEntries(output).Any())
            throw new BuildFailedException("El directorio de exportación debe estar vacío.");
        return output;
    }
}
