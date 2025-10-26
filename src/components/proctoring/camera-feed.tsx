'use client';

import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraOff } from 'lucide-react';

interface CameraFeedProps {
  onCheatingDetected: (reason: string) => void;
  isEnabled: boolean;
}

export default function CameraFeed({ onCheatingDetected, isEnabled }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isEnabled) {
      // Stop camera and interval if component is not enabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasCameraPermission(null); // Reset permission state
      return;
    }

    const setupCameraAndProctoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);

        intervalRef.current = setInterval(async () => {
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUri = canvas.toDataURL('image/jpeg');
              
              try {
                // Send the frame to the backend
                const response = await fetch('/api/proctor', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ image: dataUri }),
                });

                if (!response.ok) {
                   console.error("Proctoring API failed with status:", response.status);
                   return;
                }

                const result = await response.json();

                if (result.status === "failed") {
                    onCheatingDetected(result.reason);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                }
              } catch (e) {
                  console.error("Failed to send frame to proctoring API", e);
              }
            }
          }
        }, 1000); // Check every second

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to use this feature.',
        });
      }
    };

    setupCameraAndProctoring();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCheatingDetected, toast, isEnabled]);

  if (!isEnabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camera Feed</CardTitle>
        <CardDescription>Your session is being monitored.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          <canvas ref={canvasRef} className="hidden"></canvas>
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
              <CameraOff className="h-12 w-12 text-destructive mb-4" />
              <Alert variant="destructive" className="text-center">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access. You may need to grant permission in your browser settings.
                </AlertDescription>
              </Alert>
            </div>
          )}
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p>Initializing camera...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
