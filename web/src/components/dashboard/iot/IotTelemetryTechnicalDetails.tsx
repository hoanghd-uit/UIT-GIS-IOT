'use client';

import React, { useState } from 'react';
import { NormalizedSolarReading, NormalizedAvcReading } from '@/types/iot-telemetry';

export interface IotTelemetryTechnicalDetailsProps {
  deviceType: 'solar' | 'avc';
  latestReading: NormalizedSolarReading | NormalizedAvcReading | null;
}

export function IotTelemetryTechnicalDetails({
  deviceType,
  latestReading,
}: IotTelemetryTechnicalDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!latestReading) return null;

  return (
    <div
      className="mt-4 rounded-lg border text-xs"
      style={{
        backgroundColor: 'var(--panel-elevated)',
        borderColor: 'var(--border)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 px-4 flex items-center justify-between text-left font-medium cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.02)]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span style={{ color: 'var(--text-primary)' }}>
            Thông số kỹ thuật & Mã nguồn thô (Chưa xác nhận ngữ nghĩa)
          </span>
        </span>
        <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
          {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t divide-y divide-[rgba(78,163,225,0.1)]" style={{ borderColor: 'var(--border)' }}>
          {/* Unconfirmed Hardware Warning */}
          <div
            className="p-2.5 mb-3 rounded border text-[11px]"
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              borderColor: 'rgba(234, 179, 8, 0.25)',
              color: 'var(--warning)',
            }}
          >
            Lưu ý: Các trường dưới đây được lưu giữ nguyên bản từ gói tin nguồn (raw values) và đang chờ xác nhận từ đội ngũ phần cứng. Không suy diễn thành trạng thái pin, cảnh báo rò rỉ hoặc mức an toàn.
          </div>

          {deviceType === 'solar' && (
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(() => {
                const s = latestReading as NormalizedSolarReading;
                return (
                  <>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Điện áp thô (raw voltage)</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                        {s.rawVoltage ?? '—'} <span className="text-[10px] font-normal text-muted-foreground">(chưa có đơn vị)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Nhiệt độ thô (raw temp)</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                        {s.rawTemperature ?? '—'} <span className="text-[10px] font-normal text-muted-foreground">(chưa có đơn vị)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Độ ẩm thô (raw humidity)</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                        {s.rawHumidity ?? '—'} <span className="text-[10px] font-normal text-muted-foreground">(chưa có đơn vị)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Mã trạng thái (raw state)</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                        {s.rawState ?? '—'} <span className="text-[10px] font-normal text-muted-foreground">(chưa xác nhận enum)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Bộ đếm khung (fCnt)</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                        {s.fCnt ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Application ID</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5 truncate" title={s.applicationId ?? ''}>
                        {s.applicationId ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Gateway ID</div>
                      <div className="font-mono text-xs font-semibold text-foreground mt-0.5 truncate" title={s.gatewayId ?? ''}>
                        {s.gatewayId ?? '—'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {deviceType === 'avc' && (
            <div className="pt-2 space-y-3">
              {/* Raw numeric flags */}
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1.5">
                  Mã cờ trạng thái phần cứng (Hiển thị mã nguồn số, chưa xác nhận miền giá trị):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {(() => {
                    const a = latestReading as NormalizedAvcReading;
                    const flags = [
                      { label: 'Mã van (valve_open)', val: a.rawValveOpen },
                      { label: 'Mã rò rỉ (pipe_leak)', val: a.rawPipeLeak },
                      { label: 'Mã vỡ ống (pipe_burst)', val: a.rawPipeBurst },
                      { label: 'Mã pin yếu (battery_low)', val: a.rawBatteryLow },
                      { label: 'Mã đóng băng (frozen)', val: a.rawFrozen },
                      { label: 'Mã can thiệp (tamper)', val: a.rawTamper },
                      { label: 'Dòng ngược (reverse_flow)', val: a.rawReverseFlow },
                    ];
                    return flags.map((f, i) => (
                      <div key={i} className="p-2 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                        <div className="text-[9px] text-muted-foreground truncate" title={f.label}>
                          {f.label}
                        </div>
                        <div className="font-mono text-xs font-semibold text-cyan-400 mt-0.5">
                          {f.val ?? '—'}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* LoRaWAN & Network Metadata */}
              <div>
                <div className="text-[11px] font-semibold text-foreground mb-1.5">
                  Thông số mạng LoRaWAN & Định danh thiết bị:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(() => {
                    const a = latestReading as NormalizedAvcReading;
                    return (
                      <>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Tần số (Frequency)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                            {a.frequencyHz !== null && a.frequencyHz !== undefined ? `${(a.frequencyHz / 1e6).toFixed(1)} MHz` : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Spreading Factor (SF)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                            {a.spreadingFactor !== null && a.spreadingFactor !== undefined ? `SF${a.spreadingFactor}` : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Data Rate (DR)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                            {a.dr !== null && a.dr !== undefined ? `DR${a.dr}` : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Bộ đếm khung (fcnt)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                            {a.fcnt ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Khu vực (Region)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                            {a.region ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Địa chỉ phiên (dev_addr)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5 truncate" title="Địa chỉ phiên tạm thời, không phải khóa chính thiết bị">
                            {a.devAddr ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Số seri đồng hồ (meter_sn)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5 truncate" title={a.meterSn ?? ''}>
                            {a.meterSn ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Tên thiết bị (friendly)</div>
                          <div className="font-mono text-xs font-semibold text-foreground mt-0.5 truncate" title={a.deviceName ?? ''}>
                            {a.deviceName ?? '—'}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
