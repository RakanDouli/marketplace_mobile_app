/**
 * Reports Store
 * Handles reporting listings/users
 */

import { create } from 'zustand';
import { authGraphqlRequest } from '../services/graphql/client';

const CREATE_REPORT_MUTATION = `
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      id
      status
    }
  }
`;

// Report reason options
export const REPORT_REASONS = [
  { value: 'spam', label: 'إعلان مزعج أو متكرر' },
  { value: 'fake', label: 'إعلان وهمي أو احتيالي' },
  { value: 'wrong_category', label: 'تصنيف خاطئ' },
  { value: 'wrong_price', label: 'سعر غير صحيح' },
  { value: 'offensive', label: 'محتوى مسيء أو غير لائق' },
  { value: 'sold', label: 'تم بيعه بالفعل' },
  { value: 'other', label: 'سبب آخر' },
] as const;

export type ReportReason = typeof REPORT_REASONS[number]['value'];

interface CreateReportInput {
  entityType: 'listing' | 'user' | 'thread';
  entityId: string;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
}

interface ReportsState {
  isSubmitting: boolean;
  error: string | null;
  submitReport: (input: CreateReportInput) => Promise<boolean>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  isSubmitting: false,
  error: null,

  submitReport: async (input: CreateReportInput) => {
    set({ isSubmitting: true, error: null });

    try {
      await authGraphqlRequest(CREATE_REPORT_MUTATION, { input });
      set({ isSubmitting: false });
      return true;
    } catch (error: any) {
      console.error('[reportsStore] Error submitting report:', error);
      set({
        error: error?.message || 'فشل إرسال البلاغ',
        isSubmitting: false,
      });
      return false;
    }
  },
}));
