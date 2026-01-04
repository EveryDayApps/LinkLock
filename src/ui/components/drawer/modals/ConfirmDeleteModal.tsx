import { Modal, Button } from '../../common';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Link?',
  message,
  itemName,
}: ConfirmDeleteModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const defaultMessage = itemName
    ? `Are you sure you want to delete the rule for ${itemName}?`
    : 'Are you sure you want to delete this item?';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-text-primary">{message || defaultMessage}</p>
        <p className="text-sm text-text-muted">
          This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
};
