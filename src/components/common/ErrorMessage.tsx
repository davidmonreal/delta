import { XCircle } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage = ({
  title = "Error",
  message,
  onRetry,
  className = "",
}: ErrorMessageProps) => {
  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{message}</p>
            </div>
          </div>
        </div>
        {onRetry ? (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onRetry}
              className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium leading-4 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
