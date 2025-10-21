import React from "react";
import { ExternalLink } from "lucide-react";
import BackButton from "../components/ui/BackButton";

function Legal() {
  return (
    <div className="min-h-screen pb-8">
      <BackButton to="/" name="Dashboard" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Legal & Attributions
          </h1>
          <p className="text-white/70">
            Third-party content licenses and attributions
          </p>
        </div>

        {/* Music Attributions Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Music Attributions
          </h2>

          {/* Für Elise Attribution */}
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-5 space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">
                Alarm Sound
              </h3>

              <div className="space-y-2 text-white/90">
                <div>
                  <span className="font-semibold text-white">Title: </span>
                  <span>"Complete Performance"</span>
                </div>

                <div>
                  <span className="font-semibold text-white">
                    Performed by:{" "}
                  </span>
                  <span>German Kitkin (piano)</span>
                </div>

                <div>
                  <span className="font-semibold text-white">
                    Published by:{" "}
                  </span>
                  <span>Lev Kitkin</span>
                </div>

                <div>
                  <span className="font-semibold text-white">Source: </span>
                  <a
                    href="https://imslp.org/wiki/Special:ReverseLookup/929281"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-indigo-200 underline inline-flex items-center gap-1 transition-colors"
                  >
                    IMSLP Recording Page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <span className="font-semibold text-white">License: </span>
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-indigo-200 underline inline-flex items-center gap-1 transition-colors"
                  >
                    Creative Commons Attribution 4.0 International (CC BY 4.0)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm text-white/70 italic">
                    <span className="font-semibold text-white">
                      Contextual Note:{" "}
                    </span>
                    Original composition: Für Elise by L. V. Beethoven, Public
                    Domain
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-3">
            About Creative Commons Licenses
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            The Creative Commons Attribution (CC BY) license allows for sharing
            and adaptation of the work, even commercially, as long as
            appropriate credit is given to the creator. We are grateful to the
            performers and publishers who make their recordings available under
            these licenses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Legal;
