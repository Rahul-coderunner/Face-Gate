import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export function SignedImage({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  const { data } = useQuery({
    queryKey: ["signed", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("faces").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  if (!path || !data) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <User className="h-1/2 w-1/2" />
      </div>
    );
  }
  return <img src={data} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
}
