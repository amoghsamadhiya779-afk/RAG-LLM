import { useState } from "react";
import { useRAG } from "@/context/RAGContext";

export function useResumeUpload() {
  const { uploadResume, ingestDocument } = useRAG();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState("");

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const text = await uploadResume(file);
      await ingestDocument(file.name, text);
      setSelectedDoc(file.name);
      return file.name;
    } catch (e: unknown) {
      console.error(e);
      const err = e as Error;
      setErrorMsg(err.message || "Failed to upload document.");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    errorMsg,
    selectedDoc,
    handleFileUpload,
    setErrorMsg,
    setSelectedDoc
  };
}
