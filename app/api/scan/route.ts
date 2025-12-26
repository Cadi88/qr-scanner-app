import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { ticketId } = await request.json();

        if (!ticketId) {
            return NextResponse.json({ success: false, message: 'No Ticket ID provided' }, { status: 400 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true }
        });

        if (!ticket) {
            return NextResponse.json({ success: false, message: 'INVALID TICKET' }, { status: 404 });
        }

        if (ticket.status === 'USED') {
            const scannedTime = new Date(ticket.scannedAt!).toLocaleTimeString();
            return NextResponse.json({
                success: false,
                message: `ALREADY USED at ${scannedTime}`,
                ticket: {
                    attendee: ticket.attendeeName,
                    event: ticket.event.name
                }
            }, { status: 409 });
        }

        if (ticket.status !== 'VALID') {
            return NextResponse.json({ success: false, message: `Ticket is ${ticket.status}` }, { status: 403 });
        }

        // Mark as used
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: 'USED',
                scannedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: 'ACCESS GRANTED',
            ticket: {
                attendee: updatedTicket.attendeeName,
                event: ticket.event.name
            }
        });

    } catch (error) {
        console.error('Scan error:', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
