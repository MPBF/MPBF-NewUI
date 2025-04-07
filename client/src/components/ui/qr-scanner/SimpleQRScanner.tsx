import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

export interface ValidationResult {
  valid: boolean;
  message: string;
  data?: any;
}

interface SimpleQRScannerProps {
  onScan?: (text: string) => void;
  onValidation?: (result: ValidationResult) => void;
  validator?: (text: string) => Promise<ValidationResult>;
  title?: string;
  description?: string;
  className?: string;
}

export default function SimpleQRScanner({
  onScan,
  onValidation,
  validator,
  title = "QR Scanner",
  description = "Scan a QR code to continue",
  className = ""
}: SimpleQRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  
  // Create a unique ID for this scanner instance
  const scannerId = useRef(`qr-scanner-${Math.random().toString(36).slice(2, 11)}`);
  
  // Create and destroy scanner on mount/unmount
  const startScanning = () => {
    if (scanning) return;
    
    setScanning(true);
    setScannedText(null);
    setValidationState(null);
    
    try {
      // Initialize the scanner
      const html5QrCode = new Html5Qrcode(scannerId.current);
      
      // Start scanning
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          // Success callback
          setScannedText(decodedText);
          setScanning(false);
          
          // Call the onScan callback if provided
          if (onScan) {
            onScan(decodedText);
          }
          
          // Validate the QR code if a validator is provided
          if (validator) {
            setValidating(true);
            validator(decodedText)
              .then(result => {
                setValidationState(result);
                if (onValidation) {
                  onValidation(result);
                }
              })
              .catch(error => {
                setValidationState({
                  valid: false,
                  message: error.message || 'Validation failed'
                });
              })
              .finally(() => {
                setValidating(false);
              });
          }
          
          // Stop scanning after successful decode
          html5QrCode.stop().catch(console.error);
        },
        (error) => {
          // Error callback - just ignore most errors as they're usually just frames without QR codes
          console.debug("QR error", error);
        }
      ).catch(error => {
        console.error("Failed to start scanner:", error);
        setScanning(false);
      });
    } catch (error) {
      console.error("Error initializing scanner:", error);
      setScanning(false);
    }
  };
  
  const stopScanning = () => {
    setScanning(false);
    
    // Find and stop the scanner if it exists
    try {
      const html5QrCode = new Html5Qrcode(scannerId.current);
      html5QrCode.stop().catch(console.error);
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId.current);
        html5QrCode.stop().catch(console.error);
      } catch (error) {
        // Ignore errors on cleanup
      }
    };
  }, []);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Scanner container */}
        <div 
          id={scannerId.current}
          style={{ 
            width: '100%', 
            height: scanning ? '300px' : '0px',
            overflow: 'hidden',
            transition: 'height 0.3s ease'
          }}
        />
        
        {/* Scanner status and controls */}
        {!scanning && !scannedText && (
          <div className="border rounded flex flex-col items-center justify-center p-6 bg-gray-50">
            <Camera className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Camera is off</p>
            <Button onClick={startScanning}>
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        )}
        
        {/* Scanned result */}
        {scannedText && (
          <div className="mt-4 border rounded-md p-4">
            <h3 className="font-medium mb-2">Scanned Result:</h3>
            <p className="break-all text-sm bg-gray-50 p-2 rounded">{scannedText}</p>
            
            {validating && (
              <div className="flex items-center mt-2">
                <div className="animate-spin h-4 w-4 border-t-2 border-blue-500 rounded-full mr-2" />
                <span className="text-sm">Validating...</span>
              </div>
            )}
            
            {validationState && (
              <div className={`flex items-center mt-2 ${validationState.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationState.valid ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm">{validationState.message}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={scanning ? stopScanning : startScanning}
          variant={scanning ? "destructive" : "default"}
        >
          {scanning ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Stop Scanning
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              {scannedText ? "Scan Again" : "Start Scanning"}
            </>
          )}
        </Button>
        
        {scanning && (
          <Badge>Scanning...</Badge>
        )}
      </CardFooter>
    </Card>
  );
}