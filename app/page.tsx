import HomeContent from "./components/HomeContent";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: annotations, error } = await supabase
    .from("annotations")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error loading annotations:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  return (
    <HomeContent annotations={annotations ?? []} />
  );
}