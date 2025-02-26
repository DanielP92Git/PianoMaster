import { Award } from "lucide-react";

export function Achievements() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Latest Achievements</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
            <Award className="h-8 w-8 text-indigo-400" />
            <div className="ml-4">
              <p className="font-semibold text-white">Perfect Pitch Master</p>
              <p className="text-sm text-gray-300">
                Achieved 100% accuracy in note recognition
              </p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
            <Award className="h-8 w-8 text-emerald-400" />
            <div className="ml-4">
              <p className="font-semibold text-white">Rhythm Virtuoso</p>
              <p className="text-sm text-gray-300">
                Completed all rhythm exercises
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}