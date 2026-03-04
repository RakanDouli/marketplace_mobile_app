/**
 * BottomSheet Component
 * Simple wrapper around BaseModal for backward compatibility
 * Use BaseModal directly for more control
 */

import React from 'react';
import { BaseModal, BaseModalProps } from './BaseModal';

export interface BottomSheetProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Maximum height as percentage (default: 80) */
  maxHeightPercent?: number;
  /** Whether tapping backdrop closes modal (default: true) */
  closeOnBackdropPress?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeightPercent = 80,
  closeOnBackdropPress = true,
}: BottomSheetProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={showCloseButton}
      maxHeightPercent={maxHeightPercent}
      position="bottom"
      closeOnBackdropPress={closeOnBackdropPress}
    >
      {children}
    </BaseModal>
  );
}

export default BottomSheet;
