import { useState } from 'react';
import {
  TELUGU_VOWELS,
  TELUGU_CONSONANTS,
  TELUGU_VOWEL_MARKS,
  TELUGU_NUMERALS,
  TELUGU_SPECIAL
} from '../types';
import { api } from '../api';
import { RefreshCw, Space, Plus } from 'lucide-react';

interface Props {
  onInsert: (char: string) => void;
  activeField: 'context' | 'question';
  onFieldChange: (field: 'context' | 'question') => void;
}

type TabType = 'vowels' | 'consonants' | 'marks' | 'numbers' | 'special' | 'transliterate';

export default function TeluguKeyboard({ onInsert, activeField, onFieldChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('consonants');
  const [translitInput, setTranslitInput] = useState('');
  const [translitOutput, setTranslitOutput] = useState('');
  const [translitLoading, setTranslitLoading] = useState(false);

  const handleTransliterate = async () => {
    if (!translitInput.trim()) return;
    setTranslitLoading(true);
    try {
      const result = await api.transliterate(translitInput);
      setTranslitOutput(result.telugu);
    } catch (err) {
      console.error('Transliteration error:', err);
    } finally {
      setTranslitLoading(false);
    }
  };

  const handleInsertTranslit = () => {
    if (translitOutput) {
      onInsert(translitOutput);
      setTranslitInput('');
      setTranslitOutput('');
    }
  };

  const tabs = [
    { key: 'consonants' as TabType, label: 'హల్లులు', desc: 'Consonants' },
    { key: 'vowels' as TabType, label: 'అచ్చులు', desc: 'Vowels' },
    { key: 'marks' as TabType, label: 'గుణింతం', desc: 'Marks' },
    { key: 'numbers' as TabType, label: 'సంఖ్యలు', desc: 'Numbers' },
    { key: 'special' as TabType, label: 'గుర్తులు', desc: 'Special' },
    { key: 'transliterate' as TabType, label: '🔄', desc: 'Translit' },
  ];

  const renderCharGrid = (chars: { char: string; name: string }[], cols: number = 5) => (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {chars.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onInsert(item.char)}
          title={item.name}
          className="telugu-key"
        >
          {item.char === ' ' ? '␣' : item.char}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-5">
      {/* Active Field Indicator */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Insert to:</span>
        <div className="flex gap-2">
          <button
            onClick={() => onFieldChange('context')}
            className={`px-3.5 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
              activeField === 'context'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            Context
          </button>
          <button
            onClick={() => onFieldChange('question')}
            className={`px-3.5 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
              activeField === 'question'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            Question
          </button>
        </div>

        {/* Quick actions */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onInsert(' ')}
            className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs flex items-center gap-1 transition-colors"
            title="Insert Space"
          >
            <Space size={12} />
            Space
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 text-sm rounded-md whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <span className="font-telugu">{tab.label}</span>
            <span className="text-xs text-[var(--text-muted)] ml-1">({tab.desc})</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border-color)] min-h-[140px]">
        {activeTab === 'vowels' && renderCharGrid(TELUGU_VOWELS, 8)}
        {activeTab === 'consonants' && renderCharGrid(TELUGU_CONSONANTS, 6)}
        {activeTab === 'marks' && renderCharGrid(TELUGU_VOWEL_MARKS, 8)}
        {activeTab === 'numbers' && renderCharGrid(TELUGU_NUMERALS, 5)}
        {activeTab === 'special' && renderCharGrid(TELUGU_SPECIAL, 5)}
        
        {activeTab === 'transliterate' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              Type in English (ITRANS) like "namaste" → నమస్తే
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={translitInput}
                onChange={(e) => setTranslitInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTransliterate()}
                placeholder="Type English/ITRANS..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              />
              <button
                onClick={handleTransliterate}
                disabled={translitLoading || !translitInput.trim()}
                className="btn-accent px-5"
              >
                <RefreshCw size={16} className={translitLoading ? 'animate-spin' : ''} />
                Convert
              </button>
            </div>
            
            {translitOutput && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
                <span className="font-telugu text-2xl text-amber-700 dark:text-amber-300 flex-1">{translitOutput}</span>
                <button
                  onClick={handleInsertTranslit}
                  className="btn-accent px-4"
                >
                  <Plus size={16} />
                  Insert
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
