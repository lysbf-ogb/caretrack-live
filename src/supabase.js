// ============================================================
//  SUPABASE CONFIGURATION
//  OGB App — LYSBF CYEP
// ============================================================
//
//  SETUP INSTRUCTIONS:
//  1. Go to https://supabase.com and create a free account
//  2. Create a new project called "ogb-app"
//  3. Go to Project Settings → API
//  4. Copy your "Project URL" and paste it below as SUPABASE_URL
//  5. Copy your "anon public" key and paste it below as SUPABASE_ANON_KEY
//  6. Save this file
//
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ─────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}

// ── User profiles ────────────────────────────────────────────

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  return { data, error };
}

export async function createUserAccount(email, password, name, role) {
  // Admin creates user — uses service role in production
  // For now uses signUp; in production wrap in Edge Function
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } }
  });
  return { data, error };
}

// ── Beneficiaries ────────────────────────────────────────────

export async function getBeneficiaries(userId, role) {
  let query = supabase
    .from('beneficiaries')
    .select('*, posts(*)')
    .order('name');

  if (role !== 'Admin') {
    query = query.eq('assigned_to', userId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getBeneficiary(id) {
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*, posts(*)')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function createBeneficiary(benData) {
  const { data, error } = await supabase
    .from('beneficiaries')
    .insert([benData])
    .select()
    .single();
  return { data, error };
}

export async function updateBeneficiary(id, benData) {
  const { data, error } = await supabase
    .from('beneficiaries')
    .update(benData)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteBeneficiary(id) {
  const { error } = await supabase
    .from('beneficiaries')
    .delete()
    .eq('id', id);
  return { error };
}

// ── Posts / Follow-up Notes ──────────────────────────────────

export async function addPost(beneficiaryId, authorName, text) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{
      beneficiary_id: beneficiaryId,
      author: authorName,
      text,
      date: new Date().toISOString().slice(0, 10)
    }])
    .select()
    .single();
  return { data, error };
}

export async function getPosts(beneficiaryId) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('beneficiary_id', beneficiaryId)
    .order('date', { ascending: false });
  return { data, error };
}

// ── Documents / File Storage ─────────────────────────────────

export async function uploadDocument(beneficiaryId, file) {
  const filePath = `${beneficiaryId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file);
  return { data, error, filePath };
}

export async function getDocuments(beneficiaryId) {
  const { data, error } = await supabase.storage
    .from('documents')
    .list(beneficiaryId);
  return { data, error };
}

export async function getDocumentUrl(filePath) {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);
  return data.publicUrl;
}

// ── App Settings ─────────────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();
  return { data, error };
}

export async function updateSettings(settings) {
  const { data, error } = await supabase
    .from('settings')
    .upsert(settings)
    .select()
    .single();
  return { data, error };
}

// ── Programme Components ─────────────────────────────────────

export async function getComponents() {
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .order('sort_order');
  return { data, error };
}

export async function addComponent(component) {
  const { data, error } = await supabase
    .from('components')
    .insert([component])
    .select()
    .single();
  return { data, error };
}

export async function deleteComponent(id) {
  const { error } = await supabase
    .from('components')
    .delete()
    .eq('id', id);
  return { error };
}
