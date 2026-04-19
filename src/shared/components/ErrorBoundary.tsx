import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Power, Copy, Check } from "lucide-react";

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    copied: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleCopyError = () => {
    if (this.state.error) {
      const stack = this.state.error.stack || "";
      navigator.clipboard.writeText(this.state.error.toString() + "\n" + stack);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[200px] flex items-center justify-center p-4 bg-[#110f0f] border border-red-900/30 rounded-lg">
          <div className="max-w-md w-full bg-[#1a1111] border border-red-900/50 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <div className="p-3 bg-red-900/20 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Renderer Crashed</h2>
                <p className="text-xs text-red-400/80">
                  The GPU process or React tree encountered a fatal error.
                </p>
              </div>
            </div>

            <div className="bg-black/50 rounded-lg p-3 border border-red-900/30 overflow-hidden">
              <code className="text-[10px] font-mono text-red-300 break-words whitespace-pre-wrap block max-h-32 overflow-y-auto custom-scrollbar">
                {this.state.error?.toString()}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase rounded transition-colors"
              >
                <Power size={14} /> Try Reset
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded transition-colors shadow-lg shadow-red-900/20"
              >
                <RefreshCw size={14} /> Reload App
              </button>
            </div>

            <button
              onClick={this.handleCopyError}
              className="flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              {this.state.copied ? <Check size={12} /> : <Copy size={12} />}
              {this.state.copied ? "Error Copied" : "Copy Error Details"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
