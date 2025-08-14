-- CreateTable
CREATE TABLE "metadados" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metadados_pkey" PRIMARY KEY ("chave")
);
