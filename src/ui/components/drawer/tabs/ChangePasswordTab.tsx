import { AlertCircle, CheckCircle, Key } from "lucide-react";
import { useState } from "react";
import { sendMessage } from "../../../../core/messages";
import { Button, Card, Input } from "../../common";

export const ChangePasswordTab = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[a-zA-Z]/.test(password)) {
      return "Password must contain at least one letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password
      const verifyResult = await sendMessage("VERIFY_MASTER_PASSWORD", {
        password: currentPassword,
      });

      if (!verifyResult.success) {
        setError("Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Set new password
      const setResult = await sendMessage("SET_MASTER_PASSWORD", {
        password: newPassword,
      });

      if (setResult.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError("Failed to change password");
      }
    } catch {
      setError("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Change Master Password
        </h2>
        <p className="text-text-secondary">
          Update your master password to secure your Link Lock settings
        </p>
      </div>

      {/* Form */}
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <Input
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Current password"
              label="Current Password"
              disabled={isLoading}
            />
          </div>

          {/* New Password */}
          <div>
            <Input
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="New password"
              label="New Password"
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Input
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              label="Confirm New Password"
              disabled={isLoading}
            />
          </div>

          {/* Password Requirements */}
          <div className="bg-bg-tertiary rounded-lg p-4">
            <h4 className="text-sm font-semibold text-text-primary mb-2">
              Password Requirements:
            </h4>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent-primary" />
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent-primary" />
                Contains at least one letter
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent-primary" />
                Contains at least one number
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-accent-danger bg-opacity-10 border border-accent-danger rounded-lg">
              <AlertCircle className="w-5 h-5 text-accent-danger flex-shrink-0" />
              <p className="text-sm text-accent-danger">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-accent-success bg-opacity-10 border border-accent-success rounded-lg">
              <CheckCircle className="w-5 h-5 text-accent-success flex-shrink-0" />
              <p className="text-sm text-accent-success">
                Password changed successfully!
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            leftIcon={<Key className="w-4 h-4" />}
          >
            {isLoading ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </Card>

      {/* Warning */}
      <Card padding="lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Important Note
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Changing your master password will not affect custom passwords set
              for individual sites. Make sure to remember your new password as
              it cannot be recovered.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
