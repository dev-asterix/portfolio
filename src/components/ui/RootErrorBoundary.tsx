"use client";

import React from "react";
import { publish } from "@/lib/eventBus";

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
}

/**
 * Root-level React error boundary that catches unhandled errors in the component tree
 * and publishes a `crash` event via the kernel event bus so the BSODOverlay can take over.
 *
 * Requirements: 13.7
 */
class RootErrorBoundary extends React.Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const rawMessage = error?.message || "Unknown error";
    // Truncate reason to 256 characters per event bus contract
    const reason = rawMessage.length > 256 ? rawMessage.slice(0, 256) : rawMessage;

    try {
      publish("crash", { reason });
    } catch (publishError) {
      // If the event bus itself fails, log to console as a last resort
      console.error("[RootErrorBoundary] Failed to publish crash event:", publishError);
    }

    // Log component stack for debugging
    if (errorInfo?.componentStack) {
      console.error("[RootErrorBoundary] Component stack:", errorInfo.componentStack);
    }
  }

  /**
   * Reset the error boundary so the component tree can re-render.
   * Called externally (e.g., after BSOD reboot flow completes).
   */
  resetErrorBoundary = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render null — the BSODOverlay (subscribed to crash events) handles the actual display
      return null;
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
