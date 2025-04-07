import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

export interface ValidationResult {
  valid: boolean;
  message: string;
  data?: any;
}

interface BasicQRScannerProps {
  title?: string;
  description?: string;
  validator?: (code: string) => Promise<ValidationResult>;
  onResult?: (result: ValidationResult) => void;
  onScan?: (code: string) => void;
  className?: string;
}

export default function BasicQRScanner({
  title = "QR Scanner",
  description = "Scan a QR code",
  validator,
  onResult,
  onScan,
  className = ""
}: BasicQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create unique ID for scanner element
  const scannerContainerId = useRef(`scanner-${Math.random().toString(36).substring(2, 9)}`);
  const scannerInstance = useRef<Html5Qrcode | null>(null);
  
  // Clean up scanner on component unmount
  useEffect(() => {
    return () => {
      if (scannerInstance.current) {
        try {
          scannerInstance.current.stop().catch(() => {});
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);
  
  // Handle starting the scanner
  const startScanner = async () => {
    setError(null);
    setScannedCode(null);
    setValidationResult(null);
    setIsScanning(true);
    
    try {
      // Create new scanner instance
      scannerInstance.current = new Html5Qrcode(scannerContainerId.current);
      
      await scannerInstance.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // QR code successfully scanned
          setScannedCode(decodedText);
          if (onScan) onScan(decodedText);
          
          // Stop scanner after successful scan
          if (scannerInstance.current) {
            scannerInstance.current.stop().catch(console.error);
            scannerInstance.current = null;
          }
          setIsScanning(false);
          
          // Validate the scanned code if validator is provided
          if (validator) {
            setIsValidating(true);
            try {
              const result = await validator(decodedText);
              setValidationResult(result);
              if (onResult) onResult(result);
            } catch (error) {
              console.error("Validation error:", error);
              const errorMessage = error instanceof Error ? error.message : "Unknown validation error";
              setValidationResult({
                valid: false,
                message: errorMessage
              });
              setError(errorMessage);
            } finally {
              setIsValidating(false);
            }
          }
        },
        (errorMessage) => {
          // Ignore most QR scanning errors as they're usually just frames without QR codes
        }
      ).catch(error => {
        console.error("Failed to start scanner:", error);
        setError("Failed to start camera: " + error.message);
        setIsScanning(false);
      });
    } catch (error: any) {
      console.error("Error initializing scanner:", error);
      setError("Error initializing scanner: " + error.message);
      setIsScanning(false);
    }
  };
  
  // Handle stopping the scanner
  const stopScanner = async () => {
    if (scannerInstance.current) {
      try {
        await scannerInstance.current.stop();
        scannerInstance.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Scanner container - hidden until scanning starts */}
        <div 
          id={scannerContainerId.current} 
          className={`overflow-hidden bg-black rounded-md ${isScanning ? 'block' : 'hidden'}`}
          style={{ width: '100%', height: isScanning ? '300px' : '0px' }}
        />
        
        {/* Camera off state */}
        {!isScanning && !scannedCode && (
          <div className="border rounded-md p-6 flex flex-col items-center justify-center bg-gray-50">
            <Camera className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">Camera is off</p>
            <Button onClick={startScanner}>
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        )}
        
        {/* Scan result */}
        {scannedCode && (
          <div className="mt-4 border rounded-md p-4">
            <div className="font-medium mb-2">Scanned Code:</div>
            <div className="text-sm bg-gray-50 p-3 rounded-md break-all">{scannedCode}</div>
            
            {isValidating && (
              <div className="flex items-center mt-3 text-blue-600">
                <div className="animate-spin h-4 w-4 border-t-2 border-current rounded-full mr-2" />
                <span>Validating...</span>
              </div>
            )}
            
            {validationResult && (
              <div className={`flex items-center mt-3 ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationResult.valid ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded-md">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isScanning ? (
          <Button variant="destructive" onClick={stopScanner}>
            <X className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        ) : (
          <Button onClick={startScanner}>
            <Camera className="h-4 w-4 mr-2" />
            {scannedCode ? "Scan Again" : "Start Scanning"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}