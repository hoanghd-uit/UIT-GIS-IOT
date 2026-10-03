'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTimeRangePreset,
  AlertSeverityFilter,
  AlertSortOrder,
  DashboardAlertEvaluationStatusResponse,
} from '@/types/dashboard-alerts';
import { fetchAlertEvaluationStatus } from '@/lib/dashboard/alert-status-api';
import {
  DEMO_ALERT_EVENTS,
  ALERT_REFERENCE_INSTANT,
} from '@/lib/dashboard/alert-demo-fixtures';
import {
  filterAlertEvents,
  sortAlertEvents,
  getAlertKpis,
  get14DayEventHistory,
  getHandlingEfficiencyMetrics,
} from '@/lib/dashboard/alert-demo-selectors';
import { AlertCenterPageHeader } from './AlertCenterPageHeader';
import { AlertEngineStatusNotice } from './AlertEngineStatusNotice';
import { AlertCenterKpiStrip } from './AlertCenterKpiStrip';
import { DemoAlertList } from './DemoAlertList';
import { DemoAlertDetail } from './DemoAlertDetail';
import { DemoAlertHistoryChart } from './DemoAlertHistoryChart';
import { DemoAlertEfficiency } from './DemoAlertEfficiency';
import { DemoAlertRulesTable } from './DemoAlertRulesTable';

export function AlertCenterDashboard() {
  // Engine read-only status state
  const [engineStatus, setEngineStatus] =
    useState<DashboardAlertEvaluationStatusResponse | null>(null);
  const [statusState, setStatusState] = useState<
    'idle' | 'loading' | 'ready' | 'unavailable' | 'error'
  >('idle');

  // Local demo interactive filters
  const [preset, setPreset] = useState<AlertTimeRangePreset>('7d');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<AlertSortOrder>('newest');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('DEMO-ALT-001');

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch initial read-only evaluation status from backend
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatusState('loading');

    fetchAlertEvaluationStatus({ signal: controller.signal })
      .then((res) => {
        if (res.success) {
          setEngineStatus(res.data);
          setStatusState('ready');
        } else {
          setStatusState(res.error.isUnavailable ? 'unavailable' : 'error');
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setStatusState('error');
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Compute filtered & sorted demo events
  const filteredEvents = useMemo(() => {
    return filterAlertEvents(DEMO_ALERT_EVENTS, {
      range: preset,
      severity: severityFilter,
      searchQuery,
      referenceInstant: ALERT_REFERENCE_INSTANT,
    });
  }, [preset, severityFilter, searchQuery]);

  const sortedEvents = useMemo(() => {
    return sortAlertEvents(filteredEvents, sortOrder);
  }, [filteredEvents, sortOrder]);

  // Derive counts for tabs (based on range and search query, across all severities)
  const countsBySeverity = useMemo(() => {
    const baseInWindow = filterAlertEvents(DEMO_ALERT_EVENTS, {
      range: preset,
      severity: 'all',
      searchQuery,
      referenceInstant: ALERT_REFERENCE_INSTANT,
    });

    return {
      all: baseInWindow.length,
      danger: baseInWindow.filter((e) => e.severity === 'danger').length,
      warning: baseInWindow.filter((e) => e.severity === 'warning').length,
      info: baseInWindow.filter((e) => e.severity === 'info').length,
    };
  }, [preset, searchQuery]);

  // Derive KPI strip metrics
  const kpis = useMemo(() => {
    return getAlertKpis(filteredEvents, DEMO_ALERT_EVENTS, ALERT_REFERENCE_INSTANT);
  }, [filteredEvents]);

  // Derive 14-day history chart items
  const historyItems = useMemo(() => {
    return get14DayEventHistory(DEMO_ALERT_EVENTS, ALERT_REFERENCE_INSTANT);
  }, []);

  // Derive handling efficiency
  const efficiency = useMemo(() => {
    return getHandlingEfficiencyMetrics(DEMO_ALERT_EVENTS);
  }, []);

  // Selected alert item
  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return DEMO_ALERT_EVENTS.find((e) => e.alertId === selectedAlertId) ?? null;
  }, [selectedAlertId]);

  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto animate-fade-in">
      {/* Aligned Page Header */}
      <AlertCenterPageHeader
        activePreset={preset}
        onPresetChange={(newPreset) => setPreset(newPreset)}
        onSearchClick={handleSearchFocus}
      />

      {/* Engine Status & Blockers Notice */}
      <AlertEngineStatusNotice
        statusData={engineStatus}
        statusState={statusState}
      />

      {/* 5-Card KPI Strip */}
      <AlertCenterKpiStrip kpis={kpis} activePreset={preset} />

      {/* Primary Row: Alert List (~8/12) + Detail View (~4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <DemoAlertList
            ref={searchInputRef}
            events={sortedEvents}
            selectedAlertId={selectedAlertId}
            onSelectAlert={(id) => setSelectedAlertId(id)}
            severityFilter={severityFilter}
            onSeverityFilterChange={(sev) => setSeverityFilter(sev)}
            searchQuery={searchQuery}
            onSearchQueryChange={(q) => setSearchQuery(q)}
            sortOrder={sortOrder}
            onSortOrderChange={(ord) => setSortOrder(ord)}
            countsBySeverity={countsBySeverity}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <DemoAlertDetail alert={selectedAlert} className="h-full" />
        </div>
      </div>

      {/* Secondary Row: 14-Day History (Left) + Efficiency (Center) + Rules Table (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full items-stretch">
        <DemoAlertHistoryChart historyItems={historyItems} className="h-full" />
        <DemoAlertEfficiency efficiency={efficiency} className="h-full" />
        <DemoAlertRulesTable
          authoritativeRuleCount={engineStatus?.capabilities?.authoritativeRuleCount ?? 0}
          className="h-full"
        />
      </div>
    </div>
  );
}
