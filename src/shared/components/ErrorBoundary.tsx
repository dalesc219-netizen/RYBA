import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-xl border border-rose-500/30 w-full h-full min-h-[200px]">
          <AlertTriangle className="text-rose-500 mb-4 w-12 h-12" />
          <h2 className="text-slate-100 font-bold mb-2">Ошибка модуля</h2>
          <p className="text-slate-400 text-sm text-center mb-4">
            {this.props.fallbackMessage || 'Не удалось загрузить этот компонент. Приложение продолжает работу.'}
          </p>
          <button
            className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
