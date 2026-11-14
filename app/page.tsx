import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

// Specks of light that float up over the hero photo (positions are fixed so server and client render the same)
const bokeh = [
  { left: "8%", size: 10, dur: "16s", delay: "0s", sway: "30px" },
  { left: "22%", size: 6, dur: "12s", delay: "3s", sway: "-20px" },
  { left: "37%", size: 14, dur: "19s", delay: "6s", sway: "25px" },
  { left: "54%", size: 8, dur: "14s", delay: "1.5s", sway: "-30px" },
  { left: "68%", size: 12, dur: "17s", delay: "8s", sway: "20px" },
  { left: "81%", size: 7, dur: "13s", delay: "4.5s", sway: "-15px" },
  { left: "93%", size: 11, dur: "18s", delay: "10s", sway: "-25px" },
];

const features = [
  {
    title: "Just your people",
    body: "Your feed only shows friends you've added. No suggested accounts, no influencers, no strangers.",
  },
  {
    title: "Albums you fill together",
    body: "Start a shared album for a trip or a party, and everyone who was there adds their shots.",
  },
  {
    title: "A feed that ends",
    body: "Once you've seen today's posts, you're caught up. Close the app and come back tomorrow.",
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
      <span
        aria-hidden
        className="inline-block h-7 w-7 rounded-full"
        style={{ background: "radial-gradient(circle at 35% 35%, #ffd23f, #ff6f61 55%, #3d5afe)" }}
      />
      Afterglow
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Header floats over the full-screen hero image */}
      <header className="absolute inset-x-0 top-0 z-10 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2 text-sm font-medium sm:gap-4">
            <a href="#" className="rounded-full px-3 py-2 hover:bg-white/10">
              Sign in
            </a>
            <a
              href="#"
              className="rounded-full bg-white px-4 py-2 text-[#172033] hover:opacity-90"
            >
              Get the app
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-x-clip">
        <section className="relative isolate flex min-h-svh items-center text-white">
          {/* Café reference image (design/ui-kafe-ref.png), filling the whole screen and slowly drifting. */}
          <div className="absolute inset-0 -z-30 overflow-hidden">
            <div className="hero-drift absolute inset-0">
              <Image
                src="/hero-cafe.jpg"
                alt="A laptop on a marble café table next to a latte and a slice of chocolate cake"
                fill
                preload
                sizes="100vw"
                className="object-cover object-[50%_45%]"
              />
            </div>
          </div>
          {/* Warm light that slowly breathes, plus specks of light drifting upward */}
          <div aria-hidden className="hero-glow absolute inset-0 -z-10" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {bokeh.map((b, i) => (
              <span
                key={i}
                className="hero-bokeh"
                style={
                  {
                    left: b.left,
                    width: b.size,
                    height: b.size,
                    "--dur": b.dur,
                    "--delay": b.delay,
                    "--sway": b.sway,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          {/* Darkening so the white text stays readable on top of the photo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-black/35 bg-linear-to-r from-black/70 via-black/35 to-transparent"
          />

          <div className="hero-video mx-auto w-full max-w-6xl px-5 pt-28 pb-20 sm:px-8">
            <div className="max-w-xl">
              <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-7xl">
                Photos for the people who were there.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/85">
                Afterglow is a photo feed for your close friends. Post the day as it
                happened and see what everyone else got up to, without the strangers
                or the ads.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#"
                  className="rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-ink hover:brightness-110"
                >
                  Create your account
                </a>
                <a
                  href="#"
                  className="rounded-full px-5 py-3.5 font-semibold ring-1 ring-white/50 hover:bg-white/10"
                >
                  Sign in
                </a>
              </div>
              <p className="mt-4 text-sm text-white/75">Free on iPhone and Android.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <h2 className="text-xl font-bold tracking-tight">{f.title}</h2>
                <p className="mt-2 max-w-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-foreground px-8 py-12 text-background sm:flex-row sm:items-center sm:px-12">
            <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Your friends are already posting.
            </h2>
            <a
              href="#"
              className="shrink-0 rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-ink hover:brightness-110"
            >
              Create your account
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Afterglow</p>
          <nav className="flex gap-6">
            <a href="#" className="hover:text-foreground">About</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Help</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
