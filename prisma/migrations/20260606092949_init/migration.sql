-- CreateTable
CREATE TABLE "TeacherApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nameKanji" TEXT NOT NULL,
    "nameKatakana" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "workLocation" TEXT NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "questions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lineDisplayName" TEXT,
    "lineUserId" TEXT,
    "meetingUrl" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "questions" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
