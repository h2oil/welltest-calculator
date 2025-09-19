import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging (in production, this would go to error reporting service)
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, showDetails: false });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  copyErrorDetails = () => {
    const errorDetails = `
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
    `.trim();
    
    navigator.clipboard.writeText(errorDetails).then(() => {
      // You could add a toast notification here if needed
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorDetails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </AlertDescription>
              </Alert>
              
              {this.state.error && (
                <div className="space-y-2">
                  <Button
                    onClick={this.toggleDetails}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {this.state.showDetails ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                  </Button>
                  
                  {this.state.showDetails && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Error Information:</span>
                        <Button
                          onClick={this.copyErrorDetails}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-64 border">
                        <div className="font-semibold text-red-600">Error Message:</div>
                        <div className="mb-2">{this.state.error.message || 'Unknown error'}</div>
                        
                        <div className="font-semibold text-red-600">Stack Trace:</div>
                        <div className="mb-2 whitespace-pre-wrap">{this.state.error.stack || 'No stack trace available'}</div>
                        
                        {this.state.errorInfo?.componentStack && (
                          <>
                            <div className="font-semibold text-red-600">Component Stack:</div>
                            <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                          </>
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
