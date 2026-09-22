#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace UITCampus.Editor
{
    public static class WebGLAutoBuilder
    {
        private const string TargetWebCampusDir = "../../web/public/unity/campus";

        [MenuItem("GIS/Build WebGL (Auto-Deploy to Web)")]
        public static void BuildWebGLPlayer()
        {
            string[] scenes = new string[]
            {
                "Assets/Scene/Campus.unity",
                "Assets/Scene/FloorDetail.unity"
            };

            string webCampusPath = Path.GetFullPath(Path.Combine(Application.dataPath, TargetWebCampusDir));
            string buildOutputDir = Path.Combine(webCampusPath, "TempBuild");
            if (Directory.Exists(buildOutputDir))
            {
                Directory.Delete(buildOutputDir, true);
            }
            Directory.CreateDirectory(buildOutputDir);

            Debug.Log($"[WebGLAutoBuilder] Starting WebGL Build with WebGL Quality Profile to: {buildOutputDir}");

            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = buildOutputDir,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[WebGLAutoBuilder] Build succeeded in {summary.totalTime.TotalSeconds:F1}s. Deploying to {webCampusPath}...");
                DeployBuildFiles(buildOutputDir, webCampusPath);
                Debug.Log("[WebGLAutoBuilder] Deployment to web/public/unity/campus complete!");
            }
            else
            {
                Debug.LogError($"[WebGLAutoBuilder] WebGL Build failed with result: {summary.result}");
            }
        }

        private static void DeployBuildFiles(string sourceDir, string targetCampusDir)
        {
            string sourceBuild = Path.Combine(sourceDir, "Build");
            string targetBuild = Path.Combine(targetCampusDir, "Build");

            if (Directory.Exists(sourceBuild))
            {
                if (!Directory.Exists(targetBuild)) Directory.CreateDirectory(targetBuild);

                foreach (var file in Directory.GetFiles(sourceBuild))
                {
                    string fileName = Path.GetFileName(file);
                    string destFileName = fileName;
                    if (fileName.StartsWith("GIS-UIT-IOT") || fileName.StartsWith("UIT-GIS") || fileName.StartsWith("TempBuild"))
                    {
                        int dotIdx = fileName.IndexOf('.');
                        if (dotIdx >= 0)
                        {
                            string ext = fileName.Substring(dotIdx);
                            destFileName = "UIT-GIS-0910_1" + ext;
                        }
                    }
                    string destPath = Path.Combine(targetBuild, destFileName);
                    File.Copy(file, destPath, true);
                    Debug.Log($"[WebGLAutoBuilder] Deployed {fileName} -> {destFileName}");
                }
            }

            string sourceStreaming = Path.Combine(sourceDir, "StreamingAssets");
            string targetStreaming = Path.Combine(targetCampusDir, "StreamingAssets");
            if (Directory.Exists(sourceStreaming))
            {
                CopyDirectoryRecursive(sourceStreaming, targetStreaming);
            }
        }

        private static void CopyDirectoryRecursive(string sourceDir, string targetDir)
        {
            Directory.CreateDirectory(targetDir);
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string targetFilePath = Path.Combine(targetDir, Path.GetFileName(file));
                File.Copy(file, targetFilePath, true);
            }
            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string targetSubDirPath = Path.Combine(targetDir, Path.GetFileName(subDir));
                CopyDirectoryRecursive(subDir, targetSubDirPath);
            }
        }
    }
}
#endif
