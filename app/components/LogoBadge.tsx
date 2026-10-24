import Image from 'next/image';
import Link from 'next/link';

/**
 * The small "Bus Ticketing" lockup shown in the header of the public pages.
 * Previously this inline SVG was duplicated across the home, about and reserve
 * pages; it now points at the shared bus artwork.
 */
export default function LogoBadge() {
  return (
    <Link href="/" className="logo-link">
      <div className="logo-small">
        <Image
          src="/BUSLOGO.png"
          alt=""
          width={512}
          height={512}
          className="logo-small-image"
        />
      </div>
      <span className="logo-text">Bus Ticketing</span>
    </Link>
  );
}
