import React, { useState } from 'react';
import { 
  Zap, 
  Search, 
  Syringe, 
  ShieldCheck, 
  TrendingUp, 
  Map, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

export interface OutcomeItem {
  id: number;
  title: string;
  summary: string;
  example: string;
  tag: string;
  icon: React.ElementType;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
}

export const OUTCOMES_DATA: OutcomeItem[] = [
  {
    id: 1,
    title: 'Instant Sick Animal Reports',
    summary: 'Getting news about a sick animal to a doctor instantly, instead of waiting weeks.',
    example:
      'Imagine a cow gets sick in a small village. Normally, a paper form travels by hand from officer to officer, taking weeks. With this system, the farmer makes a free phone call or sends a text, and the central animal doctor knows about it in 5 seconds.',
    tag: '5-Second Alert',
    icon: Zap,
    accentBg: 'bg-[#E8F5E9] text-[#2E7D32]',
    badgeBg: 'bg-[#E8F5E9]',
    badgeText: 'text-[#2E7D32]',
  },
  {
    id: 2,
    title: 'Early Disease Detection',
    summary: 'Catching a contagious disease when only 3 animals have it, before it spreads to 3,000.',
    example:
      'If 4 different farmers in neighboring villages report pigs with a high fever on the same morning, the computer connects the dots and says, "Warning: This looks like the start of a dangerous swine virus!" before it spreads everywhere.',
    tag: 'Early Cluster Warning',
    icon: Search,
    accentBg: 'bg-[#FFF3E0] text-[#E65100]',
    badgeBg: 'bg-[#FFF3E0]',
    badgeText: 'text-[#E65100]',
  },
  {
    id: 3,
    title: 'Vaccination Alerts & Reminders',
    summary: 'Making sure no animal misses its health shots.',
    example:
      'The app keeps a record for every cow. When it\'s time for a foot-and-mouth vaccine, the system automatically sends a text to the farmer saying, "Bring your cows to the village center on Tuesday for their shots."',
    tag: 'SMS Vaccine Alert',
    icon: Syringe,
    accentBg: 'bg-[#E0F2F1] text-teal-800',
    badgeBg: 'bg-[#E0F2F1]',
    badgeText: 'text-teal-800',
  },
  {
    id: 4,
    title: 'Fast Medicine & Diagnostics',
    summary: 'Getting medicine to the animal quickly and stopping the disease from leaving the farm.',
    example:
      'A vet takes a blood sample from a sick goat, scans a barcode on the bottle, and sends it to the lab. The lab tests it, texts the diagnosis back the same day, and the vet starts the right medicine immediately while telling the farmer to isolate that goat.',
    tag: 'Same-Day Treatment',
    icon: ShieldCheck,
    accentBg: 'bg-[#E3F2FD] text-blue-800',
    badgeBg: 'bg-[#E3F2FD]',
    badgeText: 'text-blue-800',
  },
  {
    id: 5,
    title: 'Protect Livestock & Milk Yield',
    summary: 'Fewer animals die, and animals stay healthy enough to keep producing milk, eggs, or meat.',
    example:
      'If a dairy cow gets an udder infection and is treated on Day 1, she gets better quickly and keeps producing milk. If the farmer had to wait two weeks for help, the cow might die or stop producing milk forever, costing the farmer their income.',
    tag: 'Protects Farmer Income',
    icon: TrendingUp,
    accentBg: 'bg-[#F1F8E9] text-[#1B5E20]',
    badgeBg: 'bg-[#F1F8E9]',
    badgeText: 'text-[#1B5E20]',
  },
  {
    id: 6,
    title: 'Seasonal Planning & Supplies',
    summary: 'Using real maps and facts to prepare ahead of time instead of guessing.',
    example:
      'Government leaders look at a map on their computer screen and see: "Every year after the heavy rains, mosquitoes cause a disease spike in Region A." So, they ship medicine and vaccines to Region A before the rains start.',
    tag: 'Monsoon Planning',
    icon: Map,
    accentBg: 'bg-[#EDE7F6] text-purple-800',
    badgeBg: 'bg-[#EDE7F6]',
    badgeText: 'text-purple-800',
  },
];

export const OutcomesShowcase: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#E8F5E9] via-[#F9FBE7] to-[#FFF3E0] border-2 border-emerald-300 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-[#2E7D32] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#E65100]" />
              System Benefits & Rural Outcomes
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1B5E20]">
              6 Core Benefits of the Animal Health Surveillance System
            </h2>
            <p className="text-xs text-stone-600 max-w-2xl font-semibold leading-relaxed">
              How this system protects livestock, empowers rural families, prevents deadly epidemics, and boosts farm income with fast veterinary care.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-emerald-300 text-xs text-[#2E7D32] font-black shrink-0 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
            <span>6 Key Outcomes</span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {OUTCOMES_DATA.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white border-2 rounded-3xl p-6 transition-all flex flex-col justify-between ${
                isExpanded
                  ? 'border-[#2E7D32] shadow-xl ring-2 ring-emerald-300/60'
                  : 'border-emerald-200 hover:border-emerald-300 shadow-sm'
              }`}
            >
              <div>
                {/* Top Row: Icon + Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.accentBg} flex items-center justify-center font-black shadow-sm`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-black px-3 py-1 rounded-full ${item.badgeBg} ${item.badgeText} border border-current/20`}>
                    {item.tag}
                  </span>
                </div>

                {/* Outcome Number & Title */}
                <div className="text-xs font-black uppercase tracking-wider text-[#2E7D32] mb-1">
                  Feature #{item.id}
                </div>
                <h3 className="text-lg font-black text-stone-900 mb-2 leading-snug">
                  {item.title}
                </h3>

                {/* Plain-Language Summary */}
                <p className="text-xs text-stone-600 font-semibold leading-relaxed mb-4">
                  {item.summary}
                </p>

                {/* Expandable Practical Village Scenario */}
                {isExpanded && (
                  <div className="mt-2 p-4 rounded-2xl bg-[#F9FBE7] border border-emerald-300 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#E65100]">
                      <Lightbulb className="w-4 h-4" />
                      <span>Village Story Example:</span>
                    </div>
                    <p className="text-xs text-stone-700 font-medium leading-relaxed">
                      {item.example}
                    </p>
                  </div>
                )}
              </div>

              {/* Toggle Example Action */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="mt-5 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-[#2E7D32] hover:text-[#1B5E20] transition-colors w-full cursor-pointer"
              >
                <span>{isExpanded ? 'Hide Village Example' : 'Read Village Story Example'}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
