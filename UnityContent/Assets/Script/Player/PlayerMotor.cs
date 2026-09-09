using UnityEngine;

namespace UITCampus.Player
{
    /// <summary>
    /// Handles first-person walking physics translation and gravity using CharacterController.
    /// Movement is strictly horizontal along player yaw; pitch does not affect vertical displacement.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    [DisallowMultipleComponent]
    public class PlayerMotor : MonoBehaviour
    {
        [Header("Components")]
        [SerializeField] private CharacterController characterController;
        [SerializeField] private PlayerInputState inputState;

        [Header("Locomotion Tuning")]
        [SerializeField] private float walkSpeed = 4.0f;
        [SerializeField] private float sprintSpeed = 7.0f;
        [SerializeField] private float gravity = -20.0f;
        [SerializeField] private float groundStickVelocity = -2.0f;

        private float _verticalVelocity;

        public CharacterController CharacterController
        {
            get => characterController;
            set => characterController = value;
        }

        public PlayerInputState InputState
        {
            get => inputState;
            set => inputState = value;
        }

        private void Reset()
        {
            characterController = GetComponent<CharacterController>();
            inputState = GetComponent<PlayerInputState>();
        }

        private void Awake()
        {
            if (characterController == null)
            {
                characterController = GetComponent<CharacterController>();
            }

            if (inputState == null)
            {
                inputState = GetComponent<PlayerInputState>();
            }
        }

        private void Update()
        {
            if (characterController == null || !characterController.enabled || inputState == null)
            {
                return;
            }

            Vector2 moveInput = inputState.Move;
            Vector3 horizontalDir = transform.right * moveInput.x + transform.forward * moveInput.y;
            float speed = inputState.IsSprinting ? sprintSpeed : walkSpeed;
            Vector3 horizontalVelocity = horizontalDir * speed;

            if (characterController.isGrounded)
            {
                _verticalVelocity = groundStickVelocity;
            }
            else
            {
                _verticalVelocity += gravity * Time.deltaTime;
            }

            Vector3 totalVelocity = horizontalVelocity + Vector3.up * _verticalVelocity;
            characterController.Move(totalVelocity * Time.deltaTime);
        }
    }
}

