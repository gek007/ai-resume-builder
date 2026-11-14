import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { getResume } from "@/lib/resume/data";
import { siteConfig } from "@/lib/site-config";
import { ResumeEditor } from "./editor/resume-editor";

export const metadata: Metadata = {
  title: `Edit resume · ${siteConfig.name}`,
  robots: { index: false },
};

export default function ResumePage({ params }: PageProps<"/resumes/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<div aria-hidden className="mx-auto mt-10 h-96 w-full max-w-7xl animate-pulse rounded-3xl bg-surface" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: Pick<PageProps<"/resumes/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/resumes/${encodeURIComponent(id)}`);
  // Another person's resume is "not found", exactly like a missing one.
  const resume = await getResume(user.id, id);
  if (!resume) notFound();
  return (
    <ResumeEditor
      key={resume.updatedAt.toISOString()}
      id={resume.id}
      updatedAt={resume.updatedAt.toISOString()}
      initial={{
        title: resume.title,
        content: resume.content,
        paperSize: resume.paperSize,
        jobTitle: resume.jobTitle,
        jobCompany: resume.jobCompany,
        jobDescription: resume.jobDescription,
      }}
    />
  );
}
