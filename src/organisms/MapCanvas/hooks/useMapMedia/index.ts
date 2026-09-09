'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { computeCenteredViewport, type Viewport } from '~/utils/mapViewport';
import type { MapCanvasMedia } from '~/organisms/MapCanvas/components/MapCanvasView';

export type MapMediaHandle = {
  drawableRef: RefObject<CanvasImageSource | null>;
  sizeRef: RefObject<{ width: number; height: number }>;
  isLoadingRef: RefObject<boolean>;
  progressRef: RefObject<number>;
};

type VideoFrameLoopHandle = { cancel: () => void };

/** Redraws every decoded video frame, independent of the pan/zoom draw dedup. */
const startVideoFrameLoop = (
  video: HTMLVideoElement,
  onFrame: () => void,
): VideoFrameLoopHandle => {
  if ('requestVideoFrameCallback' in video) {
    const withRvfc = video as HTMLVideoElement & {
      requestVideoFrameCallback: (callback: () => void) => number;
      cancelVideoFrameCallback: (id: number) => void;
    };
    let id = 0;
    const tick = () => {
      onFrame();
      id = withRvfc.requestVideoFrameCallback(tick);
    };
    id = withRvfc.requestVideoFrameCallback(tick);
    return { cancel: () => withRvfc.cancelVideoFrameCallback(id) };
  }

  let active = true;
  const tick = () => {
    if (!active) return;
    onFrame();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    cancel: () => {
      active = false;
    },
  };
};

/**
 * Loads a map's image or video and exposes it as a drawable, ref-based
 * handle the canvas draw loop reads each frame.
 *
 * Video is fetched as a blob before playback starts, with progress tracked
 * for a loading bar, so the canvas never stalls mid-playback on a slow
 * connection — the same approach the source VTT used.
 */
export const useMapMedia = ({
  map,
  canvasSizeRef,
  currentViewportRef,
  onScheduleDraw,
  onMediaReady,
}: {
  map: MapCanvasMedia;
  canvasSizeRef: RefObject<{ width: number; height: number }>;
  currentViewportRef: RefObject<Viewport | undefined>;
  onScheduleDraw: () => void;
  onMediaReady: (args: {
    size: { width: number; height: number };
    viewport: Viewport;
  }) => void;
}): MapMediaHandle => {
  const drawableRef = useRef<CanvasImageSource | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({
    width: map?.nativeWidth ?? 0,
    height: map?.nativeHeight ?? 0,
  });
  const isLoadingRef = useRef(false);
  const progressRef = useRef(0);
  const mapKeyRef = useRef<string | null>(null);

  const fileUrl = map?.fileUrl ?? null;
  const kind = map?.kind ?? null;

  useEffect(() => {
    const key = fileUrl ? `${kind}:${fileUrl}` : null;
    mapKeyRef.current = key;

    if (!fileUrl || !kind) {
      drawableRef.current = null;
      sizeRef.current = { width: 0, height: 0 };
      onScheduleDraw();
      return;
    }

    const applyReadySize = (width: number, height: number) => {
      sizeRef.current = { width, height };
      const rect = canvasSizeRef.current;
      const viewport = computeCenteredViewport({
        canvasWidth: rect.width,
        canvasHeight: rect.height,
        mediaWidth: width,
        mediaHeight: height,
        currentZoom: currentViewportRef.current?.zoom,
      });
      onMediaReady({ size: { width, height }, viewport });
      onScheduleDraw();
    };

    let abortController: AbortController | null = null;
    let blobUrl = '';
    let frameLoop: VideoFrameLoopHandle | null = null;
    let video: HTMLVideoElement | null = null;

    if (kind === 'video') {
      isLoadingRef.current = true;
      progressRef.current = 0;
      onScheduleDraw();
      abortController = new AbortController();

      const fetchBlob = async () => {
        const response = await fetch(fileUrl, {
          signal: abortController!.signal,
        });
        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? Number.parseInt(contentLength, 10) : 0;

        let blob: Blob;
        if (total > 0 && response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array<ArrayBuffer>[] = [];
          let loaded = 0;
          let done = false;
          while (!done) {
            const chunk = await reader.read();
            done = chunk.done;
            if (chunk.value) {
              chunks.push(chunk.value);
              loaded += chunk.value.byteLength;
              progressRef.current = loaded / total;
              onScheduleDraw();
            }
          }
          blob = new Blob(chunks, { type: 'video/webm' });
        } else {
          blob = await response.blob();
        }

        if (mapKeyRef.current !== key) return;

        blobUrl = URL.createObjectURL(blob);
        video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.loop = true;

        video.addEventListener('loadedmetadata', () => {
          if (mapKeyRef.current !== key || !video) return;

          drawableRef.current = video;
          isLoadingRef.current = false;
          applyReadySize(video.videoWidth, video.videoHeight);
          video.play().catch(() => {});

          frameLoop = startVideoFrameLoop(video, onScheduleDraw);
        });

        video.src = blobUrl;
      };

      fetchBlob().catch(() => {
        if (mapKeyRef.current === key) {
          isLoadingRef.current = false;
          onScheduleDraw();
        }
      });
    } else {
      const image = new Image();
      image.onload = () => {
        if (mapKeyRef.current !== key) return;
        drawableRef.current = image;
        applyReadySize(image.naturalWidth, image.naturalHeight);
      };
      image.onerror = () => {
        if (mapKeyRef.current !== key) return;
        drawableRef.current = null;
        onScheduleDraw();
      };
      image.src = fileUrl;
    }

    return () => {
      if (mapKeyRef.current === key) mapKeyRef.current = null;
      abortController?.abort();
      frameLoop?.cancel();
      if (video) video.pause();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      isLoadingRef.current = false;
      drawableRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, kind]);

  return { drawableRef, sizeRef, isLoadingRef, progressRef };
};
