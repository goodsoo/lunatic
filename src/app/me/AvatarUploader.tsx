"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { updateAvatar } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ERROR_MESSAGES: Record<string, string> = {
  file_too_large: "5MB 이하 이미지를 올려 주세요.",
  file_type_invalid: "JPG, PNG, WEBP만 지원됩니다.",
  upload_failed: "업로드에 실패했습니다.",
  update_failed: "프로필 갱신에 실패했습니다.",
  remove_failed: "삭제에 실패했습니다.",
};

export function AvatarUploader({
  userId,
  initialUrl,
  hasAvatar,
}: {
  userId: string;
  initialUrl: string | null;
  hasAvatar: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [hasUploaded, setHasUploaded] = useState(hasAvatar);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleFile(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) return setError("file_too_large");
    if (!ALLOWED_TYPES.includes(file.type)) return setError("file_type_invalid");

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${userId}/${Date.now()}.${ext}`;

    startTransition(async () => {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setError("upload_failed");
        return;
      }

      const result = await updateAvatar(path);
      if (result.error) {
        setError(result.error);
        return;
      }

      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);
      setPreviewUrl(signed?.signedUrl ?? null);
      setHasUploaded(true);
      router.refresh();
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await updateAvatar(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreviewUrl(null);
      setHasUploaded(false);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <span className="font-body text-xs uppercase tracking-widest text-text-2">
        아바타
      </span>
      <div className="flex items-start gap-6">
        <div className="size-32 shrink-0 overflow-hidden bg-surface md:size-40">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="현재 아바타"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-body text-xs text-text-3">
              없음
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleClick}
            disabled={busy}
            className="cursor-pointer bg-text-1 px-4 py-2 font-body text-sm uppercase tracking-widest text-bg transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {busy ? "처리 중…" : hasUploaded ? "교체" : "업로드"}
          </button>
          {hasUploaded && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="cursor-pointer bg-surface px-4 py-2 font-body text-sm uppercase tracking-widest text-text-2 transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              삭제
            </button>
          )}
          <p className="font-body text-xs text-text-3">
            JPG, PNG, WEBP — 5MB 이하.
          </p>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="bg-surface px-4 py-3 font-body text-sm text-accent"
        >
          {ERROR_MESSAGES[error] ?? `오류: ${error}`}
        </div>
      )}
    </div>
  );
}
