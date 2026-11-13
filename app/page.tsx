import Link from "next/link";
import type { CSSProperties } from "react";

type Print = {
  caption: string;
  photo: string;
  rotate: string;
  delay: string;
  position: string;
};

const prints: Print[] = [
  {
    caption: "lake day with maya",
    photo: "linear-gradient(180deg, #8ec5fc 0%, #6aa7e8 55%, #2f6f8f 56%, #1d4e63 100%)",
    rotate: "-8deg",
    delay: "0ms",
    position: "left-[0%] top-[3%]",
  },
  {
    caption: "sam's 30th!!",
    photo: "radial-gradient(circle at 30% 30%, #ffd23f 0 8%, transparent 9%), radial-gradient(circle at 70% 60%, #ff6b9a 0 10%, transparent 11%), linear-gradient(160deg, #2b1d4e, #5a2a7a)",
    rotate: "6deg",
    delay: "120ms",
    position: "right-[2%] top-[0%]",
  },
  {
    caption: "first snow, finally",
    photo: "radial-gradient(ellipse at 30% 120%, #ffffff 0 55%, transparent 56%), radial-gradient(ellipse at 85% 115%, #f4f7fb 0 45%, transparent 46%), linear-gradient(180deg, #9fb3cc, #dbe4ee)",
    rotate: "-3deg",
    delay: "240ms",
    position: "left-[10%] top-[50%]",
  },
  {
    caption: "golden hour on the roof",
    photo: "linear-gradient(180deg, #ff9a5a 0%, #ff6f61 45%, #6b3f6e 75%, #2a2240 100%)",
    rotate: "9deg",
    delay: "360ms",
    position: "right-[0%] top-[46%]",
  },
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

function PrintCard({ print }: { print: Print }) {
  return (
    <figure
      className={`print absolute w-[44%] max-w-[230px] bg-print p-3 pb-2 shadow-[0_18px_40px_-18px_rgba(23,32,51,0.45)] ${print.position}`}
      style={{ "--r": print.rotate, "--d": print.delay } as CSSProperties}
    >
      <div className="aspect-square w-full" style={{ background: print.photo }} />
      <figcaption className="font-hand pt-2 text-center text-2xl leading-none text-[#172033]">
        {print.caption}
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-4">
          <a href="#" className="rounded-full px-3 py-2 hover:bg-foreground/5">
            Sign in
          </a>
          <a
            href="#"
            className="rounded-full bg-foreground px-4 py-2 text-background hover:opacity-90"
          >
            Get the app
          </a>
        </nav>
      </header>

      <main className="flex-1 overflow-x-clip">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div className="max-w-xl">
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-7xl">
              Photos for the people who were there.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
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
                className="rounded-full px-5 py-3.5 font-semibold ring-1 ring-line hover:bg-foreground/5"
              >
                Sign in
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">Free on iPhone and Android.</p>
          </div>

          <div className="relative mx-auto aspect-[1/1.15] w-full max-w-[500px]">
            {prints.map((print) => (
              <PrintCard key={print.caption} print={print} />
            ))}
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
