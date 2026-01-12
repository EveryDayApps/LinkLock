// ============================================
// Configuration
// Controls encryption and obfuscation behavior
// ============================================

/**
 * Debug mode flag - controls encryption behavior
 * Set to true during development to see plain values in IndexedDB
 * Set to false in production to use full encryption
 *
 * This can be controlled via environment variables:
 * - In development: VITE_DEBUG_MODE=true
 * - In production: VITE_DEBUG_MODE=false (or omit)
 */
export const DEBUG_MODE =
  import.meta.env.VITE_DEBUG_MODE === "true" || import.meta.env.DEV;

/**
 * Configuration object for encryption and obfuscation
 */
export const EncryptionConfig = {
  /**
   * Whether to use encryption for data storage
   * If false, data is stored in plain text (for debugging only)
   */
  useEncryption: !DEBUG_MODE,

  /**
   * Whether to obfuscate field and table names
   * If false, descriptive names are used (for debugging only)
   */
  useObfuscation: !DEBUG_MODE,

  /**
   * Log encryption operations for debugging
   */
  logEncryption: DEBUG_MODE,
};

/**
 * Get table name based on configuration
 * In debug mode: returns descriptive names
 * In production: returns obfuscated names
 */
export function getTableName(
  logicalName: "profiles" | "rules" | "masterPassword"
): string {
  if (EncryptionConfig.useObfuscation) {
    const tableMap = {
      profiles: "t1",
      rules: "t2",
      masterPassword: "t3",
    };
    return tableMap[logicalName];
  }
  return logicalName;
}

/**
 * Get field name based on configuration
 * In debug mode: returns descriptive names
 * In production: returns obfuscated names
 */
export function getFieldName(
  logicalName: "key" | "data" | "vector" | "profiles" | "type"
): string {
  if (EncryptionConfig.useObfuscation) {
    const fieldMap = {
      key: "k",
      data: "d",
      vector: "v",
      profiles: "p",
      type: "t",
    };
    return fieldMap[logicalName];
  }
  // Return descriptive names in debug mode
  const debugFieldMap = {
    key: "id",
    data: "encryptedData",
    vector: "iv",
    profiles: "profileIds",
    type: "type",
  };
  return debugFieldMap[logicalName];
}
