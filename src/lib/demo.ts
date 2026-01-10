// ============================================
// Demo/Test Script for Profile Management
// Run this in browser console to test the system
// ============================================

import { ProfileManager } from "./profileManager";
import { StorageService } from "./storage";
import { EncryptionService } from "./encryption";

/**
 * Demo: Basic Profile Management
 */
export async function demoProfileManagement() {
  console.log("=== Profile Management Demo ===\n");

  // Initialize with a master password hash
  const masterPasswordHash = "demo-master-password-hash-12345";
  const manager = new ProfileManager();

  console.log("1. Initializing ProfileManager...");
  await manager.initialize(masterPasswordHash);

  // Get initial profiles (should have default profile)
  console.log("\n2. Getting all profiles:");
  console.log(manager.getAllProfiles());

  // Create some profiles
  console.log("\n3. Creating profiles...");
  const workResult = await manager.createProfile("Work");
  console.log("Created Work profile:", workResult);

  const focusResult = await manager.createProfile("Focus");
  console.log("Created Focus profile:", focusResult);

  const kidsResult = await manager.createProfile("Kids");
  console.log("Created Kids profile:", kidsResult);

  // Try to create duplicate
  console.log("\n4. Testing duplicate profile name...");
  const duplicateResult = await manager.createProfile("Work");
  console.log("Duplicate result (should fail):", duplicateResult);

  // List all profiles
  console.log("\n5. All profiles:");
  const allProfiles = manager.getAllProfiles();
  allProfiles.forEach((p) => {
    console.log(`- ${p.name} (${p.isActive ? "ACTIVE" : "inactive"})`);
  });

  // Switch profile
  console.log("\n6. Switching to Work profile...");
  if (workResult.profileId) {
    const switchResult = await manager.switchProfile(workResult.profileId);
    console.log("Switch result:", switchResult);
    console.log("Active profile:", manager.getActiveProfile()?.name);
  }

  // Update profile
  console.log("\n7. Updating Focus profile name...");
  if (focusResult.profileId) {
    const updateResult = await manager.updateProfile(
      focusResult.profileId,
      "Deep Focus"
    );
    console.log("Update result:", updateResult);
  }

  // Try to delete active profile
  console.log("\n8. Attempting to delete active profile (should fail)...");
  if (workResult.profileId) {
    const deleteResult = await manager.deleteProfile(workResult.profileId);
    console.log("Delete active result:", deleteResult);
  }

  // Delete inactive profile
  console.log("\n9. Deleting Kids profile...");
  if (kidsResult.profileId) {
    const deleteResult = await manager.deleteProfile(kidsResult.profileId);
    console.log("Delete result:", deleteResult);
  }

  // Final list
  console.log("\n10. Final profile list:");
  const finalProfiles = manager.getAllProfiles();
  finalProfiles.forEach((p) => {
    console.log(`- ${p.name} (${p.isActive ? "ACTIVE" : "inactive"})`);
  });

  console.log("\n=== Demo Complete ===");
}

/**
 * Demo: Encryption & Storage
 */
export async function demoEncryptionStorage() {
  console.log("=== Encryption & Storage Demo ===\n");

  const encryptionService = new EncryptionService();
  const storageService = new StorageService();

  const masterPasswordHash = "demo-password-hash";
  const testData = {
    message: "Hello, encrypted world!",
    timestamp: Date.now(),
    sensitive: "This is secret data",
  };

  console.log("1. Original data:");
  console.log(testData);

  // Encrypt data
  console.log("\n2. Encrypting data...");
  const encrypted = await encryptionService.encrypt(
    JSON.stringify(testData),
    masterPasswordHash
  );
  console.log("Encrypted data (truncated):");
  console.log({
    encrypted: encrypted.encrypted.substring(0, 50) + "...",
    iv: encrypted.iv,
  });

  // Decrypt data
  console.log("\n3. Decrypting data...");
  const decrypted = await encryptionService.decrypt(
    encrypted.encrypted,
    encrypted.iv,
    masterPasswordHash
  );
  console.log("Decrypted data:");
  console.log(JSON.parse(decrypted));

  // Test storage service
  console.log("\n4. Testing storage service...");
  await storageService.save("test_key", testData, masterPasswordHash);
  console.log("Data saved to storage");

  const loaded = await storageService.load("test_key", masterPasswordHash);
  console.log("Loaded from storage:");
  console.log(loaded);

  // Clean up
  await storageService.delete("test_key");
  console.log("\n5. Test data cleaned up");

  console.log("\n=== Demo Complete ===");
}

/**
 * Demo: Full Profile Workflow
 */
export async function demoFullWorkflow() {
  console.log("=== Full Profile Workflow Demo ===\n");

  const masterPasswordHash = "workflow-demo-password";
  const manager = new ProfileManager();

  console.log("Scenario: User sets up profiles for different contexts\n");

  // Initialize
  console.log("Step 1: First launch - initialize with default profile");
  await manager.initialize(masterPasswordHash);
  console.log(`Active profile: ${manager.getActiveProfile()?.name}\n`);

  // Create work profile
  console.log("Step 2: Create 'Work' profile for office hours");
  const workResult = await manager.createProfile("Work");
  console.log(`Created: ${workResult.success}\n`);

  // Create personal profile
  console.log("Step 3: Create 'Personal' profile for after hours");
  const personalResult = await manager.createProfile("Personal");
  console.log(`Created: ${personalResult.success}\n`);

  // Switch to work mode
  console.log("Step 4: Start work day - switch to Work profile");
  if (workResult.profileId) {
    await manager.switchProfile(workResult.profileId);
    console.log(`Active profile: ${manager.getActiveProfile()?.name}\n`);
  }

  // Later in the day...
  console.log("Step 5: Work day ends - switch to Personal profile");
  if (personalResult.profileId) {
    await manager.switchProfile(personalResult.profileId);
    console.log(`Active profile: ${manager.getActiveProfile()?.name}\n`);
  }

  // Rename default profile
  console.log("Step 6: Rename 'Default' profile to 'Browsing'");
  const defaultProfile = manager
    .getAllProfiles()
    .find((p) => p.name === "Default");
  if (defaultProfile) {
    await manager.updateProfile(defaultProfile.id, "Browsing");
  }

  // Final state
  console.log("\nStep 7: Final profile configuration:");
  manager.getAllProfiles().forEach((p, i) => {
    console.log(
      `${i + 1}. ${p.name} ${p.isActive ? "(ACTIVE)" : ""}`
    );
  });

  console.log("\n=== Workflow Complete ===");
}

// Export all demos
export const demos = {
  profileManagement: demoProfileManagement,
  encryptionStorage: demoEncryptionStorage,
  fullWorkflow: demoFullWorkflow,
};

// Browser console helper
if (typeof window !== "undefined") {
  (window as any).linkLockDemo = demos;
  console.log(
    "LinkLock demos loaded! Run these in console:\n" +
      "- linkLockDemo.profileManagement()\n" +
      "- linkLockDemo.encryptionStorage()\n" +
      "- linkLockDemo.fullWorkflow()"
  );
}
