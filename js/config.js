const SUPABASE_URL = "https://azsyznlimagzmechvfvk.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_KThMOaHFB7IS7zdtExvqwg_Vf2KBjfl";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);