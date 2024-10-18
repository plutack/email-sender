import React, { ChangeEvent, useRef, useState } from "react";
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
import { PlusCircle, Trash2, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx-js-style";

export interface DataRow {
  id: string;
  surname: string;
  otherNames: string;
  email: string;
}

interface DataViewerProps {
  onUpdate: (newData: DataRow[]) => void;
}

const DataViewer: React.FC<DataViewerProps> = ({ onUpdate }) => {
  const [data, setData] = useState<DataRow[]>([
    { id: "1", surname: "", otherNames: "", email: "" },
  ]);
  const [isImported, setIsImported] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const requiredFields = ["Surname", "Other Names", "E-mail address"];

  const formatName = (name: string): string => {
    return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSurname = (surname: string): string => {
    return surname.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (fileExt !== "csv" && fileExt !== "xlsx") {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or XLSX file.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          let parsedData: DataRow[];
          if (fileExt === "csv") {
            parsedData = parseCSV(e.target?.result as string);
          } else {
            parsedData = parseXLSX(e.target?.result as ArrayBuffer);
          }
          setData(parsedData);
          setFileName(file.name);
          setIsImported(true);
          onUpdate(parsedData);
        } catch (error) {
          toast({
            title: "Error parsing file",
            description: (error as Error).message,
            variant: "destructive",
          });
        }
      };

      if (fileExt === "csv") {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const parseCSV = (content: string): DataRow[] => {
    const rows = content.split("\n").map((row) => row.split(","));
    const headers = rows[0].map((header) => header.trim());

    const fieldIndices = getFieldIndices(headers);

    return rows
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim() !== ""))
      .map((row, index) => ({
        id: (index + 1).toString(),
        surname: formatSurname(row[fieldIndices.surname]?.trim() || ""),
        otherNames: formatName(row[fieldIndices.otherNames]?.trim() || ""),
        email: row[fieldIndices.email]?.trim() || "",
      }));
  };

  const parseXLSX = (content: ArrayBuffer): DataRow[] => {
    const workbook = XLSX.read(content, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as string[][];

    const headers = jsonData[0].map((header) => header.trim());
    const fieldIndices = getFieldIndices(headers);

    return jsonData
      .slice(1)
      .filter((row) => row.some((cell) => cell !== ""))
      .map((row, index) => ({
        id: (index + 1).toString(),
        surname: formatSurname(row[fieldIndices.surname] || ""),
        otherNames: formatName(row[fieldIndices.otherNames] || ""),
        email: row[fieldIndices.email] || "",
      }));
  };

  const getFieldIndices = (headers: string[]) => {
    const indices = {
      surname: headers.findIndex((h) => h.toLowerCase() === "surname"),
      otherNames: headers.findIndex((h) => h.toLowerCase() === "other names"),
      email: headers.findIndex((h) => h.toLowerCase() === "e-mail address"),
    };

    if (
      indices.surname === -1 ||
      indices.otherNames === -1 ||
      indices.email === -1
    ) {
      throw new Error(
        `Missing required fields. Please ensure your file includes: ${
          requiredFields.join(
            ", ",
          )
        }`,
      );
    }

    return indices;
  };

  const handleRemoveFile = () => {
    setData([{ id: "1", surname: "", otherNames: "", email: "" }]);
    setFileName(null);
    setIsImported(false);
    onUpdate([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({
      title: "File removed",
      description: "The imported file has been removed.",
      variant: "success",
    });
  };

  const handleInputChange = (
    id: string,
    field: keyof DataRow,
    value: string,
  ) => {
    const updatedData = data.map((row) => {
      if (row.id === id) {
        let formattedValue = value;
        if (field === "surname") {
          formattedValue = formatSurname(value);
        } else if (field === "otherNames") {
          formattedValue = formatName(value);
        }
        return { ...row, [field]: formattedValue };
      }
      return row;
    });
    setData(updatedData);
    onUpdate(updatedData);
  };

  const handleAddRow = () => {
    const newId = (parseInt(data[data.length - 1].id) + 1).toString();
    const newRow: DataRow = {
      id: newId,
      surname: "",
      otherNames: "",
      email: "",
    };
    setData([...data, newRow]);
    onUpdate([...data, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    const updatedData = data.filter((row) => row.id !== id);
    setData(updatedData);
    onUpdate(updatedData);
  };

  const handleClearAll = () => {
    setData([{ id: "1", surname: "", otherNames: "", email: "" }]);
    setIsImported(false);
    setFileName(null);
    onUpdate([]);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <Input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV/XLSX
        </Button>

        {fileName && <span className="ml-4">Loaded: {fileName}</span>}

        <Button variant="outline" onClick={handleAddRow}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Row
        </Button>

        {isImported && (
          <Button variant="destructive" onClick={handleRemoveFile}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove File
          </Button>
        )}
      </div>

      <div className="flex-grow border rounded-md overflow-hidden flex flex-col">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead className="w-[200px]">Surname</TableHead>
              <TableHead className="w-[200px]">Other Names</TableHead>
              <TableHead className="w-[300px]">Email Address</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <ScrollArea className="flex-grow">
          <Table>
            <TableBody>
              <AnimatePresence>
                {data.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell className="w-[50px]">{index + 1}</TableCell>
                    <TableCell className="w-[200px]">
                      <Input
                        value={row.surname}
                        onChange={(e) =>
                          handleInputChange(row.id, "surname", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <Input
                        value={row.otherNames}
                        onChange={(e) =>
                          handleInputChange(
                            row.id,
                            "otherNames",
                            e.target.value,
                          )}
                      />
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <Input
                        value={row.email}
                        onChange={(e) =>
                          handleInputChange(row.id, "email", e.target.value)}
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

export default DataViewer;
