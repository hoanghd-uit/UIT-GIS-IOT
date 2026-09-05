using UnityEngine;

namespace UITCampus.Player
{
    /// <summary>
    /// Controls first-person camera look.
    /// Rotates the player root around world Y (yaw) and the camera pivot around local X (pitch).
    /// Prevents roll and clamps pitch within specified angles.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerLook : MonoBehaviour
    {
        [Header("Transforms")]
        [SerializeField] private Transform playerRoot;
        [SerializeField] private Transform cameraPivot;

        [Header("Input Source")]
        [SerializeField] private PlayerInputState inputState;

        [Header("Sensitivity & Limits")]
        [SerializeField] private float mouseSensitivity = 0.15f;
        [SerializeField] private float minPitch = -80.0f;
        [SerializeField] private float maxPitch = 80.0f;

        private float _currentPitch;

        public Transform PlayerRoot
        {
            get => playerRoot;
            set => playerRoot = value;
        }

        public Transform CameraPivot
        {
            get => cameraPivot;
            set => cameraPivot = value;
        }

        public PlayerInputState InputState
        {
            get => inputState;
            set => inputState = value;
        }

        private void Reset()
        {
            cameraPivot = transform;
            playerRoot = transform.parent;
            inputState = GetComponentInParent<PlayerInputState>();
        }

        private void Awake()
        {
            if (cameraPivot == null)
            {
                cameraPivot = transform;
            }

            if (playerRoot == null && transform.parent != null)
            {
                playerRoot = transform.parent;
            }

            if (inputState == null)
            {
                inputState = GetComponentInParent<PlayerInputState>();
            }

            _currentPitch = 0f;
        }

        private void Update()
        {
            if (Cursor.lockState != CursorLockMode.Locked || inputState == null || playerRoot == null || cameraPivot == null)
            {
                return;
            }

            Vector2 lookDelta = inputState.Look;
            float yawDelta = lookDelta.x * mouseSensitivity;
            float pitchDelta = lookDelta.y * mouseSensitivity;

            // Rotate player body horizontally (yaw)
            playerRoot.Rotate(Vector3.up * yawDelta, Space.World);

            // Rotate camera pivot vertically (pitch)
            _currentPitch = Mathf.Clamp(_currentPitch - pitchDelta, minPitch, maxPitch);
            cameraPivot.localRotation = Quaternion.Euler(_currentPitch, 0f, 0f);
        }
    }
}

