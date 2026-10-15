import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  Mail,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  Lead,
  Quote,
  BusinessProfile,
  FollowUpTemplateKey,
  MessageLanguage,
  MESSAGE_LANGUAGES,
  LEAD_STATUS_LABELS,
  SERVICE_LABELS,
} from '../types';
import { TEMPLATE_KEYS, TEMPLATE_META, getTemplate, renderTemplate } from '../utils/templates';
import {
  getWhatsAppUrl,
  getMailtoUrl,
  formatDate,
  isOverdue,
  formatCurrency,
  addDaysISO,
} from '../utils/formatters';

interface FollowUpAssistantViewProps {
  leads: Lead[];
  quotes: Quote[];
  profile: BusinessProfile;
  initialLeadId?: string | null;
  onUpdateLeadFollowUp: (leadId: string, nextDate: string, newStatus?: any) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const FollowUpAssistantView: React.FC<FollowUpAssistantViewProps> = ({
  leads,
  quotes,
  profile,
  initialLeadId,
  onUpdateLeadFollowUp,
  onShowToast,
}) => {
  // Find lead: default to initialLeadId or first active lead
  const [selectedLeadId, setSelectedLeadId] = useState<string>(() => {
    if (initialLeadId && leads.some((l) => l.id === initialLeadId)) {
      return initialLeadId;
    }
    const dueFirst = leads.find((l) => l.status !== 'won' && l.status !== 'lost');
    return dueFirst?.id || leads[0]?.id || '';
  });

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<FollowUpTemplateKey>('friendly_reminder');
  const [language, setLanguage] = useState<MessageLanguage>(profile.messageLanguage || 'fr');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync when initialLeadId prop changes (and only then, so a manual choice is never overridden)
  useEffect(() => {
    if (initialLeadId && leads.some((l) => l.id === initialLeadId)) {
      setSelectedLeadId(initialLeadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLeadId]);

  // If the selected prospect was deleted elsewhere, fall back to the first one.
  useEffect(() => {
    if (leads.length > 0 && !leads.some((l) => l.id === selectedLeadId)) {
      setSelectedLeadId(leads.find((l) => l.status !== 'won' && l.status !== 'lost')?.id || leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const activeLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // Find linked quote if any
  const linkedQuote = useMemo(() => {
    if (!activeLead) return undefined;
    if (activeLead.quoteId) {
      return quotes.find((q) => q.id === activeLead.quoteId);
    }
    return quotes.find((q) => q.customerName.toLowerCase() === activeLead.contactName.toLowerCase());
  }, [activeLead, quotes]);

  // If activeLead has quote_sent status, auto-select quote_followup template
  useEffect(() => {
    if (activeLead?.status === 'quote_sent') {
      setSelectedTemplateKey('quote_followup');
    } else if (activeLead?.status === 'new') {
      setSelectedTemplateKey('first_touch');
    } else if (activeLead?.status === 'won') {
      setSelectedTemplateKey('won_welcome');
    }
  }, [activeLead?.id, activeLead?.status]);

  // Render template whenever template key, lead, or linked quote changes
  useEffect(() => {
    if (!activeLead) {
      setEditedSubject('');
      setEditedBody('');
      return;
    }

    const template = getTemplate(selectedTemplateKey, language);
    const rendered = renderTemplate(template, activeLead, profile, linkedQuote, language);
    setEditedSubject(rendered.subject);
    setEditedBody(rendered.body);
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateKey, language, activeLead?.id, linkedQuote?.id]);

  const handleCopy = async () => {
    if (!editedBody) return;
    try {
      await navigator.clipboard.writeText(editedBody);
      setCopied(true);
      onShowToast('Texte copié', 'Le message est copié, vous pouvez le coller.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Copie impossible', 'Sélectionnez le texte à la main.', 'error');
    }
  };

  const whatsAppUrl = activeLead?.phone
    ? getWhatsAppUrl(activeLead.phone, editedBody, profile.defaultCountryCode)
    : null;
  const mailtoUrl = activeLead?.email ? getMailtoUrl(activeLead.email, editedSubject, editedBody) : null;

  const handlePostpone = (days: number) => {
    if (!activeLead) return;
    const nextDate = addDaysISO(days);
    onUpdateLeadFollowUp(activeLead.id, nextDate);
    onShowToast(
      'Relance reportée',
      `Prochaine relance de ${activeLead.contactName} le ${formatDate(nextDate)}.`,
      'success'
    );
  };

  const handleMarkContacted = () => {
    if (!activeLead) return;
    const nextDate = addDaysISO(3);
    onUpdateLeadFollowUp(activeLead.id, nextDate, 'contacted');
    onShowToast(
      'Statut mis à jour',
      `${activeLead.contactName} est marqué « Contacté ». Prochaine relance dans 3 jours.`,
      'success'
    );
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Aucun prospect disponible</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Ajoutez au moins un prospect avant d’utiliser l’assistant de relance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assistant de relance</h1>
        <p className="text-sm text-slate-600 mt-1">
          Préparez un message adapté, copiez-le en un clic ou ouvrez directement WhatsApp ou votre messagerie.
        </p>
      </div>

      {/* Manual Reminder Advisory Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900 mb-0.5">Vous gardez le contrôle de chaque message</p>
          LeadCatch rédige un message personnalisé pour vous, mais{' '}
          <strong>n’envoie jamais rien tout seul</strong>. Lisez-le, modifiez-le si vous voulez, puis envoyez-le vous-même
          par WhatsApp, par e-mail ou en copiant le texte.
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lead Selector & Templates (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Lead Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Choisir le prospect / client
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium text-slate-900"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.contactName} — {SERVICE_LABELS[l.serviceType] ?? l.serviceType} ({(LEAD_STATUS_LABELS[l.status] ?? l.status).toLowerCase()})
                </option>
              ))}
            </select>

            {activeLead && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact :</span>
                  <span className="font-semibold text-slate-900">{activeLead.contactName}</span>
                </div>
                {activeLead.businessOrProperty && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Adresse :</span>
                    <span className="text-slate-700 line-clamp-1">{activeLead.businessOrProperty}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Téléphone :</span>
                  <span className="font-mono tabular-nums text-slate-800">
                    {activeLead.phone || 'Aucun numéro'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail :</span>
                  <span className="text-slate-800 truncate max-w-[180px]">
                    {activeLead.email || 'Aucune adresse'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant :</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatCurrency(activeLead.estimatedValue, profile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Relance prévue :</span>
                  <span
                    className={`font-mono tabular-nums font-medium ${
                      isOverdue(activeLead.nextFollowUpDate) ? 'text-rose-600 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {formatDate(activeLead.nextFollowUpDate)}{' '}
                    {isOverdue(activeLead.nextFollowUpDate) && '(en retard)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Template Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Choisir le type de message
            </label>
            <div className="space-y-1.5">
              {TEMPLATE_KEYS.map((key) => {
                const tpl = TEMPLATE_META[key];
                const isSelected = selectedTemplateKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{tpl.label}</span>
                    </div>
                    <p
                      className={`text-[11px] mt-1 leading-relaxed ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Editor, Preview & Dispatch (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Aperçu et personnalisation du message
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px] font-semibold" role="group" aria-label="Langue du message">
                {MESSAGE_LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLanguage(l.value)}
                    aria-pressed={language === l.value}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      language === l.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 -mt-2">Vous pouvez modifier librement le texte ci-dessous avant de l’envoyer.</p>

            {/* Subject Line for Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Objet :
              </label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Corps du message :
              </label>
              <textarea
                rows={9}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm font-sans leading-relaxed border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Action Buttons: Copy, WhatsApp, Mail */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Texte copié !' : 'Copier le texte'}</span>
              </button>

              {whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer sur WhatsApp</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <button
                  disabled
                  title="Ajoutez un numéro de téléphone valide à ce prospect pour ouvrir WhatsApp"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed border border-slate-200"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp (pas de numéro)</span>
                </button>
              )}

              {mailtoUrl ? (
                <a
                  href={mailtoUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Ouvrir la messagerie</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <button
                  disabled
                  title="Ajoutez une adresse e-mail valide à ce prospect pour ouvrir la messagerie"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed border border-slate-200"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail (pas d’adresse)</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Schedule Follow-up Actions */}
          {activeLead && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Actions rapides pour {activeLead.contactName}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkContacted}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Marquer comme contacté (+3 jours)
                </button>
                <button
                  type="button"
                  onClick={() => handlePostpone(2)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  +2 jours
                </button>
                <button
                  type="button"
                  onClick={() => handlePostpone(7)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  +1 semaine
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
