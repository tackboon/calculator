const importKey = async (base64Key: string): Promise<CryptoKey> => {
  const rawKey = Uint8Array.from(atob(base64Key), (char) => char.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    {
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

export const aesEncrypt = async (
  key: string,
  value: string
): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const cryptoKey = await importKey(key);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    encoded
  );

  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const encryptedHex = Array.from(new Uint8Array(encrypted))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${ivHex}:${encryptedHex}`;
};

export const aesDecrypt = async (
  key: string,
  encryptedValue: string
): Promise<string | null> => {
  try {
    const cryptoKey = await importKey(key);
    const [ivHex, encryptedHex] = encryptedValue.split(":");
    const iv = Uint8Array.from(
      ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const encrypted = Uint8Array.from(
      encryptedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      cryptoKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
