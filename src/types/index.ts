export type LeadStatus = 'new' | 'contacted' | 'quote_sent' | 'followup_due' | 'won' | 'lost';

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nouvelle demande' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'quote_sent', label: 'Devis envoyé' },
  { value: 'followup_due', label: 'À relancer' },
  { value: 'won', label: 'Gagné' },
  { value: 'lost', label: 'Perdu' },
];

/** Short status names used in badges and filters. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  quote_sent: 'Devis envoyé',
  followup_due: 'À relancer',
  won: 'Gagné',
  lost: 'Perdu',
};

export const SERVICE_TYPES = [
  'Cleaning',
  'Painting',
  'Plumbing',
  'Electrical',
  'Garden Maintenance',
  'Handyman',
  'Tiling',
  'Carpentry',
  'Masonry',
  'AC & Heating',
  'Roofing',
  'Other',
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** The stored value stays the English key (so old backups keep working); this is what the user sees. */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  Cleaning: 'Nettoyage',
  Painting: 'Peinture',
  Plumbing: 'Plomberie',
  Electrical: 'Électricité',
  'Garden Maintenance': 'Jardinage',
  Handyman: 'Bricolage',
  Tiling: 'Carrelage',
  Carpentry: 'Menuiserie',
  Masonry: 'Maçonnerie',
  'AC & Heating': 'Climatisation & chauffage',
  Roofing: 'Toiture & étanchéité',
  Other: 'Autre',
};

export const LEAD_SOURCES = [
  'WhatsApp',
  'Phone Call',
  'Referral',
  'Social Media',
  'Website',
  'Google Search',
  'Flyer / Van',
  'Repeat Customer',
  'Other',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  WhatsApp: 'WhatsApp',
  'Phone Call': 'Appel téléphonique',
  Referral: 'Recommandation',
  'Social Media': 'Réseaux sociaux',
  Website: 'Site web',
  'Google Search': 'Recherche Google',
  'Flyer / Van': 'Flyer / véhicule',
  'Repeat Customer': 'Client fidèle',
  Other: 'Autre',
};

export interface Lead {
  id: string;
  contactName: string;
  businessOrProperty: string;
  phone: string;
  email: string;
  serviceType: ServiceType;
  leadSource: LeadSource;
  estimatedValue: number;
  actualWonRevenue?: number;
  status: LeadStatus;
  createdAt: string; // ISO String
  nextFollowUpDate: string; // YYYY-MM-DD (local calendar day)
  notes: string;
  quoteId?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  declined: 'Refusé',
};

export interface Quote {
  id: string;
  quoteNumber: string;
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  issueDate: string; // YYYY-MM-DD
  validUntilDate: string; // YYYY-MM-DD
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  status: QuoteStatus;
  notes: string;
  createdAt: string;
}

/** Language used for follow-up messages and the printed quote. */
export type MessageLanguage = 'en' | 'fr' | 'darija';

export const MESSAGE_LANGUAGES: { value: MessageLanguage; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'darija', label: 'Darija (الدارجة)' },
  { value: 'en', label: 'English' },
];

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  defaultTaxRate: number;
  quoteTerms: string;
  /** International dialling code without "+", used to turn local numbers (06…) into WhatsApp links. */
  defaultCountryCode: string;
  messageLanguage: MessageLanguage;
}

export type FollowUpTemplateKey =
  | 'first_touch'
  | 'friendly_reminder'
  | 'quote_followup'
  | 'final_checkin'
  | 'won_welcome';

export interface FollowUpTemplate {
  key: FollowUpTemplateKey;
  label: string;
  subject: string;
  body: string;
  description: string;
}

export interface AppDataPayload {
  version: number;
  exportedAt: string;
  profile: BusinessProfile;
  leads: Lead[];
  quotes: Quote[];
  /** True while the app is showing the built-in sample records. */
  isDemo?: boolean;
}
