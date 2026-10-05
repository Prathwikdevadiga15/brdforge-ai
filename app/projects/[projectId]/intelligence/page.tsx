import { notFound } from "next/navigation";
import { IntelligenceDashboard } from "@/components/intelligence-dashboard";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export default async function ProjectIntelligencePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let result;
  try {
    result = await loadIntelligence(projectId);
  } catch (error) {
    console.error("Project intelligence page could not be loaded.", error);
    throw new Error("Project intelligence is unavailable. Check database connectivity.");
  }
  if (!result) notFound();
  return <IntelligenceDashboard projectId={projectId} projectName={result.project.name} intelligence={result.intelligence} persistent={Boolean(process.env.DATABASE_URL)} />;
}
