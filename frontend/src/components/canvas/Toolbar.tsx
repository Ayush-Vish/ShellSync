import { Loader2, Maximize, TerminalIcon } from "lucide-react";

const Toolbar = ({
  onAddItem,
  onReset,
  isConnected,
  isCreating,
  permission,
}: {
  onAddItem: () => void;
  onReset: () => void;
  isConnected: boolean;
  isCreating: boolean;
  permission?: 'host' | 'read-write' | 'read-only' | null;
}) => {
  const _canWrite = permission === 'host' || permission === 'read-write';
  void _canWrite; // Reserved for future use

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
        title={isConnected ? "Connected" : "Disconnected"}
      />

    
        <button
          onClick={onAddItem}
          disabled={!isConnected || isCreating}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {isCreating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <TerminalIcon size={18} />
          )}
          {isCreating ? "Creating..." : "Add Terminal"}
        </button>

      <button
        onClick={onReset}
        className="flex p-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-600 transition-colors shadow-lg"
        title="Reset View"
      >
        <Maximize size={18} />
      </button>
    </div>
  );
};

export default Toolbar;
