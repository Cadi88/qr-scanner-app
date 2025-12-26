import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function createEvent(formData: FormData) {
  'use server';
  
  const name = formData.get('name') as string;
  const dateStr = formData.get('date') as string;
  const location = formData.get('location') as string;
  
  if (!name || !dateStr) return;

  await prisma.event.create({
    data: {
      name,
      date: new Date(dateStr),
      location,
    }
  });

  revalidatePath('/dashboard');
}

export default async function DashboardPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    include: { _count: { select: { tickets: true } } }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Event Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Manage your events and tickets</p>
          </div>
          <div className="text-right">
             <div className="text-sm font-medium text-slate-400">Total Events</div>
             <div className="text-2xl font-bold">{events.length}</div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Event Form */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm h-fit">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              New Event
            </h2>
            <form action={createEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Event Name</label>
                <input 
                  name="name" 
                  type="text" 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="e.g. Summer Festival"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date & Time</label>
                <input 
                  name="date" 
                  type="datetime-local" 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                <input 
                  name="location" 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="e.g. Main Stadium"
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors mt-4 shadow-lg shadow-indigo-500/20">
                Create Event
              </button>
            </form>
          </div>

          {/* Events List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-6 text-slate-200">Upcoming Events</h2>
            {events.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
                No events scheduled yet. Create one to get started.
              </div>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <div key={event.id} className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-50 text-slate-700">
                       {/* Icon placeholder */}
                     </div>
                     <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{event.name}</h3>
                          <div className="text-slate-400 text-sm mt-1 flex gap-4">
                             <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                             <span>📍 {event.location || 'Online'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-2xl font-bold text-slate-200">{event._count.tickets}</div>
                           <div className="text-xs text-slate-500 uppercase tracking-wider">Tickets</div>
                        </div>
                     </div>
                     
                     <div className="mt-6 flex gap-3">
                        <Link 
                          href={`/dashboard/event/${event.id}`}
                          className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-700"
                        >
                          Manage Tickets
                        </Link>
                        <Link 
                          href={`/scan?eventId=${event.id}`}
                          className="text-sm bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-900 px-4 py-2 rounded-lg transition-colors"
                        >
                          Launch Scanner
                        </Link>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
