const SUPABASE_URL = "https://azsyznlimagzmechvfvk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c3l6bmxpbWFnem1lY2h2ZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NTM2ODAsImV4cCI6MjEwNDEyOTY4MH0.ubLdsOd2-lKDoj1yKMrBdYayCrzLWJdqdAeRkTSsEyA";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);