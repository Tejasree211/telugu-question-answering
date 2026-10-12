import { useState, useRef, useCallback } from 'react';
import { Upload, Search, Loader2, FileText, HelpCircle, Languages } from 'lucide-react';
import { api } from '../api';

interface Props {
  context: string;
  question: string;
  onContextChange: (value: string) => void;
  onQuestionChange: (value: string) => void;
  onContextFocus: () => void;
  onQuestionFocus: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  loading: boolean;
}

/**
 * Detect if text contains Latin characters that could be ITRANS transliteration.
 */
function hasLatinChars(text: string): boolean {
  return /[a-zA-Z]{2,}/.test(text);
}

export default function InputPanel({
  context,
  question,
  onContextChange,
  onQuestionChange,
  onContextFocus,
  onQuestionFocus,
  onFileUpload,
  onSubmit,
  loading
}: Props) {
  const [transliterating, setTransliterating] = useState<'context' | 'question' | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // In-place transliteration: auto-convert Latin text after user stops typing
  const handleInPlaceTransliterate = useCallback(async (
    field: 'context' | 'question',
    value: string,
    setter: (v: string) => void
  ) => {
    // Clear any pending timer for this field
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field]);
    }

    // Only trigger if there are Latin characters
    if (!hasLatinChars(value)) return;

    // Debounce: wait 800ms after user stops typing
    debounceTimers.current[field] = setTimeout(async () => {
      try {
        setTransliterating(field);
        // Split into words, transliterate only Latin words
        const words = value.split(/(\s+)/);
        const converted = await Promise.all(
          words.map(async (word) => {
            if (/^[a-zA-Z]+$/.test(word.trim()) && word.trim().length >= 2) {
              try {
                const result = await api.transliterate(word.trim());
                return result.telugu;
              } catch {
                return word;
              }
            }
            return word;
          })
        );
        setter(converted.join(''));
      } catch {
        // Silently fail — don't interrupt user
      } finally {
        setTransliterating(null);
      }
    }, 800);
  }, []);

  // Manual transliterate button handler
  const handleTransliterateField = async (
    field: 'context' | 'question',
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim() || !hasLatinChars(value)) return;
    setTransliterating(field);
    try {
      const result = await api.transliterate(value);
      setter(result.telugu);
    } catch {
      // ignore
    } finally {
      setTransliterating(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Context Input */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="font-medium text-[var(--text-primary)] flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            Context <span className="font-telugu text-[var(--text-muted)]">(సందర్భం)</span>
          </label>
          <div className="flex items-center gap-2">
            {hasLatinChars(context) && (
              <button
                onClick={() => handleTransliterateField('context', context, onContextChange)}
                disabled={transliterating === 'context'}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                title="Transliterate English → Telugu"
              >
                <Languages size={13} />
                {transliterating === 'context' ? 'Converting...' : 'Transliterate'}
              </button>
            )}
            <label className="cursor-pointer text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium">
              <Upload size={13} />
              Upload .txt
              <input
                type="file"
                accept=".txt"
                onChange={onFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="relative">
          <textarea
            value={context}
            onChange={(e) => {
              onContextChange(e.target.value);
              handleInPlaceTransliterate('context', e.target.value, onContextChange);
            }}
            onFocus={onContextFocus}
            placeholder="తెలుగులో టెక్స్ట్ ఇక్కడ పేస్ట్ చేయండి... (or type in English for auto-transliteration)"
            className="w-full h-36 p-4 rounded-lg font-telugu text-lg resize-none bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
          />
          {transliterating === 'context' && (
            <div className="absolute top-2 right-2 text-xs text-purple-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Transliterating...
            </div>
          )}
        </div>
      </div>

      {/* Question Input */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="font-medium text-[var(--text-primary)] flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </span>
            Question <span className="font-telugu text-[var(--text-muted)]">(ప్రశ్న)</span>
          </label>
          {hasLatinChars(question) && (
            <button
              onClick={() => handleTransliterateField('question', question, onQuestionChange)}
              disabled={transliterating === 'question'}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
              title="Transliterate English → Telugu"
            >
              <Languages size={13} />
              {transliterating === 'question' ? 'Converting...' : 'Transliterate'}
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => {
              onQuestionChange(e.target.value);
              handleInPlaceTransliterate('question', e.target.value, onQuestionChange);
            }}
            onFocus={onQuestionFocus}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="తెలుగులో ప్రశ్న అడగండి... (or type in English)"
            className="w-full p-4 rounded-lg font-telugu text-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
          />
          {transliterating === 'question' && (
            <div className="absolute top-1/2 -translate-y-1/2 right-3 text-xs text-purple-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Transliterating...
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={loading || !context.trim() || !question.trim()}
        className="btn-accent w-full"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Finding answer...
          </>
        ) : (
          <>
            <Search size={18} />
            Get Answer / సమాధానం పొందండి
          </>
        )}
      </button>
    </div>
  );
}
