import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  MessageCircle,
  FileCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  Lead,
  LeadStatus,
  SERVICE_TYPES,
  LEAD_SOURCES,
  LEAD_STATUS_OPTIONS,
  SERVICE_LABELS,
  SOURCE_LABELS,
} from '../types';
import {
  formatCurrency,
  formatDate,
  isOverdue,
  isDueToday,
  getWhatsAppUrl,
  toInternationalDigits,
} from '../utils/formatters';
import { useMediaQuery } from '../utils/useMediaQuery';

interface LeadsViewProps {
  leads: Lead[];
  currencySymbol: string;
  defaultCountryCode?: string;
  onOpenCreate: () => void;
  onOpenEdit: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onStartFollowUp: (lead: Lead) => void;
  onCreateQuoteForLead: (lead: Lead) => void;
}

const isClosed = (lead: Lead) => lead.status === 'won' || lead.status === 'lost';

const statusColorClass = (status: LeadStatus) => {
  switch (status) {
    case 'new':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'contacted':
      return 'text-slate-700 bg-slate-100 border-slate-200';
    case 'quote_sent':
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'followup_due':
      return 'text-amber-800 bg-amber-50 border-amber-200';
    case 'won':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'lost':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  currencySymbol,
  defaultCountryCode = '212',
  onOpenCreate,
  onOpenEdit,
  onDeleteLead,
  onUpdateStatus,
  onStartFollowUp,
  onCreateQuoteForLead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'followup' | 'value' | 'created'>('followup');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    // Typing digits finds a number whatever spacing it was saved with ("0661 23 45 67" vs "0661234567").
    const queryDigits = query.replace(/\D/g, '');

    return leads
      .filter((lead) => {
        if (query) {
          const matchesText =
            lead.contactName.toLowerCase().includes(query) ||
            lead.businessOrProperty.toLowerCase().includes(query) ||
            lead.phone.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query) ||
            lead.notes.toLowerCase().includes(query);
          const matchesDigits =
            queryDigits.length >= 3 && lead.phone.replace(/\D/g, '').includes(queryDigits);
          if (!matchesText && !matchesDigits) return false;
        }

        if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
        if (serviceFilter !== 'all' && lead.serviceType !== serviceFilter) return false;
        if (sourceFilter !== 'all' && lead.leadSource !== sourceFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'followup') {
          // Open leads first (soonest follow-up on top); finished ones sink to the bottom.
          if (isClosed(a) !== isClosed(b)) return isClosed(a) ? 1 : -1;
          return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
        }
        if (sortBy === 'value') {
          return b.estimatedValue - a.estimatedValue;
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [leads, searchQuery, statusFilter, serviceFilter, sourceFilter, sortBy]);

  const filtersActive =
    statusFilter !== 'all' || serviceFilter !== 'all' || sourceFilter !== 'all' || searchQuery !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setServiceFilter('all');
    setSourceFilter('all');
  };

  const followUpFlags = (lead: Lead) => {
    const open = !isClosed(lead);
    return {
      overdue: open && isOverdue(lead.nextFollowUpDate),
      dueToday: open && isDueToday(lead.nextFollowUpDate),
    };
  };

  const statusSelect = (lead: Lead) => (
    <select
      value={lead.status}
      onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
      aria-label={`Statut de ${lead.contactName}`}
      className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-hidden ${statusColorClass(
        lead.status
      )}`}
    >
      {LEAD_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const actionButtons = (lead: Lead, size: 'sm' | 'lg') => {
    const pad = size === 'lg' ? 'p-2.5' : 'p-1.5';
    const icon = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    const whatsAppUrl = lead.phone ? getWhatsAppUrl(lead.phone, '', defaultCountryCode) : null;
    const callDigits = lead.phone ? toInternationalDigits(lead.phone, defaultCountryCode) : null;
    const base = `${pad} rounded-md transition-colors cursor-pointer`;
    return (
      <div className="flex items-center gap-1">
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${base} text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50`}
            title="Ouvrir la discussion WhatsApp"
            aria-label={`WhatsApp ${lead.contactName}`}
          >
            <MessageCircle className={icon} />
          </a>
        )}
        {callDigits && (
          <a
            href={`tel:+${callDigits}`}
            className={`${base} text-slate-500 hover:text-slate-900 hover:bg-slate-100`}
            title="Appeler"
            aria-label={`Appeler ${lead.contactName}`}
          >
            <Phone className={icon} />
          </a>
        )}
        <button
          onClick={() => onStartFollowUp(lead)}
          className={`${base} text-slate-500 hover:text-slate-900 hover:bg-slate-100`}
          title="Préparer un message de relance"
          aria-label={`Relancer ${lead.contactName}`}
        >
          <MessageSquare className={icon} />
        </button>
        <button
          onClick={() => onCreateQuoteForLead(lead)}
          className={`${base} text-slate-500 hover:text-slate-900 hover:bg-slate-100`}
          title="Créer un devis pour ce prospect"
          aria-label={`Créer un devis pour ${lead.contactName}`}
        >
          <FileCheck className={icon} />
        </button>
        <button
          onClick={() => onOpenEdit(lead)}
          className={`${base} text-slate-500 hover:text-slate-900 hover:bg-slate-100`}
          title="Modifier ce prospect"
          aria-label={`Modifier ${lead.contactName}`}
        >
          <Edit2 className={icon} />
        </button>
        <button
          onClick={() => onDeleteLead(lead)}
          className={`${base} text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
          title="Supprimer ce prospect"
          aria-label={`Supprimer ${lead.contactName}`}
        >
          <Trash2 className={icon} />
        </button>
      </div>
    );
  };

  const selectClass =
    'px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-700 min-w-0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prospects et demandes</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gardez toutes vos demandes au même endroit, suivez leur avancement et n’oubliez plus aucune relance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un prospect</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, téléphone, adresse…"
              aria-label="Rechercher un prospect"
              className="w-full pl-9 pr-14 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className={selectClass}>
              <option value="all">Tous les statuts</option>
              {LEAD_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} aria-label="Filtrer par service" className={selectClass}>
              <option value="all">Tous les services</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </select>

            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Filtrer par source" className={selectClass}>
              <option value="all">Toutes les sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'followup' | 'value' | 'created')}
              aria-label="Trier les prospects"
              className={selectClass}
            >
              <option value="followup">Tri : date de relance</option>
              <option value="value">Tri : montant le plus élevé</option>
              <option value="created">Tri : ajoutés récemment</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span>
              {filteredLeads.length} sur {leads.length} prospect{leads.length > 1 ? 's' : ''} affiché{filteredLeads.length > 1 ? 's' : ''}
            </span>
            {filtersActive && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  onClick={resetFilters}
                  className="text-slate-700 hover:text-slate-900 underline font-medium cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leads */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Aucun prospect trouvé</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {filtersActive
              ? 'Essayez de modifier votre recherche ou vos filtres.'
              : 'Ajoutez vos premières demandes pour suivre vos clients et planifier vos relances.'}
          </p>
          <div className="mt-5">
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter mon premier prospect</span>
            </button>
          </div>
        </div>
      ) : !isDesktop ? (
        /* Phone layout: one card per lead */
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const { overdue, dueToday } = followUpFlags(lead);
            return (
              <div key={lead.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{lead.contactName}</div>
                    {lead.businessOrProperty && (
                      <div className="text-xs text-slate-500 mt-0.5">{lead.businessOrProperty}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {SERVICE_LABELS[lead.serviceType] ?? lead.serviceType} · {SOURCE_LABELS[lead.leadSource] ?? lead.leadSource}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-semibold text-sm text-slate-900">
                      {formatCurrency(lead.estimatedValue, currencySymbol)}
                    </div>
                    {lead.status === 'won' && lead.actualWonRevenue !== undefined && (
                      <div className="text-xs text-emerald-700 font-medium mt-0.5">
                        Gagné : {formatCurrency(lead.actualWonRevenue, currencySymbol)}
                      </div>
                    )}
                  </div>
                </div>

                {lead.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono tabular-nums">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {lead.phone}
                  </div>
                )}

                {lead.notes && (
                  <div className="text-xs text-slate-500 italic line-clamp-2">“{lead.notes}”</div>
                )}

                <div className="flex items-center justify-between gap-3">
                  {statusSelect(lead)}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-mono tabular-nums text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(lead.nextFollowUpDate)}
                    </div>
                    {overdue && <span className="text-[11px] font-semibold text-rose-600 block">En retard</span>}
                    {dueToday && <span className="text-[11px] font-semibold text-amber-600 block">Aujourd’hui</span>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">{actionButtons(lead, 'lg')}</div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop layout: dense table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Contact et adresse</th>
                  <th className="py-3 px-4">Service et source</th>
                  <th className="py-3 px-4 text-right">Montant estimé</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Prochaine relance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const { overdue, dueToday } = followUpFlags(lead);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Contact & Property */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">{lead.contactName}</div>
                        {lead.businessOrProperty && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {lead.businessOrProperty}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          {lead.phone && (
                            <span className="flex items-center gap-1 font-mono tabular-nums whitespace-nowrap">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{lead.email}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service & Source */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-900 font-medium">{SERVICE_LABELS[lead.serviceType] ?? lead.serviceType}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{SOURCE_LABELS[lead.leadSource] ?? lead.leadSource}</span>
                          <span aria-hidden="true">·</span>
                          <span>Ajouté le {formatDate(lead.createdAt)}</span>
                        </div>
                        {lead.notes && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1 italic">“{lead.notes}”</div>
                        )}
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums">
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(lead.estimatedValue, currencySymbol)}
                        </div>
                        {lead.status === 'won' && lead.actualWonRevenue !== undefined && (
                          <div className="text-xs text-emerald-700 font-medium mt-0.5">
                            Gagné : {formatCurrency(lead.actualWonRevenue, currencySymbol)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">{statusSelect(lead)}</td>

                      {/* Next Follow-Up */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-mono tabular-nums text-slate-700">
                            {formatDate(lead.nextFollowUpDate)}
                          </span>
                        </div>
                        {overdue && (
                          <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">En retard</span>
                        )}
                        {dueToday && (
                          <span className="text-[11px] font-semibold text-amber-600 block mt-0.5">Aujourd’hui</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex justify-end">{actionButtons(lead, 'sm')}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
