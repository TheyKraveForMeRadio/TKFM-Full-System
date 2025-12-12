// netlify/functions/user-register.js
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password are required" })
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Supabase environment variables" })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "user"
      }
    });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User registered", user: data })
    };

  } catch (err) {
    console.error("user-register ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
