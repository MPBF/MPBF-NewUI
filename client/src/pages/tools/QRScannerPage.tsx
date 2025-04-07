import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { validateQRCode, validateRollQRCode, validateOrderQRCode, QRCodeFormat, parseQRCode } from '@/utils/qr-validation';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/utils/language';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import BasicQRScanner from '@/components/ui/qr-scanner/BasicQRScanner';
import type { ValidationResult } from '@/components/ui/qr-scanner/BasicQRScanner';

export default function QRScannerPage() {
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [scanMode, setScanMode] = useState<'auto' | 'roll' | 'order'>('auto');
  const { isRtl } = useLanguage();
  const [, setLocation] = useLocation();

  const handleValidationResult = (result: ValidationResult) => {
    setScanResult(result);
    
    // Show toast based on validation result
    if (result.valid) {
      toast({
        title: 'Valid QR Code',
        description: result.message,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Invalid QR Code',
        description: result.message,
        variant: 'destructive',
      });
    }
  };
  
  const validateQRByMode = async (text: string): Promise<ValidationResult> => {
    try {
      switch (scanMode) {
        case 'roll':
          return await validateRollQRCode(text);
        case 'order':
          return await validateOrderQRCode(text);
        case 'auto':
        default:
          return await validateQRCode(text);
      }
    } catch (error) {
      console.error("Validation error:", error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : "Unknown validation error"
      };
    }
  };
  
  const handleDecode = (decodedText: string) => {
    console.log('Decoded QR Code:', decodedText);
  };
  
  const handleNavigate = () => {
    if (!scanResult || !scanResult.valid || !scanResult.data) return;
    
    const { format, id } = scanResult.data;
    
    switch (format) {
      case QRCodeFormat.ROLL:
        setLocation(`/production/rolls/${id}`);
        break;
      case QRCodeFormat.ORDER:
        setLocation(`/orders/${id}`);
        break;
      case QRCodeFormat.JOB_ORDER:
        setLocation(`/job-orders/${id}`);
        break;
      case QRCodeFormat.CUSTOMER:
        setLocation(`/customers/${id}`);
        break;
      default:
        toast({
          title: 'Navigation Error',
          description: `No route available for ${format} type`,
          variant: 'destructive',
        });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">QR Code Scanner</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>QR Scanner</CardTitle>
              <CardDescription>
                Select the appropriate scan mode below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Tabs defaultValue="auto" onValueChange={(v) => setScanMode(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="auto" className="flex-1">Auto Detect</TabsTrigger>
                    <TabsTrigger value="roll" className="flex-1">Roll Scanner</TabsTrigger>
                    <TabsTrigger value="order" className="flex-1">Order Scanner</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Using the simplified QR scanner component */}
              {/* Key forces remount when scan mode changes */}
              <BasicQRScanner
                key={`qr-scanner-${scanMode}`}
                title={scanMode === 'auto' ? "Multi-purpose QR Scanner" : 
                      scanMode === 'roll' ? "Roll QR Scanner" : 
                      "Order QR Scanner"}
                description={scanMode === 'auto' ? "Scan any factory QR code" : 
                          scanMode === 'roll' ? "Scan roll identification QR codes" : 
                          "Scan order QR codes"}
                validator={validateQRByMode}
                onScan={handleDecode}
                onResult={handleValidationResult}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>
                Information about the scanned QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <div className="space-y-4">
                  <Alert variant={scanResult.valid ? "default" : "destructive"}>
                    <div className="flex items-center gap-2">
                      {scanResult.valid ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <AlertTitle>
                        {scanResult.valid ? "Valid QR Code" : "Invalid QR Code"}
                      </AlertTitle>
                    </div>
                    <AlertDescription>
                      {scanResult.message}
                    </AlertDescription>
                  </Alert>
                  
                  {scanResult.data && (
                    <div className="rounded-md border p-4">
                      <h3 className="font-medium mb-2">QR Code Data</h3>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-medium">Format:</div>
                          <div>{scanResult.data.format}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-medium">ID:</div>
                          <div>{scanResult.data.id}</div>
                        </div>
                        
                        {scanResult.valid && (
                          <Button 
                            className="w-full mt-2" 
                            onClick={handleNavigate}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Info className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No QR code has been scanned yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Scan a QR code to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Select the appropriate scanner mode from the tabs above</li>
                <li>Click "Scan" to activate your camera</li>
                <li>Position a QR code in the scanner view</li>
                <li>The results will appear automatically when a valid code is detected</li>
                <li>For valid codes, you can click "View Details" to navigate to the related item</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}