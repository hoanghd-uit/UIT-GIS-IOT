export interface NormalizedDeviceRecord {
  externalDeviceId: string;
  name: string;
  kind: string;
  buildingId: string;
  floorId: string;
  originalPosition: {
    space: string;
    frameId: string;
    frameVersion: number;
    coordinates: { x: number; y: number; z: number };
  };
}

export interface NormalizedCatalogueBatch {
  sourceKind: 'fixture' | 'iot';
  sourceNamespace: string;
  buildingId: string;
  floorId: string;
  completeness: 'full' | 'partial' | 'unknown' | 'empty';
  records: NormalizedDeviceRecord[];
}


export interface DeviceCatalogueProvider {
  fetchFloorCatalogue(request: {
    buildingId: string;
    floorId: string;
    requestId?: string;
  }): Promise<NormalizedCatalogueBatch>;
}
