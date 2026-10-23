"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/** Includes lazy chunk failures, which React effects cannot catch. */
export class VillageLoadBoundary extends Component<{
  children: ReactNode;
  onFailure: () => void;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[village] Interactive layer failed", error, info);
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
