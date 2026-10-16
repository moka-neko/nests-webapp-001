-- AlterTable
ALTER TABLE "TeacherApplication"
ADD COLUMN "interviewCandidateDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "interviewScheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WeeklyInterviewReminder" (
    "id" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "applicantCount" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyInterviewReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyInterviewReminder_weekStart_key" ON "WeeklyInterviewReminder"("weekStart");
