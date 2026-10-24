import Image from 'next/image';
import Link from 'next/link';
import GuestNavbar from '../components/GuestNavbar';

const values = [
  {
    number: '01',
    title: 'Plan with confidence',
    text: 'Compare available trips and review your journey details before you reserve a seat.',
  },
  {
    number: '02',
    title: 'Travel comfortably',
    text: 'Find bus options for the places you need to go, with the key trip information close at hand.',
  },
  {
    number: '03',
    title: 'Keep every trip together',
    text: 'Use your account to keep track of reservations and return to your travel details when you need them.',
  },
];

export default function AboutPage() {
  return (
    <div className="ds-app ds-about-app">
      <GuestNavbar showSiteLinks activeSiteLabel="About Us" />

      <main className="ds-about-page">
        <section className="ds-about-hero">
          <div className="ds-about-hero-image" aria-hidden="true">
            <Image src="/front%20b.png" alt="" fill priority sizes="100vw" />
          </div>
          <div className="ds-about-hero-content">
            <span className="ds-about-eyebrow">BUS TICKETS · PHILIPPINES</span>
            <h1>Bus travel, made simple.</h1>
            <p>
              Find routes, compare trips, and reserve your seat online.
            </p>
            <div className="ds-about-actions">
              <Link href="/reserve" className="ds-btn ds-btn-primary">Book a trip <span aria-hidden="true">→</span></Link>
              <Link href="/routes" className="ds-about-secondary-link">Explore routes</Link>
            </div>
          </div>
        </section>

        <div className="ds-about-content">
          <section className="ds-about-story">
            <div className="ds-about-story-kicker">ABOUT OUR SERVICE</div>
            <div className="ds-about-story-grid">
              <h2>Made for the journeys that bring us together.</h2>
              <div>
                <p>
                  Whether you are heading home, visiting family, or planning your next trip, finding and booking a bus should feel straightforward. Our bus ticketing system brings route information and reservations into one easy-to-use experience.
                </p>
                <p>
                  Browse available journeys, choose the trip that works for you, and keep your booking details organized from one place.
                </p>
              </div>
            </div>
          </section>

          <section className="ds-about-values" aria-labelledby="about-values-title">
            <div className="ds-about-section-heading">
              <div>
                <span className="ds-about-story-kicker">THE EXPERIENCE</span>
                <h2 id="about-values-title">Travel planning, with you in mind.</h2>
              </div>
              <p>Everything you need to get from planning to your next seat.</p>
            </div>
            <div className="ds-about-value-grid">
              {values.map((value) => (
                <article key={value.number} className="ds-about-value-card">
                  <span className="ds-about-value-number">{value.number}</span>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                  <span className="ds-about-value-arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          </section>

          <section className="ds-about-cta">
            <div>
              <span className="ds-about-story-kicker">READY WHEN YOU ARE</span>
              <h2>Where will your next journey take you?</h2>
              <p>Explore available bus trips and start planning today.</p>
            </div>
            <Link href="/reserve" className="ds-btn ds-btn-primary">Book a trip <span aria-hidden="true">→</span></Link>
          </section>
        </div>
      </main>
    </div>
  );
}
