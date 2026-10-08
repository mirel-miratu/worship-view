import { useRef, useState } from 'react';
import { Loader2, Trash2, Type, Upload } from 'lucide-react';
import { Button } from '@worship-view/ui';
import {
  useCustomFonts,
  useDeleteCustomFont,
  useUploadCustomFont,
} from '../../hooks/useCustomFonts';
import { useActiveOrganization } from '../../hooks/useActiveOrganization';
import {
  FONT_FILE_EXTENSIONS,
  countTextStylesUsingFont,
  validateFontFile,
} from '../../jazz/font-store';
import type { CustomFontResponse } from '../../jazz/font-store';
import { useAppDialogs } from '../dialogs/AppDialogsProvider';

const PREVIEW_TEXT = 'Binecuvântat este Domnul';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SettingsFonts() {
  const dialogs = useAppDialogs();
  const { activeOrganization } = useActiveOrganization();
  const fonts = useCustomFonts();
  const uploadMutation = useUploadCustomFont();
  const deleteMutation = useDeleteCustomFont();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      const validation = validateFontFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }
      setUploadingName(file.name);
      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Eroare la încărcare.'}`);
      }
    }
    setUploadingName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (errors.length > 0) {
      await dialogs.alert({
        title: 'Unele fonturi nu au fost încărcate',
        description: errors.join('\n'),
      });
    }
  };

  const handleDelete = async (font: CustomFontResponse) => {
    const usedBy = countTextStylesUsingFont(activeOrganization, font.family);
    const confirmed = await dialogs.confirm({
      title: 'Șterge fontul',
      description:
        usedBy > 0
          ? `Fontul "${font.family}" este folosit de ${usedBy === 1 ? 'un stil' : `${usedBy} stiluri`} de text, care vor reveni la Montserrat. Continuați?`
          : `Sigur doriți să ștergeți fontul "${font.family}"?`,
      confirmLabel: 'Șterge',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(font.id);
    } catch (error) {
      console.error('Failed to delete font:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fonturi</h3>
      <p className="text-sm text-muted-foreground">
        Încărcați fonturi proprii ({FONT_FILE_EXTENSIONS.join(', ')}, maximum 10MB) pentru a le
        folosi în stilurile de text. Fonturile sunt sincronizate pe toate dispozitivele organizației.
      </p>

      <div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingName !== null}
          className="gap-2"
        >
          {uploadingName ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploadingName ? `Se încarcă ${uploadingName}...` : 'Încarcă font'}
        </Button>
        <input
          ref={fileInputRef}
          id="font-file-input"
          type="file"
          accept={FONT_FILE_EXTENSIONS.join(',')}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {fonts.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          Nu există fonturi încărcate.
        </div>
      ) : (
        <ul className="space-y-2">
          {fonts.map((font) => (
            <li
              key={font.id}
              data-testid="custom-font-item"
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Type className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{font.family}</div>
                  <div
                    className="truncate text-lg"
                    style={{ fontFamily: font.family }}
                  >
                    {PREVIEW_TEXT}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {font.fileName} · {formatSize(font.sizeBytes)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(font)}
                className="shrink-0 rounded-sm p-1.5 text-destructive hover:bg-destructive/10"
                aria-label={`Șterge fontul ${font.family}`}
                disabled={deleteMutation.isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
