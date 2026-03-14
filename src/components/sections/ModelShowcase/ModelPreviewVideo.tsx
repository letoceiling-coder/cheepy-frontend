import { useEffect, useMemo, useRef, useState } from "react";

interface ModelPreviewVideoProps {
  src: string;
  alt: string;
  className?: string;
}

const ModelPreviewVideo = ({ src, alt, className }: ModelPreviewVideoProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const videoSrc = useMemo(() => (shouldLoad ? src : undefined), [shouldLoad, src]);

  return (
    <div ref={containerRef} className={className} aria-label={alt}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={videoSrc}
        preload="none"
        muted
        autoPlay
        loop
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onCanPlay={() => {
          // iOS/Safari sometimes needs an explicit play() even with autoPlay
          videoRef.current?.play().catch(() => undefined);
        }}
      />
    </div>
  );
};

export default ModelPreviewVideo;
