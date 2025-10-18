import { useRef, useState } from "react";
import { Card, Button } from "../common";
import { getFileIcon, formatFileSize } from "../../utils/file.utils";

export const FileSelector = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card
      variant="elevated"
      padding="lg"
      className={`transition-all cursor-pointer ${
        isDragging ? "border-2 border-green-500 bg-green-50" : ""
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-2xl mb-4">
          <svg
            className="w-8 h-8 text-neutral-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {isDragging ? "Drop file here" : "Choose a file to send"}
        </h3>
        <p className="text-sm text-neutral-600 mb-6">
          Drag and drop or click to browse
        </p>

        <Button variant="primary">Select File</Button>

        <p className="text-xs text-neutral-500 mt-6">Maximum file size: 2GB</p>
      </div>
    </Card>
  );
};
