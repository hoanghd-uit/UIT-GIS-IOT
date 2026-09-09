using UnityEngine;

namespace UITCampus.Core.Bootstrap
{
    /// <summary>
    /// Persistent bootstrap component for _InitManager root.
    /// Ensures only one _InitManager exists across scene loads without exposing singleton access.
    /// </summary>
    [DefaultExecutionOrder(-300)]
    public class AppBootstrap : MonoBehaviour
    {
        private static AppBootstrap _instance;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetState()
        {
            _instance = null;
        }
    }
}

