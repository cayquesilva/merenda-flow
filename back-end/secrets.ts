import crypto from "crypto";

// Cifra segredos guardados no banco (AES-256-GCM). A chave deriva de APP_SECRET
// (ou, na falta dele, de JWT_SECRET) e não é salva em lugar nenhum.
const chaveDeCifra = () =>
  crypto
    .createHash("sha256")
    .update(process.env.APP_SECRET || process.env.JWT_SECRET || "fallback-secret-key")
    .digest();

export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", chaveDeCifra(), iv);
  const dados = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), dados].map((b) => b.toString("base64")).join(":");
}

export function decifrar(valor: string): string {
  const [iv, tag, dados] = valor.split(":").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", chaveDeCifra(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(dados), decipher.final()]).toString("utf8");
}
