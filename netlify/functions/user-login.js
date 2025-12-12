// netlify/functions/user-login.js
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password required" })
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Supabase environment variables" })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        session: data.session,
        user: data.user
      })
    };

  } catch (err) {
    console.error("user-login ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
