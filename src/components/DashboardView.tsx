import React, { useMemo } from 'react';
import {
  Users,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Lead, Quote, BusinessProfile, LEAD_STATUS_LABELS, SERVICE_LABELS, SOURCE_LABELS } from '../types';
import { formatCurrency, formatDate, isOverdue, isDueToday } from '../utils/formatters';

interface DashboardViewProps {
  leads: Lead[];
  quotes: Quote[];
  profile: BusinessProfile;
  isDemo?: boolean;
  onStartFresh?: () => void;
  onNavigateToLeads: () => void;
  onNavigateToQuotes: () => void;
  onNavigateToFollowUps: (leadId?: string) => void;
  onOpenCreateLead: () => void;
  onOpenCreateQuote: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  quotes,
  profile,
  isDemo = false,
  onStartFresh,
  onNavigateToLeads,
  onNavigateToQuotes,
  onNavigateToFollowUps,
  onOpenCreateLead,
  onOpenCreateQuote,
}) => {
  // Aggregate Metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const quotesAwaitingResponse = quotes.filter((q) => q.status === 'sent').length;
  const wonOpportunities = leads.filter((l) => l.status === 'won').length;

  // Revenue distinctions:
  // Estimated Pipeline Value = sum of estimated values of all active leads (not won and not lost)
  const activePipelineValue = useMemo(() => {
    return leads
      .filter((l) => l.status !== 'won' && l.status !== 'lost')
      .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  }, [leads]);

  // Actual Won Revenue = sum of actualWonRevenue (or estimatedValue if actual won was not overridden) for won leads
  const actualWonRevenue = useMemo(() => {
    return leads
      .filter((l) => l.status === 'won')
      .reduce((acc, curr) => acc + (curr.actualWonRevenue ?? curr.estimatedValue ?? 0), 0);
  }, [leads]);

  // Upcoming & Overdue follow-ups
  const actionableFollowUps = useMemo(() => {
    return leads
      .filter((l) => l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate))
      .slice(0, 6);
  }, [leads]);

  const recentLeads = useMemo(
    () => [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [leads]
  );

  const overdueCount = leads.filter(
    (l) => l.status !== 'won' && l.status !== 'lost' && isOverdue(l.nextFollowUpDate)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {profile.ownerName ? `Bon retour, ${profile.ownerName}` : 'Bienvenue sur LeadCatch'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {profile.businessName ? (
              <>
                Vue d’ensemble de votre activité pour{' '}
                <strong className="text-slate-800">{profile.businessName}</strong>.
              </>
            ) : (
              'Vue d’ensemble de votre activité.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            onClick={onOpenCreateLead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un prospect</span>
          </button>
          <button
            onClick={onOpenCreateQuote}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileCheck className="w-4 h-4 text-slate-600" />
            <span>Nouveau devis</span>
          </button>
        </div>
      </div>

      {/* Sample-data banner: shown only while the built-in demo records are loaded */}
      {isDemo && (
        <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-slate-800 text-[#B7F34A] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Vous consultez des données d’exemple</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Explorez le tableau de bord, les devis et les messages de relance avec ces exemples. Quand vous êtes
                prêt, supprimez-les et saisissez votre propre activité — vos données restent sur cet appareil.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={onStartFresh}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-[#B7F34A] hover:bg-[#a6e63a] rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <span>Je commence avec mes données</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overdue Alert Bar if any */}
      {overdueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Vous avez {overdueCount} {overdueCount === 1 ? 'relance en retard' : 'relances en retard'}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Une réponse rapide garde la conversation vivante — commencez par la plus ancienne.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToFollowUps()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-200/80 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>Voir les retards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pipeline estimé
            </span>
            <span className="text-xs font-medium text-slate-400">Potentiel</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatCurrency(activePipelineValue, profile.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sur {leads.filter((l) => l.status !== 'won' && l.status !== 'lost').length} opportunités en cours
          </p>
        </div>

        {/* Actual Won Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Chiffre d’affaires gagné
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Conclu
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {formatCurrency(actualWonRevenue, profile.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Travaux réellement confirmés ({wonOpportunities} gagné{wonOpportunities > 1 ? 's' : ''})
          </p>
        </div>

        {/* Quotes Awaiting Response */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Devis en attente de réponse
            </span>
            <FileCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-700 mt-2">
            {quotesAwaitingResponse}
          </div>
          <button
            onClick={onNavigateToQuotes}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir les devis en attente</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Inquiries & New */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total des demandes
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {totalLeads}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <strong className="text-blue-700 font-semibold">{newLeads} nouvelle{newLeads > 1 ? 's' : ''}</strong> en attente du premier contact
          </p>
        </div>
      </div>

      {/* Revenue Distinction Clarification Card */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              À savoir sur les montants
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              <strong>Le pipeline estimé ({formatCurrency(activePipelineValue, profile.currencySymbol)})</strong> correspond aux travaux possibles, pas encore confirmés. 
              <strong> Le chiffre d’affaires gagné ({formatCurrency(actualWonRevenue, profile.currencySymbol)})</strong> correspond aux chantiers dont le devis a été accepté.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNavigateToLeads}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Gérer les prospects
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Upcoming Follow-ups & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Upcoming & Due Follow-ups */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Relances à venir et à faire</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prospects à recontacter, par ordre de priorité
              </p>
            </div>
            <button
              onClick={() => onNavigateToFollowUps()}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {actionableFollowUps.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucune relance prévue pour le moment.
              </div>
            ) : (
              actionableFollowUps.map((lead) => {
                const overdue = isOverdue(lead.nextFollowUpDate);
                const dueToday = isDueToday(lead.nextFollowUpDate);

                return (
                  <div
                    key={lead.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {lead.contactName}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                          · {SERVICE_LABELS[lead.serviceType] ?? lead.serviceType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono tabular-nums">
                        <span>{formatCurrency(lead.estimatedValue, profile.currencySymbol)}</span>
                        <span>·</span>
                        <span
                          className={`font-medium ${
                            overdue ? 'text-rose-600 font-semibold' : dueToday ? 'text-amber-600 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {overdue ? 'En retard : ' : dueToday ? 'Aujourd’hui : ' : 'Prévu le : '}
                          {formatDate(lead.nextFollowUpDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onNavigateToFollowUps(lead.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        aria-label={`Relancer ${lead.contactName}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recent Leads Pipeline Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Demandes récentes</h2>
              <p className="text-xs text-slate-500 mt-0.5">Derniers prospects enregistrés</p>
            </div>
            <button
              onClick={onNavigateToLeads}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Tout voir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {lead.contactName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{SERVICE_LABELS[lead.serviceType] ?? lead.serviceType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{SOURCE_LABELS[lead.leadSource] ?? lead.leadSource}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono tabular-nums font-semibold text-sm text-slate-900">
                    {formatCurrency(lead.estimatedValue, profile.currencySymbol)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mt-0.5">
                    {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
