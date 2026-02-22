/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays fallback UI
 * Prevents entire app from crashing due to component errors
 *
 * NOTE: Uses plain RN Text component (not themed) because ErrorBoundary
 * wraps ThemeProvider and doesn't have access to theme context.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Call optional error handler (for analytics/reporting)
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI - uses plain RN Text (no theme dependency)
      return (
        <View style={styles.container}>
          <AlertTriangle size={48} color="#E53935" />
          <Text style={styles.title}>
            حدث خطأ غير متوقع
          </Text>
          <Text style={styles.message}>
            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <RefreshCw size={18} color="#FFFFFF" />
            <Text style={styles.retryText}>
              إعادة المحاولة
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    writingDirection: 'rtl',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorBoundary;
