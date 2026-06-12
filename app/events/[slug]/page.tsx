import BookEvent from "@/components/BookEvent";
import EventCard from '@/components/EventCard';
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import type { IEvent } from '@/database/event.model';
import Image from "next/image";
import { notFound } from "next/navigation";
import { cacheLife } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailItem = ( { icon, alt, label }: { icon: string; alt: string; label: string }) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
)

const EventAgenda = ({ agendaItems } : { agendaItems: string[] }) => {
  const parsedAgendaItems: string[] =
    agendaItems.length === 1 && typeof agendaItems[0] === 'string' && agendaItems[0].startsWith('[')
      ? (JSON.parse(agendaItems[0]) as string[])
      : agendaItems;
  return (
    <div className="agenda">
      <h2>Agenda</h2>
      <ul>
        {parsedAgendaItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}


const EventTags = ({ tags } : { tags: string[] }) => {
  const parsedTags: string[] =
    tags.length === 1 && typeof tags[0] === 'string' && tags[0].startsWith('[')
      ? (JSON.parse(tags[0]) as string[])
      : tags;

  return (
    <div className="flex flex-row gap-1.5 flex-wrap">
      {parsedTags.map((tag) => (
        <div key={tag} className="pill">{tag}</div>
      ))}
    </div>
  );
}

const EventDetailsPage = async ({params } : { params: Promise<{slug: string }> }) => {
  'use cache'
  cacheLife('hours');

  const { slug } = await params;
  const request = await fetch(`${BASE_URL}/api/events/${slug}`);
  const event = await request.json();

  // If API returned an error object or no event, show 404
  if (!event || (event && (event.error || event.message === 'Event not found'))) return notFound();

  const { description, image, overview, date, time, location, mode, agenda, audience, organizer, tags } = event;

  const bookings = 10;

  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug) || [];

  return (
    <section id="event" className="mx-auto container sm:px-10 px-5">
      <div className="header">
        <h1>Event Description</h1>
        <p className="mt_2">{description}</p>
      </div>

      <div className="details">
        <div className="content">
          <Image src={image} unoptimized={true} alt="Event Banner" width={800} height={800} className="banner"></Image>
          
          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
            <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
          </section>

          <EventAgenda agendaItems={agenda} />

          <section className="flex-col-gap-2">
            <h2>Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />

        </div>


        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {
              bookings > 0 ? (
                <p className="text-sm">
                  Join {bookings} people who have already booked their spot. Don't miss out on this amazing event!
                </p>
              ) : (
                <p className="text-sm">Be the first to book you spot!</p>
              )
            }

            <BookEvent eventId={event._id} slug={event.slug} />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
            <EventCard key={similarEvent.slug} {...similarEvent} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default EventDetailsPage
