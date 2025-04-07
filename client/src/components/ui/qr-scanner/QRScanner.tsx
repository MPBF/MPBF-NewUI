import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { QrCode, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

export type ValidationResult = {
  valid: boolean;
  message: string;
  data?: any;
};

interface QRScannerProps {
  onDecode?: (decodedText: string, result: any) => void;
  onValidationResult?: (result: ValidationResult) => void;
  validate?: (text: string) => Promise<ValidationResult> | ValidationResult;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
  title?: string;
  description?: string;
  constraints?: MediaTrackConstraints;
  className?: string;
  width?: string | number;
  height?: string | number;
}

const defaultValidationResult = { valid: false, message: '' };

export function QRScanner({
  onDecode,
  onValidationResult,
  validate,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
  title = "QR Code Scanner",
  description = "Position a QR code in front of the camera to scan",
  constraints = { facingMode: "environment" },
  className = "w-full max-w-md",
  width = "100%",
  height = 400
}: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult>(defaultValidationResult);
  const [isValidating, setIsValidating] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    constraints.facingMode === 'user' ? 'user' : 'environment'
  );
  
  const scanner = useRef<Html5Qrcode | null>(null);
  // Generate a unique ID for each scanner instance
  const scannerId = `html5qrcode-scanner-container-${Math.random().toString(36).substring(2, 11)}`;
  const scannerContainerId = useRef(scannerId);
  
  // Only initialize scanner when needed, not on component mount
  useEffect(() => {
    return () => {
      try {
        if (scanner.current && scanner.current.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.current.stop().catch(error => console.error("Failed to stop scanner", error));
        }
        scanner.current = null;
      } catch (error) {
        console.error("Error cleaning up scanner:", error);
      }
    };
  }, []);
  
  const startScanner = async () => {
    // Initialize scanner on-demand if it doesn't exist
    if (!scanner.current) {
      try {
        scanner.current = new Html5Qrcode(scannerContainerId.current);
      } catch (error) {
        console.error("Error initializing scanner:", error);
        return;
      }
    }
    
    // Stop if already scanning
    if (scanner.current.getState() === Html5QrcodeScannerState.SCANNING) {
      await scanner.current.stop();
    }
    
    setScanning(true);
    setScannedResult(null);
    setValidationResult(defaultValidationResult);
    
    try {
      // Start scanning
      await scanner.current.start(
        { facingMode },
        {
          fps,
          qrbox,
          aspectRatio
        },
        async (decodedText, decodedResult) => {
          // Handle successful scan
          setScannedResult(decodedText);
          
          if (onDecode) {
            onDecode(decodedText, decodedResult);
          }
          
          // Validate the scanned code if a validation function is provided
          if (validate) {
            setIsValidating(true);
            try {
              const result = await validate(decodedText);
              setValidationResult(result);
              
              if (onValidationResult) {
                onValidationResult(result);
              }
              
              // If valid, stop scanning
              if (result.valid && scanner.current) {
                await scanner.current.stop();
                setScanning(false);
              }
            } catch (error) {
              console.error("Validation error:", error);
              setValidationResult({
                valid: false,
                message: error instanceof Error ? error.message : 'Unknown validation error'
              });
            } finally {
              setIsValidating(false);
            }
          }
        },
        (errorMessage) => {
          // Handle scan error (ignore)
          console.debug(`QR Scan error: ${errorMessage}`);
        }
      ).catch((err) => {
        console.error("Failed to start scanner:", err);
        setScanning(false);
      });
    } catch (error) {
      console.error("Error starting QR scanner:", error);
      setScanning(false);
    }
  };
  
  const stopScanner = async () => {
    if (scanner.current && scanner.current.getState() === Html5QrcodeScannerState.SCANNING) {
      await scanner.current.stop();
    }
    setScanning(false);
  };
  
  const toggleScanner = async () => {
    if (scanning) {
      await stopScanner();
    } else {
      await startScanner();
    }
  };
  
  const toggleCamera = async () => {
    if (disableFlip) return;
    
    // Stop current scanner
    if (scanner.current && scanner.current.getState() === Html5QrcodeScannerState.SCANNING) {
      await scanner.current.stop();
    }
    
    // Toggle facing mode
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    // Restart scanner with new facing mode if it was scanning
    if (scanning) {
      setTimeout(() => {
        startScanner();
      }, 100);
    }
  };
  
  const renderValidationStatus = () => {
    if (!scannedResult) return null;
    
    if (isValidating) {
      return (
        <div className="flex items-center justify-center space-x-2 mt-2">
          <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full" />
          <span>Validating...</span>
        </div>
      );
    }
    
    if (validationResult.valid) {
      return (
        <div className="flex items-center mt-2 text-green-600">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>{validationResult.message || 'Valid QR code'}</span>
        </div>
      );
    } else if (validationResult.message) {
      return (
        <div className="flex items-center mt-2 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{validationResult.message}</span>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-6 w-6 mr-2" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div 
          id={scannerContainerId.current} 
          style={{ 
            width, 
            height: scanning ? height : 'auto',
            overflow: 'hidden',
            position: 'relative',
            background: 'black',
            display: scanning ? 'block' : 'none',
            borderRadius: '0.5rem'
          }}
        >
          {!scanning && (
            <div className="flex items-center justify-center h-full w-full text-gray-400">
              <Camera className="h-12 w-12" />
            </div>
          )}
        </div>

        {!scanning && (
          <div 
            className="border rounded-md flex items-center justify-center"
            style={{ width, height: 250, background: '#f1f5f9' }}
          >
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Camera is off</p>
              <Button 
                onClick={startScanner} 
                className="mt-4"
                variant="default"
              >
                Start Scanning
              </Button>
            </div>
          </div>
        )}
        
        {scannedResult && (
          <div className="p-3 border rounded-md bg-gray-50">
            <p className="font-semibold mb-1">Scanned Result:</p>
            <p className="break-all text-sm">{scannedResult}</p>
            {renderValidationStatus()}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex space-x-4 items-center">
          <Button 
            onClick={toggleScanner} 
            variant={scanning ? "destructive" : "default"}
          >
            {scanning ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Scan
              </>
            )}
          </Button>
          
          {scanning && !disableFlip && (
            <Button 
              onClick={toggleCamera} 
              variant="outline" 
              size="icon"
              title="Flip camera"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 17 5 21l-4-4" />
                <path d="M3 16v-3a8 8 0 0 1 16 0v.83" />
                <path d="m15 7 4-4 4 4" />
                <path d="M21 8v3a8 8 0 0 1-12.83 6.31" />
              </svg>
            </Button>
          )}
        </div>
        
        {scanning && (
          <Badge variant={scanning ? "default" : "outline"}>
            {scanning ? "Scanning..." : "Scanner Off"}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}