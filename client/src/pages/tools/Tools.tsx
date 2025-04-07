import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MATERIAL_TYPES } from "@shared/schema";
import { useLanguage, t } from "@/utils/language";
import { Link } from "wouter";
import { 
  Calculator, 
  FileText, 
  Scale, 
  RefreshCw, 
  Droplets, 
  Timer, 
  Ruler, 
  DollarSign, 
  Percent, 
  TrendingUp,
  FileSpreadsheet,
  QrCode
} from "lucide-react";

// Type definitions
type BagType = "flat" | "sealedBottom" | "diecut" | "patchHandle" | "loopHandle" | "tShirt" | "garbage" | "zipper";
type WeightUnit = "kg" | "g" | "lb" | "oz";
type LengthUnit = "mm" | "cm" | "m" | "in";
type AreaUnit = "cm2" | "m2" | "in2" | "ft2";

export default function Tools() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("bagCalculator");

  // Bag weight calculator
  const [bagType, setBagType] = useState<BagType>("flat");
  const [materialType, setMaterialType] = useState<string>("HDPE");
  const [bagWidth, setBagWidth] = useState<string>("30");
  const [bagHeight, setBagHeight] = useState<string>("50");
  const [bagGusset, setBagGusset] = useState<string>("10");
  const [thickness, setThickness] = useState<string>("25");
  const [additionalFeatures, setAdditionalFeatures] = useState({
    perforation: false,
    printing: false,
    embossing: false,
    zipper: false,
  });
  const [quantity, setQuantity] = useState<string>("1000");
  const [resultText, setResultText] = useState<string>("");

  // Film yield calculator
  const [filmWidth, setFilmWidth] = useState<string>("100");
  const [filmLength, setFilmLength] = useState<string>("100");
  const [filmThickness, setFilmThickness] = useState<string>("25");
  const [filmDensity, setFilmDensity] = useState<string>("0.95");
  const [filmYieldResult, setFilmYieldResult] = useState<string>("");

  // Material mixing calculator
  const [mixMaterials, setMixMaterials] = useState([
    { id: 1, type: "HDPE", percentage: 70, density: 0.95 },
    { id: 2, type: "LLDPE", percentage: 20, density: 0.92 },
    { id: 3, type: "Color", percentage: 10, density: 1.2 },
  ]);
  const [totalMixWeight, setTotalMixWeight] = useState<string>("100");
  const [mixResult, setMixResult] = useState<string>("");

  // Production cost calculator
  const [materialCost, setMaterialCost] = useState<string>("2.5"); // per kg
  const [electricityCost, setElectricityCost] = useState<string>("0.15"); // per kWh
  const [laborCost, setLaborCost] = useState<string>("10"); // per hour
  const [machineSpeed, setMachineSpeed] = useState<string>("50"); // kg per hour
  const [wastagePercentage, setWastagePercentage] = useState<string>("3"); // percentage
  const [costResult, setCostResult] = useState<string>("");

  // Waste reduction tools
  const [currentWaste, setCurrentWaste] = useState<string>("5"); // percentage
  const [targetWaste, setTargetWaste] = useState<string>("3"); // percentage
  const [productionVolume, setProductionVolume] = useState<string>("1000"); // kg per day
  const [materialPrice, setMaterialPrice] = useState<string>("2.5"); // per kg
  const [wasteSavingsResult, setWasteSavingsResult] = useState<string>("");

  // Material density values (g/cm³)
  const densityValues: Record<string, number> = {
    "HDPE": 0.95,
    "LDPE": 0.92,
    "LLDPE": 0.92,
    "PP": 0.90,
    "Regrind": 0.94,
    "Filler": 1.8,  // Approximate value for common fillers
    "Color": 1.2,   // Approximate value for color masterbatch
    "D2w": 0.93,    // Approximate value for d2w additive
    "CaCO3": 2.7    // Calcium carbonate filler
  };

  // Weight conversion factors to kg
  const conversionFactors: Record<WeightUnit, number> = {
    "kg": 1,
    "g": 0.001,
    "lb": 0.453592,
    "oz": 0.0283495
  };

  // Function to calculate plastic bag weight
  const calculateBagWeight = () => {
    try {
      // Parse input values
      const width = parseFloat(bagWidth);
      const height = parseFloat(bagHeight);
      const gusset = parseFloat(bagGusset);
      const thicknessMicrons = parseFloat(thickness);
      const orderQuantity = parseInt(quantity);
      
      // Validate inputs
      if (isNaN(width) || isNaN(height) || isNaN(thicknessMicrons) || isNaN(orderQuantity) || 
          width <= 0 || height <= 0 || thicknessMicrons <= 0 || orderQuantity <= 0) {
        setResultText("Please enter valid dimensions and quantities.");
        return;
      }
      
      // Thickness in cm (convert from microns)
      const thicknessCm = thicknessMicrons / 10000;
      
      // Get the density based on material type
      const density = densityValues[materialType] || 0.95;
      
      // Calculate the area and volume based on bag type
      let area = 0;
      
      switch(bagType) {
        case "flat":
          // Simple flat bag (2 sides)
          area = 2 * width * height;
          break;
        case "sealedBottom":
          // Sealed bottom bag (2 sides + bottom seal)
          area = 2 * width * height + width * 1.5; // 1.5cm for bottom seal
          break;
        case "diecut":
          // Die cut handle bag
          area = 2 * width * height - 2 * (width * 0.15 * 0.1); // Subtract handle holes
          break;
        case "patchHandle":
          // Patch handle bag
          area = 2 * width * height + 2 * (width * 0.2 * 0.5); // Add patch handles
          break;
        case "loopHandle":
          // Loop handle bag
          area = 2 * width * height + 2 * (width * 0.5 * 2); // Add loop handles
          break;
        case "tShirt":
          // T-shirt bag
          area = 2 * width * height - 2 * (width * 0.3 * 0.15); // Subtract T-shirt cut
          break;
        case "garbage":
          // Garbage bag (with gusset)
          area = 2 * (width + gusset) * height; // Include gusset
          break;
        case "zipper":
          // Zipper bag
          area = 2 * width * height + width * 2; // Add zipper area
          break;
      }
      
      // Adjust for additional features
      let featureMultiplier = 1.0;
      if (additionalFeatures.perforation) featureMultiplier += 0.02;
      if (additionalFeatures.printing) featureMultiplier += 0.05;
      if (additionalFeatures.embossing) featureMultiplier += 0.03;
      if (additionalFeatures.zipper && bagType !== "zipper") featureMultiplier += 0.1;
      
      // Calculate volume in cm³ (area × thickness)
      const volume = area * thicknessCm * featureMultiplier;
      
      // Calculate weight in grams (density is in g/cm³)
      const weightInGrams = volume * density;
      
      // Calculate total weight for the order
      const totalWeightInKg = (weightInGrams / 1000) * orderQuantity;
      
      // Calculate standard box quantities (assume 250 bags per standard box)
      const boxQuantity = Math.ceil(orderQuantity / 250);
      
      // Prepare the result text
      setResultText(
        `Material: ${materialType}\n` +
        `Bag Type: ${bagType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}\n` +
        `Dimensions: ${width} × ${height} cm ${bagType === "garbage" ? `(Gusset: ${gusset} cm)` : ""}\n` +
        `Thickness: ${thicknessMicrons} microns\n` +
        `Density: ${density} g/cm³\n\n` +
        `Single Bag Weight: ${weightInGrams.toFixed(2)} g\n` +
        `Bags per kg: ${(1000 / weightInGrams).toFixed(0)}\n\n` +
        `Order Details:\n` +
        `Quantity: ${orderQuantity.toLocaleString()} bags\n` +
        `Total Weight: ${totalWeightInKg.toFixed(2)} kg\n` +
        `Boxes: ${boxQuantity} (250 bags/box)\n`
      );
    } catch (error) {
      setResultText("An error occurred while calculating. Please check your inputs.");
    }
  };

  // Calculate film yield
  const calculateFilmYield = () => {
    try {
      const width = parseFloat(filmWidth);
      const length = parseFloat(filmLength);
      const thicknessMicrons = parseFloat(filmThickness);
      const density = parseFloat(filmDensity);
      
      if (isNaN(width) || isNaN(length) || isNaN(thicknessMicrons) || isNaN(density) ||
          width <= 0 || length <= 0 || thicknessMicrons <= 0 || density <= 0) {
        setFilmYieldResult("Please enter valid values.");
        return;
      }
      
      // Convert thickness from microns to cm
      const thicknessCm = thicknessMicrons / 10000;
      
      // Calculate area in cm²
      const area = width * length;
      
      // Calculate volume in cm³
      const volume = area * thicknessCm;
      
      // Calculate weight in grams
      const weightInGrams = volume * density;
      
      // Calculate weight in kilograms
      const weightInKg = weightInGrams / 1000;
      
      // Calculate yield in square meters per kg
      const areaInSquareMeters = area / 10000; // convert cm² to m²
      const yieldPerKg = areaInSquareMeters / weightInKg;
      
      setFilmYieldResult(
        `Film Area: ${area.toFixed(2)} cm² (${areaInSquareMeters.toFixed(2)} m²)\n` +
        `Film Volume: ${volume.toFixed(2)} cm³\n` +
        `Film Weight: ${weightInGrams.toFixed(2)} g (${weightInKg.toFixed(3)} kg)\n\n` +
        `Yield: ${yieldPerKg.toFixed(2)} m²/kg\n` +
        `Film needed for 1kg: ${(1 / weightInKg).toFixed(2)} pieces`
      );
    } catch (error) {
      setFilmYieldResult("An error occurred while calculating. Please check your inputs.");
    }
  };

  // Calculate material mix
  const calculateMaterialMix = () => {
    try {
      const totalWeight = parseFloat(totalMixWeight);
      
      if (isNaN(totalWeight) || totalWeight <= 0) {
        setMixResult("Please enter a valid total weight.");
        return;
      }
      
      // Check if percentages sum to 100
      const totalPercentage = mixMaterials.reduce((sum, mat) => sum + mat.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setMixResult(`Total percentage (${totalPercentage}%) must equal 100%. Please adjust your mix.`);
        return;
      }
      
      // Calculate weights for each material
      const materialWeights = mixMaterials.map(mat => ({
        type: mat.type,
        percentage: mat.percentage,
        weight: (mat.percentage / 100) * totalWeight,
        density: mat.density
      }));
      
      // Calculate the final density of the mixture
      const totalVolume = materialWeights.reduce((sum, mat) => sum + (mat.weight / mat.density), 0);
      const mixtureDensity = totalWeight / totalVolume;
      
      // Format the result
      let resultText = `Total Mix Weight: ${totalWeight} kg\n\n`;
      resultText += "Material Breakdown:\n";
      resultText += materialWeights.map(mat => 
        `${mat.type}: ${mat.percentage}% = ${mat.weight.toFixed(2)} kg`
      ).join("\n");
      
      resultText += `\n\nMixture Density: ${mixtureDensity.toFixed(3)} g/cm³`;
      
      setMixResult(resultText);
    } catch (error) {
      setMixResult("An error occurred while calculating. Please check your inputs.");
    }
  };

  // Calculate production cost
  const calculateProductionCost = () => {
    try {
      const matCost = parseFloat(materialCost);
      const elecCost = parseFloat(electricityCost);
      const labCost = parseFloat(laborCost);
      const speed = parseFloat(machineSpeed);
      const wastage = parseFloat(wastagePercentage);
      
      if (isNaN(matCost) || isNaN(elecCost) || isNaN(labCost) || isNaN(speed) || isNaN(wastage) ||
          matCost < 0 || elecCost < 0 || labCost < 0 || speed <= 0 || wastage < 0) {
        setCostResult("Please enter valid values.");
        return;
      }
      
      // Calculate costs per kg of finished product
      const materialCostPerKg = matCost * (1 + wastage / 100); // Account for wastage
      const machineHoursPerKg = 1 / speed;
      const electricityCostPerKg = elecCost * machineHoursPerKg * 25; // Assume 25kWh per machine hour
      const laborCostPerKg = labCost * machineHoursPerKg * 1.5; // Assume 1.5 workers per machine
      
      // Calculate overhead (simplified - typically 15% of direct costs)
      const overhead = 0.15 * (materialCostPerKg + electricityCostPerKg + laborCostPerKg);
      
      // Calculate total cost per kg
      const totalCostPerKg = materialCostPerKg + electricityCostPerKg + laborCostPerKg + overhead;
      
      // Calculate cost distribution
      const materialPercentage = (materialCostPerKg / totalCostPerKg) * 100;
      const electricityPercentage = (electricityCostPerKg / totalCostPerKg) * 100;
      const laborPercentage = (laborCostPerKg / totalCostPerKg) * 100;
      const overheadPercentage = (overhead / totalCostPerKg) * 100;
      
      setCostResult(
        `Production Cost Analysis (per kg):\n\n` +
        `Material: $${materialCostPerKg.toFixed(2)} (${materialPercentage.toFixed(2)}%)\n` +
        `Electricity: $${electricityCostPerKg.toFixed(2)} (${electricityPercentage.toFixed(2)}%)\n` +
        `Labor: $${laborCostPerKg.toFixed(2)} (${laborPercentage.toFixed(2)}%)\n` +
        `Overhead: $${overhead.toFixed(2)} (${overheadPercentage.toFixed(2)}%)\n\n` +
        `Total Cost per kg: $${totalCostPerKg.toFixed(2)}\n` +
        `Cost per ton: $${(totalCostPerKg * 1000).toFixed(2)}\n\n` +
        `Machine Production Rate: ${speed} kg/hour\n` +
        `Cost per hour: $${(totalCostPerKg * speed).toFixed(2)}`
      );
    } catch (error) {
      setCostResult("An error occurred while calculating. Please check your inputs.");
    }
  };

  // Calculate waste reduction savings
  const calculateWasteSavings = () => {
    try {
      const currentWastePercent = parseFloat(currentWaste);
      const targetWastePercent = parseFloat(targetWaste);
      const production = parseFloat(productionVolume);
      const matPrice = parseFloat(materialPrice);
      
      if (isNaN(currentWastePercent) || isNaN(targetWastePercent) || isNaN(production) || isNaN(matPrice) ||
          currentWastePercent < 0 || targetWastePercent < 0 || production <= 0 || matPrice < 0) {
        setWasteSavingsResult("Please enter valid values.");
        return;
      }
      
      // Calculate current waste in kg per day
      const currentWasteKg = (currentWastePercent / 100) * production;
      
      // Calculate target waste in kg per day
      const targetWasteKg = (targetWastePercent / 100) * production;
      
      // Calculate saved material in kg per day
      const savedMaterialKg = currentWasteKg - targetWasteKg;
      
      // Calculate daily savings in currency
      const dailySavings = savedMaterialKg * matPrice;
      
      // Calculate annual savings (assuming 250 working days)
      const annualSavings = dailySavings * 250;
      
      // Calculate percentage improvement
      const improvementPercentage = ((currentWastePercent - targetWastePercent) / currentWastePercent) * 100;
      
      setWasteSavingsResult(
        `Waste Reduction Analysis:\n\n` +
        `Current Waste: ${currentWastePercent}% (${currentWasteKg.toFixed(2)} kg/day)\n` +
        `Target Waste: ${targetWastePercent}% (${targetWasteKg.toFixed(2)} kg/day)\n\n` +
        `Material Saved: ${savedMaterialKg.toFixed(2)} kg/day\n` +
        `Cost Savings: $${dailySavings.toFixed(2)} per day\n` +
        `Annual Savings: $${annualSavings.toFixed(2)} (250 working days)\n\n` +
        `Waste Reduction: ${improvementPercentage.toFixed(2)}%`
      );
    } catch (error) {
      setWasteSavingsResult("An error occurred while calculating. Please check your inputs.");
    }
  };

  // Handle material type change in mix calculator
  const handleMaterialTypeChange = (id: number, type: string) => {
    const density = densityValues[type] || 0.95;
    setMixMaterials(mixMaterials.map(mat => 
      mat.id === id ? { ...mat, type, density } : mat
    ));
  };

  // Handle percentage change in mix calculator
  const handlePercentageChange = (id: number, percentage: number) => {
    setMixMaterials(mixMaterials.map(mat => 
      mat.id === id ? { ...mat, percentage } : mat
    ));
  };

  // Add a new material to the mix
  const addMixMaterial = () => {
    const newId = Math.max(...mixMaterials.map(m => m.id), 0) + 1;
    setMixMaterials([...mixMaterials, { id: newId, type: "LDPE", percentage: 0, density: 0.92 }]);
  };

  // Remove a material from the mix
  const removeMixMaterial = (id: number) => {
    if (mixMaterials.length > 1) {
      setMixMaterials(mixMaterials.filter(mat => mat.id !== id));
    }
  };

  // Toggle additional features
  const toggleFeature = (feature: keyof typeof additionalFeatures) => {
    setAdditionalFeatures({
      ...additionalFeatures,
      [feature]: !additionalFeatures[feature]
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">Production Tools</CardTitle>
              <CardDescription>
                Professional calculators and tools for plastic bag manufacturing
              </CardDescription>
            </div>
            <Link href="/tools/qr-scanner">
              <Button variant="outline" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Scanner
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="bagCalculator" className="flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Bag Weight
              </TabsTrigger>
              <TabsTrigger value="filmYield" className="flex items-center">
                <Ruler className="h-4 w-4 mr-2" />
                Film Yield
              </TabsTrigger>
              <TabsTrigger value="materialMix" className="flex items-center">
                <Droplets className="h-4 w-4 mr-2" />
                Material Mix
              </TabsTrigger>
              <TabsTrigger value="productionCost" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Cost Analysis
              </TabsTrigger>
              <TabsTrigger value="wasteReduction" className="flex items-center">
                <Percent className="h-4 w-4 mr-2" />
                Waste Analysis
              </TabsTrigger>
            </TabsList>
            
            {/* Bag Weight Calculator Tab */}
            <TabsContent value="bagCalculator">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scale className="h-5 w-5 mr-2" />
                    Plastic Bag Weight Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate the weight of plastic bags based on dimensions, material and type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="bag-type">Bag Type</Label>
                          <Select value={bagType} onValueChange={(value) => setBagType(value as BagType)}>
                            <SelectTrigger id="bag-type">
                              <SelectValue placeholder="Select bag type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat Bag</SelectItem>
                              <SelectItem value="sealedBottom">Sealed Bottom Bag</SelectItem>
                              <SelectItem value="diecut">Die Cut Handle Bag</SelectItem>
                              <SelectItem value="patchHandle">Patch Handle Bag</SelectItem>
                              <SelectItem value="loopHandle">Loop Handle Bag</SelectItem>
                              <SelectItem value="tShirt">T-Shirt Bag</SelectItem>
                              <SelectItem value="garbage">Garbage Bag (with Gusset)</SelectItem>
                              <SelectItem value="zipper">Zipper Bag</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="material-type">Material Type</Label>
                          <Select value={materialType} onValueChange={setMaterialType}>
                            <SelectTrigger id="material-type">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(densityValues).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type} (density: {densityValues[type]} g/cm³)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bag-width">Width (cm)</Label>
                            <Input
                              id="bag-width"
                              type="number"
                              value={bagWidth}
                              onChange={(e) => setBagWidth(e.target.value)}
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="bag-height">Height (cm)</Label>
                            <Input
                              id="bag-height"
                              type="number"
                              value={bagHeight}
                              onChange={(e) => setBagHeight(e.target.value)}
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                        </div>
                        
                        {bagType === "garbage" && (
                          <div>
                            <Label htmlFor="bag-gusset">Gusset (cm)</Label>
                            <Input
                              id="bag-gusset"
                              type="number"
                              value={bagGusset}
                              onChange={(e) => setBagGusset(e.target.value)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="thickness">Thickness (microns)</Label>
                          <Input
                            id="thickness"
                            type="number"
                            value={thickness}
                            onChange={(e) => setThickness(e.target.value)}
                            min="1"
                            step="1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Additional Features</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="printing"
                                checked={additionalFeatures.printing}
                                onCheckedChange={() => toggleFeature("printing")}
                              />
                              <Label htmlFor="printing" className="text-sm font-normal">Printing</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="perforation"
                                checked={additionalFeatures.perforation}
                                onCheckedChange={() => toggleFeature("perforation")}
                              />
                              <Label htmlFor="perforation" className="text-sm font-normal">Perforation</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="embossing"
                                checked={additionalFeatures.embossing}
                                onCheckedChange={() => toggleFeature("embossing")}
                              />
                              <Label htmlFor="embossing" className="text-sm font-normal">Embossing</Label>
                            </div>
                            
                            {bagType !== "zipper" && (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="zipper"
                                  checked={additionalFeatures.zipper}
                                  onCheckedChange={() => toggleFeature("zipper")}
                                />
                                <Label htmlFor="zipper" className="text-sm font-normal">Zipper</Label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="quantity">Order Quantity (bags)</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            step="1"
                          />
                        </div>
                        
                        <div className="pt-4">
                          <Button 
                            className="w-full" 
                            onClick={calculateBagWeight}
                          >
                            Calculate Bag Weight
                          </Button>
                        </div>
                        
                        <div>
                          <Label>Result</Label>
                          <Textarea 
                            readOnly 
                            value={resultText}
                            className="h-[210px] font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t">
                  <div className="text-xs text-muted-foreground">
                    <Scale className="h-3 w-3 inline mr-1" />
                    Note: Calculations are estimates and may vary based on actual manufacturing conditions.
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Film Yield Calculator Tab */}
            <TabsContent value="filmYield">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Ruler className="h-5 w-5 mr-2" />
                    Film Yield Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate the yield and weight of plastic film based on dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="film-width">Film Width (cm)</Label>
                        <Input
                          id="film-width"
                          type="number"
                          value={filmWidth}
                          onChange={(e) => setFilmWidth(e.target.value)}
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="film-length">Film Length (cm)</Label>
                        <Input
                          id="film-length"
                          type="number"
                          value={filmLength}
                          onChange={(e) => setFilmLength(e.target.value)}
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="film-thickness">Film Thickness (microns)</Label>
                        <Input
                          id="film-thickness"
                          type="number"
                          value={filmThickness}
                          onChange={(e) => setFilmThickness(e.target.value)}
                          min="1"
                          step="1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="film-density">Material Density (g/cm³)</Label>
                        <Select 
                          value={filmDensity} 
                          onValueChange={setFilmDensity}
                        >
                          <SelectTrigger id="film-density">
                            <SelectValue placeholder="Select density" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(densityValues).map(([type, density]) => (
                              <SelectItem key={type} value={density.toString()}>
                                {type} ({density} g/cm³)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        className="w-full mt-2" 
                        onClick={calculateFilmYield}
                      >
                        Calculate Film Yield
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Result</Label>
                      <Textarea 
                        readOnly 
                        value={filmYieldResult}
                        className="h-[252px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Material Mixing Calculator Tab */}
            <TabsContent value="materialMix">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Droplets className="h-5 w-5 mr-2" />
                    Material Mixing Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate precise material quantities for compound mixtures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="total-mix-weight">Total Mix Weight (kg)</Label>
                      <Input
                        id="total-mix-weight"
                        type="number"
                        value={totalMixWeight}
                        onChange={(e) => setTotalMixWeight(e.target.value)}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Material Composition</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addMixMaterial}
                          disabled={mixMaterials.length >= 6}
                        >
                          Add Material
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {mixMaterials.map((material, index) => (
                          <div key={material.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <Select 
                                value={material.type} 
                                onValueChange={(value) => handleMaterialTypeChange(material.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Material type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.keys(densityValues).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="col-span-5">
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={material.percentage}
                                  onChange={(e) => handlePercentageChange(material.id, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                                <span className="text-sm">%</span>
                              </div>
                            </div>
                            
                            <div className="col-span-2 flex justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeMixMaterial(material.id)}
                                disabled={mixMaterials.length <= 1}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={calculateMaterialMix}
                    >
                      Calculate Mix
                    </Button>
                    
                    <div>
                      <Label>Result</Label>
                      <Textarea 
                        readOnly 
                        value={mixResult}
                        className="h-40 font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Production Cost Calculator Tab */}
            <TabsContent value="productionCost">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Production Cost Calculator
                  </CardTitle>
                  <CardDescription>
                    Analyze production costs and optimize profitability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="material-cost">Material Cost ($ per kg)</Label>
                        <Input
                          id="material-cost"
                          type="number"
                          value={materialCost}
                          onChange={(e) => setMaterialCost(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="electricity-cost">Electricity Cost ($ per kWh)</Label>
                        <Input
                          id="electricity-cost"
                          type="number"
                          value={electricityCost}
                          onChange={(e) => setElectricityCost(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="labor-cost">Labor Cost ($ per hour)</Label>
                        <Input
                          id="labor-cost"
                          type="number"
                          value={laborCost}
                          onChange={(e) => setLaborCost(e.target.value)}
                          min="0"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="machine-speed">Machine Speed (kg per hour)</Label>
                        <Input
                          id="machine-speed"
                          type="number"
                          value={machineSpeed}
                          onChange={(e) => setMachineSpeed(e.target.value)}
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="wastage-percentage">Wastage Percentage (%)</Label>
                        <Input
                          id="wastage-percentage"
                          type="number"
                          value={wastagePercentage}
                          onChange={(e) => setWastagePercentage(e.target.value)}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={calculateProductionCost}
                      >
                        Calculate Production Cost
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Cost Analysis Result</Label>
                      <Textarea 
                        readOnly 
                        value={costResult}
                        className="h-[335px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Waste Reduction Analysis Tab */}
            <TabsContent value="wasteReduction">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Percent className="h-5 w-5 mr-2" />
                    Waste Reduction Analysis
                  </CardTitle>
                  <CardDescription>
                    Calculate potential savings from reducing production waste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-waste">Current Waste Percentage (%)</Label>
                        <Input
                          id="current-waste"
                          type="number"
                          value={currentWaste}
                          onChange={(e) => setCurrentWaste(e.target.value)}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="target-waste">Target Waste Percentage (%)</Label>
                        <Input
                          id="target-waste"
                          type="number"
                          value={targetWaste}
                          onChange={(e) => setTargetWaste(e.target.value)}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="production-volume">Production Volume (kg per day)</Label>
                        <Input
                          id="production-volume"
                          type="number"
                          value={productionVolume}
                          onChange={(e) => setProductionVolume(e.target.value)}
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="material-price">Material Price ($ per kg)</Label>
                        <Input
                          id="material-price"
                          type="number"
                          value={materialPrice}
                          onChange={(e) => setMaterialPrice(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={calculateWasteSavings}
                      >
                        Calculate Potential Savings
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Savings Analysis Result</Label>
                      <Textarea 
                        readOnly 
                        value={wasteSavingsResult}
                        className="h-[252px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}