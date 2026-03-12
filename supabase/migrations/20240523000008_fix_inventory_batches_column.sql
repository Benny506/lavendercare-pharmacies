-- Rename formulation_id to drug_formulation_id in inventory_batches
ALTER TABLE public.inventory_batches 
RENAME COLUMN formulation_id TO drug_formulation_id;

-- Drop the old unique constraint which used the old column name
ALTER TABLE public.inventory_batches 
DROP CONSTRAINT unique_batch_formulation;

-- Add the unique constraint back with the new column name
ALTER TABLE public.inventory_batches 
ADD CONSTRAINT unique_batch_drug_formulation UNIQUE (batch_number, drug_formulation_id);

-- Rename the index to match the new column name
ALTER INDEX public.idx_inventory_batches_formulation 
RENAME TO idx_inventory_batches_drug_formulation;
