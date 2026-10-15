import React, { useState } from 'react';
import { Plus, Menu, X } from 'lucide-react';
import { LeadCatchLogo } from './Logo';

export type NavTab = 'dashboard' | 'leads' | 'quotes' | 'followups' | 'reports' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewLead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewLead,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'leads', label: 'Prospects' },
    { id: 'quotes', label: 'Devis' },
    { id: 'followups', label: 'Relances' },
    { id: 'reports', label: 'Statistiques' },
    { id: 'settings', label: 'Paramètres & données' },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-8 h-16">
          {/* Zone 1: Single text element Brand wordmark with custom logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center text-left group cursor-pointer focus:outline-hidden transition-opacity hover:opacity-90"
              aria-label="Accueil LeadCatch"
            >
              <LeadCatchLogo size="md" />
            </button>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: primary action + mobile menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenNewLead}
              aria-label="Nouveau prospect"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:hidden">Prospect</span>
              <span className="hidden sm:inline">Nouveau prospect</span>
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Ouvrir ou fermer le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer block ${
                  isActive
                    ? 'text-slate-900 bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
