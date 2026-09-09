using System.Collections;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Controls smooth slide in/out animations for the Left and Right data visualization panels
/// based on the Check box_DataVisualization Toggle state.
/// Default state when entering screen is Off (panels moved out off-screen).
/// </summary>
[DisallowMultipleComponent]
public class DataVisualizationPanelAnimator : MonoBehaviour
{
    [Header("UI References")]
    [Tooltip("The toggle component that controls visibility (e.g. Check box_DataVisualization).")]
    [SerializeField] private Toggle visualizationToggle;

    [Tooltip("The Left panel RectTransform under Bg.")]
    [SerializeField] private RectTransform leftPanel;

    [Tooltip("The Right panel RectTransform under Bg.")]
    [SerializeField] private RectTransform rightPanel;

    [Header("Animation Settings")]
    [Tooltip("Duration of the slide animation in seconds.")]
    [SerializeField] private float animationDuration = 0.45f;

    [Tooltip("Easing curve for the slide animation.")]
    [SerializeField] private AnimationCurve easeCurve = AnimationCurve.EaseInOut(0f, 0f, 1f, 1f);

    [Tooltip("Extra margin beyond the panel width to ensure it is completely off-screen.")]
    [SerializeField] private float offscreenPadding = 50f;

    [Tooltip("Use unscaled time so animations run regardless of Time.timeScale.")]
    [SerializeField] private bool useUnscaledTime = true;

    [Header("State")]
    [Tooltip("Whether the toggle should force Off state on startup.")]
    [SerializeField] private bool defaultOffOnStart = true;

    private Vector2 _leftOnScreenPos;
    private Vector2 _rightOnScreenPos;
    private Vector2 _leftOffScreenPos;
    private Vector2 _rightOffScreenPos;
    private Coroutine _animationCoroutine;
    private bool _initializedPositions;

    public Toggle VisualizationToggle
    {
        get => visualizationToggle;
        set => visualizationToggle = value;
    }

    public RectTransform LeftPanel
    {
        get => leftPanel;
        set => leftPanel = value;
    }

    public RectTransform RightPanel
    {
        get => rightPanel;
        set => rightPanel = value;
    }

    private void Reset()
    {
        AutoFindReferences();
    }

    private void Awake()
    {
        AutoFindReferences();
        InitializePositions();
    }

    private void Start()
    {
        if (defaultOffOnStart)
        {
            if (visualizationToggle != null)
            {
                visualizationToggle.SetIsOnWithoutNotify(false);
            }
            SnapToOffScreen();
        }
        else
        {
            if (visualizationToggle != null)
            {
                SetPanelsPositionInstant(visualizationToggle.isOn);
            }
        }

        if (visualizationToggle != null)
        {
            visualizationToggle.onValueChanged.AddListener(OnToggleValueChanged);
        }
    }

    private void OnDestroy()
    {
        if (visualizationToggle != null)
        {
            visualizationToggle.onValueChanged.RemoveListener(OnToggleValueChanged);
        }
    }

    /// <summary>
    /// Searches for references in the hierarchy if they have not been assigned in Inspector.
    /// </summary>
    public void AutoFindReferences()
    {
        if (visualizationToggle == null)
        {
            Transform toggleTransform = transform.Find("Panel/Check box_DataVisualization");
            if (toggleTransform != null)
            {
                visualizationToggle = toggleTransform.GetComponent<Toggle>();
            }
            else
            {
                visualizationToggle = GetComponentInChildren<Toggle>(true);
            }
        }

        if (leftPanel == null)
        {
            Transform leftTransform = transform.Find("Bg/Left");
            if (leftTransform != null)
            {
                leftPanel = leftTransform.GetComponent<RectTransform>();
            }
        }

        if (rightPanel == null)
        {
            Transform rightTransform = transform.Find("Bg/Right");
            if (rightTransform != null)
            {
                rightPanel = rightTransform.GetComponent<RectTransform>();
            }
        }
    }

    /// <summary>
    /// Records on-screen design positions and calculates off-screen destinations.
    /// </summary>
    public void InitializePositions()
    {
        if (_initializedPositions) return;

        if (leftPanel != null)
        {
            _leftOnScreenPos = leftPanel.anchoredPosition;
            float leftWidth = leftPanel.rect.width > 0 ? leftPanel.rect.width : leftPanel.sizeDelta.x;
            if (leftWidth <= 0) leftWidth = 1000f;
            _leftOffScreenPos = new Vector2(_leftOnScreenPos.x - leftWidth - offscreenPadding, _leftOnScreenPos.y);
        }

        if (rightPanel != null)
        {
            _rightOnScreenPos = rightPanel.anchoredPosition;
            float rightWidth = rightPanel.rect.width > 0 ? rightPanel.rect.width : rightPanel.sizeDelta.x;
            if (rightWidth <= 0) rightWidth = 1000f;
            _rightOffScreenPos = new Vector2(_rightOnScreenPos.x + rightWidth + offscreenPadding, _rightOnScreenPos.y);
        }

        _initializedPositions = true;
    }

    private void OnToggleValueChanged(bool isOn)
    {
        AnimateTo(isOn);
    }

    /// <summary>
    /// Animates the Left and Right panels to on-screen (true) or off-screen (false).
    /// </summary>
    public void AnimateTo(bool showOnScreen)
    {
        InitializePositions();

        if (_animationCoroutine != null)
        {
            StopCoroutine(_animationCoroutine);
        }

        _animationCoroutine = StartCoroutine(AnimateRoutine(showOnScreen));
    }

    private IEnumerator AnimateRoutine(bool showOnScreen)
    {
        Vector2 targetLeft = showOnScreen ? _leftOnScreenPos : _leftOffScreenPos;
        Vector2 targetRight = showOnScreen ? _rightOnScreenPos : _rightOffScreenPos;

        Vector2 startLeft = leftPanel != null ? leftPanel.anchoredPosition : Vector2.zero;
        Vector2 startRight = rightPanel != null ? rightPanel.anchoredPosition : Vector2.zero;

        float duration = Mathf.Max(animationDuration, 0.01f);
        float elapsed = 0f;

        while (elapsed < duration)
        {
            float dt = useUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
            elapsed += dt;
            float t = Mathf.Clamp01(elapsed / duration);
            float curveT = easeCurve != null ? easeCurve.Evaluate(t) : Mathf.SmoothStep(0f, 1f, t);

            if (leftPanel != null)
            {
                leftPanel.anchoredPosition = Vector2.LerpUnclamped(startLeft, targetLeft, curveT);
            }

            if (rightPanel != null)
            {
                rightPanel.anchoredPosition = Vector2.LerpUnclamped(startRight, targetRight, curveT);
            }

            yield return null;
        }

        if (leftPanel != null)
        {
            leftPanel.anchoredPosition = targetLeft;
        }

        if (rightPanel != null)
        {
            rightPanel.anchoredPosition = targetRight;
        }

        _animationCoroutine = null;
    }

    /// <summary>
    /// Immediately snaps panels without animation.
    /// </summary>
    public void SetPanelsPositionInstant(bool showOnScreen)
    {
        InitializePositions();

        if (_animationCoroutine != null)
        {
            StopCoroutine(_animationCoroutine);
            _animationCoroutine = null;
        }

        if (leftPanel != null)
        {
            leftPanel.anchoredPosition = showOnScreen ? _leftOnScreenPos : _leftOffScreenPos;
        }

        if (rightPanel != null)
        {
            rightPanel.anchoredPosition = showOnScreen ? _rightOnScreenPos : _rightOffScreenPos;
        }
    }

    [ContextMenu("Snap To Off-Screen")]
    public void SnapToOffScreen()
    {
        SetPanelsPositionInstant(false);
    }

    [ContextMenu("Snap To On-Screen")]
    public void SnapToOnScreen()
    {
        SetPanelsPositionInstant(true);
    }

    [ContextMenu("Test Animate In")]
    public void TestAnimateIn()
    {
        AnimateTo(true);
    }

    [ContextMenu("Test Animate Out")]
    public void TestAnimateOut()
    {
        AnimateTo(false);
    }
}

