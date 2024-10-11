import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CSVViewer from "@/components/csv-viewer";
import Logger from "@/components/logger";
import { toast } from "@/hooks/use-toast";
import { CSVRow as CSVData } from "./components/csv-viewer";
import { SendMail } from "../wailsjs/go/main/App";

interface EmailData {
  sender: string;
  password: string;
  message: string;
}

function App() {
  const [emailData, setEmailData] = useState<EmailData>({
    sender: "",
    password: "",
    message: "",
  });
  const [csvData, setCSVData] = useState<CSVData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = event.target;
    setEmailData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          setEmailData((prev) => ({ ...prev, message: content }));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSendEmail = async () => {
    try {
      const recipients = csvData
        .map((row) => row.email)
        .filter((email) => email);

      if (recipients.length === 0) {
        toast({
          title: "No recipients found",
          description: "Please add at least one recipient to the CSV file.",
          variant: "destructive",
        });
        return;
      }

      SendMail(
        emailData.sender,
        emailData.password,
        recipients,
        emailData.message,
        JSON.stringify(csvData)
      );

      toast({
        title: "Email sent",
        description: `Successfully sent emails to ${recipients.length} recipients.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Failed to send email",
        description: (error as any).toString(),
        variant: "destructive",
      });
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleCSVUpdate = (newCSVData: CSVData[]) => {
    setCSVData(newCSVData);
  };

  return (
    <div className="grid grid-cols-2 grid-rows-3 gap-4 p-8 h-screen">
      <div className="col-span-1 row-span-2 p-4 ">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sender">Sender Email</Label>
            <Input
              id="sender"
              placeholder="Enter your email"
              value={emailData.sender}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={emailData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col gap-4 h-full">
            <Textarea
              id="message"
              className="h-full"
              placeholder="Enter your message or select a file"
              value={emailData.message}
              onChange={handleInputChange}
            />
            <div className="flex gap-4">
              <Button onClick={handleSendEmail}>Send</Button>
              <Button onClick={handleSelectFile}>Select File</Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".txt"
                style={{ display: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-1 row-span-2">
        <CSVViewer onUpdate={handleCSVUpdate} />
      </div>
      <div className="col-span-2 row-span-1 h-full">
        <Logger />
      </div>
    </div>
  );
}

export default App;
