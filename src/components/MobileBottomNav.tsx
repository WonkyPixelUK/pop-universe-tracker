import { Link, useLocation } from 'react-router-dom';
import { Home, List, Grid, BookOpen, Folder, Users, HelpCircle, Store, Users as CommunityIcon, Clock, Castle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const navItems = [
  { to: '/directory-all', label: 'Browse Database', icon: Home },
  { to: '/features', label: 'Features', icon: BookOpen },
  { to: '/pricing', label: 'Pricing', icon: Folder },
  { to: '/browse-lists', label: 'Lists', icon: List },
  { label: 'Tools', icon: Grid, submenu: [
    { to: '/time-machine', label: 'Time Machine', icon: Clock },
    { to: '/grail-galaxy', label: 'Grail-Galaxy', icon: Castle }
  ]},
  { label: 'Community', icon: CommunityIcon, modal: 'community' },
  { label: 'Support', icon: HelpCircle, modal: 'support' },
  { label: 'Retailers', icon: Store, modal: 'retailers' },
];

const supportLinks = [
  { to: '/system-status', label: 'Service Status' },
  { to: '/faq', label: 'FAQ' },
  { to: '/log-ticket', label: 'Log a ticket' },
  { to: '/howitworks', label: 'How it works' },
  { to: '/api', label: 'API' },
];

const retailersLinks = [
  { to: '/directory', label: 'Browse Retailers' },
  { to: '/retailers/become', label: 'Add your business' },
];

const communityLinks = [
  { to: '/members', label: 'Members' },
  { to: '/shoppers-advice', label: 'Shoppers Advice' },
  { to: '/deals', label: 'Latest Deals' },
  { to: '/coming-soon', label: 'Coming Soon' },
  { to: '/browse-lists', label: 'Lists' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [modal, setModal] = useState<null | 'community' | 'support' | 'retailers' | 'tools'>(null);
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-200 shadow-lg md:hidden">
        <ul className="flex items-center px-1 py-1 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-orange-200">
          {navItems.map(({ to, label, icon: Icon, modal: modalType, submenu }) => {
            if (modalType || submenu) {
              return (
                <li key={label} className="flex-shrink-0">
                  <button
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-colors text-[#232837] hover:text-orange-500 focus:outline-none`}
                    aria-label={label}
                    onClick={() => setModal((modalType || 'tools') as 'community' | 'support' | 'retailers' | 'tools')}
                  >
                    <Icon className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                </li>
              );
            }
            const active = to && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)));
            return (
              <li key={to} className="flex-shrink-0">
                <Link
                  to={to!}
                  className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-colors ${active ? 'text-orange-600' : 'text-[#232837]'} hover:text-orange-500`}
                  aria-label={label}
                >
                  <Icon className="w-6 h-6 mb-0.5" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
          {user && (
            <li className="flex-shrink-0">
              <Link
                to="/dashboard"
                className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-colors ${location.pathname.startsWith('/dashboard') ? 'text-orange-600' : 'text-[#232837]'} hover:text-orange-500`}
                aria-label="Dashboard"
              >
                <Grid className="w-6 h-6 mb-0.5" />
                <span className="text-xs font-medium">Dashboard</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      {/* Modal for dropdowns */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden bg-black bg-opacity-40" onClick={() => setModal(null)}>
          <div className="bg-white w-full rounded-t-lg p-6 pb-10 max-w-md mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg text-[#232837]">
                {modal === 'community' ? 'Community' : 
                 modal === 'support' ? 'Support' : 
                 modal === 'retailers' ? 'Retailers' : 'Tools'}
              </span>
              <button onClick={() => setModal(null)} className="text-gray-500 text-2xl leading-none">&times;</button>
            </div>
            <ul className="space-y-4">
              {(modal === 'community'
                ? communityLinks
                : modal === 'support'
                ? supportLinks
                : modal === 'retailers'
                ? retailersLinks
                : navItems.find(item => item.label === 'Tools')?.submenu || []
              ).map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-3 text-[#232837] text-base font-medium hover:text-orange-500"
                    onClick={() => setModal(null)}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav; 