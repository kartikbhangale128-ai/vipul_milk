import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Layers, 
  ArrowRight, 
  Users, 
  LayoutDashboard
} from 'lucide-react';

interface EntryOption {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  bgGradient: string;
  badgeColor: string;
  route: string;
}

export const ModeSelectPage: React.FC = () => {
  const navigate = useNavigate();

  const options: EntryOption[] = [
    {
      id: 'ajay-morning',
      title: '1. Ajay Morning',
      subtitle: 'Record morning & evening milk intake for customers on Ajay Morning route.',
      badge: 'AJAY MORNING',
      icon: <Sun className="w-8 h-8 text-amber-600" />,
      bgGradient: 'hover:border-amber-400 hover:bg-amber-50/40',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      route: '/milk-entry?shift=Ajay%20Morning&session=both',
    },
    {
      id: 'rahul-evening',
      title: '2. Rahul Evening',
      subtitle: 'Record morning & evening milk intake for customers on Rahul Evening route.',
      badge: 'RAHUL EVENING',
      icon: <Moon className="w-8 h-8 text-indigo-600" />,
      bgGradient: 'hover:border-indigo-400 hover:bg-indigo-50/40',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      route: '/milk-entry?shift=Rahul%20Evening&session=both',
    },
    {
      id: 'ajay-evening',
      title: '3. Ajay Evening',
      subtitle: 'Record morning & evening milk intake for customers on Ajay Evening route.',
      badge: 'AJAY EVENING',
      icon: <Moon className="w-8 h-8 text-indigo-600" />,
      bgGradient: 'hover:border-indigo-400 hover:bg-indigo-50/40',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      route: '/milk-entry?shift=Ajay%20Evening&session=both',
    },
    {
      id: 'rahul-morning',
      title: '4. Rahul Morning',
      subtitle: 'Record morning & evening milk intake for customers on Rahul Morning route.',
      badge: 'RAHUL MORNING',
      icon: <Sun className="w-8 h-8 text-amber-600" />,
      bgGradient: 'hover:border-amber-400 hover:bg-amber-50/40',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      route: '/milk-entry?shift=Rahul%20Morning&session=both',
    },
    {
      id: 'all-entries',
      title: '5. All (All Routes & Sessions)',
      subtitle: 'View and enter all customer records together at once (both morning and evening).',
      badge: 'ALL ENTRIES',
      icon: <Layers className="w-8 h-8 text-red-600" />,
      bgGradient: 'hover:border-red-400 hover:bg-red-50/40 border-stone-300',
      badgeColor: 'bg-red-100 text-red-800 border-red-300',
      route: '/milk-entry?shift=All&session=both',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider mb-2">
          Daily Entry Gateway
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Select Shift for Milk Entry
        </h1>
        <p className="text-stone-500 text-sm sm:text-base mt-2">
          Choose which delivery shift to enter records for, or view all entries at once.
        </p>
      </div>

      {/* 5 Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => navigate(opt.route)}
            className={`bg-white p-6 rounded-2xl border-2 border-stone-200 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex items-start gap-4 ${opt.bgGradient} ${
              opt.id === 'all-entries' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0">
              {opt.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-stone-900">
                  {opt.title}
                </h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                {opt.subtitle}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-2 text-stone-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Footer */}
      <div className="bg-stone-100/70 p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
        <span className="font-semibold">Looking for other dairy management features?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Customers
          </button>
        </div>
      </div>
    </div>
  );
};
