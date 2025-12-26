import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function generateTickets(formData: FormData) {
    'use server';
    const eventId = formData.get('eventId') as string;
    const count = parseInt(formData.get('count') as string);
    const prefix = formData.get('prefix') as string || 'Guest';

    if (!eventId || count < 1) return;

    const tickets = Array.from({ length: count }).map((_, i) => ({
        eventId,
        attendeeName: `${prefix} #${i + 1}`,
        status: 'VALID'
    }));

    await prisma.ticket.createMany({
        data: tickets
    });

    revalidatePath(`/dashboard/event/${eventId}`);
}

export default async function EventPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ page?: string }>
}) {
    const { id: eventId } = await params;
    const { page } = await searchParams;

    const currentPage = Number(page) || 1;
    const pageSize = 50;
    const skip = (currentPage - 1) * pageSize;

    // Fetch event basic info
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { tickets: true } } }
    });

    if (!event) return notFound();

    // Fetch paginated tickets
    const tickets = await prisma.ticket.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: skip
    });

    const totalTickets = event._count.tickets;
    const totalPages = Math.ceil(totalTickets / pageSize);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 mb-6 inline-block">← Back to Dashboard</Link>

                <header className="flex justify-between items-start mb-8 border-b border-slate-800 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{event.name}</h1>
                        <div className="flex gap-6 text-slate-400">
                            <span>📅 {new Date(event.date).toLocaleString()}</span>
                            <span>📍 {event.location}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-indigo-400">{event._count.tickets}</div>
                        <div className="text-sm text-slate-500 uppercase">Total Tickets</div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Generate Tickets Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
                        <h2 className="text-xl font-semibold mb-4 text-white">Generate Tickets</h2>
                        <form action={generateTickets} className="space-y-4">
                            <input type="hidden" name="eventId" value={event.id} />

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
                                <input
                                    name="count"
                                    type="number"
                                    min="1"
                                    max="1000"
                                    defaultValue="10"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Attendee Prefix</label>
                                <input
                                    name="prefix"
                                    type="text"
                                    defaultValue="VIP Guest"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                                Generate Codes
                            </button>
                        </form>
                    </div>

                    {/* Ticket List */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Tickets</h2>
                            <div className="text-sm text-slate-400">
                                Page {currentPage} of {totalPages || 1}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Attendee</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Key (Preview)</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {tickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-200">{ticket.attendeeName}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                              ${ticket.status === 'VALID' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : ''}
                              ${ticket.status === 'USED' ? 'bg-amber-950 text-amber-400 border border-amber-900' : ''}
                            `}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{ticket.id.slice(0, 8)}...</td>
                                                <td className="px-6 py-4">
                                                    <Link href={`/ticket/${ticket.id}`} className="text-indigo-400 hover:text-indigo-300 hover:underline">
                                                        View QR
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {tickets.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                    No tickets generated yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                {currentPage > 1 ? (
                                    <Link
                                        href={`/dashboard/event/${eventId}?page=${currentPage - 1}`}
                                        className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition"
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <button disabled className="px-4 py-2 bg-slate-900 text-slate-600 rounded cursor-not-allowed">Previous</button>
                                )}

                                {currentPage < totalPages ? (
                                    <Link
                                        href={`/dashboard/event/${eventId}?page=${currentPage + 1}`}
                                        className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition"
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <button disabled className="px-4 py-2 bg-slate-900 text-slate-600 rounded cursor-not-allowed">Next</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
