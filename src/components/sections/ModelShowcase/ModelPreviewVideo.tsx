import { useEffect, useMemo, useRef, useState } from "react";

interface ModelPreviewVideoProps {
  src: string;
  alt: string;
  className?: string;
}

// placehold.co returns images, not video — video element can't play them
const isImagePlaceholder = (url: string) =>
  /placehold\.co|\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);

const ModelPreviewVideo = ({ src, alt, className }: ModelPreviewVideoProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const useImg = isImagePlaceholder(src);

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

  if (useImg && shouldLoad) {
    return (
      <div className={className} aria-label={alt}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

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
          videoRef.current?.play().catch(() => undefined);
        }}
      />
    </div>
  );
};

export default ModelPreviewVideo;
