"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "./Button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // em bytes
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = ".pdf",
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Arquivo excede o tamanho máximo de ${formatFileSize(maxSize)}.`;
    }
    if (accept === ".pdf" && file.type !== "application/pdf") {
      return "Apenas arquivos PDF são aceitos.";
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect, maxSize, accept]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (selectedFile) {
    return (
      <div className="rounded-xl border-2 border-navy-200 bg-navy-50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">
            <FileText className="h-6 w-6 text-ember-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-navy-900">
              {selectedFile.name}
            </p>
            <p className="text-sm text-navy-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 hover:bg-white hover:text-navy-900 disabled:opacity-50"
            aria-label="Remover arquivo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-ember-500 bg-ember-50"
            : "border-navy-200 bg-white hover:border-navy-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-100">
          <UploadCloud className="h-7 w-7 text-navy-600" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold text-navy-900">
          Arraste seu PDF até aqui
        </h3>
        <p className="mt-1 text-sm text-navy-500">
          ou clique abaixo para selecionar um arquivo do seu computador
        </p>
        <p className="mt-1 text-xs text-navy-400">
          Apenas PDF, máximo {formatFileSize(maxSize)}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Selecionar arquivo
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-status-bad">{error}</p>
      )}
    </div>
  );
}
