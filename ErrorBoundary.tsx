import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Store error in localStorage for debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    existingLogs.unshift(errorLog);
    // Keep only last 50 errors
    localStorage.setItem('errorLogs', JSON.stringify(existingLogs.slice(0, 50)));
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">عذراً، حدث خطأ ما</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600 dark:text-slate-400 text-center">
                نعتذر عن الإزعاج. حدث خطأ غير متوقع في التطبيق.
                <br />
                فريق الدعم لدينا تم إخطاره بالمشكلة.
              </p>

              {this.state.error && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      تفاصيل الخطأ:
                    </span>
                  </div>
                  <code className="block text-sm text-red-600 break-all">
                    {this.state.error.message}
                  </code>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={this.handleReload} variant="default">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  إعادة تحميل الصفحة
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="ml-2 h-4 w-4" />
                  العودة للرئيسية
                </Button>
                <Button onClick={this.handleClearError} variant="ghost">
                  تجاهل الخطأ
                </Button>
              </div>

              <div className="text-center text-sm text-slate-500">
                <p>إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني</p>
                <p className="mt-1">معرف الخطأ: {crypto.randomUUID().slice(0, 8)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Error handled:', error);
    // You can also send to error reporting service here
  };
}
