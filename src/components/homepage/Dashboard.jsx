import React, { useEffect, useRef, useState } from "react";
import { Award, Flame, Music, Clock, X, Loader2 } from "lucide-react";
import alarmMelody from "../../../public/audio/alarm.mp3";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useModal } from "../../context/ModalContext";
import { Link } from "react-router-dom";

export function Dashboard() {
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [reminderMessage, setReminderMessage] = useState("");
  const alarmRef = useRef(new Audio(alarmMelody));
  const { user } = useUser();
  const { scores, isLoading } = useScores();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">
          Welcome back
          {user?.user_metadata?.full_name
            ? `, ${user.user_metadata.full_name}`
            : ""}
          !
        </h1>
        <p className="mt-2 text-gray-300">
          Ready to continue your musical journey?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Streak */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Daily Streak
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {scores?.daily_streak || 0}
              <span className="text-base lg:text-xl ml-1">days</span>
            </p>
          </div>
        </div>

        {/* Songs Mastered */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Songs Mastered
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {scores?.songs_mastered || 0}
            </p>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Total Points
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {totalScore || 0}
            </p>
          </div>
        </div>

        {/* Practice Time */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Practice Time
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {scores?.practice_time || 0}
              <span className="text-base lg:text-xl ml-1">h</span>
            </p>
          </div>
        </div>
      </div>

      {/* Set Reminder Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-white mb-4">
            Set a Practice Reminder
          </h2>
          <button
            onClick={handleSetTimer}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
}
