import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Upload, PlusCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface CSVRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CSVViewerProps {
  onUpdate: (newCSVData: CSVRow[]) => void;
}

const CSVViewer: React.FC<CSVViewerProps> = ({ onUpdate }) => {
  const [csvData, setCsvData] = useState<CSVRow[]>([
    { id: "1", firstName: "", lastName: "", email: "" },
  ]);
  const [isImported, setIsImported] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const expectedHeaders = ["firstName", "lastName", "email"];

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv") {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result as string;
        const rows = text.split("\n").map((row) => row.split(","));

        // Extract the first row as potential headers
        const headers = rows[0].map((header) => header.trim());

        // Check if headers match the expected headers
        const isValidHeader = expectedHeaders.every(
          (expected, index) =>
            headers[index] &&
            headers[index].toLowerCase() === expected.toLowerCase()
        );

        if (!isValidHeader) {
          toast({
            title: "Invalid Headers",
            description: "CSV headers do not match the expected format.",
            variant: "destructive",
          });
          return;
        }

        // Remove the first row (header) and filter empty rows
        const filteredRows = rows.slice(1).filter(
          (row) => row[0] && row[1] && row[2] // Ensure firstName, lastName, and email exist
        );

        const parsedData = filteredRows.map((row, index) => ({
          id: (index + 1).toString(),
          firstName: row[0].trim(),
          lastName: row[1].trim(),
          email: row[2].trim(),
        }));

        setCsvData(parsedData);
        setFileName(file.name);
        setIsImported(true);
        onUpdate(parsedData); // Pass filtered data to parent
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveCSV = () => {
    setCsvData([{ id: "1", firstName: "", lastName: "", email: "" }]);
    setFileName(null);
    setIsImported(false);
    onUpdate([]); // Clear data in parent

    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input value so the same file can be re-added
    }
    toast({
      title: "CSV removed",
      description: "The CSV file has been removed.",
      variant: "success",
    });
  };

  const handleInputChange = (
    id: string,
    field: keyof CSVRow,
    value: string
  ) => {
    const updatedData = csvData.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setCsvData(updatedData);
    onUpdate(updatedData); // Send updated data to parent
  };

  const handleAddRow = () => {
    const newId = (parseInt(csvData[csvData.length - 1].id) + 1).toString();
    const newRow = { id: newId, firstName: "", lastName: "", email: "" };
    setCsvData([...csvData, newRow]);
    onUpdate([...csvData, newRow]); // Update parent with new row
  };

  const handleRemoveRow = (id: string) => {
    const updatedData = csvData.filter((row) => row.id !== id);
    setCsvData(updatedData);
    onUpdate(updatedData); // Update parent
  };

  const handleClearAll = () => {
    setCsvData([{ id: "1", firstName: "", lastName: "", email: "" }]);
    setIsImported(false);
    setFileName(null);
    onUpdate([]); // Clear data in parent
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>

        {fileName && <span className="ml-4">Loaded: {fileName}</span>}

        <Button variant="outline" onClick={handleAddRow}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Row
        </Button>

        {isImported && (
          <Button variant="destructive" onClick={handleRemoveCSV}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove CSV
          </Button>
        )}
      </div>

      <div className="flex-grow border rounded-md overflow-hidden flex flex-col">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-[200px]">First Name</TableHead>
              <TableHead className="w-[200px]">Last Name</TableHead>
              <TableHead className="w-[300px]">Email</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <ScrollArea className="flex-grow">
          <Table>
            <TableBody>
              <AnimatePresence>
                {csvData.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell className="w-[200px]">
                      <Input
                        value={row.firstName}
                        onChange={(e) =>
                          handleInputChange(row.id, "firstName", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <Input
                        value={row.lastName}
                        onChange={(e) =>
                          handleInputChange(row.id, "lastName", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <Input
                        value={row.email}
                        onChange={(e) =>
                          handleInputChange(row.id, "email", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(row.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="destructive" onClick={handleClearAll}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default CSVViewer;
