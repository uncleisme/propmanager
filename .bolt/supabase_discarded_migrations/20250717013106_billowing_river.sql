/*
  # Add Building Information Management

  1. New Tables
    - `building_info`
      - `id` (uuid, primary key)
      - `building_name` (text)
      - `building_address` (text)
      - `building_type` (text)
      - `total_units` (integer)
      - `total_floors` (integer)
      - `year_built` (integer)
      - `property_manager_name` (text)
      - `property_manager_company` (text)
      - `property_manager_phone` (text)
      - `property_manager_email` (text)
      - `jmb_name` (text)
      - `jmb_chairman` (text)
      - `jmb_secretary` (text)
      - `jmb_treasurer` (text)
      - `jmb_phone` (text)
      - `jmb_email` (text)
      - `maintenance_fee` (numeric)
      - `sinking_fund` (numeric)
      - `insurance_company` (text)
      - `insurance_policy_number` (text)
      - `insurance_expiry` (date)
      - `facilities` (text array)
      - `parking_spaces` (integer)
      - `security_features` (text array)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `building_info` table
    - Add policies for authenticated users to manage building info