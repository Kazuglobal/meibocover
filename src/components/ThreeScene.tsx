'use client';

interface ThreeSceneProps {
  imageSrc?: string;
}

export default function ThreeScene({ imageSrc }: ThreeSceneProps) {
  return (
    <div className="w-full h-full min-h-[500px] overflow-hidden rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="flex h-full min-h-[452px] items-center justify-center rounded-lg border border-white/10 bg-black/20">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Preview"
            className="max-h-full max-w-full object-contain drop-shadow-2xl"
            draggable={false}
          />
        ) : (
          <div className="text-sm text-white/70">3D preview is not configured.</div>
        )}
      </div>
    </div>
  );
}
