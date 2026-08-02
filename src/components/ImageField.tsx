type Props = {
  label?: string;
};

export function ImageField({ label = "Image (optional)" }: Props) {
  return (
    <label className="flex flex-col gap-1">
      {label}
      <input
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="border p-2"
      />
      <span className="text-sm text-neutral-600">JPG, PNG, WebP, or GIF. Max 1MB.</span>
    </label>
  );
}
