import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEpisode, deleteEpisode, fetchEpisodes } from '../api/episodes';

const LOCATION_PRESETS = [
  'Left temple',
  'Right temple',
  'Both temples',
  'Forehead',
  'Left side of head',
  'Right side of head',
  'Behind the left eye',
  'Behind the right eye',
  'Back of the head',
  'Top of the head',
  'Entire head',
  'Neck and base of skull',
];

const TRIGGER_PRESETS = [
  'Stress',
  'Lack of sleep',
  'Too much sleep',
  'Dehydration',
  'Caffeine (excess or withdrawal)',
  'Alcohol',
  'Skipping meals',
  'Hormonal changes',
  'Bright light',
  'Loud noise',
  'Strong smells',
  'Weather or pressure changes',
  'Physical exertion',
  'Screen time',
  'Certain foods',
  'Anxiety or depression',
  'Neck tension',
];

const DEFAULT_PAGE_SIZE = 10;

export default function EpisodeTrackingPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showLocationCustom, setShowLocationCustom] = useState(false);
  const [showTriggerCustom, setShowTriggerCustom] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    severity: 5,
    durationDays: '',
    durationHours: '',
    durationMins: '',
    locationPreset: '',
    locationCustom: '',
    triggersPreset: [] as string[],
    triggerCustom: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['episodes', page],
    queryFn: () => fetchEpisodes({ page, pageSize: DEFAULT_PAGE_SIZE }),
  });

  const createMutation = useMutation({
    mutationFn: createEpisode,
    onSuccess: async () => {
      setError(null);
      setShowLocationCustom(false);
      setShowTriggerCustom(false);
      setForm((previous) => ({
        ...previous,
        durationDays: '',
        durationHours: '',
        durationMins: '',
        locationPreset: '',
        locationCustom: '',
        triggersPreset: [],
        triggerCustom: '',
        notes: '',
      }));
      await queryClient.invalidateQueries({ queryKey: ['episodes'] });
      await queryClient.invalidateQueries({ queryKey: ['episodeStats'] });
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEpisode,
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['episodes'] });
      await queryClient.invalidateQueries({ queryKey: ['episodeStats'] });
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  const totalPages = data?.pagination.totalPages || 1;
  const rows = data?.items || [];
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const formatDuration = (totalMins: number): string => {
    const d = Math.floor(totalMins / (24 * 60));
    const h = Math.floor((totalMins % (24 * 60)) / 60);
    const m = totalMins % 60;
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);
    return parts.join(' ');
  };

  const toggleTrigger = (trigger: string) => {
    setForm((previous) => ({
      ...previous,
      triggersPreset: previous.triggersPreset.includes(trigger)
        ? previous.triggersPreset.filter((t) => t !== trigger)
        : [...previous.triggersPreset, trigger],
    }));
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const days = parseInt(form.durationDays) || 0;
    const hours = parseInt(form.durationHours) || 0;
    const mins = parseInt(form.durationMins) || 0;
    const totalMinutes = days * 24 * 60 + hours * 60 + mins;

    if (totalMinutes > 7 * 24 * 60) {
      setError('Duration cannot exceed 7 days.');
      return;
    }

    const location = showLocationCustom
      ? form.locationCustom.trim() || null
      : form.locationPreset || null;

    const customTriggers = showTriggerCustom
      ? form.triggerCustom
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await createMutation.mutateAsync({
      date: new Date(`${form.date}T12:00:00.000Z`).toISOString(),
      severity: form.severity,
      durationMinutes: totalMinutes > 0 ? totalMinutes : null,
      location,
      triggers: [...form.triggersPreset, ...customTriggers],
      notes: form.notes.trim() || null,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Episode Tracking</h1>
        <p className="text-gray-600">Log every migraine episode and keep your history clean and searchable.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Add new episode</h2>
        <form onSubmit={onCreate} className="mt-4 space-y-5">
          {/* Date + Severity */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              Severity ({form.severity}/10)
              <input
                type="range"
                min={1}
                max={10}
                value={form.severity}
                onChange={(event) => setForm({ ...form, severity: Number(event.target.value) })}
                className="mt-3 w-full"
              />
            </label>
          </div>

          {/* Duration: Days / Hours / Minutes */}
          <div>
            <span className="text-sm font-medium text-gray-700">Duration</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label className="flex flex-col items-center gap-1 text-xs text-gray-500">
                Days
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={form.durationDays}
                  onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm"
                  placeholder="0"
                />
              </label>
              <span className="mt-4 text-lg font-light text-gray-400">:</span>
              <label className="flex flex-col items-center gap-1 text-xs text-gray-500">
                Hours
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.durationHours}
                  onChange={(event) => setForm({ ...form, durationHours: event.target.value })}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm"
                  placeholder="0"
                />
              </label>
              <span className="mt-4 text-lg font-light text-gray-400">:</span>
              <label className="flex flex-col items-center gap-1 text-xs text-gray-500">
                Minutes
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={form.durationMins}
                  onChange={(event) => setForm({ ...form, durationMins: event.target.value })}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm"
                  placeholder="0"
                />
              </label>
            </div>
          </div>

          {/* Location */}
          <div>
            <span className="text-sm font-medium text-gray-700">Location</span>
            <div className="mt-1">
              {!showLocationCustom ? (
                <div className="flex items-center gap-2">
                  <select
                    value={form.locationPreset}
                    onChange={(event) => setForm({ ...form, locationPreset: event.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select location…</option>
                    {LOCATION_PRESETS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationCustom(true);
                      setForm((prev) => ({ ...prev, locationPreset: '' }));
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Other
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.locationCustom}
                    onChange={(event) => setForm({ ...form, locationCustom: event.target.value })}
                    className="flex-1 rounded-lg border border-blue-400 px-3 py-2"
                    placeholder="Describe the location…"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationCustom(false);
                      setForm((prev) => ({ ...prev, locationCustom: '' }));
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <span className="text-sm font-medium text-gray-700">Triggers</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRIGGER_PRESETS.map((trigger) => {
                const selected = form.triggersPreset.includes(trigger);
                return (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => toggleTrigger(trigger)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {trigger}
                  </button>
                );
              })}
              {!showTriggerCustom ? (
                <button
                  type="button"
                  onClick={() => setShowTriggerCustom(true)}
                  className="rounded-full border border-dashed border-gray-400 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-600 hover:text-gray-700"
                >
                  + Other
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowTriggerCustom(false);
                    setForm((prev) => ({ ...prev, triggerCustom: '' }));
                  }}
                  className="rounded-full border border-dashed border-blue-400 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                >
                  − Other
                </button>
              )}
            </div>
            {showTriggerCustom && (
              <input
                type="text"
                value={form.triggerCustom}
                onChange={(event) => setForm({ ...form, triggerCustom: event.target.value })}
                className="mt-2 w-full rounded-lg border border-blue-400 px-3 py-2"
                placeholder="Add custom triggers, comma-separated…"
                autoFocus
              />
            )}
          </div>

          {/* Notes */}
          <label className="block text-sm font-medium text-gray-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="mt-1 min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Any extra context about this episode"
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {createMutation.isLoading ? 'Saving...' : 'Save episode'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">History</h2>
          <div className="text-sm text-gray-500">Total: {data?.pagination.total || 0}</div>
        </div>

        {isLoading ? (
          <p className="mt-4 text-gray-600">Loading episodes...</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-gray-600">No episodes yet. Add your first record above.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Severity</th>
                  <th className="pb-3 pr-4 font-medium">Duration</th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Triggers</th>
                  <th className="pb-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((episode) => (
                  <tr key={episode.id} className="border-b border-gray-100 align-top">
                    <td className="py-3 pr-4 text-gray-900">{new Date(episode.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-gray-900">{episode.severity}/10</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {episode.durationMinutes ? formatDuration(episode.durationMinutes) : '-'}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{episode.location || '-'}</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {episode.triggers.length > 0 ? episode.triggers.join(', ') : '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(episode.id)}
                        disabled={deleteMutation.isLoading}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!canGoPrev}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!canGoNext}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}