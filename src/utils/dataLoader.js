import { fetchManufacturers, fetchSuppliers, fetchDrugs, fetchBatches } from '../features/inventory/inventorySlice';

/**
 * Fetches all critical inventory data needed for the application.
 * @param {string} pharmacyId - The ID of the pharmacy to fetch data for
 * @param {Function} dispatch - The Redux dispatch function
 * @returns {Promise<void>}
 */
export const loadInventoryData = async (pharmacyId, dispatch) => {
  if (!pharmacyId) throw new Error('Pharmacy ID is required to load inventory data');

  try {
    // Dispatch all fetch actions in parallel
    await Promise.all([
      dispatch(fetchManufacturers(pharmacyId)).unwrap(),
      dispatch(fetchSuppliers(pharmacyId)).unwrap(),
      dispatch(fetchDrugs(pharmacyId)).unwrap(),
      dispatch(fetchBatches(pharmacyId)).unwrap(),
    ]);

  } catch (error) {
    console.error('Failed to load inventory data:', error);
    // Rethrow to allow caller to handle cleanup (logout/redirect)
    throw new Error('Failed to load critical system data. Please try again or contact support.');
  }
};