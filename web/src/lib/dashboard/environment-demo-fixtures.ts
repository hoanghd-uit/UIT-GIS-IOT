import {
  Co2DemoFixtureData,
  Co2DemoRoomData,
  Co2DemoRoomRanking,
  Co2FloorComplianceItem,
} from '@/types/dashboard-environment';

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

const RAW_ROOMS_DATA: Array<{
  roomId: string;
  roomName: string;
  floor: string;
  values: number[];
}> = [
    {
      roomId: 'DEMO-E-101',
      roomName: 'Phòng E4.1',
      floor: 'Tầng 4',
      values: [520, 610, 780, 840, 690, 720, 890, 930, 810, 680],
    },
    {
      roomId: 'DEMO-E-102',
      roomName: 'Phòng E4.8',
      floor: 'Tầng 4',
      values: [480, 540, 650, 720, 600, 640, 710, 750, 680, 590],
    },
    {
      roomId: 'DEMO-E-103',
      roomName: 'Sảnh Tầng 6',
      floor: 'Tầng 6',
      values: [450, 500, 560, 610, 540, 580, 630, 660, 590, 520],
    },
    {
      roomId: 'DEMO-E-201',
      roomName: 'Phòng E6.7',
      floor: 'Tầng 6',
      values: [550, 640, 790, 880, 710, 760, 920, 970, 850, 720],
    },
    {
      roomId: 'DEMO-E-202',
      roomName: 'Phòng E6.6',
      floor: 'Tầng 6',
      values: [610, 720, 910, 1050, 820, 890, 1080, 1120, 940, 780],
    },
    {
      roomId: 'DEMO-E-401',
      roomName: 'Phòng E6.5',
      floor: 'Tầng 6',
      values: [580, 690, 860, 950, 750, 810, 990, 1040, 880, 740],
    },
    {
      roomId: 'DEMO-E-402',
      roomName: 'Phòng E6.4',
      floor: 'Tầng 6',
      values: [510, 590, 710, 790, 660, 700, 820, 860, 770, 650],
    },
    {
      roomId: 'DEMO-E-403',
      roomName: 'Phòng E6.3',
      floor: 'Tầng 6',
      values: [490, 560, 670, 730, 620, 660, 750, 790, 710, 610],
    },
    {
      roomId: 'DEMO-E-601',
      roomName: 'Phòng E6.1',
      floor: 'Tầng 6',
      values: [640, 780, 980, 1140, 890, 960, 1180, 1220, 1010, 830],
    },
    {
      roomId: 'DEMO-E-602',
      roomName: 'Phòng E6.2',
      floor: 'Tầng 6',
      values: [470, 530, 620, 680, 580, 610, 690, 730, 650, 1100],
    },
  ];

const THRESHOLDS = {
  co2GoodMax: 800,
  co2ModerateMax: 1000,
  vocGoodMax: 0.1,
};

function buildDeterministicFixture(): Co2DemoFixtureData {
  const rooms: Co2DemoRoomData[] = RAW_ROOMS_DATA.map((r) => ({
    roomId: r.roomId,
    roomName: r.roomName,
    floor: r.floor,
    hourlyValues: HOURS.map((hour, idx) => ({
      hour,
      value: r.values[idx] ?? 600,
    })),
  }));

  // Derive rankings strictly from the latest hourly value of each room
  const rankings: Co2DemoRoomRanking[] = rooms
    .map((r) => {
      const latestValue = r.hourlyValues[r.hourlyValues.length - 1].value;
      const status: 'good' | 'moderate' | 'warning' =
        latestValue <= THRESHOLDS.co2GoodMax
          ? 'good'
          : latestValue <= THRESHOLDS.co2ModerateMax
            ? 'moderate'
            : 'warning';
      return {
        roomId: r.roomId,
        roomName: r.roomName,
        floor: r.floor,
        latestValue,
        status,
      };
    })
    .sort((a, b) => b.latestValue - a.latestValue);

  // Derive floor compliance percentages strictly from hourly values
  const floors = ['Tất cả', 'Tầng 1', 'Tầng 2', 'Tầng 4', 'Tầng 6'];
  const compliance: Co2FloorComplianceItem[] = floors.map((floor) => {
    const targetRooms = floor === 'Tất cả' ? rooms : rooms.filter((r) => r.floor === floor);
    const allValues: number[] = targetRooms.flatMap((r) => r.hourlyValues.map((v) => v.value));
    const passCount = allValues.filter((v) => v <= THRESHOLDS.co2ModerateMax).length;
    const totalCount = allValues.length || 1;
    const compliancePercent = Math.round((passCount / totalCount) * 100);
    return {
      floor,
      compliancePercent,
      sampleCount: totalCount,
    };
  });

  // Derive KPI summary
  const latestSum = rankings.reduce((acc, curr) => acc + curr.latestValue, 0);
  const averageCo2 = Math.round(latestSum / (rankings.length || 1));
  const peakRoom = rankings[0]?.roomName || '—';
  const peakCo2 = rankings[0]?.latestValue || 0;

  return {
    fixtureId: 'page03-co2-demo-v1',
    version: '1.0.0',
    hours: HOURS,
    floors,
    rooms,
    rankings,
    compliance,
    kpis: {
      averageCo2,
      peakRoom,
      peakCo2,
      vocIndex: 0.06,
      vocLabel: 'Mức an toàn',
      maxCo2: rankings[0]?.latestValue || 0,
    },
    thresholds: THRESHOLDS,
  };
}

export const CO2_DEMO_FIXTURE: Co2DemoFixtureData = buildDeterministicFixture();
