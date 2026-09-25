import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SOURCE_BUCKET = "documentos";
const TARGET_BUCKET = "documentos-vehiculos";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function targetPath(sourcePath: string, userId: string) {
  if (sourcePath.startsWith("documentos-vehiculos/")) {
    return sourcePath.replace(/^documentos-vehiculos\//, `${userId}/`);
  }
  if (sourcePath.startsWith("vehiculos/")) {
    return sourcePath.replace(/^vehiculos\//, "");
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Falta Authorization" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, secretKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Sesión no válida" }, 401);
  const userId = userData.user.id;

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode ?? "preview";
  if (!["preview", "copy", "finalize"].includes(mode)) {
    return json({ error: "mode debe ser preview, copy o finalize" }, 400);
  }

  const { data: sourceObjects, error: sourceError } = await admin
    .from("storage.objects")
    .select("name,owner_id,metadata")
    .eq("bucket_id", SOURCE_BUCKET)
    .or("name.like.documentos-vehiculos/%,name.like.vehiculos/%")
    .eq("owner_id", userId);

  if (sourceError) {
    return json({ error: `No se pudieron leer los archivos de origen: ${sourceError.message}` }, 500);
  }

  const { data: unexpectedObjects } = await admin
    .from("storage.objects")
    .select("name,owner_id")
    .eq("bucket_id", SOURCE_BUCKET)
    .or("name.like.documentos-vehiculos/%,name.like.vehiculos/%")
    .neq("owner_id", userId);

  if ((unexpectedObjects ?? []).length) {
    return json({
      error: "Hay archivos de vehículos cuyo propietario no coincide con la sesión. No se ha movido ningún archivo.",
      skipped: unexpectedObjects,
    }, 409);
  }

  const candidates = (sourceObjects ?? [])
    .map((object: any) => ({
      from: object.name as string,
      to: targetPath(object.name, userId),
      metadata: object.metadata as Record<string, unknown> | null,
    }))
    .filter((item): item is { from: string; to: string; metadata: Record<string, unknown> | null } => Boolean(item.to));

  const summary = {
    mode,
    userId,
    sourceCount: candidates.length,
    sourcePaths: candidates.map((x) => x.from),
    targetPaths: candidates.map((x) => x.to),
  };

  if (mode === "preview") return json({ ok: true, ...summary });

  const { data: targetObjects, error: targetError } = await admin
    .from("storage.objects")
    .select("name")
    .eq("bucket_id", TARGET_BUCKET);
  if (targetError) return json({ error: `No se pudo inspeccionar el destino: ${targetError.message}` }, 500);
  const targetSet = new Set((targetObjects ?? []).map((o: any) => o.name));

  if (mode === "finalize") {
    const missingTargets = candidates.filter((item) => !targetSet.has(item.to));
    if (missingTargets.length) {
      return json({
        error: "No se puede finalizar: faltan archivos en el bucket privado.",
        missingTargets,
      }, 409);
    }

    const pathsToDelete = candidates.map((item) => item.from);
    const { error: deleteError } = await admin.storage.from(SOURCE_BUCKET).remove(pathsToDelete);
    if (deleteError) {
      return json({
        ok: false,
        error: `No se pudieron eliminar todos los archivos antiguos: ${deleteError.message}`,
      }, 500);
    }

    return json({ ok: true, ...summary, deleted: pathsToDelete.length });
  }

  const migrated: { from: string; to: string }[] = [];
  const failures: { path: string; error: string }[] = [];

  for (const object of candidates) {
    if (!targetSet.has(object.to)) {
      const { data: file, error: downloadError } = await admin.storage
        .from(SOURCE_BUCKET)
        .download(object.from);

      if (downloadError || !file) {
        failures.push({ path: object.from, error: downloadError?.message ?? "No se pudo descargar" });
        continue;
      }

      const contentType = typeof object.metadata?.mimetype === "string"
        ? object.metadata.mimetype
        : "application/octet-stream";

      const { error: uploadError } = await admin.storage
        .from(TARGET_BUCKET)
        .upload(object.to, file, { contentType, upsert: false });

      if (uploadError) {
        failures.push({ path: object.from, error: uploadError.message });
        continue;
      }

      targetSet.add(object.to);
    }

    migrated.push({ from: object.from, to: object.to });
  }

  if (failures.length) {
    return json({ ok: false, migrated, failures, deleted: 0 }, 500);
  }

  for (const item of migrated) {
    const { error: docError } = await admin
      .from("vehiculos_documentacion")
      .update({ archivo_path: item.to })
      .eq("archivo_path", item.from);
    if (docError) {
      return json({ error: `No se pudo actualizar documentación para ${item.from}: ${docError.message}` }, 500);
    }

    const { error: photoError } = await admin
      .from("vehiculos_fotografias")
      .update({ archivo_path: item.to })
      .eq("archivo_path", item.from);
    if (photoError) {
      return json({ error: `No se pudo actualizar fotografía para ${item.from}: ${photoError.message}` }, 500);
    }
  }

  return json({
    ok: true,
    ...summary,
    migrated: migrated.length,
    deleted: 0,
    next: "Tras desplegar el código cliente que usa el bucket privado, ejecutar mode=finalize para eliminar los originales públicos.",
  });
});
