import type { HilRequestEvent, HilOption } from "@opensprint/shared";

const CATEGORY_LABELS: Record<string, string> = {
  scopeChanges: "Scope Changes",
  architectureDecisions: "Architecture Decisions",
  dependencyModifications: "Dependency Modifications",
  testFailuresAndRetries: "Test Failures & Retries",
};

interface HilApprovalModalProps {
  request: HilRequestEvent;
  onRespond: (requestId: string, approved: boolean, notes?: string) => void;
}

export function HilApprovalModal({ request, onRespond }: HilApprovalModalProps) {
  const categoryLabel = CATEGORY_LABELS[request.category] ?? request.category;

  const handleOption = (option: HilOption) => {
    const approved = option.id === "approve" || option.id === "retry";
    onRespond(request.requestId, approved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          Approval required: {categoryLabel}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{request.description}</p>
        <div className="mt-4 flex flex-col gap-2">
          {request.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOption(option)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                option.id === "approve" || option.id === "retry"
                  ? "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span className="block">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                  {option.description}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
