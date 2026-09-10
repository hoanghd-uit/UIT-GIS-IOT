mergeInto(LibraryManager.library, {
  DispatchViewerEvent: function (eventNamePtr, payloadJsonPtr) {
    var eventName = UTF8ToString(eventNamePtr);
    var payloadJson = UTF8ToString(payloadJsonPtr);
    if (typeof window !== "undefined" && typeof window.dispatchReactUnityEvent === "function") {
      try {
        window.dispatchReactUnityEvent(eventName, payloadJson);
      } catch (err) {
        console.error("[ViewerBridge] Error dispatching React Unity event '" + eventName + "':", err);
      }
    } else {
      console.warn("[ViewerBridge] window.dispatchReactUnityEvent is not available for event: " + eventName);
    }
  }
});

