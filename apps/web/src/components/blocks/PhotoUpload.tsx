'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { compressImageFile } from '@/components/blocks/job-posting/helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';


interface PhotoUploadLabels {
  title: string;
  subtitle: string;
  uploading: string;
  maxReached: string;
  remove: string;
  photoAlt: string;
}

interface PhotoUploadProps {
  value: ReadonlyArray<string>;
  maxPhotos?: number;
  labels: PhotoUploadLabels;
  onChange: (value: string[]) => void;
}

const toPublicUrl = (bucket: string, path: string): string => {
  const supabase = createSupabaseClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
};

const toStoragePath = (name: string): string => {
  const timestamp = Date.now();
  const safeName = name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');

  return `jobs/${timestamp}-${crypto.randomUUID()}-${safeName}`;
};

export const PhotoUpload = ({
  value,
  maxPhotos = 10,
  labels,
  onChange
}: PhotoUploadProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = async (files: FileList): Promise<void> => {
    const remaining = maxPhotos - value.length;
    if (remaining <= 0) {
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) {
      return;
    }

    setIsUploading(true);
    const supabase = createSupabaseClient();
    const nextUrls: string[] = [];

    for (const file of selected) {
      const compressed = await compressImageFile(file);
      const path = toStoragePath(compressed.name);

      const upload = await supabase.storage.from('job-photos').upload(path, compressed, {
        upsert: false,
        contentType: compressed.type
      });

      if (upload.error) {
        nextUrls.push(URL.createObjectURL(compressed));
      } else {
        nextUrls.push(toPublicUrl('job-photos', path));
      }
    }

    setIsUploading(false);
    onChange([...value, ...nextUrls]);
  };

  return (
    <div className="space-y-4">
      <Card
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => { event.preventDefault(); }}
        onDragLeave={() => { setIsDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (event.dataTransfer.files.length > 0) {
            void processFiles(event.dataTransfer.files);
          }
        }}
        className={`cursor-pointer border-2 border-dashed p-6 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-8 w-8 text-primary" aria-hidden="true" />
          )}
          <p className="text-sm font-semibold text-foreground">{labels.title}</p>
          <p className="text-xs text-muted-foreground">{isUploading ? labels.uploading : labels.subtitle}</p>
          <p className="text-xs text-muted-foreground">
            {value.length}/{maxPhotos}
          </p>
          {value.length >= maxPhotos ? (
            <p className="text-xs font-medium text-warning">{labels.maxReached}</p>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (!event.target.files || event.target.files.length === 0) {
              return;
            }

            void processFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </Card>

      <AnimatePresence>
        {value.length > 0 ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {value.map((url) => (
              <motion.div key={url} layout={!reducedMotion} className="group relative overflow-hidden rounded-lg border">
                <img src={url} alt={labels.photoAlt} className="h-24 w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute end-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => { onChange(value.filter((item) => item !== url)); }}
                  aria-label={labels.remove}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default PhotoUpload;
