import { useState } from 'react';
import { Modal, Input, Button } from '../../common';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  description?: string;
}

export const MasterPasswordModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Enter Master Password',
  description = 'This action requires your master password',
}: MasterPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    onConfirm(password);
    handleClose();
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </>
      }
    >
      <Input
        type="password"
        value={password}
        onChange={(val) => {
          setPassword(val);
          setError('');
        }}
        onEnter={handleConfirm}
        placeholder="Enter your master password"
        autoFocus
        error={error}
      />
    </Modal>
  );
};
