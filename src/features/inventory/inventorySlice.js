import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';

// --- Manufacturers Thunks ---
export const fetchManufacturers = createAsyncThunk(
  'inventory/fetchManufacturers',
  async (pharmacyId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addManufacturer = createAsyncThunk(
  'inventory/addManufacturer',
  async ({ pharmacyId, manufacturer }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .insert([{ ...manufacturer, pharmacy_id: pharmacyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateManufacturer = createAsyncThunk(
  'inventory/updateManufacturer',
  async ({ id, manufacturer }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .update(manufacturer)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update failed: No rows returned (check RLS update policies)');

      return data[0];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteManufacturer = createAsyncThunk(
  'inventory/deleteManufacturer',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('manufacturers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- Suppliers Thunks ---
export const fetchSuppliers = createAsyncThunk(
  'inventory/fetchSuppliers',
  async (pharmacyId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addSupplier = createAsyncThunk(
  'inventory/addSupplier',
  async ({ pharmacyId, supplier }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplier, pharmacy_id: pharmacyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'inventory/updateSupplier',
  async ({ id, supplier }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update failed: No rows returned (check RLS update policies)');

      return data[0];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'inventory/deleteSupplier',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- Drugs Thunks ---
export const fetchDrugs = createAsyncThunk(
  'inventory/fetchDrugs',
  async (pharmacyId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('drugs')
        .select(`
          *,
          manufacturers (name),
          drug_formulations (
            *,
            images: drug_formulation_images (*)
          )
        `)
        .eq('pharmacy_id', pharmacyId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDrug = createAsyncThunk(
  'inventory/addDrug',
  async ({ pharmacyId, drug, formulations }, { rejectWithValue }) => {
    try {
      // 1. Insert Drug
      const { data: drugData, error: drugError } = await supabase
        .from('drugs')
        .insert([{ ...drug, pharmacy_id: pharmacyId }])
        .select(`*, manufacturers(name)`)
        .single();

      if (drugError) throw drugError;

      // 2. Insert Formulations and Upload Images
      let formulationsData = [];
      if (formulations && formulations.length > 0) {
        for (const f of formulations) {
          const { images, ...fData } = f;

          // Insert formulation
          const { data: insertedF, error: fError } = await supabase
            .from('drug_formulations')
            .insert([{ ...fData, drug_id: drugData.id }])
            .select()
            .single();

          if (fError) throw fError;

          // Upload images
          let uploadedImages = [];
          if (images && images.length > 0) {
            for (const imgFile of images) {
              const fileExt = imgFile.name.split('.').pop();
              const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `${insertedF.id}/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('drug_images')
                .upload(filePath, imgFile);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('drug_images')
                .getPublicUrl(filePath);

              // Insert into drug_formulation_images
              const { data: imgRecord, error: imgError } = await supabase
                .from('drug_formulation_images')
                .insert({
                  formulation_id: insertedF.id,
                  image_url: publicUrl
                })
                .select()
                .single();

              if (imgError) throw imgError;
              uploadedImages.push(imgRecord);
            }
          }
          formulationsData.push({ ...insertedF, drug_formulation_images: uploadedImages });
        }
      }

      return { ...drugData, drug_formulations: formulationsData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDrugDetails = createAsyncThunk(
  'inventory/updateDrugDetails',
  async ({ id, drug }, { rejectWithValue }) => {
    try {

      const { data, error } = await supabase
        .from('drugs')
        .update(drug)
        .eq('id', id)
        .select(`*, manufacturers(name), drug_formulations(*, drug_formulation_images(*))`); // Fetch everything to keep state consistent

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update failed: No rows returned');

      return data[0];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDrugFormulations = createAsyncThunk(
  'inventory/updateDrugFormulations',
  async ({ drugId, formulations }, { rejectWithValue }) => {
    try {
      // Fetch existing formulations to detect deletions if needed, 
      // but simpler approach:
      // 1. Loop through provided formulations
      // 2. If 'id' exists -> Update formulation details -> Check images
      // 3. If no 'id' -> Insert new formulation -> Upload images
      // 4. (Optional) Handle deletions of formulations not in the list? 
      //    User requirement says: "Handle cases where a drug-formation that had 5 images, 2 were removed and replaced by new ones"
      //    This implies we are managing the images list.

      for (const f of formulations) {
        const { images, id, ...fData } = f; // images is array of { id, url } (existing) or File objects (new)

        let formulationId = id;

        if (formulationId) {
          // Update existing formulation
          const { error: updateError } = await supabase
            .from('drug_formulations')
            .update(fData)
            .eq('id', formulationId);
          if (updateError) throw updateError;
        } else {
          // Insert new formulation
          const { data: newF, error: insertError } = await supabase
            .from('drug_formulations')
            .insert([{ ...fData, drug_id: drugId }])
            .select()
            .single();
          if (insertError) throw insertError;
          formulationId = newF.id;
        }

        // Handle Images
        // 'images' array contains mixed types:
        // 1. Existing image objects (from DB): { id, image_url, formulation_id, ... }
        // 2. New File objects: File { name, size, ... }

        // Step A: Get current DB images for this formulation (if it existed)
        let currentDbImages = [];
        if (id) {
          const { data: dbImgs } = await supabase
            .from('drug_formulation_images')
            .select('id')
            .eq('formulation_id', formulationId);
          currentDbImages = dbImgs || [];
        }

        // Step B: Identify images to keep vs delete
        // Kept images are those in 'images' array that have an 'id'
        const keptImageIds = images.filter(img => img.id).map(img => img.id);
        const imagesToDelete = currentDbImages.filter(dbImg => !keptImageIds.includes(dbImg.id));

        // Delete removed images from DB
        if (imagesToDelete.length > 0) {
          await supabase
            .from('drug_formulation_images')
            .delete()
            .in('id', imagesToDelete.map(img => img.id));

          // (Optional) Delete from Storage? Skipping for now to avoid complexity/risk
        }

        // Step C: Upload new images
        const newFiles = images.filter(img => !img.id); // Items without ID are new files
        for (const file of newFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${formulationId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('drug_images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('drug_images')
            .getPublicUrl(filePath);

          await supabase
            .from('drug_formulation_images')
            .insert({
              formulation_id: formulationId,
              image_url: publicUrl
            });
        }
      }

      // Return updated drug object
      const { data: updatedDrug, error: fetchError } = await supabase
        .from('drugs')
        .select(`*, manufacturers(name), drug_formulations(*, drug_formulation_images(*))`)
        .eq('id', drugId)
        .single();

      if (fetchError) throw fetchError;
      return updatedDrug;

    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleFormulationVisibility = createAsyncThunk(
  'inventory/toggleFormulationVisibility',
  async ({ id, is_visible }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('drug_formulations')
        .update({ is_visible })
        .eq('id', id)
        .select(`*, drug_formulation_images(*), drugs(*, manufacturers(name))`) // Fetch parent drug to update local state properly
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- Stock Thunks ---
export const fetchBatches = createAsyncThunk(
  'inventory/fetchBatches',
  async (pharmacyId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          drug_formulations (
            *,
            drugs (name, generic_name, manufacturers(name)),
            images: drug_formulation_images (*)
          ),
          suppliers (name)
        `)
        .eq('pharmacy_id', pharmacyId)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addBatch = createAsyncThunk(
  'inventory/addBatch',
  async ({ pharmacyId, batch, movement }, { rejectWithValue }) => {
    try {
      // 1. Insert Batch
      const { quantity, ...batchDataPayload } = batch;
      const { data: batchData, error: batchError } = await supabase
        .from('inventory_batches')
        .insert([{
          ...batchDataPayload,
          pharmacy_id: pharmacyId,
          quantity_initial: quantity,
          quantity_remaining: quantity
        }])
        .select(`
          *,
          drug_formulations (
            *,
            drugs (name, generic_name, manufacturers(name))
          ),
          suppliers (name)
        `)
        .single();

      if (batchError) throw batchError;

      // 2. Record Stock Movement (Stock In)
      const { error: moveError } = await supabase
        .from('stock_movements')
        .insert([{
          pharmacy_id: pharmacyId,
          batch_id: batchData.id,
          movement_type: 'IN',
          quantity: movement.quantity,
          reason: movement.reason || 'Initial Stock'
        }]);

      if (moveError) {
        // Rollback batch if movement fails (manual cleanup since no transaction support in client)
        await supabase.from('inventory_batches').delete().eq('id', batchData.id);
        throw moveError;
      }

      return batchData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBatch = createAsyncThunk(
  'inventory/updateBatch',
  async ({ id, batch }, { rejectWithValue }) => {
    try {
      // Only allow updating non-quantity fields
      // quantity_remaining should only be updated via movements
      const { quantity, ...updatePayload } = batch;

      const { data: batchDataArray, error: batchError } = await supabase
        .from('inventory_batches')
        .update(updatePayload)
        .eq('id', id)
        .select(`
          *,
          drug_formulations (
            *,
            drugs (name, generic_name, manufacturers(name))
          ),
          suppliers (name)
        `);

      if (batchError) throw batchError;
      if (!batchDataArray || batchDataArray.length === 0) throw new Error('Update failed: No rows returned (check RLS update policies)');
      const batchData = batchDataArray[0];

      return batchData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  manufacturers: [],
  manufacturersLoaded: false,
  suppliers: [],
  suppliersLoaded: false,
  drugs: [],
  drugsLoaded: false,
  batches: [],
  batchesLoaded: false,
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Manufacturers
    builder
      .addCase(fetchManufacturers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        state.loading = false;
        state.manufacturers = action.payload;
        state.manufacturersLoaded = true;
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addManufacturer.fulfilled, (state, action) => {
        state.manufacturers.unshift(action.payload);
      })
      .addCase(updateManufacturer.fulfilled, (state, action) => {
        const index = state.manufacturers.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.manufacturers[index] = action.payload;
        }
      })
      .addCase(deleteManufacturer.fulfilled, (state, action) => {
        state.manufacturers = state.manufacturers.filter((m) => m.id !== action.payload);
      });

    // Suppliers
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
        state.suppliersLoaded = true;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.suppliers.unshift(action.payload);
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.suppliers.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((s) => s.id !== action.payload);
      });

    // Drugs
    builder
      .addCase(fetchDrugs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrugs.fulfilled, (state, action) => {
        state.loading = false;
        state.drugs = action.payload;
        state.drugsLoaded = true;
      })
      .addCase(fetchDrugs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addDrug.fulfilled, (state, action) => {
        state.drugs.unshift(action.payload);
      })
      .addCase(updateDrugDetails.fulfilled, (state, action) => {
        const index = state.drugs.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.drugs[index] = action.payload;
        }
      })
      .addCase(updateDrugFormulations.fulfilled, (state, action) => {
        const index = state.drugs.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.drugs[index] = action.payload;
        }
      })
      .addCase(toggleFormulationVisibility.fulfilled, (state, action) => {
        const drugId = action.payload.drug_id;
        const drugIndex = state.drugs.findIndex(d => d.id === drugId);
        if (drugIndex !== -1) {
          const formulationIndex = state.drugs[drugIndex].drug_formulations.findIndex(f => f.id === action.payload.id);
          if (formulationIndex !== -1) {
            state.drugs[drugIndex].drug_formulations[formulationIndex] = action.payload;
          }
        }
      });

    // Batches
    builder
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload;
        state.batchesLoaded = true;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addBatch.fulfilled, (state, action) => {
        state.batches.push(action.payload);
      })
      .addCase(updateBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
