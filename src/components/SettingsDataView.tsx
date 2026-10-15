import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { BusinessProfile, AppDataPayload, MessageLanguage, MESSAGE_LANGUAGES } from '../types';
import { exportAppDataAsFile, validateImportPayload } from '../utils/storage';

interface SettingsDataViewProps {
  profile: BusinessProfile;
  appData: AppDataPayload;
  onUpdateProfile: (updated: BusinessProfile) => void;
  onRestoreDemo: () => void;
  onClearAllData: () => void;
  onImportData: (data: AppDataPayload, mode: 'replace' | 'merge') => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  onRequestConfirm: (config: {
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

const CURRENCIES = [
  { code: 'MAD', symbol: 'DH', label: 'Dirham marocain (DH)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'USD', symbol: '$', label: 'Dollar américain ($)' },
  { code: 'GBP', symbol: '£', label: 'Livre sterling (£)' },
  { code: 'DZD', symbol: 'DA', label: 'Dinar algérien (DA)' },
  { code: 'TND', symbol: 'DT', label: 'Dinar tunisien (DT)' },
  { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (FCFA)' },
  { code: 'CAD', symbol: '$', label: 'Dollar canadien (CAD $)' },
  { code: 'AUD', symbol: '$', label: 'Dollar australien (AUD $)' },
];

export const SettingsDataView: React.FC<SettingsDataViewProps> = ({
  profile,
  appData,
  onUpdateProfile,
  onRestoreDemo,
  onClearAllData,
  onImportData,
  onShowToast,
  onRequestConfirm,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>({ ...profile });
  const [importPendingPayload, setImportPendingPayload] = useState<AppDataPayload | null>(null);
  const [importStats, setImportStats] = useState<{ leads: number; quotes: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  const handleProfileFieldChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
    setFormData((prev) => ({
      ...prev,
      currency: found.code,
      currencySymbol: found.symbol,
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...formData,
      defaultCountryCode: formData.defaultCountryCode.replace(/\D/g, '') || '212',
    });
    onShowToast('Paramètres enregistrés', 'Les informations de l’entreprise et les valeurs par défaut des devis ont été mises à jour.', 'success');
  };

  const handleExport = () => {
    exportAppDataAsFile(appData);
    onShowToast(
      'Sauvegarde téléchargée',
      `${appData.leads.length} prospect${appData.leads.length > 1 ? 's' : ''} et ${appData.quotes.length} devis enregistrés dans le fichier JSON.`,
      'success'
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateImportPayload(content);

      if (!result.valid || !result.data) {
        onShowToast('Import impossible', result.error || 'Fichier de sauvegarde invalide.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setImportPendingPayload(result.data);
      setImportStats({
        leads: result.data.leads.length,
        quotes: result.data.quotes.length,
      });
      onShowToast(
        'Sauvegarde valide',
        `Le fichier contient ${result.data.leads.length} prospect${result.data.leads.length > 1 ? 's' : ''} et ${result.data.quotes.length} devis. Choisissez ci-dessous : remplacer ou fusionner.`,
        'info'
      );
    };

    reader.onerror = () => {
      onShowToast('Erreur de lecture', 'Impossible de lire le fichier JSON choisi.', 'error');
    };

    reader.readAsText(file);
  };

  const handleApplyImport = (mode: 'replace' | 'merge') => {
    if (!importPendingPayload) return;

    const actionText = mode === 'replace' ? 'remplacer vos données actuelles' : 'ajouter ces données à vos données actuelles';

    onRequestConfirm({
      title: mode === 'replace' ? 'Remplacer toutes les données actuelles ?' : 'Fusionner avec les données actuelles ?',
      message: `Cette action va ${actionText} avec le fichier de sauvegarde (${importStats?.leads} prospect${(importStats?.leads ?? 0) > 1 ? 's' : ''}, ${importStats?.quotes} devis).`,
      confirmLabel: mode === 'replace' ? 'Oui, remplacer' : 'Oui, fusionner',
      isDestructive: mode === 'replace',
      onConfirm: () => {
        onImportData(importPendingPayload, mode);
        setImportPendingPayload(null);
        setImportStats(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onShowToast(
          'Import réussi',
          mode === 'replace' ? 'Les données de la sauvegarde ont été restaurées.' : 'Les données de la sauvegarde ont été ajoutées.',
          'success'
        );
      },
    });
  };

  const handleRestoreDemoClick = () => {
    onRequestConfirm({
      title: 'Remettre les données d’exemple ?',
      message:
        'Vos données actuelles seront remplacées par des prospects, devis et informations d’entreprise fictifs pour tester l’application. Faites d’abord une sauvegarde si vous avez de vraies données.',
      confirmLabel: 'Oui, remettre les exemples',
      isDestructive: false,
      onConfirm: () => {
        onRestoreDemo();
        onShowToast('Exemples restaurés', '7 prospects et 3 devis d’exemple ont été chargés.', 'success');
      },
    });
  };

  const handleClearAllClick = () => {
    onRequestConfirm({
      title: 'Supprimer toutes les données de cet appareil ?',
      message:
        'ATTENTION : tous les prospects, devis et informations d’entreprise enregistrés dans ce navigateur seront effacés définitivement. Exportez d’abord une sauvegarde JSON si vous voulez les garder.',
      confirmLabel: 'Oui, tout effacer',
      isDestructive: true,
      onConfirm: () => {
        onClearAllData();
        onShowToast('Données effacées', 'Tous les prospects et devis de cet appareil ont été supprimés.', 'info');
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paramètres et données
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Renseignez les informations de votre entreprise, les conditions de vos devis et gérez vos sauvegardes.
        </p>
      </div>

      {/* Storage Architecture Advisory */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900 mb-0.5">Vos données restent sur cet appareil</p>
          LeadCatch conserve vos données uniquement dans ce navigateur : aucune donnée n’est envoyée à un serveur et la
          synchronisation entre votre téléphone et votre ordinateur n’est <strong>pas</strong> automatique. Effacer les
          données du navigateur peut supprimer vos enregistrements. Utilisez donc l’option{' '}
          <strong>« Exporter les données (JSON) »</strong> ci-dessous pour effectuer une sauvegarde régulière (par exemple,
          tous les vendredis) et conservez le fichier en lieu sûr, comme vos messages enregistrés WhatsApp ou votre messagerie.
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Business Profile & Quote Defaults (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Entreprise et valeurs par défaut des devis</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informations imprimées sur les devis et utilisées dans les messages de relance.
              </p>
            </div>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de l’entreprise
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleProfileFieldChange('businessName', e.target.value)}
                  placeholder="ex. Atlas Services Maison"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsable / personne à contacter
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleProfileFieldChange('ownerName', e.target.value)}
                  placeholder="ex. Youssef El Amrani"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                  placeholder="ex. 0661 23 45 67"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                  placeholder="ex. contact@monentreprise.ma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse professionnelle
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                placeholder="ex. 12 Rue des Orangers, Maârif, Casablanca"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Devise principale
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taux de TVA par défaut (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.defaultTaxRate}
                  onChange={(e) => handleProfileFieldChange('defaultTaxRate', Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.0"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Langue des messages et des devis
                </label>
                <select
                  value={formData.messageLanguage}
                  onChange={(e) => handleProfileFieldChange('messageLanguage', e.target.value as MessageLanguage)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {MESSAGE_LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Langue des messages de relance et du devis imprimé.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Indicatif du pays (WhatsApp)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 text-sm border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 text-slate-500">
                    +
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.defaultCountryCode}
                    onChange={(e) => handleProfileFieldChange('defaultCountryCode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="212"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-r-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Transforme 06 12 34 56 78 en numéro WhatsApp valide (212 = Maroc).
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conditions et garantie par défaut des devis
              </label>
              <textarea
                rows={3}
                value={formData.quoteTerms}
                onChange={(e) => handleProfileFieldChange('quoteTerms', e.target.value)}
                placeholder="Conditions de paiement, délai de validité, garantie sur les travaux…"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les informations</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Backup, Import & Reset (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Export & Import Box */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Sauvegarde et restauration</h2>
            <p className="text-xs text-slate-500">
              Téléchargez vos données dans un fichier de sauvegarde JSON ou importez une sauvegarde précédente.
            </p>

            <div className="space-y-3 pt-1">
              {/* Export Button */}
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-slate-700" />
                    Exporter les données (JSON)
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Enregistrer {appData.leads.length} prospect{appData.leads.length > 1 ? 's' : ''} et {appData.quotes.length} devis sur l’appareil
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                  Télécharger
                </span>
              </button>

              {/* Import Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-700" />
                    Importer une sauvegarde (JSON)
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Choisissez un fichier .json exporté depuis LeadCatch
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />

                {/* Import Confirmation Buttons if file is staged */}
                {importPendingPayload && importStats && (
                  <div className="p-3 bg-white border border-indigo-200 rounded-lg space-y-2 mt-2 animate-in fade-in">
                    <p className="text-xs font-semibold text-slate-900">
                      Fichier chargé : {importStats.leads} prospect{importStats.leads > 1 ? 's' : ''}, {importStats.quotes} devis.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyImport('replace')}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        Tout remplacer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyImport('merge')}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                      >
                        Fusionner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Demo Data & Danger Zone */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Maintenance et réinitialisation</h2>

            <div className="space-y-3">
              {/* Restore Demo */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    Remettre les données d’exemple
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Remplace tout par des données fictives
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreDemoClick}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  Remettre les exemples
                </button>
              </div>

              {/* Erase All */}
              <div className="flex items-center justify-between p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Effacer les données de l’appareil
                  </div>
                  <span className="text-[11px] text-rose-700 block mt-0.5">
                    Supprime les prospects et les devis
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllClick}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
                >
                  Tout effacer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
