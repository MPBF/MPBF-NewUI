/**
 * Utility functions for various calculations in the application
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
 * Calculate waste for a single roll based on extruding quantity and delivery quantity
 * @param roll Roll data
 * @returns Waste quantity (or null if data is insufficient)
 */
export const calculateRollWaste = (roll: Roll): number | null => {
  // If extruding quantity is not set, we can't calculate waste
  if (roll.extruding_qty === null) {
    return null;
  }
  
  // Delivery quantity is the cutting quantity (final stage)
  const deliveryQty = roll.cutting_qty;
  
  // If delivery quantity is not set, we can't calculate waste
  if (deliveryQty === null) {
    return null;
  }
  
  // Calculate waste as extruding - delivery
  return Math.max(0, roll.extruding_qty - deliveryQty);
};

/**
 * Calculate total waste for all rolls in a job order
 * @param rolls Array of rolls for a specific job order
 * @returns Total waste quantity
 */
export const calculateJobOrderWaste = (rolls: Roll[]): number => {
  if (!rolls || rolls.length === 0) {
    return 0;
  }
  
  // Get waste for each roll and sum them
  return rolls.reduce((total, roll) => {
    const waste = calculateRollWaste(roll);
    return total + (waste !== null ? waste : 0);
  }, 0);
};

/**
 * Calculate total production quantity for a job order by stage
 * @param rolls Array of rolls for a specific job order
 * @param stage Production stage ('extruding', 'printing', or 'cutting')
 * @returns Total quantity for the specified stage
 */
export const calculateJobOrderQuantity = (
  rolls: Roll[], 
  stage: 'extruding' | 'printing' | 'cutting'
): number => {
  if (!rolls || rolls.length === 0) {
    return 0;
  }
  
  return rolls.reduce((total, roll) => {
    const qty = roll[`${stage}_qty`];
    return total + (qty !== null ? qty : 0);
  }, 0);
};

/**
 * Calculate waste percentage for a job order
 * @param rolls Array of rolls for a specific job order
 * @returns Waste percentage (0-100)
 */
export const calculateWastePercentage = (rolls: Roll[]): number | null => {
  if (!rolls || rolls.length === 0) {
    return null;
  }
  
  const totalExtruding = calculateJobOrderQuantity(rolls, 'extruding');
  const totalCutting = calculateJobOrderQuantity(rolls, 'cutting');
  
  if (totalExtruding === 0) {
    return null;
  }
  
  const wastePercentage = ((totalExtruding - totalCutting) / totalExtruding) * 100;
  return Math.max(0, Math.round(wastePercentage * 100) / 100); // Round to 2 decimal places
};