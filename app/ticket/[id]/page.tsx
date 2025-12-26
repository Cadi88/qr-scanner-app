import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { event: true }
    });

    if (!ticket) return notFound();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
                {/* Decorative header */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="text-center mb-8 pt-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Event Ticket</label>
                    <h1 className="text-2xl font-black text-gray-900 mt-1 leading-tight">{ticket.event.name}</h1>
                    <p className="text-sm text-gray-500 mt-2">{new Date(ticket.event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p className="text-sm text-gray-500">{ticket.event.location}</p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl relative">
                        <QRCodeSVG
                            value={ticket.id}
                            size={200}
                            level="Q"
                            includeMargin={true}
                        />
                        {ticket.status !== 'VALID' && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-red-600 font-bold border-2 border-red-600 px-4 py-2 rounded-lg -rotate-12 uppercase text-xl">
                                    {ticket.status}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <p className="text-xs text-gray-400 uppercase">Attendee</p>
                    <p className="font-bold text-gray-800 text-lg">{ticket.attendeeName}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-xs text-gray-400 font-mono">
                    <span>ID: {ticket.id.slice(0, 8)}...</span>
                    <span>{ticket.status}</span>
                </div>
            </div>
        </div>
    );
}
