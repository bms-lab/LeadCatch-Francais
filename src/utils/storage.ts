import { AppDataPayload, BusinessProfile, Lead, LeadSource, LeadStatus, Quote, ServiceType } from '../types';
import { LEAD_SOURCES, SERVICE_TYPES } from '../types';
import { BLANK_BUSINESS_PROFILE, getBlankData, getInitialDemoData } from './demoData';
import { addDaysISO, round2, toLocalISODate } from './formatters';

const STORAGE_KEY = 'leadcatch_app_data_v1';
const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'quote_sent', 'followup_due', 'won', 'lost'];

export function loadAppData(): AppDataPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDemoData();
      saveAppData(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    return sanitizePayload(parsed);
  } catch (error) {
    console.error('LeadCatch storage load error, resetting to fallback safe state:', error);
    const fallback = getInitialDemoData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // Ignore write errors in restricted contexts
    }
    return fallback;
  }
}

export function saveAppData(data: AppDataPayload): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('LeadCatch failed to save to localStorage:', error);
    return false;
  }
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return isFinite(n) ? n : undefined;
}

export function sanitizePayload(raw: any): AppDataPayload {
  const rp = raw?.profile;
  const profile: BusinessProfile = {
    businessName: str(rp?.businessName, BLANK_BUSINESS_PROFILE.businessName),
    ownerName: str(rp?.ownerName, BLANK_BUSINESS_PROFILE.ownerName),
    email: str(rp?.email, BLANK_BUSINESS_PROFILE.email),
    phone: str(rp?.phone, BLANK_BUSINESS_PROFILE.phone),
    address: str(rp?.address, BLANK_BUSINESS_PROFILE.address),
    currency: str(rp?.currency, BLANK_BUSINESS_PROFILE.currency),
    currencySymbol: str(rp?.currencySymbol, BLANK_BUSINESS_PROFILE.currencySymbol),
    defaultTaxRate:
      typeof rp?.defaultTaxRate === 'number' && isFinite(rp.defaultTaxRate)
        ? Math.max(0, rp.defaultTaxRate)
        : BLANK_BUSINESS_PROFILE.defaultTaxRate,
    quoteTerms: str(rp?.quoteTerms, BLANK_BUSINESS_PROFILE.quoteTerms),
    // Backups made before these settings existed fall back to the Moroccan defaults.
    defaultCountryCode:
      typeof rp?.defaultCountryCode === 'string' && rp.defaultCountryCode.replace(/\D/g, '')
        ? rp.defaultCountryCode.replace(/\D/g, '')
        : BLANK_BUSINESS_PROFILE.defaultCountryCode,
    messageLanguage: ['en', 'fr', 'darija'].includes(rp?.messageLanguage)
      ? rp.messageLanguage
      : BLANK_BUSINESS_PROFILE.messageLanguage,
  };

  const today = toLocalISODate();

  const leads: Lead[] = Array.isArray(raw?.leads)
    ? raw.leads
        .filter((l: any) => l && typeof l === 'object' && typeof l.contactName === 'string')
        .map((l: any, idx: number) => {
          const estimated = num(l.estimatedValue);
          const won = num(l.actualWonRevenue);
          return {
            id: typeof l.id === 'string' ? l.id : `lead-${Date.now()}-${idx}`,
            contactName: String(l.contactName || 'Unnamed Contact').trim(),
            businessOrProperty: String(l.businessOrProperty || '').trim(),
            phone: String(l.phone || '').trim(),
            email: String(l.email || '').trim(),
            serviceType: (SERVICE_TYPES as readonly string[]).includes(l.serviceType)
              ? (l.serviceType as ServiceType)
              : 'Other',
            leadSource: (LEAD_SOURCES as readonly string[]).includes(l.leadSource)
              ? (l.leadSource as LeadSource)
              : 'Other',
            estimatedValue: estimated !== undefined && estimated >= 0 ? estimated : 0,
            actualWonRevenue: won !== undefined && won >= 0 ? won : undefined,
            status: LEAD_STATUSES.includes(l.status) ? l.status : 'new',
            createdAt: typeof l.createdAt === 'string' ? l.createdAt : new Date().toISOString(),
            nextFollowUpDate: typeof l.nextFollowUpDate === 'string' ? l.nextFollowUpDate : today,
            notes: String(l.notes || ''),
            quoteId: typeof l.quoteId === 'string' ? l.quoteId : undefined,
          };
        })
    : [];

  const quotes: Quote[] = Array.isArray(raw?.quotes)
    ? raw.quotes
        .filter((q: any) => q && typeof q === 'object' && typeof q.quoteNumber === 'string')
        .map((q: any, idx: number) => {
          const items = Array.isArray(q.items)
            ? q.items
                .filter((item: any) => item && typeof item === 'object')
                .map((item: any, itemIdx: number) => {
                  const quantity = num(item.quantity);
                  const unitPrice = num(item.unitPrice);
                  const qty = quantity !== undefined && quantity > 0 ? quantity : 1;
                  const price = unitPrice !== undefined && unitPrice >= 0 ? unitPrice : 0;
                  return {
                    id: typeof item.id === 'string' ? item.id : `item-${itemIdx}`,
                    description: String(item.description || 'Prestation'),
                    quantity: qty,
                    unitPrice: price,
                    total: round2(qty * price),
                  };
                })
            : [];

          const discountPercent = Math.max(0, Math.min(100, Number(q.discountPercent) || 0));
          const taxPercent = Math.max(0, Number(q.taxPercent) || 0);

          // With line items present, totals are always derived from them so the document can never disagree with itself.
          let subtotal = num(q.subtotal) !== undefined && Number(q.subtotal) >= 0 ? Number(q.subtotal) : 0;
          let total = num(q.total) !== undefined && Number(q.total) >= 0 ? Number(q.total) : 0;
          if (items.length > 0) {
            subtotal = round2(items.reduce((acc: number, i: { total: number }) => acc + i.total, 0));
            const base = Math.max(0, subtotal - (subtotal * discountPercent) / 100);
            total = round2(base + (base * taxPercent) / 100);
          }

          return {
            id: typeof q.id === 'string' ? q.id : `quote-${Date.now()}-${idx}`,
            quoteNumber: String(q.quoteNumber || `LC-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`),
            leadId: typeof q.leadId === 'string' ? q.leadId : undefined,
            customerName: String(q.customerName || '').trim(),
            customerEmail: String(q.customerEmail || '').trim(),
            customerPhone: String(q.customerPhone || '').trim(),
            customerAddress: String(q.customerAddress || '').trim(),
            issueDate: typeof q.issueDate === 'string' ? q.issueDate : today,
            validUntilDate: typeof q.validUntilDate === 'string' ? q.validUntilDate : addDaysISO(30),
            items,
            subtotal,
            discountPercent,
            taxPercent,
            total,
            status: ['draft', 'sent', 'accepted', 'declined'].includes(q.status) ? q.status : 'draft',
            notes: String(q.notes || ''),
            createdAt: typeof q.createdAt === 'string' ? q.createdAt : new Date().toISOString(),
          };
        })
    : [];

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    leads,
    quotes,
    // Visitors of the first release have the old US sample set stored without the flag.
    isDemo:
      raw?.isDemo === true || (raw?.isDemo === undefined && rp?.businessName === 'Summit Craft Home Services'),
  };
}

export function validateImportPayload(jsonStr: string): { valid: boolean; error?: string; data?: AppDataPayload } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Le fichier n’est pas un objet JSON valide.' };
    }

    if (!Array.isArray(parsed.leads) && !Array.isArray(parsed.quotes)) {
      return { valid: false, error: 'Fichier de sauvegarde invalide : la liste des prospects ou des devis est manquante.' };
    }

    // A backup restored by the user is real data, never "sample" data.
    const sanitized = { ...sanitizePayload(parsed), isDemo: false };
    return { valid: true, data: sanitized };
  } catch (err: any) {
    return { valid: false, error: `Fichier illisible : ${err?.message || 'JSON mal formé'}` };
  }
}

export function exportAppDataAsFile(data: AppDataPayload): void {
  const exportPayload: AppDataPayload = {
    ...data,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `leadcatch-backup-${toLocalISODate()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function resetToDemoData(): AppDataPayload {
  const demo = getInitialDemoData();
  saveAppData(demo);
  return demo;
}

/** Wipes every record and the business profile. */
export function clearAllStorage(): AppDataPayload {
  const blank = getBlankData();
  saveAppData(blank);
  return blank;
}
