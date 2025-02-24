import { Award } from "lucide-react";

 export function Achievements() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Latest Achievements</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <Award className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="font-semibold text-gray-800">Perfect Pitch Master</p>
                <p className="text-sm text-gray-600">Achieved 100% accuracy in note recognition</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <Award className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="font-semibold text-gray-800">Rhythm Virtuoso</p>
                <p className="text-sm text-gray-600">Completed all rhythm exercises</p>
              </div>
            </div>
          </div>
        </div>
    )
}