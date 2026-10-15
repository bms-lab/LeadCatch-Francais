import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Edit2,
  Trash2,
  MessageSquare,
  Calendar,
  Search,
} from 'lucide-react';
import { Quote, QuoteStatus, BusinessProfile, Lead, QUOTE_STATUS_LABELS } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useMediaQuery } from '../utils/useMediaQuery';

interface QuotesViewProps {
  quotes: Quote[];
  leads: Lead[];
  profile: BusinessProfile;
  onOpenCreate: () => void;
  onOpenEdit: (quote: Quote) => void;
  onDeleteQuote: (quote: Quote) => void;
  onUpdateStatus: (quoteId: string, status: QuoteStatus) => void;
  onPrintPreview: (quote: Quote) => void;
  onFollowUpOnQuote: (quote: Quote) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  leads,
  profile,
  onOpenCreate,
  onOpenEdit,
  onDeleteQuote,
  onUpdateStatus,
  onPrintPreview,
  onFollowUpOnQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesNum = q.quoteNumber.toLowerCase().includes(query);
        const matchesCust = q.customerName.toLowerCase().includes(query);
        const matchesAddress = q.customerAddress.toLowerCase().includes(query);
        const matchesContact =
          q.customerEmail.toLowerCase().includes(query) || q.customerPhone.toLowerCase().includes(query);
        if (!matchesNum && !matchesCust && !matchesAddress && !matchesContact) return false;
      }

      if (statusFilter !== 'all' && q.status !== statusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [quotes, searchQuery, statusFilter]);

  // Aggregate metrics
  const totalQuotedValue = quotes.reduce((acc, q) => acc + q.total, 0);
  const pendingValue = quotes.filter((q) => q.status === 'sent').reduce((acc, q) => acc + q.total, 0);
  const acceptedValue = quotes.filter((q) => q.status === 'accepted').reduce((acc, q) => acc + q.total, 0);

  const statusColorClass = (status: QuoteStatus) => {
    switch (status) {
      case 'draft':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      case 'sent':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'accepted':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'declined':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const statusSelect = (q: Quote) => (
    <select
      value={q.status}
      onChange={(e) => onUpdateStatus(q.id, e.target.value as QuoteStatus)}
      aria-label={`Statut du devis ${q.quoteNumber}`}
      className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-hidden ${statusColorClass(
        q.status
      )}`}
    >
      <option value="draft">{QUOTE_STATUS_LABELS.draft}</option>
      <option value="sent">{QUOTE_STATUS_LABELS.sent}</option>
      <option value="accepted">{QUOTE_STATUS_LABELS.accepted}</option>
      <option value="declined">{QUOTE_STATUS_LABELS.declined}</option>
    </select>
  );

  const actionButtons = (q: Quote, size: 'sm' | 'lg') => {
    const pad = size === 'lg' ? 'p-2.5' : 'p-1.5';
    const icon = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPrintPreview(q)}
          className={`${pad} text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer`}
          title="Imprimer ou afficher le devis"
          aria-label={`Imprimer ${q.quoteNumber}`}
        >
          <Printer className={icon} />
        </button>
        <button
          onClick={() => onFollowUpOnQuote(q)}
          className={`${pad} text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer`}
          title="Préparer une relance pour ce devis"
          aria-label={`Relancer pour ${q.quoteNumber}`}
        >
          <MessageSquare className={icon} />
        </button>
        <button
          onClick={() => onOpenEdit(q)}
          className={`${pad} text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer`}
          title="Modifier le devis"
          aria-label={`Modifier ${q.quoteNumber}`}
        >
          <Edit2 className={icon} />
        </button>
        <button
          onClick={() => onDeleteQuote(q)}
          className={`${pad} text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer`}
          title="Supprimer le devis"
          aria-label={`Supprimer ${q.quoteNumber}`}
        >
          <Trash2 className={icon} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Devis</h1>
          <p className="text-sm text-slate-600 mt-1">
            Créez des devis détaillés, imprimez-les en PDF et suivez leur acceptation.
          </p>
        </div>
        <div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un devis</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            En attente de réponse
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-700 mt-1">
            {formatCurrency(pendingValue, profile.currencySymbol)}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {quotes.filter((q) => q.status === 'sent').length} devis chez les clients
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Acceptés / gagnés
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {formatCurrency(acceptedValue, profile.currencySymbol)}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {quotes.filter((q) => q.status === 'accepted').length} devis accepté{quotes.filter((q) => q.status === 'accepted').length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total des devis (toutes périodes)
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(totalQuotedValue, profile.currencySymbol)}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            Sur {quotes.length} devis créé{quotes.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="N° de devis, client, adresse…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-700"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé au client</option>
              <option value="accepted">Accepté</option>
              <option value="declined">Refusé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Aucun devis trouvé</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Essayez de modifier votre recherche ou le filtre de statut.'
              : 'Créez votre premier devis détaillé à remettre à un client.'}
          </p>
          <div className="mt-5">
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer mon premier devis</span>
            </button>
          </div>
        </div>
      ) : !isDesktop ? (
        <div className="space-y-3">
          {filteredQuotes.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono font-bold text-slate-900">{q.quoteNumber}</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{q.customerName}</div>
                  {q.customerAddress && <div className="text-xs text-slate-500 mt-0.5">{q.customerAddress}</div>}
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <div className="font-bold text-slate-900">{formatCurrency(q.total, profile.currencySymbol)}</div>
                  {q.taxPercent > 0 && <div className="text-[11px] text-slate-400">dont TVA {q.taxPercent} %</div>}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {q.items.length} {q.items.length === 1 ? 'ligne' : 'lignes'} · Émis le {formatDate(q.issueDate)} · Valable jusqu’au{' '}
                {formatDate(q.validUntilDate)}
              </div>
              <div>{statusSelect(q)}</div>
              <div className="pt-2 border-t border-slate-100">{actionButtons(q, 'lg')}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">N° de devis et date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Détail</th>
                  <th className="py-3 px-4 text-right">Montant total</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Quote # and Date */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-slate-900">{q.quoteNumber}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Émis le {formatDate(q.issueDate)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Valable jusqu’au {formatDate(q.validUntilDate)}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-900">{q.customerName}</div>
                      {q.customerAddress && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {q.customerAddress}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                        {q.customerPhone || q.customerEmail}
                      </div>
                    </td>

                    {/* Items preview */}
                    <td className="py-3.5 px-4 align-top text-xs text-slate-600">
                      <div className="font-medium text-slate-900">
                        {q.items.length} {q.items.length === 1 ? 'ligne' : 'lignes'}
                      </div>
                      <div className="text-slate-500 line-clamp-1 mt-0.5">
                        {q.items.map((i) => i.description).join(', ')}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900 text-base">
                        {formatCurrency(q.total, profile.currencySymbol)}
                      </div>
                      {q.taxPercent > 0 && (
                        <div className="text-[11px] text-slate-400">
                          dont TVA {q.taxPercent} %
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-top">{statusSelect(q)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex justify-end">{actionButtons(q, 'sm')}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
