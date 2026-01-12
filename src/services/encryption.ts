// ============================================
// Encryption Service
// Handles AES-GCM encryption/decryption for secure local storage
// ============================================
import type { EncryptedData } from "../models/interfaces";
import { EncryptionConfig } from "./config";

export class EncryptionService {
  /**
   * Encrypt data using AES-GCM
   * In debug mode, returns plain text for easy inspection
   */
  async encrypt(
    data: string,
    masterPasswordHash: string
  ): Promise<EncryptedData> {
    // In debug mode, skip encryption and return plain data
    if (!EncryptionConfig.useEncryption) {
      if (EncryptionConfig.logEncryption) {
        console.log("[DEBUG] Encryption bypassed - storing plain text");
      }
      return {
        encrypted: data,
        iv: "debug-mode-no-iv",
      };
    }

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
   * Generate a deterministic encrypted ID for database lookups
   * This allows us to lookup records without exposing the actual ID
   * In debug mode, returns the plain ID
   */
  async encryptId(id: string, masterPasswordHash: string): Promise<string> {
    // In debug mode, return plain ID
    if (!EncryptionConfig.useEncryption) {
      return id;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(id);

    // Use a deterministic IV derived from the ID itself
    const ivSource = await crypto.subtle.digest("SHA-256", data);
    const iv = new Uint8Array(ivSource.slice(0, 12));

    const keyMaterial = await this.deriveKey(masterPasswordHash);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keyMaterial,
      data
    );

    return this.arrayBufferToBase64(encrypted);
  }

  /**
   * Decrypt an encrypted ID back to its original form
   */
  async decryptId(
    encryptedId: string,
    originalId: string,
    masterPasswordHash: string
  ): Promise<boolean> {
    try {
      // Verify by re-encrypting the original ID and comparing
      const reencrypted = await this.encryptId(originalId, masterPasswordHash);
      return reencrypted === encryptedId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obfuscate field names using base64 encoding
   */
  obfuscateFieldName(fieldName: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(fieldName);
    return this.arrayBufferToBase64(data.buffer);
  }

  /**
   * De-obfuscate field names from base64
   */
  deobfuscateFieldName(obfuscatedName: string): string {
    const decoder = new TextDecoder();
    const buffer = this.base64ToArrayBuffer(obfuscatedName);
    return decoder.decode(buffer);
  }

  /**
   * Decrypt data using AES-GCM
   * In debug mode, returns the data as-is (since it wasn't encrypted)
   */
  async decrypt(
    encryptedData: string,
    iv: string,
    masterPasswordHash: string
  ): Promise<string> {
    // In debug mode, skip decryption and return plain data
    if (!EncryptionConfig.useEncryption) {
      if (EncryptionConfig.logEncryption) {
        console.log("[DEBUG] Decryption bypassed - reading plain text");
      }
      return encryptedData;
    }

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
   * Convert ArrayBuffer to Base64 string (URL-safe)
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Convert Base64 string to ArrayBuffer (handles URL-safe base64)
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Convert URL-safe base64 back to standard base64
    let standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    while (standardBase64.length % 4) {
      standardBase64 += "=";
    }

    const binary = atob(standardBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
