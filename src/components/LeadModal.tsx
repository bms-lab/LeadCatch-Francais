import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Banknote, Calendar, FileText, Tag, Briefcase } from 'lucide-react';
import {
  Lead,
  LeadStatus,
  ServiceType,
  LeadSource,
  SERVICE_TYPES,
  LEAD_SOURCES,
  LEAD_STATUS_OPTIONS,
  SERVICE_LABELS,
  SOURCE_LABELS,
} from '../types';
import { addDaysISO, isValidEmail } from '../utils/formatters';

interface LeadModalProps {
  isOpen: boolean;
  leadToEdit: Lead | null;
  currencySymbol: string;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

const SERVICE_OPTIONS: readonly ServiceType[] = SERVICE_TYPES;
const SOURCE_OPTIONS: readonly LeadSource[] = LEAD_SOURCES;
const STATUS_OPTIONS = LEAD_STATUS_OPTIONS.map((o) =>
  o.value === 'won' ? { ...o, label: 'Gagné / Confirmé' } : o.value === 'lost' ? { ...o, label: 'Perdu / Clos' } : o
);

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  leadToEdit,
  currencySymbol,
  onClose,
  onSave,
}) => {
  const [contactName, setContactName] = useState('');
  const [businessOrProperty, setBusinessOrProperty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Cleaning');
  const [leadSource, setLeadSource] = useState<LeadSource>('WhatsApp');
  const [estimatedValue, setEstimatedValue] = useState<string>('0');
  const [actualWonRevenue, setActualWonRevenue] = useState<string>('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (leadToEdit) {
      setContactName(leadToEdit.contactName || '');
      setBusinessOrProperty(leadToEdit.businessOrProperty || '');
      setPhone(leadToEdit.phone || '');
      setEmail(leadToEdit.email || '');
      setServiceType(leadToEdit.serviceType || 'Cleaning');
      setLeadSource(leadToEdit.leadSource || 'WhatsApp');
      setEstimatedValue(leadToEdit.estimatedValue ? String(leadToEdit.estimatedValue) : '0');
      setActualWonRevenue(
        leadToEdit.actualWonRevenue !== undefined ? String(leadToEdit.actualWonRevenue) : ''
      );
      setStatus(leadToEdit.status || 'new');
      setNextFollowUpDate(leadToEdit.nextFollowUpDate || '');
      setNotes(leadToEdit.notes || '');
    } else {
      // Default for new lead
      setContactName('');
      setBusinessOrProperty('');
      setPhone('');
      setEmail('');
      setServiceType('Cleaning');
      setLeadSource('WhatsApp');
      setEstimatedValue('0');
      setActualWonRevenue('');
      setStatus('new');
      // Set default follow-up to tomorrow
      setNextFollowUpDate(addDaysISO(1));
      setNotes('');
    }
    setErrors({});
  }, [leadToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contactName.trim()) {
      newErrors.contactName = 'Le nom du contact est obligatoire.';
    }

    if (!phone.trim() && !email.trim()) {
      newErrors.contactInfo = 'Indiquez au moins un numéro de téléphone ou une adresse e-mail.';
    }

    if (email.trim() && !isValidEmail(email)) {
      newErrors.email = 'Indiquez une adresse e-mail valide.';
    }

    const valNum = parseFloat(estimatedValue);
    if (isNaN(valNum) || valNum < 0) {
      newErrors.estimatedValue = 'Le montant estimé doit être un nombre positif.';
    }

    if (status === 'won' && actualWonRevenue.trim()) {
      const wonNum = parseFloat(actualWonRevenue);
      if (isNaN(wonNum) || wonNum < 0) {
        newErrors.actualWonRevenue = 'Le montant final doit être un nombre positif.';
      }
    }

    if (!nextFollowUpDate) {
      newErrors.nextFollowUpDate = 'La date de prochaine relance est obligatoire.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const valNum = parseFloat(estimatedValue) || 0;
    const wonNum = actualWonRevenue.trim() ? parseFloat(actualWonRevenue) : (status === 'won' ? valNum : undefined);

    const savedLead: Lead = {
      id: leadToEdit ? leadToEdit.id : `lead-${Date.now()}`,
      contactName: contactName.trim(),
      businessOrProperty: businessOrProperty.trim(),
      phone: phone.trim(),
      email: email.trim(),
      serviceType,
      leadSource,
      estimatedValue: valNum,
      actualWonRevenue: status === 'won' ? wonNum : undefined,
      status,
      createdAt: leadToEdit ? leadToEdit.createdAt : new Date().toISOString(),
      nextFollowUpDate,
      notes: notes.trim(),
      quoteId: leadToEdit?.quoteId,
    };

    onSave(savedLead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {leadToEdit ? 'Modifier le prospect' : 'Nouveau prospect'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enregistrez les coordonnées, le type de travaux et planifiez vos relances.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {errors.contactInfo && (
            <div className="p-3 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              {errors.contactInfo}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nom du contact <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="ex. Salma Bennani"
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 ${
                  errors.contactName
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900 bg-white'
                }`}
              />
              {errors.contactName && (
                <p className="text-xs text-rose-600 mt-1">{errors.contactName}</p>
              )}
            </div>

            {/* Business or Property Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Adresse ou entreprise
              </label>
              <input
                type="text"
                value={businessOrProperty}
                onChange={(e) => setBusinessOrProperty(e.target.value)}
                placeholder="ex. Villa Les Palmiers, Casablanca"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex. 0661 23 45 67"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex. salma@example.com"
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900 bg-white'
                }`}
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Type de service
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {SERVICE_LABELS[opt]}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Source du contact
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {SOURCE_LABELS[opt]}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                Montant estimé ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono tabular-nums focus:outline-hidden focus:ring-2 ${
                  errors.estimatedValue
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900 bg-white'
                }`}
              />
              {errors.estimatedValue && (
                <p className="text-xs text-rose-600 mt-1">{errors.estimatedValue}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Follow-Up Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Prochaine relance <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 ${
                  errors.nextFollowUpDate
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900 bg-white'
                }`}
              />
              {errors.nextFollowUpDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.nextFollowUpDate}</p>
              )}
            </div>

            {/* Actual Won Revenue (if status is Won) */}
            {status === 'won' && (
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  Montant final du chantier ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={actualWonRevenue}
                  onChange={(e) => setActualWonRevenue(e.target.value)}
                  placeholder={estimatedValue || '0.00'}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 bg-emerald-50/20 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Laissez vide pour reprendre le montant estimé.
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes et détails du chantier
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex. Le client veut un devis pour la peinture intérieure avant le mois prochain. Préfère les rendez-vous le matin."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors cursor-pointer"
            >
              {leadToEdit ? 'Enregistrer les modifications' : 'Ajouter le prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
