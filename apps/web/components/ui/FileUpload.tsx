'use client';
import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onUpload,
  folder = 'general',
  accept = '*/*',
  maxSizeMB = 5,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo no debe superar los ${maxSizeMB}MB`);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/storage/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }
      
      const data = await response.json();
      setSuccessUrl(data.url);
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSuccessUrl(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!file && !successUrl && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed transition-colors duration-200 ease-in-out cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleChange}
            />
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
              <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
              <p className="mb-2 text-sm">
                <span className="font-semibold text-blue-600">Haz clic</span> o arrastra un archivo aquí
              </p>
              <p className="text-xs text-slate-400">
                Máximo {maxSizeMB}MB
              </p>
            </div>
          </motion.div>
        )}

        {file && !successUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <FileIcon className="w-6 h-6" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={reset}
                disabled={uploading}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <span>Confirmar Subida</span>
              )}
            </button>
          </motion.div>
        )}

        {successUrl && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Archivo subido con éxito</p>
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline"
                >
                  Ver archivo
                </a>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-green-700 hover:text-green-900 font-medium px-3 py-1 bg-green-200/50 hover:bg-green-200 rounded-md transition-colors"
            >
              Subir otro
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
