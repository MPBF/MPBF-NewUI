/**
 * Waste calculation utility for production rolls
 * This utility calculates waste between different production stages
 */

interface Roll {
  id: number;
  roll_identification: string;
  job_order_id: number;
  roll_number: number;
  extruding_qty: number | null;
  printing_qty: number | null;
  cutting_qty: number | null;
  status: string;
  created_date: string;
  notes: string | null;
}

/**
 * Calculate waste between two production stages
 * @param fromQuantity Quantity from the previous stage
 * @param toQuantity Quantity from the current stage
 * @returns Waste amount or null if calculation not possible
 */
export const calculateStageWaste = (fromQuantity: number | null, toQuantity: number | null): number | null => {
  if (fromQuantity === null || toQuantity === null) {
    return null;
  }
  
  return Math.max(0, fromQuantity - toQuantity);
};

/**
 * Calculate waste percentage between two production stages
 * @param fromQuantity Quantity from the previous stage
 * @param toQuantity Quantity from the current stage
 * @returns Waste percentage (0-100) or null if calculation not possible
 */
export const calculateStageWastePercentage = (fromQuantity: number | null, toQuantity: number | null): number | null => {
  if (fromQuantity === null || toQuantity === null || fromQuantity === 0) {
    return null;
  }
  
  const waste = Math.max(0, fromQuantity - toQuantity);
  return (waste / fromQuantity) * 100;
};

/**
 * Calculate printing stage waste for a roll
 * @param roll Roll data
 * @returns Waste amount or null if calculation not possible
 */
export const calculatePrintingWaste = (roll: Roll): number | null => {
  return calculateStageWaste(roll.extruding_qty, roll.printing_qty);
};

/**
 * Calculate cutting stage waste for a roll
 * @param roll Roll data
 * @returns Waste amount or null if calculation not possible
 */
export const calculateCuttingWaste = (roll: Roll): number | null => {
  return calculateStageWaste(roll.printing_qty, roll.cutting_qty);
};

/**
 * Calculate total waste for a roll (from extruding to final stage)
 * @param roll Roll data
 * @returns Total waste amount or null if calculation not possible
 */
export const calculateTotalRollWaste = (roll: Roll): number | null => {
  if (roll.extruding_qty === null) {
    return null;
  }
  
  // If roll has reached cutting stage
  if (roll.cutting_qty !== null) {
    return Math.max(0, roll.extruding_qty - roll.cutting_qty);
  }
  
  // If roll has reached printing stage
  if (roll.printing_qty !== null) {
    return Math.max(0, roll.extruding_qty - roll.printing_qty);
  }
  
  // Roll has only extruding data
  return 0;
};

/**
 * Calculate total waste percentage for a roll
 * @param roll Roll data
 * @returns Waste percentage (0-100) or null if calculation not possible
 */
export const calculateTotalRollWastePercentage = (roll: Roll): number | null => {
  if (roll.extruding_qty === null || roll.extruding_qty === 0) {
    return null;
  }
  
  const totalWaste = calculateTotalRollWaste(roll);
  if (totalWaste === null) {
    return null;
  }
  
  return (totalWaste / roll.extruding_qty) * 100;
};

/**
 * Calculate total waste for all rolls in a job order
 * @param rolls Array of rolls for a specific job order
 * @returns Total waste quantity or null if no valid data
 */
export const calculateJobOrderWaste = (rolls: Roll[]): number | null => {
  if (!rolls || rolls.length === 0) {
    return null;
  }
  
  let totalExtrudingQty = 0;
  let totalFinalQty = 0;
  let hasValidData = false;
  
  rolls.forEach(roll => {
    if (roll.extruding_qty !== null) {
      totalExtrudingQty += roll.extruding_qty;
      hasValidData = true;
      
      // Use the latest stage quantity available for this roll
      if (roll.cutting_qty !== null) {
        totalFinalQty += roll.cutting_qty;
      } else if (roll.printing_qty !== null) {
        totalFinalQty += roll.printing_qty;
      } else {
        totalFinalQty += roll.extruding_qty; // No waste yet
      }
    }
  });
  
  return hasValidData ? Math.max(0, totalExtrudingQty - totalFinalQty) : null;
};

/**
 * Calculate waste percentage for a job order
 * @param rolls Array of rolls for a specific job order
 * @returns Waste percentage (0-100) or null if calculation not possible
 */
export const calculateJobOrderWastePercentage = (rolls: Roll[]): number | null => {
  if (!rolls || rolls.length === 0) {
    return null;
  }
  
  let totalExtrudingQty = 0;
  let totalFinalQty = 0;
  let hasValidData = false;
  
  rolls.forEach(roll => {
    if (roll.extruding_qty !== null) {
      totalExtrudingQty += roll.extruding_qty;
      hasValidData = true;
      
      // Use the latest stage quantity available for this roll
      if (roll.cutting_qty !== null) {
        totalFinalQty += roll.cutting_qty;
      } else if (roll.printing_qty !== null) {
        totalFinalQty += roll.printing_qty;
      } else {
        totalFinalQty += roll.extruding_qty; // No waste yet
      }
    }
  });
  
  if (!hasValidData || totalExtrudingQty === 0) {
    return null;
  }
  
  return ((totalExtrudingQty - totalFinalQty) / totalExtrudingQty) * 100;
};

/**
 * Calculate cumulative cutting waste for all rolls in a job order
 * This function sums up the waste from all rolls that have gone through cutting
 * @param rolls Array of rolls for a specific job order
 * @returns Cumulative cutting waste amount or null if no valid data
 */
export const calculateCumulativeCuttingWaste = (rolls: Roll[]): number | null => {
  if (!rolls || rolls.length === 0) {
    return null;
  }
  
  let totalWaste = 0;
  let hasValidData = false;
  
  rolls.forEach(roll => {
    // Only include rolls that have gone through cutting
    if (roll.cutting_qty !== null && 
        (roll.printing_qty !== null || roll.extruding_qty !== null)) {
      
      // Use printing quantity if available, otherwise use extruding quantity
      const fromQuantity = roll.printing_qty !== null ? roll.printing_qty : roll.extruding_qty;
      
      if (fromQuantity !== null) {
        const rollWaste = Math.max(0, fromQuantity - roll.cutting_qty);
        totalWaste += rollWaste;
        hasValidData = true;
      }
    }
  });
  
  return hasValidData ? totalWaste : null;
};

/**
 * Calculate cumulative cutting waste percentage for all rolls in a job order
 * @param rolls Array of rolls for a specific job order
 * @returns Cumulative waste percentage (0-100) or null if calculation not possible
 */
export const calculateCumulativeCuttingWastePercentage = (rolls: Roll[]): number | null => {
  if (!rolls || rolls.length === 0) {
    return null;
  }
  
  let totalFromQuantity = 0;
  let totalCuttingQty = 0;
  let hasValidData = false;
  
  rolls.forEach(roll => {
    // Only include rolls that have gone through cutting
    if (roll.cutting_qty !== null && 
        (roll.printing_qty !== null || roll.extruding_qty !== null)) {
      
      // Use printing quantity if available, otherwise use extruding quantity
      const fromQuantity = roll.printing_qty !== null ? roll.printing_qty : roll.extruding_qty;
      
      if (fromQuantity !== null) {
        totalFromQuantity += fromQuantity;
        totalCuttingQty += roll.cutting_qty;
        hasValidData = true;
      }
    }
  });
  
  if (!hasValidData || totalFromQuantity === 0) {
    return null;
  }
  
  return ((totalFromQuantity - totalCuttingQty) / totalFromQuantity) * 100;
};