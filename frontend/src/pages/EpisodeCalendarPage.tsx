import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchEpisodes } from '../api/episodes';

export default function EpisodeCalendarPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['episodes', 'calendar'],
    queryFn: () => fetchEpisodes({ page: 1, pageSize: 365 }),
  });

  const events = useMemo(() => {
    return (data?.items || []).map((episode) => ({
      id: episode.id,
      title: `Severity ${episode.severity}/10`,
      start: episode.date,
      allDay: true,
      backgroundColor: episode.severity >= 8 ? '#dc2626' : episode.severity >= 5 ? '#f59e0b' : '#2563eb',
      borderColor: 'transparent',
    }));
  }, [data?.items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Episodes Calendar</h1>
        <p className="text-gray-600">Visualize migraine frequency by date and severity.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-gray-600">Loading calendar...</p>
        ) : error ? (
          <p className="text-red-700">{(error as Error).message}</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="auto"
            events={events}
            eventDisplay="block"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
          />
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-700">
        <div className="font-semibold text-gray-900 mb-2">Severity legend</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
            <span>1-4 mild</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
            <span>5-7 moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
            <span>8-10 severe</span>
          </div>
        </div>
      </div>
    </div>
  );
}