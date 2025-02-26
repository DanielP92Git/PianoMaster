import React, { useEffect, useRef, useState } from "react";
import { Award, Flame, Music, Clock, X } from "lucide-react";
import alarmMelody from "../../../public/audio/alarm.mp3";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useModal } from "../../context/ModalContext";

export function Dashboard() {
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [reminderMessage, setReminderMessage] = useState("");
  const alarmRef = useRef(new Audio(alarmMelody));
  // const { user } = useUser();
  const { scores } = useScores();
  // const score = scores?.scores[0].score;
  let totalScore = scores?.totalScore;

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    let timerInterval;
    if (timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && timer > 0) {
      setReminderMessage("Time to practice your instrument!");
      alarmRef.current.play();
    }
    return () => clearInterval(timerInterval);
  }, [timeLeft, timer]);

  const handleSetTimer = () => {
    openModal(
      <>
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Set Practice Reminder
        </h3>
        <form onSubmit={handleSubmitReminder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              required
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Set Reminder
          </button>
        </form>
      </>
    );
  };

  const handleSubmitReminder = (e) => {
    e.preventDefault();
    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    const timeDifferenceInMinutes = Math.floor((dateTime - now) / (1000 * 60));

    if (timeDifferenceInMinutes > 0) {
      setTimer(timeDifferenceInMinutes);
      setTimeLeft(timeDifferenceInMinutes);
      setReminderMessage("");
      closeModal();
    } else {
      alert("Please select a future date and time");
    }
  };

  const handleStopTimer = () => {
    setTimer(0);
    setTimeLeft(0);
    setReminderMessage("");
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Flame className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Daily Streak</p>
              <p className="text-2xl font-bold text-white">7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Music className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Songs Mastered</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Total Points</p>
              <p className="text-2xl font-bold text-white">{totalScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Practice Time</p>
              <p className="text-2xl font-bold text-white">24h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Progress
          </h2>
          <div className="space-y-4">
            Progress chart would go here
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              Progress Chart Placeholder
            </div>
          </div>
        </div> */}

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Set a Practice Reminder
          </h2>
          <div className="space-y-4">
            <button
              onClick={handleSetTimer}
              className="w-full py-3 px-6 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Set Reminder
            </button>
            {timeLeft > 0 && (
              <div className="space-y-2">
                <div className="text-center text-white">
                  Time left: {Math.floor(timeLeft / 60)}:
                  {timeLeft % 60 < 10 ? "0" : ""}
                  {timeLeft % 60} minutes
                </div>
                <button
                  onClick={handleStopTimer}
                  className="w-full py-2 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel Reminder
                </button>
              </div>
            )}
            {reminderMessage && (
              <div>
                <div className="text-center text-green-400 font-bold">
                  {reminderMessage}
                </div>
                <button
                  onClick={handleStopTimer}
                  className="w-full py-3 px-6 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
