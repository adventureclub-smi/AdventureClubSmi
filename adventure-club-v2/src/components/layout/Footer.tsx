import Link from "next/link";
import Image from "next/image";
import type { SocialLinks } from "@/types/homepage";
import styles from "./Footer.module.scss";

const links = [
  { name: "Home", href: "/" },
  { name: "Upcoming Treks", href: "/#treks" },
  { name: "Gallery", href: "/gallery" },
  { name: "Stories", href: "/#stories" },
];

export default function Footer({ socials }: { socials: SocialLinks }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image
              src="/logo/logo-white.png"
              alt="Adventure Club"
              width={48}
              height={48}
            />
            <div>
              <h3>Adventure Club</h3>
              <span>Srishti Manipal Institute</span>
            </div>
          </div>

          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.name}>
                <Link href={link.href}>{link.name}</Link>
              </li>
            ))}
          </ul>

          <div className={styles.socials}>
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                Instagram
              </a>
            )}
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
            )}
            {socials.email && (
              <a href={`mailto:${socials.email}`} aria-label="Email">
                Email
              </a>
            )}
            {socials.phone && (
              <a href={`tel:${socials.phone}`} aria-label="Phone">
                {socials.phone}
              </a>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Adventure Club, Srishti Manipal Institute.</p>
          <p>Every summit begins with one step.</p>
        </div>
      </div>
    </footer>
  );
}
