"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText, X, Plus } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "./Button";

interface MultiFileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // bytes por arquivo
  maxFiles?: number;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

const ACCEPT_TYPES_DEFAULT = ".pdf,.png,.jpg,.jpeg,.webp";

export function MultiFileUpload({
  files,
  onChange,
  accept = ACCEPT_TYPES_DEFAULT,
  maxSize = 32 * 1024 * 1024, // 32 MB
  maxFiles = 10,
  label = "Pranchas do projeto",
  sublabel = "PDF, PNG ou JPG · até 32 MB cada",
  disabled = false,
}: MultiFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (file.size > maxSize) {
      return `${file.name} excede ${formatFileSize(maxSize)}.`;
    }
    const allowed = accept.split(",").map((e) => e.trim().toLowerCase());
    const name = file.name.toLowerCase();
    const ok = allowed.some((ext) => name.endsWith(ext));
    if (!ok) {
      return `${file.name}: formato não aceito. Use ${accept}.`;
    }
    return null;
  };

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: File[] = [];
      let firstError: string | null = null;
      for (const f of Array.from(incoming)) {
        if (files.length + newFiles.length >= maxFiles) {
          firstError = firstError ?? `Máximo de ${maxFiles} arquivos.`;
          break;
        }
        const err = validate(f);
        if (err) {
          firstError = firstError ?? err;
          continue;
        }
        // evita duplicatas (nome + size)
        const dup = files.some(
          (existing) => existing.name === f.name && existing.size === f.size
        );
        if (dup) continue;
        newFiles.push(f);
      }
      if (newFiles.length > 0) {
        onChange([...files, ...newFiles]);
      }
      setError(firstError);
    },
    [files, onChange, maxFiles, maxSize, accept]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const isFull = files.length >= maxFiles;

  return (
    <div>
      {/* Lista de arquivos selecionados */}
      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-navy-100 bg-white p-3"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50">
                <FileText className="h-4 w-4 text-navy-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-900">
                  {f.name}
                </p>
                <p className="text-xs text-navy-500">{formatFileSize(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-md text-navy-500 hover:bg-navy-50 hover:text-navy-900 disabled:opacity-50"
                aria-label={`Remover ${f.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {!isFull && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            isDragging
              ? "border-ember-500 bg-ember-50"
              : "border-navy-200 bg-white hover:border-navy-300",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {files.length === 0 ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-100">
                <UploadCloud className="h-6 w-6 text-navy-600" />
              </div>
              <h3 className="mt-3 font-display font-semibold text-navy-900">
                {label}
              </h3>
              <p className="mt-1 text-xs text-navy-500">{sublabel}</p>
              <p className="mt-1 text-xs text-navy-400">
                Arraste vários arquivos ou clique para selecionar (até{" "}
                {maxFiles})
              </p>
            </>
          ) : (
            <p className="text-sm text-navy-600">
              Adicione mais pranchas se necessário
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleInput}
            disabled={disabled}
            className="hidden"
          />
          <Button
            type="button"
            variant={files.length === 0 ? "outline" : "ghost"}
            size="sm"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5" />
            {files.length === 0
              ? "Selecionar arquivos"
              : "Adicionar mais arquivos"}
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-status-bad">{error}</p>}
    </div>
  );
}
