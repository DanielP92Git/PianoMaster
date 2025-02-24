import { Loader2 } from "lucide-react";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );
}

export default Spinner;
