import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, FileText, User, MapPin, Phone, Mail, Hash } from 'lucide-react';
import { Quote, QuoteItem, Lead, BusinessProfile, QuoteStatus, SERVICE_LABELS } from '../types';
import { addDaysISO, formatCurrency, nextQuoteNumber, round2, toLocalISODate } from '../utils/formatters';

interface QuoteModalProps {
  isOpen: boolean;
  quoteToEdit: Quote | null;
  initialLead?: Lead | null;
  leads: Lead[];
  profile: BusinessProfile;
  existingQuoteNumbers: string[];
  onClose: () => void;
  onSave: (quote: Quote) => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  quoteToEdit,
  initialLead,
  leads,
  profile,
  existingQuoteNumbers,
  onClose,
  onSave,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [validUntilDate, setValidUntilDate] = useState('');
  const [status, setStatus] = useState<QuoteStatus>('draft');
  const [notes, setNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(profile.defaultTaxRate || 0);

  const [items, setItems] = useState<QuoteItem[]>([
    { id: 'item-1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // A primitive key: the numbers array is rebuilt on every parent render and would otherwise reset the form while typing.
  const numbersKey = existingQuoteNumbers.join('|');

  useEffect(() => {
    if (quoteToEdit) {
      setSelectedLeadId(quoteToEdit.leadId || '');
      setQuoteNumber(quoteToEdit.quoteNumber);
      setCustomerName(quoteToEdit.customerName);
      setCustomerEmail(quoteToEdit.customerEmail);
      setCustomerPhone(quoteToEdit.customerPhone);
      setCustomerAddress(quoteToEdit.customerAddress);
      setIssueDate(quoteToEdit.issueDate);
      setValidUntilDate(quoteToEdit.validUntilDate);
      setStatus(quoteToEdit.status);
      setNotes(quoteToEdit.notes);
      setDiscountPercent(quoteToEdit.discountPercent || 0);
      setTaxPercent(quoteToEdit.taxPercent || 0);
      setItems(
        quoteToEdit.items.length > 0
          ? quoteToEdit.items
          : [{ id: 'item-1', description: '', quantity: 1, unitPrice: 0, total: 0 }]
      );
    } else {
      const today = toLocalISODate();
      const validUntil = addDaysISO(30);
      const nextNum = nextQuoteNumber(numbersKey ? numbersKey.split('|') : []);

      setQuoteNumber(nextNum);
      setIssueDate(today);
      setValidUntilDate(validUntil);
      setStatus('draft');
      setNotes(profile.quoteTerms || '');
      setDiscountPercent(0);
      setTaxPercent(profile.defaultTaxRate || 0);

      if (initialLead) {
        setSelectedLeadId(initialLead.id);
        setCustomerName(initialLead.contactName);
        setCustomerEmail(initialLead.email);
        setCustomerPhone(initialLead.phone);
        setCustomerAddress(initialLead.businessOrProperty);
        setItems([
          {
            id: `item-${Date.now()}`,
            description: `Travaux de ${(SERVICE_LABELS[initialLead.serviceType] ?? initialLead.serviceType).toLowerCase()}`,
            quantity: 1,
            unitPrice: initialLead.estimatedValue || 0,
            total: initialLead.estimatedValue || 0,
          },
        ]);
      } else {
        setSelectedLeadId('');
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setCustomerAddress('');
        setItems([
          {
            id: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
        ]);
      }
    }
    setErrors({});
  }, [quoteToEdit, initialLead, isOpen, numbersKey, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setCustomerName(lead.contactName);
      setCustomerEmail(lead.email);
      setCustomerPhone(lead.phone);
      setCustomerAddress(lead.businessOrProperty);
      if (items.length === 1 && !items[0].description) {
        setItems([
          {
            id: items[0].id,
            description: `Travaux de ${(SERVICE_LABELS[lead.serviceType] ?? lead.serviceType).toLowerCase()}`,
            quantity: 1,
            unitPrice: lead.estimatedValue || 0,
            total: lead.estimatedValue || 0,
          },
        ]);
      }
    }
  };

  // Inputs keep the raw text while the user types (so "1." or an empty box works); numbers are parsed here.
  const num = (value: unknown) => {
    const n = parseFloat(String(value));
    return isFinite(n) ? n : 0;
  };
  const lineTotal = (item: QuoteItem) => round2(Math.max(0, num(item.quantity)) * Math.max(0, num(item.unitPrice)));

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      item.total = lineTotal(item);
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = round2(items.reduce((acc, curr) => acc + lineTotal(curr), 0));
  const discountAmount = round2((subtotal * (discountPercent || 0)) / 100);
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = round2((taxableBase * (taxPercent || 0)) / 100);
  const grandTotal = round2(taxableBase + taxAmount);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quoteNumber.trim()) {
      newErrors.quoteNumber = 'Le numéro de devis est obligatoire.';
    }

    if (!customerName.trim()) {
      newErrors.customerName = 'Le nom du client est obligatoire.';
    }

    if (!issueDate) {
      newErrors.issueDate = 'La date d’émission est obligatoire.';
    }

    if (!validUntilDate) {
      newErrors.validUntilDate = 'La date de validité est obligatoire.';
    }

    if (items.length === 0) {
      newErrors.items = 'Ajoutez au moins une ligne au devis.';
    } else {
      const hasEmptyDesc = items.some((item) => !item.description.trim());
      if (hasEmptyDesc) {
        newErrors.items = 'Chaque ligne doit avoir une description.';
      } else if (items.some((item) => !(num(item.quantity) > 0))) {
        newErrors.items = 'La quantité doit être supérieure à 0 sur chaque ligne.';
      } else if (items.some((item) => String(item.unitPrice).trim() === '' || num(item.unitPrice) < 0)) {
        newErrors.items = 'Le prix unitaire doit être de 0 ou plus sur chaque ligne.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const savedQuote: Quote = {
      id: quoteToEdit ? quoteToEdit.id : `quote-${Date.now()}`,
      quoteNumber: quoteNumber.trim(),
      leadId: selectedLeadId || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      issueDate,
      validUntilDate,
      items: items.map((item) => ({
        id: item.id,
        description: item.description.trim(),
        quantity: num(item.quantity),
        unitPrice: num(item.unitPrice),
        total: lineTotal(item),
      })),
      subtotal,
      discountPercent: Number(discountPercent) || 0,
      taxPercent: Number(taxPercent) || 0,
      total: grandTotal,
      status,
      notes: notes.trim(),
      createdAt: quoteToEdit ? quoteToEdit.createdAt : new Date().toISOString(),
    };

    onSave(savedQuote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {quoteToEdit ? 'Modifier le devis' : 'Nouveau devis'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Détaillez les travaux, appliquez une remise ou la TVA et imprimez un devis professionnel.
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
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {/* Quick Lead Autofill */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Remplir depuis un prospect :
            </span>
            <select
              value={selectedLeadId}
              onChange={(e) => handleSelectLeadChange(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800"
            >
              <option value="">— Saisie manuelle / aucun prospect lié —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.contactName} ({SERVICE_LABELS[l.serviceType] ?? l.serviceType}) — {formatCurrency(l.estimatedValue, profile.currencySymbol)}
                </option>
              ))}
            </select>
          </div>

          {/* Quote Meta & Customer Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                N° de devis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="LC-2026-001"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
              {errors.quoteNumber && <p className="text-xs text-rose-600 mt-1">{errors.quoteNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date d’émission <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Valable jusqu’au <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => setValidUntilDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nom du client <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ex. Salma Bennani"
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 ${
                  errors.customerName ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.customerName && <p className="text-xs text-rose-600 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Adresse du client / chantier
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="ex. Villa Les Palmiers, Casablanca"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Téléphone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="ex. 0661 23 45 67"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Adresse e-mail
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="ex. salma@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Détail des travaux et prestations
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une ligne
              </button>
            </div>

            {errors.items && <p className="text-xs text-rose-600">{errors.items}</p>}

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qté</th>
                    <th className="py-2.5 px-3 w-28 text-right">Prix unitaire ({profile.currencySymbol})</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="ex. Peinture intérieure, 2 couches + finitions"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center border border-slate-200 rounded-md font-mono tabular-nums focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-right border border-slate-200 rounded-md font-mono tabular-nums focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums font-semibold text-slate-800">
                        {formatCurrency(lineTotal(item), profile.currencySymbol)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-6 pt-2">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total :</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatCurrency(subtotal, profile.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 gap-2">
                  <span className="flex items-center gap-1">Remise (%) :</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-0.5 text-right border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-600 gap-2">
                  <span className="flex items-center gap-1">TVA (%) :</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-0.5 text-right border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Total à payer :</span>
                  <span className="font-mono tabular-nums text-base">
                    {formatCurrency(grandTotal, profile.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut du devis
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyé au client</option>
                <option value="accepted">Accepté / gagné</option>
                <option value="declined">Refusé</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Notes et conditions (affichées sur le devis imprimé)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions de paiement, garantie, délais…"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Actions */}
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
              {quoteToEdit ? 'Enregistrer les modifications' : 'Enregistrer le devis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
