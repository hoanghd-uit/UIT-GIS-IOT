using UnityEngine;

namespace UITCampus.Player
{
    /// <summary>
    /// Initializes player root position and yaw orientation from a serialized spawn marker
    /// before any movement or physics update frames execute.
    /// </summary>
    [DefaultExecutionOrder(-200)]
    [DisallowMultipleComponent]
    public class PlayerSpawnInitializer : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Transform startPosition;
        [SerializeField] private Transform cameraPivot;
        [SerializeField] private CharacterController characterController;
        [SerializeField] private PlayerMotor playerMotor;

        [Header("Spawn Settings")]
        [SerializeField] private float spawnClearance = 0.05f;

        public Transform StartPosition
        {
            get => startPosition;
            set => startPosition = value;
        }

        public Transform CameraPivot
        {
            get => cameraPivot;
            set => cameraPivot = value;
        }

        private void Awake()
        {
            if (startPosition == null)
            {
                Debug.LogError($"[PlayerSpawnInitializer] startPosition reference is missing on '{gameObject.name}'! Disabling movement.", this);
                if (playerMotor != null)
                {
                    playerMotor.enabled = false;
                }
                return;
            }

            // Disable CharacterController during teleport to prevent collision override
            if (characterController != null)
            {
                characterController.enabled = false;
            }

            // Apply world position with clearance
            transform.position = startPosition.position + Vector3.up * spawnClearance;

            // Apply yaw only from spawn marker
            transform.rotation = Quaternion.Euler(0f, startPosition.eulerAngles.y, 0f);

            // Reset camera pivot to local identity
            if (cameraPivot != null)
            {
                cameraPivot.localRotation = Quaternion.identity;
            }

            if (characterController != null)
            {
                characterController.enabled = true;
            }
        }
    }
}

