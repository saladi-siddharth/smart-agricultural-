import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Tractor, Map, Leaf,
  ClipboardList, Package, Wallet, Brain, ArrowRight, X
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: 'nav-dashboard', category: 'Navigation', title: 'Dashboard', subtitle: 'Farm Health & Today Operations', path: '/dashboard', icon: LayoutDashboard },
  { id: 'nav-farms', category: 'Navigation', title: 'Farms', subtitle: 'Green Valley Farm & Context', path: '/farms', icon: Tractor },
  { id: 'nav-fields', category: 'Navigation', title: 'Fields', subtitle: 'Plot acreage & soil layout', path: '/fields', icon: Map },
  { id: 'nav-crops', category: 'Navigation', title: 'Crop Cycles', subtitle: 'Paddy Kharif biological progression', path: '/crops', icon: Leaf },
  { id: 'nav-activities', category: 'Navigation', title: 'Activities', subtitle: 'Operation queue & task status', path: '/activities', icon: ClipboardList },
  { id: 'nav-inputs', category: 'Navigation', title: 'Inputs', subtitle: 'Seed, fertilizer & bio-agent ledger', path: '/inputs', icon: Package },
  { id: 'nav-expenses', category: 'Navigation', title: 'Expenses', subtitle: 'Cost breakdown & financial ledger', path: '/expenses', icon: Wallet },
  { id: 'nav-intelligence', category: 'Navigation', title: 'Farm Intelligence', subtitle: '4-pillar health score & recommendations', path: '/intelligence', icon: Brain },
];

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = COMMAND_ITEMS.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (item: CommandItem) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white border border-[var(--color-border-subtle)] shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--color-border-subtle)] gap-3">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, crops, operations, modules... (ESC to close)"
            className="w-full text-sm text-[var(--color-text-title)] placeholder-[var(--color-text-faint)] outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text-title)] hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
              No matching modules or actions found for "{query}".
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-800)]' : 'text-[var(--color-text-title)] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : 'bg-slate-100 text-[var(--color-text-muted)]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-[var(--color-text-muted)]">{item.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--color-primary-700)]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">↵</kbd> to select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
