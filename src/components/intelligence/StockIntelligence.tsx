import React, { useState } from 'react';
import { TrendingUp, Calendar, ArrowRight, Layers, Tag, Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { SeasonalEvent, SeasonalConcept } from '../../types';
import { exportToCSV, exportToJSON } from '../../lib/utils/exportUtils';
import { AIManager } from '../../lib/ai/AIManager';

interface StockIntelligenceProps {
  onSelectPromptIdea: (idea: string) => void;
}

export const StockIntelligence: React.FC<StockIntelligenceProps> = ({
  onSelectPromptIdea,
}) => {
  const [selectedSeason, setSelectedSeason] = useState('Autumn & Halloween');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiConcepts, setAiConcepts] = useState<SeasonalConcept[]>([]);

  const seasonalEvents: SeasonalEvent[] = [
    {
      id: 'halloween',
      name: 'Halloween & Autumn',
      season: 'Fall',
      description: 'High-demand seasonal concepts for autumn flatlays, spooky creative events, and cozy lifestyle themes.',
      concepts: [
        {
          title: 'Cozy Autumn Coffee & Pumpkin Flatlay',
          promptIdea: 'Flatlay photography of hot spiced pumpkin latte, autumn leaves, cinnamon sticks on rustic wooden table, soft morning window light, high copy space',
          category: 'Lifestyle',
          commercialUse: 'Seasonal advertising, cafe menus, food blogs',
          copySpace: '80% top copy space',
        },
        {
          title: 'Modern Minimalist Halloween Party Decor',
          promptIdea: 'Minimalist Halloween party arrangement with matte black pumpkins, subtle gold candles, elegant typography space, high-end interior styling',
          category: 'Seasonal',
          commercialUse: 'Event planning, festive marketing campaigns',
          copySpace: 'Center copy space',
        },
      ],
    },
    {
      id: 'backtoschool',
      name: 'Back to School & Learning',
      season: 'Late Summer',
      description: 'Educational technology, modern virtual classrooms, stationery supplies, and student productivity.',
      concepts: [
        {
          title: 'Modern Online Education Setup',
          promptIdea: 'Sleek laptop displaying online course dashboard, colorful stationery neatly arranged on clean oak desk, bright natural sunlight, editorial photography',
          category: 'Education',
          commercialUse: 'EdTech platforms, school supplies retail, webinars',
          copySpace: '75% right copy space',
        },
        {
          title: 'Collaborative Study Group with Tablets',
          promptIdea: 'Top down view of diverse students brainstorming over digital tablet sketches and notebooks, bright minimalist study space',
          category: 'Education',
          commercialUse: 'University brochures, student lifestyle blogs',
          copySpace: 'Balanced negative space',
        },
      ],
    },
    {
      id: 'newyear',
      name: 'New Year & Financial Planning',
      season: 'Winter',
      description: 'Financial goal setting, investment growth, resolution planning, and business milestone tracking.',
      concepts: [
        {
          title: 'Financial Growth & Investment Strategy',
          promptIdea: 'Abstract 3D financial growth chart with glowing green trend lines, digital coin icons, modern dark mode fintech UI aesthetic',
          category: 'Finance',
          commercialUse: 'Banking apps, investment portfolios, wealth management',
          copySpace: 'Wide panoramic format',
        },
        {
          title: 'Goal Setting Notebook and Coffee',
          promptIdea: 'Close up of leather notebook with 2026 goals written in elegant typography, cup of espresso, gold pen, professional executive desk',
          category: 'Business',
          commercialUse: 'Corporate stationery, productivity apps, coaching ads',
          copySpace: '65% left copy space',
        },
      ],
    },
  ];

  const currentEvent = seasonalEvents.find(e => e.name === selectedSeason) || seasonalEvents[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Stock Intelligence & Market Trends</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">AI-Driven Commercial Concept Generator</h2>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Explore high-demand microstock themes, seasonal demand surges, and commercial concepts optimized for Adobe Stock buyer search patterns.
          </p>
        </div>
      </div>

      {/* Season Selector Tabs & Bulk Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {seasonalEvents.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setSelectedSeason(evt.name)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                selectedSeason === evt.name
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{evt.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsAiGenerating(true);
              try {
                const response = await AIManager.generateStructured<{ concepts: SeasonalConcept[] }>(
                  `Generate 4 high-demand commercial Adobe Stock visual concepts for the season/trend: "${selectedSeason}". Focus on underserved niches, high buyer demand, corporate advertising utility, and generous copy space.`,
                  {
                    taskType: 'idea-generation',
                    systemInstruction: `You are a microstock commercial trend analyst. Generate commercially viable stock photo/illustration ideas.
Return JSON strictly:
{
  "concepts": [
    {
      "title": "string",
      "promptIdea": "detailed stock prompt",
      "category": "string",
      "commercialUse": "string",
      "copySpace": "string"
    }
  ]
}`
                  }
                );
                if (response?.concepts && Array.isArray(response.concepts)) {
                  setAiConcepts(response.concepts);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setIsAiGenerating(false);
              }
            }}
            disabled={isAiGenerating}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isAiGenerating ? 'Brainstorming...' : 'Trend Expander'}</span>
          </button>

          <button
            onClick={() => {
              const allConcepts = [...seasonalEvents.flatMap(e => 
                e.concepts.map(c => ({
                  SeasonEvent: e.name,
                  Category: c.category,
                  Title: c.title,
                  PromptIdea: c.promptIdea,
                  CommercialUse: c.commercialUse,
                  CopySpace: c.copySpace
                }))
              ), ...aiConcepts.map(c => ({
                SeasonEvent: `${selectedSeason} (AI)`,
                Category: c.category,
                Title: c.title,
                PromptIdea: c.promptIdea,
                CommercialUse: c.commercialUse,
                CopySpace: c.copySpace
              }))];
              exportToCSV(allConcepts, `stock-intelligence-all-${Date.now()}.csv`);
            }}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bulk CSV All</span>
          </button>
          <button
            onClick={() => {
              const currentConcepts = [...currentEvent.concepts, ...aiConcepts].map(c => ({
                Season: currentEvent.name,
                Category: c.category,
                Title: c.title,
                PromptIdea: c.promptIdea,
                CommercialUse: c.commercialUse,
                CopySpace: c.copySpace
              }));
              exportToJSON(currentConcepts, `stock-intelligence-${currentEvent.id}-${Date.now()}.json`);
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiConcepts.map((concept, idx) => (
          <div key={`ai-${idx}`} className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>Concept • {concept.category}</span>
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{concept.copySpace}</span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{concept.title}</h3>
              <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/70 p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 leading-relaxed">
                {concept.promptIdea}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-800 dark:text-zinc-200">Commercial Use:</strong> {concept.commercialUse}
              </p>
            </div>

            <button
              onClick={() => onSelectPromptIdea(concept.promptIdea)}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer group shadow-sm shadow-purple-600/20"
            >
              <span>Load into Prompt Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}

        {currentEvent.concepts.map((concept, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  {concept.category}
                </span>
                <span className="text-xs text-zinc-400">{concept.copySpace}</span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{concept.title}</h3>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 leading-relaxed">
                {concept.promptIdea}
              </p>
              <p className="text-xs text-zinc-500">
                <strong className="text-zinc-700 dark:text-zinc-300">Commercial Use:</strong> {concept.commercialUse}
              </p>
            </div>

            <button
              onClick={() => onSelectPromptIdea(concept.promptIdea)}
              className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors group cursor-pointer"
            >
              <span>Load into Prompt Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
