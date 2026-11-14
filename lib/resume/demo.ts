import { SECTION_KEYS, newId, type PaperSize, type ResumeContent } from "@/lib/resume/schema";

// A complete, realistic sample resume (fictional person) so people can see
// every section filled in and try the editor without typing from scratch.

const bullets = (...texts: string[]) => texts.map((text) => ({ id: newId(), text }));

export function demoResume(): {
  title: string;
  content: ResumeContent;
  paperSize: PaperSize;
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
} {
  return {
    title: "Demo resume",
    paperSize: "A4",
    jobTitle: "Senior Frontend Engineer",
    jobCompany: "Northwind Labs",
    jobDescription:
      "We're looking for a Senior Frontend Engineer to lead our customer dashboard. You'll work with React, TypeScript and Next.js, care about accessibility and performance, and mentor other engineers. Experience with design systems and testing (Playwright, Vitest) is a plus.",
    content: {
      contact: {
        fullName: "Dana Levi",
        headline: "Frontend Engineer",
        email: "dana.levi@example.com",
        phone: "+972 50 123 4567",
        location: "Tel Aviv, Israel",
        links: [
          { id: newId(), label: "LinkedIn", url: "linkedin.com/in/dana-levi-example" },
          { id: newId(), label: "GitHub", url: "github.com/dana-levi-example" },
        ],
      },
      summary:
        "Frontend engineer with 6 years of experience building fast, accessible React applications for fintech. I turn complex flows into simple interfaces, and I've led small teams shipping customer-facing products used by over 200,000 people.",
      experience: [
        {
          id: newId(),
          role: "Senior Frontend Engineer",
          organization: "Acme Payments",
          location: "Tel Aviv",
          start: "2021-03",
          end: "present",
          bullets: bullets(
            "Cut checkout load time by 42% by moving rendering to the server and splitting the bundle.",
            "Led a team of 4 engineers that shipped the new merchant dashboard in 5 months.",
            "Built a shared component library adopted by 6 product teams, reducing UI bugs by 30%.",
          ),
        },
        {
          id: newId(),
          role: "Frontend Engineer",
          organization: "Brightside Insurance",
          location: "Herzliya",
          start: "2019-07",
          end: "2021-02",
          bullets: bullets(
            "Rebuilt the quote flow in React and TypeScript, raising completed quotes by 18%.",
            "Brought the main app to WCAG 2.1 AA, fixing 120+ accessibility issues.",
          ),
        },
      ],
      military: [
        {
          id: newId(),
          role: "Software Developer",
          organization: "IDF Computer Service Directorate",
          location: "",
          start: "2016-03",
          end: "2019-03",
          bullets: bullets(
            "Developed internal web tools used daily by 300 analysts.",
            "Trained 12 new developers in JavaScript and code review practices.",
          ),
        },
      ],
      projects: [
        {
          id: newId(),
          name: "Open-source date picker",
          link: "github.com/dana-levi-example/datepicker",
          start: "2022-01",
          end: null,
          bullets: bullets("Accessible React date picker with 1,800 GitHub stars and 40k weekly downloads."),
        },
      ],
      education: [
        {
          id: newId(),
          school: "Tel Aviv University",
          degree: "B.Sc.",
          field: "Computer Science",
          start: "2015-10",
          end: "2019-06",
          notes: "Graduated with honors.",
        },
      ],
      skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Accessibility (WCAG)", "Playwright", "Figma"].map(
        (name) => ({ id: newId(), name }),
      ),
      languages: [
        { id: newId(), name: "Hebrew", level: "native" },
        { id: newId(), name: "English", level: "fluent" },
      ],
      certifications: [
        { id: newId(), name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "2023-05" },
      ],
      layout: { order: [...SECTION_KEYS], hidden: [] },
    },
  };
}
