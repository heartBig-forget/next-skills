import ExploreBtn from '@/components/ExploreBtn';
import EventCard from '@/components/EventCard';

import {events} from '@/lib/constants';

export default function Page() {
  return (
    <section className="mx-auto container sm:px-10 px-5">
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackthons, Meetups, and Conferences, All in  One Place</p>

      <ExploreBtn/>

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.map((event) => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
