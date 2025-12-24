"use client";

import { useCallback, useState, useRef } from "react";
import { CloudArrowUp, FilePdf, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isLoading) {
            setIsDragging(true);
        }
    }, [isLoading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateAndSetFile = (file: File) => {
        if (file.type !== "application/pdf") {
            setError("Only PDF files are supported.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB.");
            return;
        }
        setError(null);
        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (isLoading) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, [isLoading, onFileSelect]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleClick = () => {
        if (!isLoading) {
            fileInputRef.current?.click();
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {selectedFile ? (
                <Card className="flex items-center justify-between p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-red-500 shadow-sm border border-border">
                            <FilePdf size={24} weight="fill" />
                        </div>
                        <div>
                            <p className="font-medium text-text-main">{selectedFile.name}</p>
                            <p className="text-xs text-text-muted">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                    {!isLoading && (
                        <button
                            onClick={clearFile}
                            className="p-2 hover:bg-white rounded-full transition-colors text-text-muted hover:text-red-500"
                        >
                            <X size={20} />
                        </button>
                    )}
                </Card>
            ) : (
                <div
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group bg-surface",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-gray-300 hover:border-primary/50 hover:bg-gray-50",
                        error && "border-red-500 bg-red-50"
                    )}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300",
                            isDragging ? "bg-white text-primary" : "bg-primary/10 text-primary group-hover:scale-110"
                        )}>
                            <CloudArrowUp size={32} weight="bold" />
                        </div>
                        <p className="mb-2 text-lg font-semibold text-text-main">
                            Click to upload or drag and drop
                        </p>
                        <p className="mb-6 text-sm text-text-muted">
                            Regulatory Circular (PDF only, max 10MB)
                        </p>
                        <Button size="sm" variant="secondary" className="pointer-events-none">
                            Select File
                        </Button>
                        {error && (
                            <p className="mt-4 text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                {error}
                            </p>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileInput}
                        disabled={isLoading}
                    />
                </div>
            )}
        </div>
    );
}
