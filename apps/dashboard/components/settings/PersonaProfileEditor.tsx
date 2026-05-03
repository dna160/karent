'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { PersonaProfile } from '@/lib/store';

interface Props { profile: PersonaProfile; onChange: (p: PersonaProfile) => void }

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().replace(/^#/, '');
    if (t && !values.includes(t)) onChange([...values, t]);
    setInput('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 bg-indigo-600/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-indigo-400 hover:text-white">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input text-xs flex-1"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        />
        <button onClick={add} className="btn-ghost text-xs px-3">Add</button>
      </div>
    </div>
  );
}

export function PersonaProfileEditor({ profile, onChange }: Props) {
  const [rawMode, setRawMode] = useState(false);
  const [rawJson, setRawJson] = useState(JSON.stringify(profile, null, 2));
  const [rawError, setRawError] = useState('');

  useEffect(() => {
    setRawJson(JSON.stringify(profile, null, 2));
  }, [profile]);

  const set = (k: keyof PersonaProfile, v: unknown) => onChange({ ...profile, [k]: v });

  function applyRaw() {
    try {
      const parsed = JSON.parse(rawJson);
      onChange(parsed);
      setRawError('');
    } catch (e: unknown) {
      setRawError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Persona Profile</h3>
        <button onClick={() => setRawMode(!rawMode)} className="text-xs text-gray-500 hover:text-white transition-colors">
          {rawMode ? 'Form view' : 'Raw JSON'}
        </button>
      </div>

      {rawMode ? (
        <div>
          <textarea
            className="input font-mono text-xs h-64 resize-none"
            value={rawJson}
            onChange={(e) => { setRawJson(e.target.value); setRawError(''); }}
            spellCheck={false}
          />
          {rawError && <p className="text-red-400 text-xs mt-1">{rawError}</p>}
          <button onClick={applyRaw} className="btn-primary mt-2 text-xs">Apply JSON</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input className="input" value={profile.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Aria" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Age</label>
              <input className="input" type="number" value={profile.age || ''} onChange={(e) => set('age', Number(e.target.value))} placeholder="23" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Aesthetic</label>
            <input className="input" value={profile.aesthetic || ''} onChange={(e) => set('aesthetic', e.target.value)} placeholder="soft girl, coastal grandmother…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Caption Voice</label>
            <input className="input" value={profile.caption_voice || ''} onChange={(e) => set('caption_voice', e.target.value)} placeholder="casual and aspirational" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Color Palette</label>
            <input className="input" value={profile.color_palette || ''} onChange={(e) => set('color_palette', e.target.value)} placeholder="warm neutrals, sage green…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bio</label>
            <input className="input" value={profile.bio || ''} onChange={(e) => set('bio', e.target.value)} placeholder="chasing golden hours ✨" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Personality Tags <span className="text-gray-600">(press Enter or comma to add)</span></label>
            <TagInput values={profile.personality_tags || []} onChange={(v) => set('personality_tags', v)} placeholder="dreamy, minimalist…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Niche Hashtags <span className="text-gray-600">(no #)</span></label>
            <TagInput values={profile.hashtag_niches || []} onChange={(v) => set('hashtag_niches', v)} placeholder="slowliving, softlife…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Viral Hashtags <span className="text-gray-600">(no #)</span></label>
            <TagInput values={profile.hashtag_viral || []} onChange={(v) => set('hashtag_viral', v)} placeholder="aesthetic, lifestyle…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Preferred Settings</label>
            <TagInput values={profile.preferred_settings || []} onChange={(v) => set('preferred_settings', v)} placeholder="cafe, beach, home…" />
          </div>
        </div>
      )}
    </div>
  );
}
