import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MATERIAL_TYPES } from "@shared/schema";
import { useLanguage, t } from "@/utils/language";
import { Calculator, FileText, AreaChart, Scale, RefreshCw } from "lucide-react";

// Type for weight conversion
type WeightUnit = "kg" | "g" | "lb" | "oz";

export default function HelpfulTools() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("calculator");

  // Plastic bag calculator
  const [materialType, setMaterialType] = useState<string>("HDPE");
  const [bagWidth, setBagWidth] = useState<string>("30");
  const [bagDepth, setBagDepth] = useState<string>("10");
  const [bagLength, setBagLength] = useState<string>("50");
  const [thickness, setThickness] = useState<string>("25");
  const [handleShape, setHandleShape] = useState<string>("none");
  const [resultText, setResultText] = useState<string>("");

  // Unit conversion
  const [fromUnit, setFromUnit] = useState<WeightUnit>("kg");
  const [toUnit, setToUnit] = useState<WeightUnit>("lb");
  const [conversionValue, setConversionValue] = useState<string>("1");
  const [conversionResult, setConversionResult] = useState<string>("");

  // Notes
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteContent, setNoteContent] = useState<string>("");
  const [notes, setNotes] = useState<{id: number; title: string; content: string}[]>(() => {
    const savedNotes = localStorage.getItem("factory_notes");
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  // Material density values (g/cm³)
  const densityValues: Record<string, number> = {
    "HDPE": 0.95,
    "LDPE": 0.92,
    "LLDPE": 0.92,
    "Regrind": 0.94,
    "Filler": 1.8,  // Approximate value for common fillers
    "Color": 1.2,   // Approximate value for color masterbatch
    "D2w": 0.93     // Approximate value for d2w additive
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
      const depth = parseFloat(bagDepth);
      const length = parseFloat(bagLength);
      const thicknessMicrons = parseFloat(thickness);
      
      // Validate inputs
      if (isNaN(width) || isNaN(depth) || isNaN(length) || isNaN(thicknessMicrons) || 
          width <= 0 || depth <= 0 || length <= 0 || thicknessMicrons <= 0) {
        setResultText(t("invalidValue", { lang: language, fallback: "Please enter valid dimensions." }));
        return;
      }
      
      // Thickness in cm (convert from microns)
      const thicknessCm = thicknessMicrons / 10000;
      
      // Get the density based on material type
      const density = densityValues[materialType];
      
      // Calculate the volume of plastic in the bag (in cm³)
      // Formula: 2 * (width * length + width * depth + length * depth) * thickness
      // This assumes a rectangular bag with both sides covered
      let volume = 2 * (width * length) * thicknessCm; // Front and back panels
      volume += 2 * (width * depth) * thicknessCm;    // Side panels
      volume += 2 * (length * depth) * thicknessCm;   // Bottom panel and top (if closed)
      
      // Add handle volume based on handle type
      let handleVolume = 0;
      if (handleShape === "die-cut") {
        // Die-cut handles (holes in the bag)
        // No additional plastic, actually reduces volume, but we'll ignore that for simplicity
      } else if (handleShape === "loop") {
        // Loop handles - approximate as two strips
        const handleLength = width * 2; // Twice the width for a loop
        const handleWidth = 2.5; // Typical handle width in cm
        handleVolume = 2 * handleLength * handleWidth * thicknessCm;
      } else if (handleShape === "patch") {
        // Patch handles - reinforced areas on the bag
        const patchSize = width * 0.15; // 15% of width
        handleVolume = 2 * patchSize * patchSize * thicknessCm;
      }
      
      // Add handle volume if applicable
      if (handleShape !== "none") {
        volume += handleVolume;
      }
      
      // Calculate weight in grams (density is in g/cm³)
      const weightInGrams = volume * density;
      
      // Convert to kg for larger bags if needed
      const weightInKg = weightInGrams / 1000;
      
      // Prepare the result text with custom translations
      const dimensionsText = t("value", { lang: language, fallback: "Dimensions" });
      const thicknessText = t("value", { lang: language, fallback: "Thickness" });
      const handleTypeText = t("value", { lang: language, fallback: "Handle Type" });
      const bagWeightText = t("value", { lang: language, fallback: "Bag Weight" });
      const kgEquivalentText = t("value", { lang: language, fallback: "KG Equivalent" });
      
      setResultText(
        `${t("materialType", { lang: language })}: ${materialType}\n` +
        `${dimensionsText}: ${width} × ${depth} × ${length} cm\n` +
        `${thicknessText}: ${thicknessMicrons} microns\n` +
        `${handleTypeText}: ${handleShape}\n` +
        `${t("density", { lang: language })}: ${density} g/cm³\n` +
        `${bagWeightText}: ${weightInGrams.toFixed(2)} g\n` +
        `${kgEquivalentText}: ${weightInKg.toFixed(5)} kg`
      );
    } catch (error) {
      setResultText(t("calculationError", { lang: language }));
    }
  };

  // Function to convert between weight units
  const convertWeight = () => {
    try {
      const value = parseFloat(conversionValue);
      if (isNaN(value) || value < 0) {
        setConversionResult(t("invalidValue", { lang: language }));
        return;
      }

      // Convert to kg first, then to target unit
      const valueInKg = value * conversionFactors[fromUnit];
      const result = valueInKg / conversionFactors[toUnit];
      
      setConversionResult(`${value} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`);
    } catch (error) {
      setConversionResult(t("conversionError", { lang: language }));
    }
  };

  // Function to save a new note
  const saveNote = () => {
    if (noteTitle.trim() === "") {
      return;
    }
    
    const newNote = {
      id: Date.now(),
      title: noteTitle,
      content: noteContent
    };
    
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem("factory_notes", JSON.stringify(updatedNotes));
    
    // Clear inputs
    setNoteTitle("");
    setNoteContent("");
  };

  // Function to delete a note
  const deleteNote = (id: number) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem("factory_notes", JSON.stringify(updatedNotes));
  };

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("helpfulTools", { lang: language })}</CardTitle>
          <CardDescription>
            {t("helpfulToolsDescription", { lang: language })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="calculator">
                <Calculator className="h-4 w-4 mr-2" />
                {t("value", { lang: language, fallback: "Bag Calculator" })}
              </TabsTrigger>
              <TabsTrigger value="conversion">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("unitConversion", { lang: language })}
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                {t("value", { lang: language, fallback: "Notes" })}
              </TabsTrigger>
            </TabsList>
            
            {/* Plastic Bag Weight Calculator Tab */}
            <TabsContent value="calculator">
              <Card>
                <CardHeader>
                  <CardTitle>{t("value", { lang: language, fallback: "Plastic Bag Weight Calculator" })}</CardTitle>
                  <CardDescription>
                    {t("value", { lang: language, fallback: "Calculate the weight of plastic bags based on dimensions and material." })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material-type">{t("materialType", { lang: language })}</Label>
                      <Select value={materialType} onValueChange={setMaterialType}>
                        <SelectTrigger id="material-type">
                          <SelectValue placeholder={t("selectMaterial", { lang: language })} />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="handle-shape">{t("handleType", { lang: language, fallback: "Handle Type" })}</Label>
                      <Select value={handleShape} onValueChange={setHandleShape}>
                        <SelectTrigger id="handle-shape">
                          <SelectValue placeholder={t("selectHandleType", { lang: language, fallback: "Select handle type" })} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("none", { lang: language, fallback: "None" })}</SelectItem>
                          <SelectItem value="die-cut">{t("dieCut", { lang: language, fallback: "Die-cut" })}</SelectItem>
                          <SelectItem value="loop">{t("loop", { lang: language, fallback: "Loop" })}</SelectItem>
                          <SelectItem value="patch">{t("patch", { lang: language, fallback: "Patch" })}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bag-width">{t("width", { lang: language, fallback: "Width (cm)" })}</Label>
                      <Input
                        id="bag-width"
                        type="number"
                        value={bagWidth}
                        onChange={(e) => setBagWidth(e.target.value)}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bag-depth">{t("depth", { lang: language, fallback: "Depth (cm)" })}</Label>
                      <Input
                        id="bag-depth"
                        type="number"
                        value={bagDepth}
                        onChange={(e) => setBagDepth(e.target.value)}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bag-length">{t("length", { lang: language, fallback: "Length (cm)" })}</Label>
                      <Input
                        id="bag-length"
                        type="number"
                        value={bagLength}
                        onChange={(e) => setBagLength(e.target.value)}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="thickness">{t("thickness", { lang: language, fallback: "Thickness (microns)" })}</Label>
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
                  
                  <Button 
                    className="w-full" 
                    onClick={calculateBagWeight}
                  >
                    {t("calculate", { lang: language })}
                  </Button>
                  
                  <div className="space-y-2">
                    <Label>{t("result", { lang: language })}</Label>
                    <Textarea 
                      readOnly 
                      value={resultText}
                      className="h-32 font-mono text-sm"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    <Scale className="h-3 w-3 inline mr-1" />
                    {t("densityValues", { lang: language })}
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Unit Conversion Tab */}
            <TabsContent value="conversion">
              <Card>
                <CardHeader>
                  <CardTitle>{t("unitConversion", { lang: language })}</CardTitle>
                  <CardDescription>
                    {t("unitConversionDescription", { lang: language })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-unit">{t("fromUnit", { lang: language })}</Label>
                      <Select value={fromUnit} onValueChange={(value) => setFromUnit(value as WeightUnit)}>
                        <SelectTrigger id="from-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="to-unit">{t("toUnit", { lang: language })}</Label>
                      <Select value={toUnit} onValueChange={(value) => setToUnit(value as WeightUnit)}>
                        <SelectTrigger id="to-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="conversion-value">{t("value", { lang: language })}</Label>
                    <div className="flex">
                      <Input
                        id="conversion-value"
                        type="number"
                        value={conversionValue}
                        onChange={(e) => setConversionValue(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                      <Button 
                        className="ml-2" 
                        onClick={convertWeight}
                      >
                        {t("convert", { lang: language })}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border p-3 rounded-md bg-muted/20">
                    <div className="text-center font-semibold">
                      {conversionResult || "—"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 inline mr-1" />
                    {t("conversionFactors", { lang: language })}
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>{t("value", { lang: language, fallback: "Notes" })}</CardTitle>
                  <CardDescription>
                    {t("value", { lang: language, fallback: "Save important information and reminders" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">{t("title", { lang: language })}</Label>
                    <Input
                      id="note-title"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder={t("noteTitlePlaceholder", { lang: language })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="note-content">{t("content", { lang: language })}</Label>
                    <Textarea
                      id="note-content"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder={t("noteContentPlaceholder", { lang: language })}
                      className="h-24"
                    />
                  </div>
                  
                  <Button onClick={saveNote} className="w-full">
                    {t("saveNote", { lang: language })}
                  </Button>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t("savedNotes", { lang: language })}</h3>
                    
                    {notes.length === 0 ? (
                      <div className="text-center p-4 text-muted-foreground">
                        {t("noNotes", { lang: language })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notes.map(note => (
                          <Card key={note.id}>
                            <CardHeader className="py-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-md">{note.title}</CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteNote(note.id)}
                                >
                                  {t("delete", { lang: language })}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
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
