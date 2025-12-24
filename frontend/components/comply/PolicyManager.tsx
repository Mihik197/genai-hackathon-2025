"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, CaretUp, Trash, Upload, File, CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
    getPolicies,
    uploadPolicy,
    deletePolicy,
    type PoliciesByCategory,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface PolicyManagerProps {
    policies: PoliciesByCategory;
    onRefresh: () => void;
}

const categoryOrder = ["kyc", "lending", "payments", "cybersecurity", "consumer_protection"];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PolicyManager({ policies, onRefresh }: PolicyManagerProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["kyc"]));
    const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleUpload = async (category: string, file: File) => {
        setUploadingCategory(category);
        const result = await uploadPolicy(category, file);
        setUploadingCategory(null);

        if (result.success) {
            onRefresh();
        } else {
            alert(result.error || "Upload failed");
        }
    };

    const handleDelete = async (category: string, filename: string) => {
        if (!confirm(`Delete "${filename}"?`)) return;

        setDeletingFile(`${category}/${filename}`);
        const result = await deletePolicy(category, filename);
        setDeletingFile(null);

        if (result.success) {
            onRefresh();
        } else {
            alert(result.error || "Delete failed");
        }
    };

    const triggerFileInput = (category: string) => {
        fileInputRefs.current[category]?.click();
    };

    return (
        <div className="space-y-3">
            {categoryOrder.map((categoryId) => {
                const category = policies[categoryId];
                if (!category) return null;

                const isExpanded = expandedCategories.has(categoryId);
                const policyCount = category.policies.length;

                return (
                    <div
                        key={categoryId}
                        className="border border-border rounded-lg overflow-hidden"
                    >
                        <button
                            onClick={() => toggleCategory(categoryId)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
                                <span className="font-semibold text-text-main">{category.name}</span>
                                <span className="text-sm px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                    {policyCount} {policyCount === 1 ? "policy" : "policies"}
                                </span>
                            </div>
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 space-y-2 bg-white">
                                        {category.policies.length === 0 ? (
                                            <p className="text-sm text-text-muted text-center py-4">
                                                No policies in this category
                                            </p>
                                        ) : (
                                            category.policies.map((policy) => {
                                                const isDeleting = deletingFile === `${categoryId}/${policy.file_name}`;
                                                return (
                                                    <div
                                                        key={policy.file_name}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <File size={20} className="text-red-500" weight="fill" />
                                                            <div>
                                                                <p className="text-sm font-medium text-text-main">
                                                                    {policy.file_name}
                                                                </p>
                                                                <p className="text-xs text-text-muted">
                                                                    {formatFileSize(policy.file_size)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(categoryId, policy.file_name)}
                                                            disabled={isDeleting}
                                                            className={cn(
                                                                "p-2 rounded-lg transition-all",
                                                                isDeleting
                                                                    ? "text-gray-400"
                                                                    : "text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                                            )}
                                                        >
                                                            {isDeleting ? (
                                                                <CircleNotch size={18} className="animate-spin" />
                                                            ) : (
                                                                <Trash size={18} />
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}

                                        {/* Upload button */}
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            ref={(el) => { fileInputRefs.current[categoryId] = el; }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleUpload(categoryId, file);
                                                    e.target.value = "";
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => triggerFileInput(categoryId)}
                                            disabled={uploadingCategory === categoryId}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors",
                                                uploadingCategory === categoryId
                                                    ? "border-gray-200 text-gray-400"
                                                    : "border-gray-300 text-text-muted hover:border-primary hover:text-primary"
                                            )}
                                        >
                                            {uploadingCategory === categoryId ? (
                                                <>
                                                    <CircleNotch size={18} className="animate-spin" />
                                                    <span>Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={18} />
                                                    <span>Upload Policy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
