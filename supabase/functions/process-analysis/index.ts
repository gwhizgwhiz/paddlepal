// @ts-ignore: Deno runtime import
import { serve } from "std/server";

serve(() => new Response("Hello, world!", { status: 200 }));
