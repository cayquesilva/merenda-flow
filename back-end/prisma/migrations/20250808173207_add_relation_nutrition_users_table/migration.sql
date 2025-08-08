-- CreateTable
CREATE TABLE "_UsuarioUnidades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UsuarioUnidades_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UsuarioUnidades_B_index" ON "_UsuarioUnidades"("B");

-- AddForeignKey
ALTER TABLE "_UsuarioUnidades" ADD CONSTRAINT "_UsuarioUnidades_A_fkey" FOREIGN KEY ("A") REFERENCES "UnidadeEducacional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioUnidades" ADD CONSTRAINT "_UsuarioUnidades_B_fkey" FOREIGN KEY ("B") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
