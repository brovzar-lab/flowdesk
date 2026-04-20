import { NavLink } from 'react-router-dom';

type NavItem = { to: string; label: string; icon: string };

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/log', label: 'Log', icon: '➕' },
  { to: '/insights', label: 'Insights', icon: '📊' },
];

export default function BottomNav(): JSX.Element {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex justify-around items-center h-16 z-40 safe-area-inset-bottom">
      {NAV_ITEMS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-6 py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-600' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
