-- Migration: add parent_id to equipment for accessory grouping (e.g. transport cases)
-- Run this in Supabase SQL Editor

ALTER TABLE equipment
  ADD COLUMN parent_id UUID REFERENCES equipment(id) ON DELETE SET NULL;

-- Index for fast lookup of children by parent
CREATE INDEX idx_equipment_parent_id ON equipment(parent_id) WHERE parent_id IS NOT NULL;
