import React, { useState, useMemo } from 'react';
import { Lead, Quote, BusinessProfile, LeadStatus, SERVICE_LABELS, SOURCE_LABELS, ServiceType, LeadSource } from '../types';
import { formatCurrency, safeDiv, isOverdue } from '../utils/formatters';

interface ReportsViewProps {
  leads: Lead[];
  quotes: Quote[];
  profile: BusinessProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  leads,
  quotes,
  profile,
}) => {
  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d' | 'year'>('all');

  const filteredLeads = useMemo(() => {
    if (dateRange === 'all') return leads;

    const now = Date.now();
    let daysCutoff = 365;
    if (dateRange === '30d') daysCutoff = 30;
    if (dateRange === '90d') daysCutoff = 90;

    const cutoffTime = now - daysCutoff * 86400000;

    return leads.filter((l) => {
      try {
        const time = new Date(l.createdAt).getTime();
        return time >= cutoffTime;
      } catch {
        return true;
      }
    });
  }, [leads, dateRange]);

  // Total Leads & Conversion Rates
  const totalLeadsCount = filteredLeads.length;
  const wonCount = filteredLeads.filter((l) => l.status === 'won').length;
  const lostCount = filteredLeads.filter((l) => l.status === 'lost').length;
  const closedCount = wonCount + lostCount;

  // Conversion rate of closed deals (won / closed * 100), safe against division by zero
  const closedConversionRate = safeDiv(wonCount, closedCount);

  // Financial Metrics
  const activePipelineValue = filteredLeads
    .filter((l) => l.status !== 'won' && l.status !== 'lost')
    .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

  const wonRevenue = filteredLeads
    .filter((l) => l.status === 'won')
    .reduce((acc, curr) => acc + (curr.actualWonRevenue ?? curr.estimatedValue ?? 0), 0);

  const averageWonDealSize = wonCount > 0 ? wonRevenue / wonCount : 0;

  // Overdue follow-ups
  const overdueCount = filteredLeads.filter(
    (l) => l.status !== 'won' && l.status !== 'lost' && isOverdue(l.nextFollowUpDate)
  ).length;

  // Breakdown by Service Type
  const serviceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalValue: number; wonCount: number }> = {};
    filteredLeads.forEach((l) => {
      if (!map[l.serviceType]) {
        map[l.serviceType] = { count: 0, totalValue: 0, wonCount: 0 };
      }
      map[l.serviceType].count += 1;
      map[l.serviceType].totalValue += l.estimatedValue || 0;
      if (l.status === 'won') {
        map[l.serviceType].wonCount += 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].totalValue - a[1].totalValue);
  }, [filteredLeads]);

  // Breakdown by Lead Source
  const sourceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalValue: number; wonCount: number }> = {};
    filteredLeads.forEach((l) => {
      if (!map[l.leadSource]) {
        map[l.leadSource] = { count: 0, totalValue: 0, wonCount: 0 };
      }
      map[l.leadSource].count += 1;
      map[l.leadSource].totalValue += l.estimatedValue || 0;
      if (l.status === 'won') {
        map[l.leadSource].wonCount += 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [filteredLeads]);

  // Breakdown by Status
  const statusCounts: Record<LeadStatus, number> = {
    new: filteredLeads.filter((l) => l.status === 'new').length,
    contacted: filteredLeads.filter((l) => l.status === 'contacted').length,
    quote_sent: filteredLeads.filter((l) => l.status === 'quote_sent').length,
    followup_due: filteredLeads.filter((l) => l.status === 'followup_due').length,
    won: wonCount,
    lost: lostCount,
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Statistiques de votre activité
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Taux de réussite, chiffre d’affaires et canaux qui vous apportent des clients.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-semibold self-start">
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              dateRange === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              dateRange === '30d'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 derniers jours
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              dateRange === '90d'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90 derniers jours
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              dateRange === 'year'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            12 derniers mois
          </button>
        </div>
      </div>

      {/* Primary Conversion & Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win / Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Taux de réussite
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {closedConversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {wonCount} gagné{wonCount > 1 ? 's' : ''} sur {closedCount} décision{closedCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Realized Won Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Chiffre d’affaires gagné
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {formatCurrency(wonRevenue, profile.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Montant moyen : {formatCurrency(averageWonDealSize, profile.currencySymbol)}
          </p>
        </div>

        {/* Active Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Prospects en cours
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatCurrency(activePipelineValue, profile.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Travaux en attente d’une décision ou d’un devis
          </p>
        </div>

        {/* Overdue Follow-ups */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Relances en retard
          </span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-2 ${
              overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {overdueCount === 0 ? 'Toutes vos relances sont à jour' : 'Prospects dont la relance est dépassée'}
          </p>
        </div>
      </div>

      {/* Status Funnel Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Répartition des prospects par statut</h2>
          <span className="text-xs text-slate-500">{totalLeadsCount} prospect{totalLeadsCount > 1 ? 's' : ''} au total</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'new', label: 'Nouvelle demande', count: statusCounts.new, color: 'bg-blue-500' },
            { key: 'contacted', label: 'Contacté', count: statusCounts.contacted, color: 'bg-slate-400' },
            { key: 'quote_sent', label: 'Devis envoyé', count: statusCounts.quote_sent, color: 'bg-indigo-500' },
            { key: 'followup_due', label: 'À relancer', count: statusCounts.followup_due, color: 'bg-amber-500' },
            { key: 'won', label: 'Gagné / confirmé', count: statusCounts.won, color: 'bg-emerald-500' },
            { key: 'lost', label: 'Perdu / clos', count: statusCounts.lost, color: 'bg-rose-500' },
          ].map((item) => {
            const pct = safeDiv(item.count, totalLeadsCount);
            return (
              <div key={item.key} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 truncate">{item.label}</div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {item.count}
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                  {pct.toFixed(0)} % du total
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Breakdown: Services & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Type Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Résultats par type de service</h2>
          {serviceBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune donnée de service pour cette période.</p>
          ) : (
            <div className="space-y-3">
              {serviceBreakdown.map(([serviceName, data]) => {
                const pctOfTotalValue = safeDiv(
                  data.totalValue,
                  filteredLeads.reduce((a, b) => a + (b.estimatedValue || 0), 0)
                );
                return (
                  <div key={serviceName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{SERVICE_LABELS[serviceName as ServiceType] ?? serviceName}</span>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-slate-600">
                        <span>{data.count} {data.count === 1 ? 'chantier' : 'chantiers'} ({data.wonCount} gagné{data.wonCount > 1 ? 's' : ''})</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(data.totalValue, profile.currencySymbol)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-800 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(4, pctOfTotalValue))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">D’où viennent vos clients</h2>
          {sourceBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune donnée de source pour cette période.</p>
          ) : (
            <div className="space-y-3">
              {sourceBreakdown.map(([sourceName, data]) => {
                const pctOfLeads = safeDiv(data.count, totalLeadsCount);
                return (
                  <div key={sourceName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{SOURCE_LABELS[sourceName as LeadSource] ?? sourceName}</span>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-slate-600">
                        <span>{data.wonCount} gagné{data.wonCount > 1 ? 's' : ''} sur {data.count}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(data.totalValue, profile.currencySymbol)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(4, pctOfLeads))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
