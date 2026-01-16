// ============================================
// Export/Import Manager Service
// Handles secure backup and restore of LinkLock data
// ============================================

import type { LinkRule, Profile } from "../models/interfaces";

// ============================================
// Export Format Types
// ============================================

/**
 * Schema version for the export format
 * Increment this when making breaking changes to the format
 */
export const EXPORT_FORMAT_VERSION = "1.0";

/**
 * Supported format versions for import
 * Add older versions here when implementing migrations
 */
export const SUPPORTED_FORMAT_VERSIONS = ["1.0"];

/**
 * Options for what to include in export
 */
export interface ExportOptions {
  includeProfiles: boolean;
  includeRules: boolean;
}

/**
 * Options for what to import
 */
export interface ImportOptions {
  importProfiles: boolean;
  importRules: boolean;
  mergeStrategy: "replace" | "merge";
}

/**
 * Metadata visible without decryption
 * Safe for display in UI before password entry
 */
export interface ExportMetadata {
  profileCount: number;
  ruleCount: number;
  includesProfiles: boolean;
  includesRules: boolean;
}

/**
 * Encryption parameters stored in export
 */
export interface ExportEncryption {
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2";
  iterations: number;
  hash: "SHA-256";
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
}

/**
 * The complete export file format
 */
export interface ExportFile {
  formatVersion: string;
  appVersion: string;
  exportedAt: string;
  exportId: string;
  metadata: ExportMetadata;
  encryption: ExportEncryption;
  payload: string; // Base64 encoded encrypted data
  checksum: string; // SHA-256 hash of decrypted payload for integrity
}

/**
 * Decrypted payload structure
 */
export interface ExportPayload {
  profiles?: Profile[];
  rules?: LinkRule[];
}

/**
 * Result of parsing/validating an export file
 */
export interface ParseResult {
  valid: boolean;
  error?: string;
  metadata?: ExportMetadata;
  formatVersion?: string;
  exportedAt?: string;
  needsMigration?: boolean;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  error?: string;
  imported?: {
    profiles: number;
    rules: number;
  };
}

// ============================================
// Export/Import Manager
// ============================================

export class ExportImportManager {
  constructor() {
    // ExportImportManager uses Web Crypto API directly for key derivation
  }

  // ============================================
  // Export Functions
  // ============================================

  /**
   * Create an export file with selected data
   * @param masterPassword - User's master password (for encryption)
   * @param profiles - Profiles to export (already decrypted)
   * @param rules - Rules to export (already decrypted)
   * @param options - What to include in export
   * @returns Export file object ready to be saved as JSON
   */
  async createExport(
    masterPassword: string,
    profiles: Profile[],
    rules: LinkRule[],
    options: ExportOptions
  ): Promise<{ success: boolean; data?: ExportFile; error?: string }> {
    try {
      // Generate unique export ID
      const exportId = crypto.randomUUID();

      // Generate fresh salt for this export
      const saltArray = crypto.getRandomValues(new Uint8Array(16));
      const salt = this.arrayBufferToBase64(saltArray.buffer);

      // Derive encryption key from master password with fresh salt
      const exportKey = await this.deriveExportKey(masterPassword, salt);

      // Build payload with selected data
      const payload: ExportPayload = {};

      if (options.includeProfiles) {
        payload.profiles = profiles;
      }

      if (options.includeRules) {
        payload.rules = rules;
      }

      // Stringify payload
      const payloadString = JSON.stringify(payload);

      // Generate checksum before encryption
      const checksum = await this.generateChecksum(payloadString);

      // Encrypt payload
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encryptedPayload = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        exportKey,
        encoder.encode(payloadString)
      );

      // Build export file
      const exportFile: ExportFile = {
        formatVersion: EXPORT_FORMAT_VERSION,
        appVersion: "1.0.0", // TODO: Get from package.json or manifest
        exportedAt: new Date().toISOString(),
        exportId,
        metadata: {
          profileCount: options.includeProfiles ? profiles.length : 0,
          ruleCount: options.includeRules ? rules.length : 0,
          includesProfiles: options.includeProfiles,
          includesRules: options.includeRules,
        },
        encryption: {
          algorithm: "AES-GCM",
          keyDerivation: "PBKDF2",
          iterations: 100000,
          hash: "SHA-256",
          salt,
          iv: this.arrayBufferToBase64(iv.buffer),
        },
        payload: this.arrayBufferToBase64(encryptedPayload),
        checksum,
      };

      return { success: true, data: exportFile };
    } catch (error) {
      console.error("[ExportImport] Export failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  /**
   * Download export file as JSON
   */
  downloadExport(exportFile: ExportFile, filename?: string): void {
    const json = JSON.stringify(exportFile, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      filename || `linklock-backup-${exportFile.exportedAt.split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Import Functions
  // ============================================

  /**
   * Parse and validate an export file without decrypting
   * Use this to show preview info before asking for password
   */
  parseExportFile(fileContent: string): ParseResult {
    try {
      const data = JSON.parse(fileContent);

      // Check required fields
      if (!data.formatVersion) {
        return { valid: false, error: "Missing format version" };
      }

      if (!SUPPORTED_FORMAT_VERSIONS.includes(data.formatVersion)) {
        return {
          valid: false,
          error: `Unsupported format version: ${data.formatVersion}. Supported versions: ${SUPPORTED_FORMAT_VERSIONS.join(", ")}`,
        };
      }

      if (!data.encryption || !data.payload) {
        return { valid: false, error: "Invalid export file structure" };
      }

      if (!data.metadata) {
        return { valid: false, error: "Missing metadata" };
      }

      // Check encryption parameters
      if (
        data.encryption.algorithm !== "AES-GCM" ||
        data.encryption.keyDerivation !== "PBKDF2"
      ) {
        return { valid: false, error: "Unsupported encryption algorithm" };
      }

      return {
        valid: true,
        metadata: data.metadata,
        formatVersion: data.formatVersion,
        exportedAt: data.exportedAt,
        needsMigration: data.formatVersion !== EXPORT_FORMAT_VERSION,
      };
    } catch {
      return { valid: false, error: "Invalid JSON file" };
    }
  }

  /**
   * Decrypt and extract payload from export file
   * @param exportFile - Parsed export file object
   * @param masterPassword - User's master password for decryption
   */
  async decryptExport(
    exportFile: ExportFile,
    masterPassword: string
  ): Promise<{ success: boolean; data?: ExportPayload; error?: string }> {
    try {
      // Derive key using the salt from the export file
      const exportKey = await this.deriveExportKey(
        masterPassword,
        exportFile.encryption.salt
      );

      // Decrypt payload
      const encryptedData = this.base64ToArrayBuffer(exportFile.payload);
      const iv = this.base64ToArrayBuffer(exportFile.encryption.iv);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        exportKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      const payloadString = decoder.decode(decryptedBuffer);

      // Verify checksum
      const calculatedChecksum = await this.generateChecksum(payloadString);
      if (calculatedChecksum !== exportFile.checksum) {
        return {
          success: false,
          error: "Data integrity check failed. File may be corrupted.",
        };
      }

      const payload = JSON.parse(payloadString) as ExportPayload;

      return { success: true, data: payload };
    } catch (error) {
      console.error("[ExportImport] Decryption failed:", error);
      // Most likely wrong password
      return {
        success: false,
        error: "Decryption failed. Please check your password.",
      };
    }
  }

  /**
   * Apply format migrations if needed
   * Currently no migrations needed for v1.0
   */
  migratePayload(payload: ExportPayload, fromVersion: string): ExportPayload {
    // Migration logic will go here when format changes
    // For now, v1.0 is the only version
    if (fromVersion === "1.0") {
      return payload;
    }

    return payload;
  }

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Derive encryption key for export/import using PBKDF2
   * Uses a fresh salt for each export
   */
  private async deriveExportKey(
    password: string,
    salt: string
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive actual encryption key
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.base64ToArrayBuffer(salt),
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
   * Generate SHA-256 checksum of data
   */
  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(data)
    );
    return this.arrayBufferToBase64(hashBuffer);
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
