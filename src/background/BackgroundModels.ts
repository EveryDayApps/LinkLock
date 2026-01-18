// ============================================
// Background Models - Types and interfaces for background script
// Contains all type definitions for database change messages
// ============================================

import { DB_CHANGE_MESSAGE_TYPE } from "@/models/constants";
import type { LinkRule, Profile } from "@/models/interfaces";
import type {
  EncryptedProfile,
  MasterPasswordData,
  StoredRule,
} from "@/models/types";

// ============================================
// Table and Operation Types
// ============================================

/**
 * Table names that can be affected by database changes
 */
export type TableName = "profiles" | "rules" | "masterPassword";

/**
 * Operation types for database changes
 * Maps to the message types sent via browser.runtime.sendMessage
 */
export type OperationType = "add" | "update" | "delete";

// ============================================
// Entity Types Mapping
// ============================================

/**
 * Maps table names to their stored (encrypted) types in IndexedDB
 */
export interface StoredEntityMap {
  profiles: EncryptedProfile;
  rules: StoredRule;
  masterPassword: MasterPasswordData;
}

/**
 * Maps table names to their decrypted types
 */
export interface DecryptedEntityMap {
  profiles: Profile;
  rules: LinkRule;
  masterPassword: MasterPasswordData;
}

// ============================================
// Payload and Message Types
// ============================================

/**
 * Base payload structure for database change messages
 * Includes optional newValue and oldValue for the actual data
 */
export interface DBChangePayload<T extends TableName = TableName> {
  table: T;
  type: OperationType;
  key?: string;
  newValue?: StoredEntityMap[T];
  oldValue?: StoredEntityMap[T];
}

/**
 * Typed payload for profile changes
 */
export interface ProfileChangePayload extends DBChangePayload<"profiles"> {
  table: "profiles";
  newValue?: EncryptedProfile;
  oldValue?: EncryptedProfile;
}

/**
 * Typed payload for rule changes
 */
export interface RuleChangePayload extends DBChangePayload<"rules"> {
  table: "rules";
  newValue?: StoredRule;
  oldValue?: StoredRule;
}

/**
 * Typed payload for master password changes
 */
export interface MasterPasswordChangePayload
  extends DBChangePayload<"masterPassword"> {
  table: "masterPassword";
  newValue?: MasterPasswordData;
  oldValue?: MasterPasswordData;
}

/**
 * Union type for all typed payloads
 */
export type TypedDBChangePayload =
  | ProfileChangePayload
  | RuleChangePayload
  | MasterPasswordChangePayload;

/**
 * Message structure for database change notifications
 * Uses TypedDBChangePayload for proper type discrimination
 */
export interface DBChangeMessage {
  type: typeof DB_CHANGE_MESSAGE_TYPE;
  payload: TypedDBChangePayload;
}

/**
 * Typed message structure with entity data
 */
export interface TypedDBChangeMessage<T extends TableName = TableName> {
  type: typeof DB_CHANGE_MESSAGE_TYPE;
  payload: DBChangePayload<T>;
}

// ============================================
// Handler Types
// ============================================

/**
 * Callback function type for handling database changes
 */
export type DBChangeHandler<T extends TableName = TableName> = (
  payload: DBChangePayload<T>,
) => void | Promise<void>;

/**
 * Handler registry for different tables and operations
 */
export interface TableHandlers<T extends TableName = TableName> {
  onCreate?: DBChangeHandler<T>;
  onUpdate?: DBChangeHandler<T>;
  onDelete?: DBChangeHandler<T>;
}

/**
 * Handler for profile changes
 */
export type ProfileChangeHandler = (
  payload: ProfileChangePayload,
) => void | Promise<void>;

/**
 * Handler for rule changes
 */
export type RuleChangeHandler = (
  payload: RuleChangePayload,
) => void | Promise<void>;

/**
 * Handler for master password changes
 */
export type MasterPasswordChangeHandler = (
  payload: MasterPasswordChangePayload,
) => void | Promise<void>;

/**
 * Handler for any database change (generic)
 */
export type AnyChangeHandler = (
  payload: TypedDBChangePayload,
) => void | Promise<void>;

/**
 * Table-specific handler registry for profiles
 */
export interface ProfileTableHandlers {
  onCreate?: ProfileChangeHandler;
  onUpdate?: ProfileChangeHandler;
  onDelete?: ProfileChangeHandler;
}

/**
 * Table-specific handler registry for rules
 */
export interface RuleTableHandlers {
  onCreate?: RuleChangeHandler;
  onUpdate?: RuleChangeHandler;
  onDelete?: RuleChangeHandler;
}

/**
 * Table-specific handler registry for master password
 */
export interface MasterPasswordTableHandlers {
  onCreate?: MasterPasswordChangeHandler;
  onUpdate?: MasterPasswordChangeHandler;
  onDelete?: MasterPasswordChangeHandler;
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if payload is for profiles table
 */
export function isProfilePayload(
  payload: DBChangePayload,
): payload is ProfileChangePayload {
  return payload.table === "profiles";
}

/**
 * Check if payload is for rules table
 */
export function isRulePayload(
  payload: DBChangePayload,
): payload is RuleChangePayload {
  return payload.table === "rules";
}

/**
 * Check if payload is for masterPassword table
 */
export function isMasterPasswordPayload(
  payload: DBChangePayload,
): payload is MasterPasswordChangePayload {
  return payload.table === "masterPassword";
}

// ============================================
// Re-export commonly used types for convenience
// ============================================

export type {
  EncryptedProfile,
  LinkRule,
  MasterPasswordData,
  Profile,
  StoredRule
};

