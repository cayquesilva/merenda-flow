-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nome_plataforma" TEXT NOT NULL DEFAULT 'Merenda Flow',
    "subtitulo" TEXT NOT NULL DEFAULT 'Gestão de Alimentação Escolar',
    "cor_primaria" TEXT,
    "cor_menu" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);
