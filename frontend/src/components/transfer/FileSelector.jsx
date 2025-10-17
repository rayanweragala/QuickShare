import { useRef, useState } from "react";
import { Upload, Zap } from "lucide-react";

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
    <div
      className={`relative group cursor-pointer transition-all duration-300 ${
        isDragging ? 'scale-[1.02]' : ''
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-2xl opacity-0 transition-opacity duration-500 ${
        isDragging ? 'opacity-100' : 'group-hover:opacity-100'
      }`} />
      
      <div className={`relative bg-zinc-900/80 backdrop-blur-md border rounded-2xl p-8 transition-all duration-300 ${
        isDragging 
          ? 'border-green-500 bg-zinc-900' 
          : 'border-zinc-800 hover:bg-zinc-900 hover:border-green-500/50'
      }`}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 transition-all ${
            isDragging 
              ? 'bg-gradient-to-br from-green-400 to-emerald-600 scale-110' 
              : 'bg-green-500/10 border border-green-500/20 group-hover:scale-105'
          }`}>
            <Upload className={`w-8 h-8 transition-all ${
              isDragging ? 'text-black' : 'text-green-400'
            }`} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {isDragging ? "Drop file here" : "Choose a file"}
          </h3>
          
          <p className="text-zinc-400 text-sm mb-6">
            Drag & drop or click to browse
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm border border-green-500/30">
            <Zap className="w-4 h-4" />
            <span>No size limits</span>
          </div>
        </div>
      </div>
    </div>
  );
};