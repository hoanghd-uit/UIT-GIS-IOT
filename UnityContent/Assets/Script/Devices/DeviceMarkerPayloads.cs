using System;
using UnityEngine;

namespace UITCampus.Devices
{
    [Serializable]
    public class Vector3Dto
    {
        public float x;
        public float y;
        public float z;

        public Vector3 ToVector3() => new Vector3(x, y, z);
        public static Vector3Dto FromVector3(Vector3 v) => new Vector3Dto { x = v.x, y = v.y, z = v.z };
    }

    [Serializable]
    public class MarkerDataDto
    {
        public string id;
        public string externalId;
        public string name;
        public string kind;
        public Vector3Dto position;
    }

    [Serializable]
    public class ApplyFloorMarkersPayload
    {
        public int schemaVersion = 1;
        public string requestId;
        public string buildingId;
        public string floorId;
        public string frameId;
        public int frameVersion;
        public MarkerDataDto[] markers;
    }

    [Serializable]
    public class PreviewMarkerPositionPayload
    {
        public int schemaVersion = 1;
        public string requestId;
        public string deviceId;
        public Vector3Dto position;
    }

    [Serializable]
    public class DeviceMarkerClickedPayload
    {
        public int schemaVersion = 1;
        public string buildingId;
        public string floorId;
        public string deviceId;
        public string externalId;
        public string category;
        public string sourceDeviceType;
        public bool isTestAnchor;
    }
}

