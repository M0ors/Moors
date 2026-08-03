import Image from "next/image";

type Props = {
  imageUrl?: string | null;
  imageApproved?: boolean | null;
  canPreviewPending?: boolean;
};

export function PostImage({
  imageUrl,
  imageApproved,
  canPreviewPending = false,
}: Props) {
  if (!imageUrl) {
    return null;
  }

  const showReal = Boolean(imageApproved) || canPreviewPending;

  if (!showReal) {
    return (
      <div className="mt-3 flex items-center justify-center border rounded bg-neutral-100 text-neutral-600 text-sm w-full max-w-md aspect-video">
        Awaiting approval
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!imageApproved ? (
        <p className="text-xs text-amber-700 mb-1">Pending admin approval</p>
      ) : null}
      <Image
        src={imageUrl}
        alt="Post attachment"
        width={800}
        height={600}
        className="max-w-full h-auto rounded border"
      />
    </div>
  );
}
