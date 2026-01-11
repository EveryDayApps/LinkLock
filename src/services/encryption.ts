// ============================================
// Encryption Service
// Handles AES-GCM encryption/decryption for secure local storage
// ============================================

// ============================================
// Encryption Service
// Handles AES-GCM encryption/decryption for secure local storage
// ============================================
import type { EncryptedData } from "../models/interfaces";

export class EncryptionService {
  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(
    data: string,
    masterPasswordHash: string
  ): Promise<EncryptedData> {
    const keyMaterial = await this.deriveKey(masterPasswordHash);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keyMaterial,
      encoder.encode(data)
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer),
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(
    encryptedData: string,
    iv: string,
    masterPasswordHash: string
  ): Promise<string> {
    const keyMaterial = await this.deriveKey(masterPasswordHash);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: this.base64ToArrayBuffer(iv) },
      keyMaterial,
      this.base64ToArrayBuffer(encryptedData)
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Derive encryption key from password hash using PBKDF2
   */
  private async deriveKey(passwordHash: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passwordHash),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("linklock-salt-v1"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
