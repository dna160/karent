'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ReferenceImageUploader } from '@/components/run/ReferenceImageUploader';
import { LiveLogStream } from '@/components/run/LiveLogStream';

type PostType = 'feed' | 'story' | 'both';

export default function RunPipelinePage() {
  const { activeAccount } = useStore();

  const [refImages, setRefImages] = useState<File[]>([]);
  const [driveUrl, setDriveUrl] = useState('');
  const [postType, setPostType] = useState<PostType>('feed');
  const [captionHint, setCaptionHint] = useState('');
  const [useCustomPersona, setUseCustomPersona] = useState(false);
  const [personaJson, setPersonaJson] = useState('');

  const [running, setRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const canRun = refImages.length > 0 && !running;

  async function handleRun() {
    if (!activeAccount || !canRun) return;
    setError('');
    setRunning(true);

    const fd = new FormData();
    refImages.forEach((f) => fd.append('reference_images', f));
    fd.append('post_type', postType);
    if (captionHint) fd.append('caption_hint', captionHint);
    if (driveUrl) fd.append('drive_pose_folder_id', driveUrl);
    if (useCustomPersona && personaJson) {
      try {
        JSON.parse(personaJson); // validate
        fd.append('persona_profile', personaJson);
      } catch {
        setError('Persona JSON is invalid — please check syntax');
        setRunning(false);
        return;
      }
    }

    try {
      const { run_id } = await api.runs.trigger(activeAccount.slug, fd);
      setActiveRunId(run_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
      setRunning(false);
    }
  }

  if (!activeAccount) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Select an account first</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Run Pipeline</h1>
        <p className="text-gray-500 text-sm mt-0.5">Generate and post content for {activeAccount.display_name}</p>
      </div>

      {/* Form */}
      <div className="card p-5 space-y-5">
        {/* Reference images */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reference Images <span className="text-red-400">*</span>
            <span className="text-gray-600 font-normal ml-1">Face & style references — max 5</span>
          </label>
          <ReferenceImageUploader files={refImages} onChange={setRefImages} />
        </div>

        {/* Drive folder */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pose Reference — Google Drive Folder URL
            <span className="text-gray-600 font-normal ml-1">(optional — uses account default if blank)</span>
          </label>
          <input
            className="input"
            placeholder="https://drive.google.com/drive/folders/..."
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
          />
        </div>

        {/* Post type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Post Type <span className="text-red-400">*</span></label>
          <div className="flex gap-1 bg-bg-base rounded-lg p-1 w-fit border border-bg-border">
            {(['feed', 'story', 'both'] as PostType[]).map((t) => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className={`px-4 py-1.5 rounded-md text-sm capitalize transition-colors ${
                  postType === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Caption hint */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Caption Hint <span className="text-gray-600 font-normal">(optional)</span>
          </label>
          <input
            className="input"
            placeholder="e.g. morning cafe vibes, cozy autumn aesthetic…"
            value={captionHint}
            onChange={(e) => setCaptionHint(e.target.value)}
          />
        </div>

        {/* Persona override */}
        <div>
          <button
            onClick={() => {
              setUseCustomPersona(!useCustomPersona);
              if (!personaJson && activeAccount?.persona_profile) {
                setPersonaJson(JSON.stringify(activeAccount.persona_profile, null, 2));
              }
            }}
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span className={`text-xs ${useCustomPersona ? 'text-indigo-400' : 'text-gray-600'}`}>{useCustomPersona ? '▼' : '▶'}</span>
            Override persona profile for this run
          </button>
          {useCustomPersona && (
            <textarea
              className="input mt-2 font-mono text-xs h-36 resize-none"
              value={personaJson}
              onChange={(e) => setPersonaJson(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleRun}
          disabled={!canRun}
          className="btn-primary w-full py-2.5 text-base"
        >
          {running ? 'Pipeline running…' : '▶  Run Pipeline'}
        </button>
      </div>

      {/* Live log — shown after run is triggered */}
      {activeRunId && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-400">Live Agent Log</h2>
          <LiveLogStream slug={activeAccount.slug} runId={activeRunId} />
          <p className="text-xs text-gray-600">
            Run ID: <span className="font-mono text-gray-500">{activeRunId}</span> ·{' '}
            <a href="/history" className="text-indigo-400 hover:underline">View in Run History →</a>
          </p>
        </div>
      )}
    </div>
  );
}
