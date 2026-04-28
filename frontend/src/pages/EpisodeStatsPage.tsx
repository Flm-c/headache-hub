import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchEpisodeStats } from '../api/episodes';

export default function EpisodeStatsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['episodeStats', dateFrom, dateTo],
    queryFn: () =>
      fetchEpisodeStats({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Episode Statistics</h1>
        <p className="text-gray-600">Track trends, averages and your most common triggers over time.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Period filter</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-gray-700">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </section>

      {isLoading ? (
        <p className="text-gray-600">Loading statistics...</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{(error as Error).message}</p>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Total episodes</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{data?.totalEpisodes || 0}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Average severity</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {data?.averageSeverity || 0}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Average duration (min)</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {data?.averageDurationMinutes || 0}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Top triggers</h2>
            {!data || data.topTriggers.length === 0 ? (
              <p className="mt-4 text-gray-600">No trigger data for the selected period yet.</p>
            ) : (
              <div className="mt-5 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topTriggers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="trigger" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}