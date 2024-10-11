import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GetLogs, SubscribeToLogs } from "../../wailsjs/go/main/App";

interface LogEntry {
  timestamp: string;
  message: string;
  type: string;
}

const Logger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load of logs
    GetLogs().then(setLogs);

    // Subscribe to new logs
    SubscribeToLogs((newLog: LogEntry) => {
      setLogs((prevLogs) => [...prevLogs, newLog]);
    });

    // Cleanup function
    return () => {
      // If there's a way to unsubscribe, call it here
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new logs are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full bg-gray-900 text-gray-200 font-mono rounded-lg shadow-lg overflow-hidden">
      <ScrollArea className="h-full w-full p-4" ref={scrollAreaRef}>
        {logs.map((log, index) => (
          <div
            key={index}
            className={`mb-1 ${
              log.type === "error"
                ? "text-red-400"
                : log.type === "warning"
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            <span className="text-blue-400">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>{" "}
            {log.message}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default Logger;
