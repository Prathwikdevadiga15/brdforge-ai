import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const projectId = "atlas-ops";

const sources = [
  {
    id: "demo-src-ops",
    filename: "operations-sync.txt",
    type: "meeting",
    text: "Operations sync notes: The service must reduce policy-approval turnaround to 24 hours.",
  },
  {
    id: "demo-src-policy",
    filename: "service-policy.txt",
    type: "policy",
    text: "Service policy: Policy approvals shall be completed within 48 hours. Evidence must be retained for 7 years.",
  },
];

const requirements = [
  {
    id: "demo-req-intake",
    title: "Multi-source intake and normalization",
    category: "Ingestion",
    owner: "Product intelligence",
    status: "validated",
    confidence: 0.95,
    summary: "The system should ingest fragmented meeting notes, transcripts, PDFs, screenshots, and spreadsheets into a normalized evidence set.",
    rationale: "Supported across product and operations source material.",
    evidence: {
      id: "demo-ev-intake",
      sourceId: "demo-src-ops",
      excerpt: "The service must reduce policy-approval turnaround to 24 hours.",
    },
  },
  {
    id: "demo-req-traceability",
    title: "Evidence-backed requirement traceability",
    category: "Governance",
    owner: "Compliance",
    status: "validated",
    confidence: 0.97,
    summary: "Every requirement should link to its source evidence and show the excerpt used during review.",
    rationale: "Traceability enables human verification and audit review.",
    evidence: {
      id: "demo-ev-traceability",
      sourceId: "demo-src-policy",
      excerpt: "Evidence must be retained for 7 years.",
    },
  },
  {
    id: "demo-req-sla",
    title: "Resolve SLA target before approval",
    category: "Open decision",
    owner: "Business operations",
    status: "review",
    confidence: 0.58,
    summary: "Operations notes specify 24 hours while the service policy specifies 48 hours for approval turnaround.",
    rationale: "Contradictory source statements require an authorized stakeholder decision.",
    evidence: {
      id: "demo-ev-sla",
      sourceId: "demo-src-ops",
      excerpt: "The service must reduce policy-approval turnaround to 24 hours.",
    },
  },
];

async function main() {
  await prisma.project.upsert({
    where: { id: projectId },
    update: { name: "Atlas Ops Hub", status: "In review", health: 84 },
    create: {
      id: projectId,
      name: "Atlas Ops Hub",
      domain: "Operations intelligence",
      owner: "Nadia Shah",
      status: "In review",
      health: 84,
    },
  });

  for (const source of sources) {
    await prisma.source.upsert({
      where: { id: source.id },
      update: { filename: source.filename, type: source.type, extractedText: source.text },
      create: {
        id: source.id,
        projectId,
        filename: source.filename,
        mimeType: "text/plain",
        type: source.type,
        extractedText: source.text,
        status: "processed",
      },
    });
  }

  for (const requirement of requirements) {
    await prisma.requirement.upsert({
      where: { id: requirement.id },
      update: {
        title: requirement.title,
        category: requirement.category,
        owner: requirement.owner,
        status: requirement.status,
        confidence: requirement.confidence,
        summary: requirement.summary,
        rationale: requirement.rationale,
      },
      create: {
        id: requirement.id,
        projectId,
        title: requirement.title,
        category: requirement.category,
        owner: requirement.owner,
        status: requirement.status,
        confidence: requirement.confidence,
        summary: requirement.summary,
        rationale: requirement.rationale,
        evidenceIds: [requirement.evidence.id],
      },
    });
    await prisma.evidence.upsert({
      where: { id: requirement.evidence.id },
      update: { excerpt: requirement.evidence.excerpt },
      create: {
        id: requirement.evidence.id,
        projectId,
        requirementId: requirement.id,
        uploadedSourceId: requirement.evidence.sourceId,
        title: sources.find((source) => source.id === requirement.evidence.sourceId).filename,
        type: sources.find((source) => source.id === requirement.evidence.sourceId).type,
        source: sources.find((source) => source.id === requirement.evidence.sourceId).filename,
        confidence: requirement.confidence,
        excerpt: requirement.evidence.excerpt,
      },
    });
  }

  const conflicts = [
    {
      id: "demo-conflict-sla",
      title: "Approval SLA mismatch",
      severity: "high",
      summary: "Operations notes specify 24 hours; the service policy specifies 48 hours.",
      requirements: ["demo-req-sla"],
      resolution: "Awaiting policy owner review.",
    },
    {
      id: "demo-conflict-retention",
      title: "Evidence retention needs confirmation",
      severity: "medium",
      summary: "The seven-year retention period appears in one policy source and needs an accountable owner.",
      requirements: ["demo-req-traceability"],
      resolution: "Awaiting compliance owner review.",
    },
  ];
  for (const conflict of conflicts) {
    await prisma.conflict.upsert({
      where: { id: conflict.id },
      update: { summary: conflict.summary, resolution: conflict.resolution },
      create: { ...conflict, projectId },
    });
  }

  const versions = [
    { id: "demo-version-1", label: "v1.0", summary: "Initial BRD from operational and policy sources.", impact: "Baseline for stakeholder review." },
    { id: "demo-version-2", label: "v1.1", summary: "Added evidence traceability and identified the SLA mismatch.", impact: "Policy owner decision required." },
  ];
  for (const version of versions) {
    await prisma.version.upsert({
      where: { id: version.id },
      update: { summary: version.summary, impact: version.impact },
      create: { ...version, projectId },
    });
  }

  const sections = [
    { position: 1, title: "Objective and scope", description: "Business outcome and boundaries.", content: "Create a shared operations hub that converts fragmented business inputs into traceable, reviewable requirements." },
    { position: 2, title: "Business requirements", description: "Validated functional and non-functional needs.", content: "Ingest varied source documents, extract candidate requirements, and preserve links to supporting evidence." },
    { position: 3, title: "Assumptions and constraints", description: "Known assumptions and delivery boundaries.", content: "Requirements remain subject to stakeholder validation. Source retention follows the applicable policy." },
    { position: 4, title: "Risks and open decisions", description: "Items requiring stakeholder review.", content: "Approval turnaround is inconsistent across source documents: 24 hours versus 48 hours." },
  ];
  for (const section of sections) {
    await prisma.brdSection.upsert({
      where: { projectId_position: { projectId, position: section.position } },
      update: { title: section.title, description: section.description, content: section.content },
      create: { ...section, projectId },
    });
  }

  console.log("Seeded the Atlas Ops Hub demo project with linked sources and evidence.");
}

main()
  .catch((error) => {
    console.error("Demo seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
