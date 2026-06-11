import ExploreBtn from '@/components/ExploreBtn';
import EventCard from '@/components/EventCard';
import type { IEvent } from '@/database/event.model';
import { cacheLife } from 'next/cache';

// import { events } from '@/lib/constants';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
  'use cache'
  cacheLife('hours');
  const response = await fetch(`${BASE_URL}/api/events`);
  const { events } = await response.json();

  return (
    <section className="mx-auto container sm:px-10 px-5">
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackthons, Meetups, and Conferences, All in  One Place</p>

      <ExploreBtn/>

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events list-none">
          {events && events.length > 0 && events.map((event: IEvent) => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Page;
