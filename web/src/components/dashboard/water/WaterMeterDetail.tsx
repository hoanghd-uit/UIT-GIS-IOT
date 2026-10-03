'use client';

import React, { useState } from 'react';
import {
  DashboardWaterLatestSample,
  DashboardWaterReadingsResponse,
} from '@/types/dashboard-water';

export interface WaterMeterDetailProps {
  selectedMeterId: string | null;
  readingsData: DashboardWaterReadingsResponse | null;
  status: 'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'unavailable' | 'error';
}

export function WaterMeterDetail({
  selectedMeterId,
  readingsData,
  status,
}: WaterMeterDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');

  const latestSample: DashboardWaterLatestSample | null =
    readingsData?.latestSample ?? null;
  const coverage = readingsData?.coverage;

  const rawFlags = latestSample?.rawFlags;

  return (
    <div
      role="region"
      aria-label="Chi tiết kỹ thuật đồng hồ nước và cảnh báo AI"
      className="p-4 rounded-xl border flex flex-col justify-between min-h-[460px] transition-all"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header with View Tabs */}
      <div className="flex flex-col gap-2 pb-3 border-b border-[rgba(83,109,126,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[rgba(23,34,44,0.6)] border border-[rgba(83,109,126,0.25)] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'details'
                ? 'bg-[#17222C] text-[#E6EDF1] shadow-sm'
                : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                }`}
              aria-pressed={activeTab === 'details'}
            >
              Chi tiết kỹ thuật (Live)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'ai'
                ? 'bg-[#17222C] text-[#E6EDF1] shadow-sm'
                : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                }`}
              aria-pressed={activeTab === 'ai'}
            >
              Bất thường AI (Demo)
            </button>
          </div>

          {activeTab === 'ai' && (
            <span className="text-[10px] text-[#43C0AC] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43C0AC]" />
              Mô hình mẫu
            </span>
          )}
        </div>
      </div>

      {/* Tab 1: Live Hardware Details and Raw Flags */}
      {activeTab === 'details' && (
        <div className="flex-1 flex flex-col justify-between pt-3 gap-3">
          {!selectedMeterId ? (
            <div className="my-auto py-10 text-center">
              <p className="text-xs text-[#A5B0B9]">
                Chọn một đồng hồ nước AVC để xem thông số kỹ thuật và cờ phần cứng.
              </p>
            </div>
          ) : status === 'loading' ? (
            <div className="my-auto py-10 text-center text-xs text-[#A5B0B9]">
              Đang nạp thông số kỹ thuật...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[340px] custom-scrollbar">
              {/* Radio and Identity Details */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A5B0B9]">
                  Thông tin kết nối & thiết bị
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[10px] text-[#7E8B96] block">Mã ChirpStack</span>
                    <span className="font-mono text-[#E6EDF1] truncate block">
                      {latestSample?.deviceName || '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[10px] text-[#7E8B96] block">Sê-ri đồng hồ</span>
                    <span className="font-mono text-[#E6EDF1] truncate block">
                      {latestSample?.meterSerial || '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[10px] text-[#7E8B96] block">Gateway</span>
                    <span className="font-mono text-[#E6EDF1] truncate block">
                      {latestSample?.gatewayId || '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[10px] text-[#7E8B96] block">RSSI / SNR</span>
                    <span className="font-mono text-[#E6EDF1] block">
                      {latestSample?.rssiDbm != null ? `${latestSample.rssiDbm} dBm` : '—'} /{' '}
                      {latestSample?.snrDb != null ? `${latestSample.snrDb} dB` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Observation Time */}
              {latestSample?.observedAt && (
                <div className="text-[11px] text-[#A5B0B9] bg-[rgba(23,34,44,0.3)] p-2 rounded border border-[rgba(83,109,126,0.2)]">
                  <span>Thời điểm đo gần nhất: </span>
                  <span className="font-mono text-[#E6EDF1]">
                    {new Date(latestSample.observedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}

              {/* Technical Flags (Raw Numeric Disclosure) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A5B0B9]">
                    Mã cờ kỹ thuật (Raw numeric)
                  </span>
                  <span className="text-[10px] text-[#E4BF55]">Chưa xác nhận miền</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[#A5B0B9] text-[11px]">Van (valveOpen)</span>
                    <span className="font-mono font-bold text-[#E6EDF1]">
                      {rawFlags?.valveOpen ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[#A5B0B9] text-[11px]">Rò rỉ (pipeLeak)</span>
                    <span className="font-mono font-bold text-[#E6EDF1]">
                      {rawFlags?.pipeLeak ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[#A5B0B9] text-[11px]">Bể vỡ (pipeBurst)</span>
                    <span className="font-mono font-bold text-[#E6EDF1]">
                      {rawFlags?.pipeBurst ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[#A5B0B9] text-[11px]">Pin (batteryLow)</span>
                    <span className="font-mono font-bold text-[#E6EDF1]">
                      {rawFlags?.batteryLow ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[#A5B0B9] text-[11px]">Đóng băng (frozen)</span>
                    <span className="font-mono font-bold text-[#E6EDF1]">
                      {rawFlags?.frozen ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(23,34,44,0.4)] border border-[rgba(83,109,126,0.2)]">
                    <span className="text-[#A5B0B9] text-[11px]">Can thiệp (tamper)</span>
                    <span className="font-mono font-bold text-[#E6EDF1]">
                      {rawFlags?.tamper ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coverage summary */}
              {coverage && (
                <div className="text-[11px] text-[#7E8B96] space-y-0.5">
                  <div>
                    Mẫu nhận: {coverage.returnedCount} (hợp lệ: {coverage.validCount}, bỏ qua:{' '}
                    {coverage.invalidCount})
                  </div>
                  {coverage.isTruncated && (
                    <div className="text-[#E4BF55]">
                      * Dữ liệu bị cắt bớt bởi giới hạn truy vấn (1000 mẫu).
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mandatory Disclaimers */}
          <div className="pt-2 border-t border-[rgba(83,109,126,0.2)]">
            <p className="text-[11px] text-[#A5B0B9] leading-relaxed">
              * Không thể kết luận rò rỉ hoặc bất thường từ các mã cờ kỹ thuật hiện tại khi chưa có tài liệu xác nhận miền giá trị từ đội ngũ phần cứng.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Dummy AI Anomaly Detection (Mockup Reference) */}
      {activeTab === 'ai' && (
        <div className="flex-1 flex flex-col justify-between pt-3 gap-3">
          <div className="space-y-2.5">
            {/* Anomaly 1: Water leak at night */}
            <div className="p-3 rounded-lg bg-[rgba(23,34,44,0.5)] border-l-4 border-l-[#E53E3E] border border-[rgba(83,109,126,0.2)] space-y-1">
              <h5 className="text-xs font-semibold text-[#E6EDF1]">
                Lưu lượng nước 02:00–05:00 cao gấp 4,5 lần mức nền
              </h5>
              <p className="text-[11px] text-[#A5B0B9]">
                Trục cấp nước T2 · AVC-T2-01 · độ tin cậy cao
              </p>
            </div>

            {/* Anomaly 2: Night electricity baseline */}
            <div className="p-3 rounded-lg bg-[rgba(23,34,44,0.5)] border-l-4 border-l-[#FFB121] border border-[rgba(83,109,126,0.2)] space-y-1">
              <h5 className="text-xs font-semibold text-[#E6EDF1]">
                Phụ tải nền ban đêm tăng 13% trong 5 đêm liên tiếp
              </h5>
              <p className="text-[11px] text-[#A5B0B9]">
                Đồng hồ tổng · nghi thiết bị không tắt sau giờ học
              </p>
            </div>

            {/* Anomaly 3: Floor 4 consumption */}
            <div className="p-3 rounded-lg bg-[rgba(23,34,44,0.5)] border-l-4 border-l-[#ECC94B] border border-[rgba(83,109,126,0.2)] space-y-1">
              <h5 className="text-xs font-semibold text-[#E6EDF1]">
                Tầng 4 tiêu thụ cao hơn các tầng tương đương 28%
              </h5>
              <p className="text-[11px] text-[#A5B0B9]">
                Trùng thời điểm CO₂ E4.07–E4.08 vượt ngưỡng
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
            Demo
          </span>
        </div>
      )}

      {/* Card Footer */}
      <div className="pt-2.5 mt-2 border-t border-[rgba(83,109,126,0.15)] flex items-center justify-between text-[11px] text-[#7E8B96]">
        <span>{activeTab === 'details' ? 'Trạng thái: Trực tiếp' : 'Trạng thái: Demo'}</span>
        <span>{activeTab === 'details' ? 'Nguồn: AVC telemetry' : 'AI model: Chưa tích hợp'}</span>
      </div>
    </div>
  );
}
