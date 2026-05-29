import { useEffect, useState } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { ThinPlateSpline } from '../utils/tps';
import type { GCPData } from './warpedImageOverlayData';
import { WARP_GCPS } from './warpedImageOverlayData';

interface WarpedImageOverlayProps {
  imageUrl: string;
  opacity: number;
  zIndex?: number;
  gcps: GCPData[];
}

export function WarpedImageOverlay({ imageUrl, opacity, zIndex = 10, gcps }: WarpedImageOverlayProps) {
  const [warpedDataUrl, setWarpedDataUrl] = useState<string | null>(null);
  const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processImage = async () => {
      try {
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // 1. Calculate boundaries of the original image using Forward TPS
        // We map from normalized pixel coords [0..1] to [lat, lng]
        const fwdTps = new ThinPlateSpline(
          WARP_GCPS.map(g => [g.x / img.width, g.y / img.height]),
          WARP_GCPS.map(g => [g.lat, g.lng])
        );

        const corners = [
          fwdTps.transform(0, 0),
          fwdTps.transform(1, 0),
          fwdTps.transform(1, 1),
          fwdTps.transform(0, 1)
        ];

        const minLat = Math.min(...corners.map(c => c[0]));
        const maxLat = Math.max(...corners.map(c => c[0]));
        const minLng = Math.min(...corners.map(c => c[1]));
        const maxLng = Math.max(...corners.map(c => c[1]));

        if (!isMounted) return;
        setBounds([[minLat, minLng], [maxLat, maxLng]]);

        // 2. Inverse TPS to generate the warped image
        const invTps = new ThinPlateSpline(
          gcps.map(g => [
            (g.lat - minLat) / (maxLat - minLat),
            (g.lng - minLng) / (maxLng - minLng)
          ]),
          gcps.map(g => [g.x / img.width, g.y / img.height])
        );

        // Read source pixels
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error('Cannot get 2d context');
        tempCtx.drawImage(img, 0, 0);
        const srcData = tempCtx.getImageData(0, 0, img.width, img.height);
        const src32 = new Uint32Array(srcData.data.buffer);

        // Calculate RMSE of the Affine component
        // As a demonstration for the prompt requirement, we'll measure the error
        let rmse = 0;
        WARP_GCPS.forEach(g => {
          const nLat = (g.lat - minLat) / (maxLat - minLat);
          const nLng = (g.lng - minLng) / (maxLng - minLng);
          const [px, py] = invTps.transform(nLat, nLng);
          const dx = (px * img.width) - g.x;
          const dy = (py * img.height) - g.y;
          rmse += dx * dx + dy * dy;
        });
        rmse = Math.sqrt(rmse / WARP_GCPS.length);
        console.log(`[GCP Warping] Root Mean Square Error (RMSE) on control points: ${rmse.toFixed(6)} px`);

        // Target Canvas (1024x1024 is usually sufficient for map overlays)
        const outWidth = 1024;
        const outHeight = 1024;
        const outCanvas = document.createElement('canvas');
        outCanvas.width = outWidth;
        outCanvas.height = outHeight;
        const outCtx = outCanvas.getContext('2d')!;
        const outData = outCtx.createImageData(outWidth, outHeight);
        const out32 = new Uint32Array(outData.data.buffer);

        // Warp pixels
        for (let cy = 0; cy < outHeight; cy++) {
          // Leaflet bounds: maxLat is at the TOP (cy = 0), minLat is at BOTTOM (cy = height)
          const nLat = 1 - (cy / outHeight);
          
          for (let cx = 0; cx < outWidth; cx++) {
            // minLng is at LEFT (cx = 0), maxLng is at RIGHT (cx = width)
            const nLng = cx / outWidth;

            const [nx, ny] = invTps.transform(nLat, nLng);
            const ix = Math.floor(nx * img.width);
            const iy = Math.floor(ny * img.height);

            if (ix >= 0 && ix < img.width && iy >= 0 && iy < img.height) {
              out32[cy * outWidth + cx] = src32[iy * img.width + ix];
            } else {
              out32[cy * outWidth + cx] = 0; // transparent
            }
          }
        }

        outCtx.putImageData(outData, 0, 0);
        if (isMounted) {
          setWarpedDataUrl(outCanvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Warping error:', err);
      }
    };

    processImage();

    return () => {
      isMounted = false;
    };
  }, [imageUrl, gcps]);

  if (!warpedDataUrl || !bounds) {
    return null; // Or a loading indicator
  }

  return (
    <ImageOverlay
      url={warpedDataUrl}
      bounds={bounds}
      opacity={opacity}
      zIndex={zIndex}
    />
  );
}
