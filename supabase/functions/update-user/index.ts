import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum([
    "platform_owner", "platform_admin",
    "agency_owner", "agency_admin", "agency_manager", "agency_member",
    "client_owner", "client_viewer",
  ]).optional(),
  is_active: z.boolean().optional(),
  plan_id: z.string().uuid().nullable().optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile || !["platform_owner", "platform_admin"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, full_name, email, password, role, is_active, plan_id, billing_cycle } = parsed.data;

    // Update auth user (email, password)
    const authUpdate: Record<string, any> = {};
    if (email) authUpdate.email = email;
    if (password) authUpdate.password = password;
    
    const metaUpdate: Record<string, any> = {};
    if (full_name) metaUpdate.full_name = full_name;
    if (role) {
      metaUpdate.role = role;
      metaUpdate.tenant_type = ["platform_owner", "platform_admin"].includes(role) ? "platform" : "agency";
    }
    
    if (Object.keys(metaUpdate).length > 0) authUpdate.user_metadata = metaUpdate;
    
    if (Object.keys(authUpdate).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdate);
      if (authUpdateError) {
        const msg = authUpdateError.message.includes("already been registered")
          ? "Este e-mail já está em uso por outro usuário"
          : authUpdateError.message;
        return new Response(JSON.stringify({ error: msg }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update profile
    const profileUpdate: Record<string, any> = {};
    if (full_name) profileUpdate.full_name = full_name;
    if (role) {
      profileUpdate.role = role;
      profileUpdate.tenant_type = ["platform_owner", "platform_admin"].includes(role) ? "platform" : "agency";
    }
    if (is_active !== undefined) profileUpdate.is_active = is_active;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", user_id);
      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle plan/subscription changes
    if (plan_id !== undefined) {
      // Get existing subscription
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (plan_id === null) {
        // Remove subscription
        if (existingSub) {
          await supabaseAdmin.from("subscriptions").delete().eq("id", existingSub.id);
        }
      } else if (existingSub) {
        // Update existing
        await supabaseAdmin.from("subscriptions").update({
          plan_id,
          billing_cycle: billing_cycle || "monthly",
          status: "active",
          current_period_start: new Date().toISOString(),
        }).eq("id", existingSub.id);
      } else {
        // Create new
        await supabaseAdmin.from("subscriptions").insert({
          user_id,
          plan_id,
          billing_cycle: billing_cycle || "monthly",
          status: "active",
          current_period_start: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
