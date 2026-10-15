import {
  BusinessProfile,
  FollowUpTemplate,
  FollowUpTemplateKey,
  Lead,
  MessageLanguage,
  Quote,
  SERVICE_LABELS,
} from '../types';
import { formatCurrency } from './formatters';

export const TEMPLATE_KEYS: FollowUpTemplateKey[] = [
  'first_touch',
  'friendly_reminder',
  'quote_followup',
  'final_checkin',
  'won_welcome',
];

/** Scenario names/descriptions are shown in the (English) interface; only the message text changes language. */
export const TEMPLATE_META: Record<FollowUpTemplateKey, { label: string; description: string }> = {
  first_touch: {
    label: 'Premier contact (réponse rapide)',
    description: 'À envoyer juste après une demande pour confirmer les détails et fixer une visite.',
  },
  friendly_reminder: {
    label: 'Petit rappel (2 à 3 jours après)',
    description: 'Un message poli pour un prospect qui n’a pas répondu à la première discussion.',
  },
  quote_followup: {
    label: 'Relance après devis',
    description: 'Pour savoir si le devis envoyé convient, répondre aux questions ou ajuster les travaux.',
  },
  final_checkin: {
    label: 'Dernière relance (clôture polie)',
    description: 'Un message courtois, sans pression, avant de classer un prospect qui ne répond plus.',
  },
  won_welcome: {
    label: 'Chantier confirmé',
    description: 'Pour remercier le client et lui expliquer la suite avant le début des travaux.',
  },
};

type TemplateText = Record<FollowUpTemplateKey, { subject: string; body: string }>;

const EN: TemplateText = {
  first_touch: {
    subject: 'Following up on your {serviceType} inquiry — {businessName}',
    body: `Hi {customerName},

Thank you for reaching out to {businessName} regarding your {serviceType} project!

I wanted to quickly check in and confirm if you would like me to stop by for a quick assessment, or if you have any photos/details you can share so I can prepare an accurate estimate for you.

Looking forward to helping you with this!

Best regards,
{ownerName}
{businessName}
{businessPhone}`,
  },
  friendly_reminder: {
    subject: 'Checking in regarding your {serviceType} project — {businessName}',
    body: `Hi {customerName},

Just following up on our recent chat about your {serviceType} project.

I know things get busy, so I wanted to make sure you have everything you need, or if you have any questions about scheduling and availability for the coming week.

Feel free to reply here or give me a call whenever convenient.

Warm regards,
{ownerName}
{businessName}`,
  },
  quote_followup: {
    subject: 'Your {serviceType} estimate {quoteNumber} — {businessName}',
    body: `Hi {customerName},

I hope you’re having a great week!

I’m checking in to see if you had a chance to review the quote ({quoteNumber}) for your {serviceType} work ({quoteTotal}).

Do you have any questions about the itemized breakdown or materials? If you’d like to adjust any part of the scope or get on our schedule before dates fill up, just let me know!

Best regards,
{ownerName}
{businessName}
{businessPhone}`,
  },
  final_checkin: {
    subject: 'Status of your {serviceType} project — {businessName}',
    body: `Hi {customerName},

I’m following up one final time regarding your {serviceType} project.

If your plans have shifted or you’ve decided to put the project on hold for now, no worries at all! I just wanted to close the loop so I don’t keep bothering you with reminders.

If you ever need us down the road, our door is always open.

Thanks again,
{ownerName}
{businessName}`,
  },
  won_welcome: {
    subject: 'Booking confirmed! Next steps for your {serviceType} project — {businessName}',
    body: `Hi {customerName},

We’re thrilled to work with you on your {serviceType} project!

Your booking is confirmed. We’ll be in touch shortly to finalize the start date, arrival time, and any preparation needed at {businessOrProperty}.

If you need anything in the meantime, feel free to contact me directly.

Thank you for choosing {businessName}!

Best regards,
{ownerName}
{businessPhone}`,
  },
};

const FR: TemplateText = {
  first_touch: {
    subject: 'Suite à votre demande ({serviceType}) — {businessName}',
    body: `Bonjour {customerName},

Merci d’avoir contacté {businessName} au sujet de votre projet ({serviceType}).

Je me permets de vous relancer pour savoir si vous souhaitez que je passe faire une visite rapide, ou si vous pouvez m’envoyer quelques photos et détails afin de vous préparer un devis précis.

Dans l’attente de votre retour.

Cordialement,
{ownerName}
{businessName}
{businessPhone}`,
  },
  friendly_reminder: {
    subject: 'Votre projet ({serviceType}) — {businessName}',
    body: `Bonjour {customerName},

Je reviens vers vous suite à notre échange concernant votre projet ({serviceType}).

Je sais que le temps manque parfois, alors je voulais m’assurer que vous avez toutes les informations nécessaires, ou si vous avez des questions sur le planning et nos disponibilités pour la semaine à venir.

N’hésitez pas à me répondre ici ou à m’appeler quand cela vous arrange.

Bien cordialement,
{ownerName}
{businessName}`,
  },
  quote_followup: {
    subject: 'Votre devis {quoteNumber} ({serviceType}) — {businessName}',
    body: `Bonjour {customerName},

J’espère que vous allez bien.

Je me permets de vous relancer pour savoir si vous avez pu consulter le devis ({quoteNumber}) pour vos travaux de {serviceType} ({quoteTotal}).

Avez-vous des questions sur le détail ou les matériaux ? Si vous souhaitez ajuster une partie des travaux ou réserver une date avant que le planning ne se remplisse, dites-le-moi.

Cordialement,
{ownerName}
{businessName}
{businessPhone}`,
  },
  final_checkin: {
    subject: 'Où en est votre projet ({serviceType}) ? — {businessName}',
    body: `Bonjour {customerName},

Je vous écris une dernière fois au sujet de votre projet ({serviceType}).

Si vos plans ont changé ou si vous préférez mettre ce projet en attente, aucun problème ! Je voulais simplement clore le sujet pour ne pas vous relancer inutilement.

Si vous avez besoin de nous plus tard, nous restons à votre disposition.

Merci et bonne continuation,
{ownerName}
{businessName}`,
  },
  won_welcome: {
    subject: 'Réservation confirmée — votre projet ({serviceType}) — {businessName}',
    body: `Bonjour {customerName},

Nous sommes ravis de travailler avec vous sur votre projet ({serviceType}) !

Votre réservation est confirmée. Je vous recontacte très vite pour fixer la date de début, l’heure d’arrivée et les préparatifs nécessaires à {businessOrProperty}.

Si vous avez besoin de quoi que ce soit d’ici là, appelez-moi directement.

Merci de votre confiance,
{ownerName}
{businessName}
{businessPhone}`,
  },
};

// Darija written in Latin letters ("arabizi"), the way people actually write on WhatsApp.
const DARIJA: TemplateText = {
  first_touch: {
    subject: FR.first_touch.subject,
    body: `Salam {customerName},

Choukran 3la tawasolk m3a {businessName} 3la khedmat {serviceType}.

Bghit n3ref wach t7eb nji nchouf l-khedma 3ndek, wla t9der tsifet liya chwiya dyal tsawer w tafasil bach n3tik taman dqiq.

Ntsenna jawabek, w mer7ba bik!

{ownerName}
{businessName}
{businessPhone}`,
  },
  friendly_reminder: {
    subject: FR.friendly_reminder.subject,
    body: `Salam {customerName},

Ghir bghit nsewlek 3la khedmat {serviceType} li hdarna 3liha. Ila 3ndek chi souâl wla bghiti n7eddo l-maw3id, ana kayn.

T9der tjawebni hna wla tkellemni f ay wa9t.

Bsa7a,
{ownerName}
{businessName}`,
  },
  quote_followup: {
    subject: FR.quote_followup.subject,
    body: `Salam {customerName},

Wach chefti l-devis ({quoteNumber}) dyal {serviceType} ({quoteTotal})?

Ila 3ndek chi mola7ada wla bghiti nbeddlo chi 7aja f l-khedma wla f taman, golha liya w nsala7 lik. L-maw3id kay3emmro b sor3a, ila bghiti n7jez lik l-yom ana kayn.

{ownerName}
{businessName}
{businessPhone}`,
  },
  final_checkin: {
    subject: FR.final_checkin.subject,
    body: `Salam {customerName},

Ghir bghit n3awd nsewlek l-merra l-lakhra 3la {serviceType}. Ila tbeddlat l-khotta dyalek wla bghiti twa99ef l-machrou3 daba, ma kayn mouchkil.

W ila 7tajitina f chi nhar, ana kayn dima.

Choukran bzzaf,
{ownerName}
{businessName}`,
  },
  won_welcome: {
    subject: FR.won_welcome.subject,
    body: `Salam {customerName},

Far7anin bzzaf bach ghadi nkhedmo m3ak f {serviceType}!

L-7ejz tconfirma. Ghadi nkellmek 9rib bach n7eddo nhar l-bidaya, l-wa9t, w ay 7aja khassna n-wejdo 9bel l-khedma f {businessOrProperty}.

Ila bghiti chi 7aja f had l-wa9t, kellemni mn dak sa3a.

Choukran 3la tiqa dyalek f {businessName}!
{ownerName}
{businessPhone}`,
  },
};

const BY_LANGUAGE: Record<MessageLanguage, TemplateText> = { en: EN, fr: FR, darija: DARIJA };

export function getTemplate(key: FollowUpTemplateKey, language: MessageLanguage): FollowUpTemplate {
  const text = (BY_LANGUAGE[language] || BY_LANGUAGE.fr)[key];
  return { key, ...TEMPLATE_META[key], subject: text.subject, body: text.body };
}

const FALLBACKS: Record<MessageLanguage, { there: string; team: string; property: string; estimate: string; service: string }> = {
  en: { there: 'there', team: 'The Team', property: 'your property', estimate: 'estimate', service: 'service' },
  fr: { there: 'Madame, Monsieur', team: 'L’équipe', property: 'votre adresse', estimate: 'devis', service: 'service' },
  darija: { there: 'sa7bi', team: 'L-fari9', property: 'l-3enwan dyalek', estimate: 'devis', service: 'khedma' },
};

export function renderTemplate(
  template: FollowUpTemplate,
  lead: Lead,
  profile: BusinessProfile,
  quote?: Quote,
  language: MessageLanguage = 'en'
): { subject: string; body: string } {
  const fb = FALLBACKS[language] || FALLBACKS.en;
  const quoteTotalStr = quote
    ? formatCurrency(quote.total, profile.currencySymbol)
    : formatCurrency(lead.estimatedValue, profile.currencySymbol);

  // French / Darija messages mention the service in French ("travaux de nettoyage"), English keeps the stored key.
  const serviceLabel = lead.serviceType
    ? language === 'en'
      ? lead.serviceType
      : (SERVICE_LABELS[lead.serviceType] ?? lead.serviceType).toLowerCase()
    : fb.service;

  const replacements: Record<string, string> = {
    '{customerName}': lead.contactName || fb.there,
    '{serviceType}': serviceLabel,
    '{businessName}': profile.businessName || fb.team,
    '{ownerName}': profile.ownerName || fb.team,
    '{businessPhone}': profile.phone || '',
    '{businessOrProperty}': lead.businessOrProperty || fb.property,
    '{quoteNumber}': quote?.quoteNumber || fb.estimate,
    '{quoteTotal}': quoteTotalStr,
  };

  let renderedSubject = template.subject;
  let renderedBody = template.body;

  Object.entries(replacements).forEach(([key, value]) => {
    renderedSubject = renderedSubject.split(key).join(value);
    renderedBody = renderedBody.split(key).join(value);
  });

  // An empty {businessPhone} would leave a dangling blank line at the end of the signature.
  renderedBody = renderedBody.replace(/\s+$/, '');

  return {
    subject: renderedSubject,
    body: renderedBody,
  };
}
