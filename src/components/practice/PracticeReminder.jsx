import React, { useEffect, useRef, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { useModal } from "../../contexts/ModalContext";
import { toast } from "react-hot-toast";
import alarmMelody from "../../../public/audio/alarm.mp3";

export default function PracticeReminder() {
  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem("practiceTimer");
    if (saved) {
      const { timeLeft, dateTime } = JSON.parse(saved);
      const now = new Date().getTime();
      const remaining = Math.floor((dateTime - now) / (1000 * 60));
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });
  const [timeLeft, setTimeLeft] = useState(timer);
  const [reminderMessage, setReminderMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const alarmRef = useRef(new Audio(alarmMelody));
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    let timerInterval;
    if (timeLeft > 0) {
      // Save timer state to localStorage
      const dateTime = new Date().getTime() + timeLeft * 60 * 1000;
      localStorage.setItem(
        "practiceTimer",
        JSON.stringify({ timeLeft, dateTime })
      );

      timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setReminderMessage("Time to practice your instrument!");
            alarmRef.current.play();
          }
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && timer > 0) {
      setReminderMessage("Time to practice your instrument!");
      alarmRef.current.play();
    }
    return () => {
      clearInterval(timerInterval);
    };
  }, [timeLeft, timer]);

  const handleSetTimer = () => {
    // Set min date to today and initialize with current date/time
    const now = new Date();
    const minDate = now.toISOString().split("T")[0];

    // Initialize with current date and time
    setSelectedDate(minDate);
    setSelectedTime(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    const ReminderForm = () => {
      const [formDate, setFormDate] = useState(minDate);
      const [formTime, setFormTime] = useState(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );

      const handleSubmit = (e) => {
        e.preventDefault();
        const dateTime = new Date(`${formDate}T${formTime}`);
        const timeDifferenceInMinutes = Math.floor(
          (dateTime - now) / (1000 * 60)
        );

        if (timeDifferenceInMinutes > 0) {
          setTimer(timeDifferenceInMinutes);
          setTimeLeft(timeDifferenceInMinutes);
          setReminderMessage("");
          closeModal();
          toast.success("Reminder set successfully!");
        } else {
          toast.error("Please select a future date and time");
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
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
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="w-5 h-5" />
            Set Reminder
          </button>
        </form>
      );
    };

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
        <ReminderForm />
      </>
    );
  };

  const handleStopTimer = () => {
    setTimer(0);
    setTimeLeft(0);
    setReminderMessage("");
    localStorage.removeItem("practiceTimer");
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
    toast.success("Reminder cancelled");
  };

  const formatTimeLeft = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white mb-4">
          Set a Practice Reminder
        </h2>
        {timeLeft > 0 ? (
          <div className="space-y-4">
            <p className="text-white">
              Next practice reminder in: {formatTimeLeft(timeLeft)}
            </p>
            <button
              onClick={handleStopTimer}
              className="flex gap-2 items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <BellOff className="w-5 h-5" />
              Cancel Reminder
            </button>
          </div>
        ) : (
          <button
            onClick={handleSetTimer}
            className="flex gap-2 items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            Set Reminder
          </button>
        )}
        {reminderMessage && (
          <div className="mt-4 p-4 bg-green-600/20 border border-green-500/30 rounded-xl">
            <p className="text-white">{reminderMessage}</p>
            <button
              onClick={() => {
                setReminderMessage("");
                alarmRef.current.pause();
                alarmRef.current.currentTime = 0;
              }}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
