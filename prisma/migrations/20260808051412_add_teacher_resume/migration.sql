-- AlterTable
ALTER TABLE "TeacherApplication" ALTER COLUMN "resumeUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TeacherResume" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "birthDate" TEXT,
    "gender" TEXT,
    "phoneNumber" TEXT,
    "postalCode" TEXT,
    "address" TEXT,
    "nearestStation" TEXT,
    "education" JSONB,
    "workHistory" JSONB,
    "qualifications" JSONB,
    "motivation" TEXT,
    "selfPromotion" TEXT,
    "hobbies" TEXT,
    "requests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherResume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherResume_applicationId_key" ON "TeacherResume"("applicationId");

-- AddForeignKey
ALTER TABLE "TeacherResume" ADD CONSTRAINT "TeacherResume_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TeacherApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
