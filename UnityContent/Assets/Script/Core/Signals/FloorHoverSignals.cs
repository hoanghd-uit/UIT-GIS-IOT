using System;
using UnityEngine;
using UITCampus.Campus.Buildings;

namespace UITCampus.Core.Signals
{
    /// <summary>
    /// Static event hub for floor hover events.
    /// Decouples pointer event dispatchers (HoverableFloor) from building aggregates (HoverableBuilding) and future UI.
    /// </summary>
    public static class FloorHoverSignals
    {
        public static event Action<HoverableFloor> PointerEntered;
        public static event Action<HoverableFloor> PointerExited;
        public static event Action<HoverableFloor> FloorClicked;

        public static void PublishPointerEntered(HoverableFloor floor)
        {
            if (floor != null)
            {
                PointerEntered?.Invoke(floor);
            }
        }

        public static void PublishPointerExited(HoverableFloor floor)
        {
            if (floor != null)
            {
                PointerExited?.Invoke(floor);
            }
        }

        public static void PublishFloorClicked(HoverableFloor floor)
        {
            if (floor != null)
            {
                FloorClicked?.Invoke(floor);
            }
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        public static void ResetSignals()
        {
            PointerEntered = null;
            PointerExited = null;
            FloorClicked = null;
        }
    }
}

