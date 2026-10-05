CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "health" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conflict" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "requirements" TEXT[],
    "resolution" TEXT NOT NULL,
    CONSTRAINT "Conflict_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "excerpt" TEXT NOT NULL,
    "uploadedSourceId" TEXT,
    "requirementId" TEXT,
    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "extractedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrdSection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "BrdSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Version" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impact" TEXT NOT NULL,
    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Impact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    CONSTRAINT "Impact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Requirement_projectId_status_idx" ON "Requirement"("projectId", "status");
CREATE INDEX "Evidence_projectId_idx" ON "Evidence"("projectId");
CREATE INDEX "Evidence_requirementId_idx" ON "Evidence"("requirementId");
CREATE INDEX "Evidence_uploadedSourceId_idx" ON "Evidence"("uploadedSourceId");
CREATE INDEX "Source_projectId_createdAt_idx" ON "Source"("projectId", "createdAt");
CREATE UNIQUE INDEX "BrdSection_projectId_position_key" ON "BrdSection"("projectId", "position");
CREATE INDEX "Version_projectId_timestamp_idx" ON "Version"("projectId", "timestamp");

ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conflict" ADD CONSTRAINT "Conflict_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedSourceId_fkey" FOREIGN KEY ("uploadedSourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrdSection" ADD CONSTRAINT "BrdSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Version" ADD CONSTRAINT "Version_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Impact" ADD CONSTRAINT "Impact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
